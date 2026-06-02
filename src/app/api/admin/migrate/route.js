import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req) {
  try {
    await pool.query('ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS km_actuales INTEGER DEFAULT 0 NOT NULL');
    await pool.query('ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS km_iniciales INTEGER DEFAULT 0 NOT NULL');
    return NextResponse.json({ success: true, message: 'Migración completada: km_actuales y km_iniciales añadidos a vehiculos.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
