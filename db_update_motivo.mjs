import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`ALTER TABLE partes_trabajo ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT;`);
  console.log('Migración completada');
  pool.end();
}
run();
