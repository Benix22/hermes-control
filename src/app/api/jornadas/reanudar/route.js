import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const shiftResult = await client.query('SELECT id, estado FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL FOR UPDATE', [auth.user.id]);
      if (shiftResult.rows.length === 0) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'No tienes jornada activa.' }, { status: 400 }); }
      
      const shift = shiftResult.rows[0];
      if (shift.estado !== 'PAUSADA') { await client.query('ROLLBACK'); return NextResponse.json({ error: 'No está pausada.' }, { status: 400 }); }

      await client.query('UPDATE pausas_jornada SET hora_fin = NOW() WHERE id_jornada = $1 AND hora_fin IS NULL', [shift.id]);
      const updateShift = await client.query("UPDATE jornadas SET estado = 'ACTIVA' WHERE id = $1 RETURNING *", [shift.id]);
      await client.query('COMMIT');
      return NextResponse.json(updateShift.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}