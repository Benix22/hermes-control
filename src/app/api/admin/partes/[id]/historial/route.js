import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await pool.query(`
      SELECT h.*, u.username, u.rol
      FROM historial_partes h
      LEFT JOIN usuarios u ON h.id_usuario = u.id
      WHERE h.id_parte = $1
      ORDER BY h.creado_en DESC
    `, [id]);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener el historial del parte' }, { status: 500 });
  }
}
