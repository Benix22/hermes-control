const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

// Lógica de check-in copiada del servidor Express
async function simulateCheckIn(driverId, matricula, kmInicio) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log(`[Driver ${driverId}] Iniciando transacción...`);

    // 1. Verificar si el conductor ya tiene jornada activa
    const activeShift = await client.query(
      'SELECT id FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL',
      [driverId]
    );
    if (activeShift.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Ya tienes una jornada activa.' };
    }

    // 2. Bloquear y verificar el vehículo (FOR UPDATE)
    console.log(`[Driver ${driverId}] Intentando bloquear vehículo ${matricula}...`);
    const vehicleCheck = await client.query(
      'SELECT en_uso, activo FROM vehiculos WHERE matricula = $1 FOR UPDATE',
      [matricula]
    );

    if (vehicleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'El vehículo no existe.' };
    }

    const vehicle = vehicleCheck.rows[0];
    if (!vehicle.activo) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Vehículo inactivo.' };
    }

    if (vehicle.en_uso) {
      // Simular un pequeño retraso de red o procesamiento para demostrar la retención del bloqueo
      await new Promise(resolve => setTimeout(resolve, 100));
      await client.query('ROLLBACK');
      return { success: false, error: 'Vehículo ocupado por otro conductor.' };
    }

    // 3. Marcar como ocupado
    await client.query(
      'UPDATE vehiculos SET en_uso = TRUE WHERE matricula = $1',
      [matricula]
    );

    // Simular un retraso en la base de datos para retener el bloqueo y forzar al otro proceso a esperar
    console.log(`[Driver ${driverId}] Vehículo libre. Adquiriendo bloqueo por 1.5s...`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 4. Crear la jornada
    const insertShift = await client.query(
      `INSERT INTO jornadas (id_conductor, matricula, km_inicio, estado, hora_inicio) 
       VALUES ($1, $2, $3, 'ACTIVA', NOW()) 
       RETURNING *`,
      [driverId, matricula, kmInicio]
    );

    await client.query('COMMIT');
    console.log(`[Driver ${driverId}] Transacción completada con éxito. Jornada ID: ${insertShift.rows[0].id}`);
    return { success: true, shift: insertShift.rows[0] };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Driver ${driverId}] Error detectado:`, err.message);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

async function runConcurrencyTest() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL no está configurada.');
    process.exit(1);
  }

  console.log('--- Iniciando Test de Concurrencia ACID ---');
  
  // Limpieza inicial para la prueba
  const cleanClient = await pool.connect();
  const testMatricula = '1234-LMX';
  const driverA = 2; // conductor1
  const driverB = 3; // conductor2

  try {
    console.log('Limpiando registros de prueba previos...');
    // Liberar vehículo
    await cleanClient.query('UPDATE vehiculos SET en_uso = FALSE WHERE matricula = $1', [testMatricula]);
    // Cerrar jornadas activas previas de los conductores de prueba
    await cleanClient.query('DELETE FROM jornadas WHERE id_conductor IN ($1, $2)', [driverA, driverB]);
    console.log('Limpieza completada.');
  } finally {
    cleanClient.release();
  }

  console.log('Lanzando peticiones de Check-In concurrentes para el Toyota (1234-LMX)...');
  
  // Lanzar peticiones concurrentes en paralelo
  const promises = [
    simulateCheckIn(driverA, testMatricula, 15000),
    new Promise(async (resolve) => {
      // Retrasar 200ms la segunda para asegurar que Driver A entra primero y bloquea la fila
      await new Promise(r => setTimeout(r, 200));
      const res = await simulateCheckIn(driverB, testMatricula, 15050);
      resolve(res);
    })
  ];

  const results = await Promise.all(promises);
  
  console.log('\n--- Resultados del Test ---');
  console.log('Driver A (conductor1):', results[0]);
  console.log('Driver B (conductor2):', results[1]);

  if (results[0].success && !results[1].success && results[1].error === 'Vehículo ocupado por otro conductor.') {
    console.log('\n¡TEST CONCURRENCIA ACID: ÉXITO!');
    console.log('El bloqueo de fila (FOR UPDATE) impidió que dos conductores utilicen el mismo coche al mismo tiempo.');
  } else {
    console.error('\n¡TEST CONCURRENCIA ACID: FALLIDO!');
    console.error('El bloqueo no se comportó de la forma esperada.');
  }

  // Limpiar para dejar el sistema listo para el usuario
  const resetClient = await pool.connect();
  try {
    await resetClient.query('UPDATE vehiculos SET en_uso = FALSE WHERE matricula = $1', [testMatricula]);
    await resetClient.query('DELETE FROM jornadas WHERE id_conductor IN ($1, $2)', [driverA, driverB]);
    console.log('Base de datos reseteada a estado limpio.');
  } finally {
    resetClient.release();
    await pool.end();
  }
}

runConcurrencyTest();
