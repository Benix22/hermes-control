import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const { matricula } = params;
    const { marca_modelo, activo, en_uso } = await req.json();

    const result = await pool.query(
      "UPDATE vehiculos SET marca_modelo = $1, activo = $2, en_uso = $3 WHERE matricula = $4 RETURNING *",
      [marca_modelo.trim(), activo, en_uso, matricula.toUpperCase()]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}