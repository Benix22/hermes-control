import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS historial_partes (
        id SERIAL PRIMARY KEY,
        id_parte INTEGER NOT NULL REFERENCES partes_trabajo(id) ON DELETE CASCADE,
        id_usuario INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        accion VARCHAR(50) NOT NULL,
        detalles TEXT,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_historial_parte ON historial_partes(id_parte);
  `);
  console.log('Migración completada');
  pool.end();
}
run();
