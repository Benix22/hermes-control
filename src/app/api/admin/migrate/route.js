import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req) {
  try {
    await pool.query('ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS km_actuales INTEGER DEFAULT 0 NOT NULL');
    await pool.query('ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS km_iniciales INTEGER DEFAULT 0 NOT NULL');
    await pool.query('ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS url_foto_fin_km TEXT');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS repostajes (
          id SERIAL PRIMARY KEY,
          id_jornada INTEGER NOT NULL REFERENCES jornadas(id) ON DELETE CASCADE,
          cantidad_euros DECIMAL(10,2) NOT NULL,
          km_repostaje INTEGER NOT NULL DEFAULT 0,
          fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    await pool.query('ALTER TABLE repostajes ADD COLUMN IF NOT EXISTS km_repostaje INTEGER NOT NULL DEFAULT 0');
    await pool.query('ALTER TABLE repostajes ADD COLUMN IF NOT EXISTS adblue_litros DECIMAL(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE repostajes ADD COLUMN IF NOT EXISTS adblue_euros DECIMAL(10,2) DEFAULT 0');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS limpiezas (
          id SERIAL PRIMARY KEY,
          id_jornada INTEGER NOT NULL REFERENCES jornadas(id) ON DELETE CASCADE,
          cantidad_euros DECIMAL(10,2) NOT NULL,
          fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    return NextResponse.json({ success: true, message: 'Migración completada.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
