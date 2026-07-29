import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`
    ALTER TABLE partes_trabajo DROP CONSTRAINT IF EXISTS partes_trabajo_estado_check;
    ALTER TABLE partes_trabajo ADD CONSTRAINT partes_trabajo_estado_check CHECK (estado IN ('PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'CANCELADO', 'CADUCADO'));
  `);
  console.log('Migración completada (estado CADUCADO)');
  pool.end();
}
run();
