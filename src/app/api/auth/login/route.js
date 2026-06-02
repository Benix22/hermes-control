import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: 'Usuario y contraseña son requeridos.' }, { status: 400 });

    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username.toLowerCase().trim()]);
    const user = result.rows[0];

    if (!user || !user.activo) return NextResponse.json({ error: 'Credenciales inválidas o usuario inactivo.' }, { status: 401 });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return NextResponse.json({ error: 'Credenciales inválidas o usuario inactivo.' }, { status: 401 });

    const token = signToken({ id: user.id, username: user.username, rol: user.rol });
    return NextResponse.json({ token, user: { id: user.id, username: user.username, rol: user.rol } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}