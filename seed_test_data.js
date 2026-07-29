require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

async function seed() {
  try {
    console.log('Generando datos de prueba...');
    
    let startId = 10000;
    
    const drivers = [
      { id: 8, name: 'andres', type: 'perfect' }, 
      { id: 2, name: 'gabriel', type: 'minor' },  
      { id: 9, name: 'miguel', type: 'bad' },     
      { id: 14, name: 'test', type: 'mixed' }     
    ];

    const destinations = [
      { origin: 'Aeropuerto de Málaga', dest: 'Marbella Centro', estMins: 45 },
      { origin: 'Estación María Zambrano', dest: 'Estepona', estMins: 65 },
      { origin: 'Mijas Pueblo', dest: 'Puerto Banús', estMins: 35 },
      { origin: 'Málaga Centro', dest: 'Nerja', estMins: 55 }
    ];

    let partesQueries = [];
    let historialQueries = [];

    let day = 1;

    for (const driver of drivers) {
      for (let i = 0; i < 5; i++) {
        const pId = startId++;
        const route = destinations[i % destinations.length];
        
        const baseDate = new Date(`2026-07-${String(day).padStart(2, '0')}T10:00:00Z`);
        day = (day % 28) + 1; 
        
        const recogida = new Date(baseDate);
        const estimada = new Date(recogida.getTime() + route.estMins * 60000);
        
        const inicioReal = new Date(recogida.getTime() - 5 * 60000); 
        
        let realMins = route.estMins;
        
        if (driver.type === 'perfect') {
          realMins += Math.floor(Math.random() * 3); 
        } else if (driver.type === 'minor') {
          realMins += Math.floor(Math.random() * 5) + 3; 
        } else if (driver.type === 'bad') {
          realMins += Math.floor(route.estMins * 0.5) + 10; 
        } else if (driver.type === 'mixed') {
          if (i === 2) { 
            realMins += route.estMins * 2; 
          } else {
            realMins += 2; 
          }
        }
        
        const finReal = new Date(inicioReal.getTime() + realMins * 60000);

        partesQueries.push(`
          INSERT INTO partes_trabajo 
          (id, id_conductor, fecha_hora_recogida, nombre_pasajero, direccion_recogida, direccion_destino, estado, fecha_hora_fin_estimada, creado_en)
          VALUES 
          (${pId}, ${driver.id}, '${recogida.toISOString()}', 'Cliente de Prueba ${pId}', '${route.origin}', '${route.dest}', 'COMPLETADO', '${estimada.toISOString()}', '${new Date(baseDate.getTime() - 3600000).toISOString()}')
        `);

        historialQueries.push(`
          INSERT INTO historial_partes (id_parte, id_usuario, accion, creado_en)
          VALUES (${pId}, ${driver.id}, 'ACEPTADO_POR_CONDUCTOR', '${inicioReal.toISOString()}')
        `);

        historialQueries.push(`
          INSERT INTO historial_partes (id_parte, id_usuario, accion, creado_en)
          VALUES (${pId}, ${driver.id}, 'COMPLETADO', '${finReal.toISOString()}')
        `);
      }
    }

    console.log(`Insertando ${partesQueries.length} partes...`);
    for(let q of partesQueries) await pool.query(q);
    
    console.log(`Insertando ${historialQueries.length} registros en historial...`);
    for(let q of historialQueries) await pool.query(q);

    console.log('✅ Base de datos poblada con éxito. ¡Ve a la app a probarlo!');
    process.exit(0);

  } catch(e) {
    console.error('Error insertando datos:', e);
    process.exit(1);
  }
}

seed();
