import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { motivo_cancelacion } = await req.json();

    const result = await pool.query(
      `UPDATE partes_trabajo 
       SET estado = 'CANCELADO', motivo_cancelacion = $1 
       WHERE id = $2 RETURNING *`,
      [motivo_cancelacion || 'Cancelado por administrador', id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Parte no encontrado' }, { status: 404 });
    }
    
    await pool.query(
      `INSERT INTO historial_partes (id_parte, id_usuario, accion, detalles) VALUES ($1, $2, $3, $4)`,
      [id, auth.user.id, 'CANCELADO_POR_ADMIN', motivo_cancelacion || 'Cancelado por administrador']
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
