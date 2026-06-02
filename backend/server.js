const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'javify_super_secret_key_2026';

// Configuración de Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

// Middlewares
app.use(cors());
// Incrementar límite de tamaño para poder recibir las fotos en formato Base64 sin problemas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Middlewares de Autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
    req.user = user;
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.rol !== role) {
      return res.status(403).json({ error: 'Acceso prohibido. Permisos insuficientes.' });
    }
    next();
  };
};

// ==========================================
// 1. ENDPOINTS DE AUTENTICACIÓN
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username.toLowerCase().trim()]);
    const user = result.rows[0];

    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor durante el inicio de sesión.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, rol, activo FROM usuarios WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user || !user.activo) {
      return res.status(404).json({ error: 'Usuario no encontrado o inactivo.' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor al obtener perfil.' });
  }
});

// ==========================================
// 2. ENDPOINTS DE CONDUCTOR (MÓVIL)
// ==========================================

// Obtener vehículos disponibles para check-in
app.get('/api/vehiculos/disponibles', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT matricula, marca_modelo FROM vehiculos WHERE activo = TRUE AND en_uso = FALSE ORDER BY matricula ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener vehículos disponibles.' });
  }
});

// Obtener la jornada activa actual del conductor (si existe) junto con sus pausas
app.get('/api/jornadas/activa', authenticateToken, async (req, res) => {
  try {
    const shiftResult = await pool.query(
      `SELECT j.*, v.marca_modelo 
       FROM jornadas j
       JOIN vehiculos v ON j.matricula = v.matricula
       WHERE j.id_conductor = $1 AND j.hora_fin IS NULL`,
      [req.user.id]
    );

    if (shiftResult.rows.length === 0) {
      return res.json({ activa: false });
    }

    const shift = shiftResult.rows[0];
    
    // Obtener pausas de esta jornada
    const pausesResult = await pool.query(
      'SELECT * FROM pausas_jornada WHERE id_jornada = $1 ORDER BY hora_inicio ASC',
      [shift.id]
    );

    res.json({
      activa: true,
      jornada: {
        ...shift,
        pausas: pausesResult.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la jornada activa.' });
  }
});

// Iniciar jornada (Check-in) con transacción ACID y bloqueo
app.post('/api/jornadas/checkin', authenticateToken, async (req, res) => {
  const { matricula, km_inicio, url_foto_km } = req.body;

  if (!matricula || km_inicio === undefined) {
    return res.status(400).json({ error: 'Matrícula y Kilómetros Iniciales son obligatorios.' });
  }

  const kmInicioNum = parseInt(km_inicio, 10);
  if (isNaN(kmInicioNum) || kmInicioNum < 0) {
    return res.status(400).json({ error: 'Los kilómetros iniciales deben ser un número válido mayor o igual a 0.' });
  }

  const client = await pool.connect();
  try {
    // Iniciar transacción
    await client.query('BEGIN');

    // 1. Verificar si el conductor ya tiene una jornada activa
    const activeShiftCheck = await client.query(
      'SELECT id FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL',
      [req.user.id]
    );
    if (activeShiftCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ya tienes una jornada activa en curso.' });
    }

    // 2. Bloquear y verificar el estado del vehículo en la base de datos (FOR UPDATE)
    const vehicleCheck = await client.query(
      'SELECT en_uso, activo FROM vehiculos WHERE matricula = $1 FOR UPDATE',
      [matricula]
    );

    if (vehicleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'El vehículo no existe en el sistema.' });
    }

    const vehicle = vehicleCheck.rows[0];
    if (!vehicle.activo) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Este vehículo está dado de baja o inactivo.' });
    }

    if (vehicle.en_uso) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Vehículo ocupado por otro conductor.' });
    }

    // 3. Marcar el vehículo como ocupado
    await client.query(
      'UPDATE vehiculos SET en_uso = TRUE WHERE matricula = $1',
      [matricula]
    );

    // 4. Crear la jornada (hora_inicio se genera con la hora exacta del servidor)
    const insertShift = await client.query(
      `INSERT INTO jornadas (id_conductor, matricula, km_inicio, url_foto_km, estado, hora_inicio) 
       VALUES ($1, $2, $3, $4, 'ACTIVA', NOW()) 
       RETURNING *`,
      [req.user.id, matricula, kmInicioNum, url_foto_km || null]
    );

    // Confirmar transacción
    await client.query('COMMIT');
    res.status(201).json(insertShift.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en checkin transaccional:', err);
    res.status(500).json({ error: 'Error interno del servidor al iniciar jornada.' });
  } finally {
    client.release();
  }
});

