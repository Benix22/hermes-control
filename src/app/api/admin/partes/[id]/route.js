import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

import { getEstimatedDuration } from '@/lib/googleMaps';

export async function PUT(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { id_conductor, fecha_hora_recogida, nombre_pasajero, direccion_recogida, direccion_destino } = body;

    if (!id_conductor || !fecha_hora_recogida || !nombre_pasajero || !direccion_recogida || !direccion_destino) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const prevResult = await pool.query('SELECT id_conductor, estado FROM partes_trabajo WHERE id = $1', [id]);
    if (prevResult.rows.length === 0) return NextResponse.json({ error: 'Parte no encontrado' }, { status: 404 });
    const prevParte = prevResult.rows[0];

    let fecha_hora_fin_estimada = null;
    try {
      const duracionSegundos = await getEstimatedDuration(direccion_recogida, direccion_destino);
      if (duracionSegundos) {
        fecha_hora_fin_estimada = new Date(new Date(fecha_hora_recogida).getTime() + duracionSegundos * 1000).toISOString();
      }
    } catch(e) {
       console.error("Error al estimar duracion", e);
    }

    const result = await pool.query(
      `UPDATE partes_trabajo 
       SET id_conductor = $1, fecha_hora_recogida = $2, nombre_pasajero = $3, direccion_recogida = $4, direccion_destino = $5,
           estado = CASE WHEN estado = 'CANCELADO' THEN 'PENDIENTE' ELSE estado END,
           motivo_cancelacion = CASE WHEN estado = 'CANCELADO' THEN NULL ELSE motivo_cancelacion END,
           fecha_hora_fin_estimada = COALESCE($7, fecha_hora_fin_estimada)
       WHERE id = $6 RETURNING *`,
      [id_conductor, fecha_hora_recogida, nombre_pasajero, direccion_recogida, direccion_destino, id, fecha_hora_fin_estimada]
    );

    const accion = (prevParte.estado === 'CANCELADO' || prevParte.id_conductor != id_conductor) ? 'REASIGNADO' : 'EDITADO';
    let detalles = (prevParte.estado === 'CANCELADO') ? 'El parte ha sido reabierto tras cancelación.' : 'El parte ha sido modificado.';
    if (prevParte.id_conductor != id_conductor) {
      detalles += ` Asignado a nuevo conductor.`;
    }

    await pool.query(
      `INSERT INTO historial_partes (id_parte, id_usuario, accion, detalles) VALUES ($1, $2, $3, $4)`,
      [id, auth.user.id, accion, detalles]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const result = await pool.query('DELETE FROM partes_trabajo WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Parte no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Parte eliminado correctamente' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno del servidor. Es posible que existan jornadas vinculadas.' }, { status: 500 });
  }
}
