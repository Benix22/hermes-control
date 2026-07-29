import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`
    ALTER TABLE partes_trabajo 
    ADD COLUMN IF NOT EXISTS fecha_hora_fin_estimada TIMESTAMP WITH TIME ZONE;
  `);
  console.log('Migración completada (fecha_hora_fin_estimada)');
  pool.end();
}
run();