// Registrar Pausa / Descanso
app.post('/api/jornadas/pausar', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener la jornada activa
    const shiftResult = await client.query(
      'SELECT id, estado FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL FOR UPDATE',
      [req.user.id]
    );

    if (shiftResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No tienes ninguna jornada activa para pausar.' });
    }

    const shift = shiftResult.rows[0];
    if (shift.estado === 'PAUSADA') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'La jornada ya se encuentra en pausa.' });
    }

    // 2. Insertar nueva pausa
    await client.query(
      'INSERT INTO pausas_jornada (id_jornada, hora_inicio) VALUES ($1, NOW())',
      [shift.id]
    );

    // 3. Cambiar estado de la jornada a PAUSADA
    const updateShift = await client.query(
      "UPDATE jornadas SET estado = 'PAUSADA' WHERE id = $1 RETURNING *",
      [shift.id]
    );

    await client.query('COMMIT');
    res.json(updateShift.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al pausar la jornada.' });
  } finally {
    client.release();
  }
});

// Reanudar Jornada
app.post('/api/jornadas/reanudar', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener la jornada activa
    const shiftResult = await client.query(
      'SELECT id, estado FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL FOR UPDATE',
      [req.user.id]
    );

    if (shiftResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No tienes ninguna jornada activa para reanudar.' });
    }

    const shift = shiftResult.rows[0];
    if (shift.estado !== 'PAUSADA') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'La jornada no está pausada.' });
    }

    // 2. Finalizar la pausa activa (la que tiene hora_fin en NULL)
    const pauseUpdate = await client.query(
      `UPDATE pausas_jornada 
       SET hora_fin = NOW() 
       WHERE id_jornada = $1 AND hora_fin IS NULL 
       RETURNING *`,
      [shift.id]
    );

    if (pauseUpdate.rows.length === 0) {
      // Si no encuentra una pausa sin cerrar por inconsistencias, igual reanudamos
      console.warn('Se intentó reanudar pero no se encontró un registro de pausa abierto.');
    }

    // 3. Cambiar estado de la jornada a ACTIVA
    const updateShift = await client.query(
      "UPDATE jornadas SET estado = 'ACTIVA' WHERE id = $1 RETURNING *",
      [shift.id]
    );

    await client.query('COMMIT');
    res.json(updateShift.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al reanudar la jornada.' });
  } finally {
    client.release();
  }
});

