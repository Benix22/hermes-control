const { pool } = require('./src/lib/db.js');

async function check() {
  try {
    const res = await pool.query(`
      SELECT p.id, p.estado, p.fecha_hora_recogida, p.fecha_hora_fin_estimada, p.direccion_destino 
      FROM partes_trabajo p 
      JOIN usuarios u ON p.id_conductor = u.id 
      WHERE u.username = 'test' 
      ORDER BY p.fecha_hora_recogida DESC 
      LIMIT 5
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
