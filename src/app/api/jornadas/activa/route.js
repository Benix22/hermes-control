import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const shiftResult = await pool.query(
      `SELECT j.*, v.marca_modelo 
       FROM jornadas j
       JOIN vehiculos v ON j.matricula = v.matricula
       WHERE j.id_conductor = $1 AND j.hora_fin IS NULL`,
      [auth.user.id]
    );

    if (shiftResult.rows.length === 0) return NextResponse.json({ activa: false });

    const shift = shiftResult.rows[0];
    const pausesResult = await pool.query('SELECT * FROM pausas_jornada WHERE id_jornada = $1 ORDER BY hora_inicio ASC', [shift.id]);

    return NextResponse.json({ activa: true, jornada: { ...shift, pausas: pausesResult.rows } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}