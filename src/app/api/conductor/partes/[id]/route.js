import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req, { params }) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { estado, motivo_cancelacion } = await req.json();

    if (!['EN_CURSO', 'CANCELADO', 'COMPLETADO'].includes(estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE partes_trabajo 
       SET estado = $1, motivo_cancelacion = $4 
       WHERE id = $2 AND id_conductor = $3 
       RETURNING *`,
      [estado, id, auth.user.id, estado === 'CANCELADO' ? (motivo_cancelacion || null) : null]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Parte no encontrado o no asignado a ti' }, { status: 404 });
    }

    let accion = 'ACTUALIZADO';
    if (estado === 'EN_CURSO') accion = 'ACEPTADO_POR_CONDUCTOR';
    if (estado === 'CANCELADO') accion = 'CANCELADO_POR_CONDUCTOR';
    if (estado === 'COMPLETADO') accion = 'COMPLETADO';

    await pool.query(
      `INSERT INTO historial_partes (id_parte, id_usuario, accion, detalles) VALUES ($1, $2, $3, $4)`,
      [id, auth.user.id, accion, estado === 'CANCELADO' ? motivo_cancelacion : '']
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al actualizar el parte' }, { status: 500 });
  }
}
