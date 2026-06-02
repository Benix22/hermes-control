import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { cantidad_euros } = await req.json();
    if (!cantidad_euros || isNaN(parseFloat(cantidad_euros)) || parseFloat(cantidad_euros) <= 0) {
      return NextResponse.json({ error: 'Cantidad en euros inválida.' }, { status: 400 });
    }

    // Comprobar que el usuario tiene una jornada activa
    const active = await pool.query("SELECT id FROM jornadas WHERE id_conductor = $1 AND estado = 'ACTIVA'", [auth.user.id]);
    if (active.rows.length === 0) {
      return NextResponse.json({ error: 'No tienes una jornada activa (o está pausada) para registrar repostajes.' }, { status: 400 });
    }

    const id_jornada = active.rows[0].id;

    const result = await pool.query(
      'INSERT INTO repostajes (id_jornada, cantidad_euros) VALUES ($1, $2) RETURNING *',
      [id_jornada, parseFloat(cantidad_euros)]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Error guardando repostaje:', err);
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 });
  }
}
