const { pool } = require('./src/lib/db.js');
async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(50) PRIMARY KEY,
        valor TEXT NOT NULL
      );
      INSERT INTO configuracion (clave, valor) VALUES ('direccion_base', 'Málaga centro')
      ON CONFLICT (clave) DO NOTHING;
    `);
    console.log('Migración completada con éxito.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}
run();
