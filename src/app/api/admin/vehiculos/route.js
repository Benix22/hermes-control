import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const result = await pool.query('SELECT * FROM vehiculos ORDER BY matricula ASC');
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const { matricula, marca_modelo, km_actuales, km_iniciales } = await req.json();
    const kmActParsed = parseInt(km_actuales, 10);
    const validKmAct = isNaN(kmActParsed) ? 0 : kmActParsed;
    
    const kmIniParsed = parseInt(km_iniciales, 10);
    const validKmIni = isNaN(kmIniParsed) ? validKmAct : kmIniParsed;

    const result = await pool.query(
      'INSERT INTO vehiculos (matricula, marca_modelo, km_iniciales, km_actuales, en_uso, activo) VALUES ($1, $2, $3, $4, FALSE, TRUE) RETURNING *',
      [matricula.toUpperCase().trim(), marca_modelo.trim(), validKmIni, validKmAct]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Error creating vehicle:', err);
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 });
  }
}