// Finalizar jornada (Check-out) con transacción ACID y liberación del coche
app.post('/api/jornadas/checkout', authenticateToken, async (req, res) => {
  const { km_fin } = req.body;

  if (km_fin === undefined) {
    return res.status(400).json({ error: 'Los kilómetros finales son obligatorios.' });
  }

  const kmFinNum = parseInt(km_fin, 10);
  if (isNaN(kmFinNum) || kmFinNum < 0) {
    return res.status(400).json({ error: 'Los kilómetros finales deben ser un número válido mayor o igual a 0.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Buscar la jornada activa del conductor con bloqueo FOR UPDATE
    const shiftResult = await client.query(
      'SELECT * FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL FOR UPDATE',
      [req.user.id]
    );

    if (shiftResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No tienes ninguna jornada activa registrada.' });
    }

    const shift = shiftResult.rows[0];

    // 2. Validar que los kilómetros finales sean mayores o iguales a los iniciales
    if (kmFinNum < shift.km_inicio) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Los kilómetros finales (${kmFinNum} km) no pueden ser menores que los iniciales (${shift.km_inicio} km).`
      });
    }

    // 3. Si estaba pausada, cerrar automáticamente la pausa abierta actual
    if (shift.estado === 'PAUSADA') {
      await client.query(
        'UPDATE pausas_jornada SET hora_fin = NOW() WHERE id_jornada = $1 AND hora_fin IS NULL',
        [shift.id]
      );
    }

    // 4. Actualizar la jornada con hora_fin, kilómetros finales y estado FINALIZADA
    const updateShift = await client.query(
      `UPDATE jornadas 
       SET km_fin = $1, hora_fin = NOW(), estado = 'FINALIZADA' 
       WHERE id = $2 
       RETURNING *`,
      [kmFinNum, shift.id]
    );

    // 5. Liberar el vehículo
    await client.query(
      'UPDATE vehiculos SET en_uso = FALSE WHERE matricula = $1',
      [shift.matricula]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      jornada: updateShift.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en checkout transaccional:', err);
    res.status(500).json({ error: 'Error del servidor al finalizar la jornada.' });
  } finally {
    client.release();
  }
});

// ==========================================
// 3. ENDPOINTS DE ADMINISTRACIÓN (PROTEGIDOS)
// ==========================================

// CRUD CONDUCTORES (USUARIOS)
app.get('/api/admin/conductores', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, rol, activo FROM usuarios WHERE rol = \'CONDUCTOR\' ORDER BY username ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar conductores.' });
  }
});

app.post('/api/admin/conductores', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña obligatorios.' });
  }

  try {
    const hashedPass = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (username, password, rol, activo) 
       VALUES ($1, $2, 'CONDUCTOR', TRUE) 
       RETURNING id, username, rol, activo`,
      [username.toLowerCase().trim(), hashedPass]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Violación de clave única
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al registrar conductor.' });
  }
});

app.put('/api/admin/conductores/:id', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { id } = req.params;
  const { username, password, activo } = req.body;

  try {
    let query = '';
    let params = [];

    if (password) {
      const hashedPass = await bcrypt.hash(password, 10);
      query = 'UPDATE usuarios SET username = $1, password = $2, activo = $3 WHERE id = $4 RETURNING id, username, rol, activo';
      params = [username.toLowerCase().trim(), hashedPass, activo, id];
    } else {
      query = 'UPDATE usuarios SET username = $1, activo = $2 WHERE id = $3 RETURNING id, username, rol, activo';
      params = [username.toLowerCase().trim(), activo, id];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado.' });
    }

    // Si damos de baja (activo = false) y el conductor tiene una jornada activa, 
    // la base de datos no lo restringe directamente, pero es buena práctica no dejar vehículos colgados.
    // Opcionalmente liberamos su vehículo si tenía jornada abierta.
    if (activo === false) {
      const activeShiftResult = await pool.query(
        'SELECT id, matricula FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL',
        [id]
      );
      if (activeShiftResult.rows.length > 0) {
        const shiftId = activeShiftResult.rows[0].id;
        const matricula = activeShiftResult.rows[0].matricula;
        // Cerrar jornada
        await pool.query(
          "UPDATE jornadas SET hora_fin = NOW(), estado = 'FINALIZADA', km_fin = km_inicio WHERE id = $1",
          [shiftId]
        );
        // Liberar vehículo
        await pool.query(
          "UPDATE vehiculos SET en_uso = FALSE WHERE matricula = $1",
          [matricula]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
    }
    res.status(500).json({ error: 'Error al actualizar conductor.' });
  }
});

// Baja lógica de un conductor (Marcar inactivo)
app.delete('/api/admin/conductores/:id', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id, username, rol, activo',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conductor no encontrado.' });
    }

    // Si tiene jornada activa, la cerramos y liberamos el vehículo
    const activeShiftResult = await pool.query(
      'SELECT id, matricula FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL',
      [id]
    );
    if (activeShiftResult.rows.length > 0) {
      const shiftId = activeShiftResult.rows[0].id;
      const matricula = activeShiftResult.rows[0].matricula;
      
      await pool.query(
        "UPDATE jornadas SET hora_fin = NOW(), estado = 'FINALIZADA', km_fin = km_inicio WHERE id = $1",
        [shiftId]
      );
      await pool.query(
        "UPDATE vehiculos SET en_uso = FALSE WHERE matricula = $1",
        [matricula]
      );
    }

    res.json({ message: 'Conductor dado de baja con éxito.', conductor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al dar de baja al conductor.' });
  }
});


