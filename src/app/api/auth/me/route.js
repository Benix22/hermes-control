import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const result = await pool.query('SELECT id, username, rol, activo FROM usuarios WHERE id = $1', [auth.user.id]);
    const user = result.rows[0];
    if (!user || !user.activo) return NextResponse.json({ error: 'Usuario no encontrado o inactivo.' }, { status: 404 });

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}