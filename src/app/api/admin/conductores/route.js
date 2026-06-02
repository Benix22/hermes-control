import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const result = await pool.query("SELECT id, username, rol, activo FROM usuarios WHERE rol = 'CONDUCTOR' ORDER BY username ASC");
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });

    const hashedPass = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (username, password, rol, activo) VALUES ($1, $2, 'CONDUCTOR', TRUE) RETURNING id, username, rol, activo",
      [username.toLowerCase().trim(), hashedPass]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    if (err.code === '23505') return NextResponse.json({ error: 'El usuario ya existe.' }, { status: 400 });
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}