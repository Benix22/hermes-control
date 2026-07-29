import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    // Ensure table exists (auto-migrate)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(50) PRIMARY KEY,
        valor TEXT NOT NULL
      );
      INSERT INTO configuracion (clave, valor) VALUES ('direccion_base', 'Málaga centro')
      ON CONFLICT (clave) DO NOTHING;
    `);

    const result = await pool.query(`SELECT clave, valor FROM configuracion`);
    const configuracion = {};
    result.rows.forEach(row => {
      configuracion[row.clave] = row.valor;
    });

    return NextResponse.json(configuracion);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const data = await req.json();
    
    // Validate
    if (!data.direccion_base) {
      return NextResponse.json({ error: 'Falta direccion_base' }, { status: 400 });
    }

    // Upsert
    await pool.query(`
      INSERT INTO configuracion (clave, valor) 
      VALUES ('direccion_base', $1)
      ON CONFLICT (clave) DO UPDATE SET valor = $1
    `, [data.direccion_base]);

    return NextResponse.json({ message: 'Configuración actualizada.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
