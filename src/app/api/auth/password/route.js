import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    // Solo permitimos al admin cambiar su contraseña desde este endpoint, o también conductores si quisieran
    // El usuario que pide cambiar la contraseña es auth.user
    
    const { currentPassword, newPassword } = await req.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    // Verificar que la contraseña actual es correcta
    const result = await pool.query('SELECT password FROM usuarios WHERE id = $1', [auth.user.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta.' }, { status: 401 });
    }

    // Encriptar y actualizar la nueva contraseña
    const hashedPass = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPass, auth.user.id]);

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}
