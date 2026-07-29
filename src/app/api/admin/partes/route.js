import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    await pool.query(`UPDATE partes_trabajo SET estado = 'CADUCADO' WHERE estado = 'PENDIENTE' AND fecha_hora_recogida < NOW()`);

    const result = await pool.query(`
      SELECT p.*, u.username as conductor_nombre
      FROM partes_trabajo p
      JOIN usuarios u ON p.id_conductor = u.id
      ORDER BY p.fecha_hora_recogida DESC
    `);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener los partes de trabajo' }, { status: 500 });
  }
}

import { getEstimatedDuration } from '@/lib/googleMaps';

export async function POST(req) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const data = await req.json();
    const { id_conductor, fecha_hora_recogida, nombre_pasajero, direccion_recogida, direccion_destino } = data;

    if (!id_conductor || !fecha_hora_recogida || !nombre_pasajero || !direccion_recogida || !direccion_destino) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

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
      `INSERT INTO partes_trabajo 
        (id_conductor, fecha_hora_recogida, nombre_pasajero, direccion_recogida, direccion_destino, estado, fecha_hora_fin_estimada) 
       VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', $6) RETURNING *`,
      [id_conductor, fecha_hora_recogida, nombre_pasajero, direccion_recogida, direccion_destino, fecha_hora_fin_estimada]
    );
    
    const nuevoParte = result.rows[0];
    
    await pool.query(
      `INSERT INTO historial_partes (id_parte, id_usuario, accion, detalles) VALUES ($1, $2, $3, $4)`,
      [nuevoParte.id, auth.user.id, 'CREADO', 'Parte de trabajo creado y asignado al conductor']
    );

    return NextResponse.json(nuevoParte);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al crear el parte de trabajo' }, { status: 500 });
  }
}