// CRUD VEHÍCULOS
app.get('/api/admin/vehiculos', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehiculos ORDER BY matricula ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar vehículos.' });
  }
});

app.post('/api/admin/vehiculos', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { matricula, marca_modelo } = req.body;
  if (!matricula || !marca_modelo) {
    return res.status(400).json({ error: 'Matrícula y Marca/Modelo son obligatorios.' });
  }

  const cleanMatricula = matricula.toUpperCase().trim();

  try {
    const result = await pool.query(
      'INSERT INTO vehiculos (matricula, marca_modelo, en_uso, activo) VALUES ($1, $2, FALSE, TRUE) RETURNING *',
      [cleanMatricula, marca_modelo.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Un vehículo con esta matrícula ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al crear vehículo.' });
  }
});

app.put('/api/admin/vehiculos/:matricula', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { matricula } = req.params;
  const { marca_modelo, activo, en_uso } = req.body;

  try {
    const result = await pool.query(
      `UPDATE vehiculos 
       SET marca_modelo = $1, activo = $2, en_uso = $3 
       WHERE matricula = $4 
       RETURNING *`,
      [marca_modelo.trim(), activo, en_uso, matricula.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar vehículo.' });
  }
});


// REPORTES DE KILOMETRAJE
app.get('/api/admin/reportes', authenticateToken, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { conductorId, fechaInicio, fechaFin } = req.query;

  try {
    let sql = `
      SELECT 
        j.id,
        j.id_conductor,
        u.username AS conductor,
        j.matricula,
        j.km_inicio,
        j.km_fin,
        (j.km_fin - j.km_inicio) AS km_recorridos,
        j.hora_inicio,
        j.hora_fin,
        j.estado,
        j.url_foto_km
      FROM jornadas j
      JOIN usuarios u ON j.id_conductor = u.id
      WHERE j.estado = 'FINALIZADA'
    `;
    const params = [];

    // Filtro por Conductor
    if (conductorId && conductorId !== 'todos') {
      params.push(parseInt(conductorId, 10));
      sql += ` AND j.id_conductor = $${params.length}`;
    }

    // Filtro por Fecha Inicio (hora_inicio >= fechaInicio)
    if (fechaInicio) {
      params.push(`${fechaInicio} 00:00:00+00`);
      sql += ` AND j.hora_inicio >= $${params.length}`;
    }

    // Filtro por Fecha Fin (hora_inicio <= fechaFin + 23:59:59)
    if (fechaFin) {
      params.push(`${fechaFin} 23:59:59+00`);
      sql += ` AND j.hora_inicio <= $${params.length}`;
    }

    sql += ' ORDER BY j.hora_inicio DESC';

    const result = await pool.query(sql, params);
    const rows = result.rows;

    // Calcular estadísticas globales
    let totalKilometros = 0;
    let totalJornadas = rows.length;

    rows.forEach(row => {
      totalKilometros += row.km_recorridos || 0;
    });

    res.json({
      resumen: {
        totalKilometros,
        totalJornadas
      },
      detalles: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar reportes de kilometraje.' });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
});

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto: ${PORT}`);
});
