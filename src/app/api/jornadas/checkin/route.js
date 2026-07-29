import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { matricula, km_inicio, url_foto_km, id_parte } = await req.json();
    if (!matricula || km_inicio === undefined) return NextResponse.json({ error: 'Matrícula y Kilómetros Iniciales son obligatorios.' }, { status: 400 });
    if (!url_foto_km) return NextResponse.json({ error: 'La fotografía del cuentakilómetros es obligatoria para iniciar la jornada.' }, { status: 400 });

    const kmInicioNum = parseInt(km_inicio, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const activeShiftCheck = await client.query('SELECT id FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL', [auth.user.id]);
      if (activeShiftCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Ya tienes una jornada activa en curso.' }, { status: 400 });
      }

      const vehicleCheck = await client.query('SELECT en_uso, activo, km_actuales FROM vehiculos WHERE matricula = $1 FOR UPDATE', [matricula]);
      if (vehicleCheck.rows.length === 0) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'El vehículo no existe.' }, { status: 404 }); }
      
      const vehicle = vehicleCheck.rows[0];
      if (!vehicle.activo) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Este vehículo está dado de baja.' }, { status: 400 }); }
      if (vehicle.en_uso) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Vehículo ocupado.' }, { status: 400 }); }

      if (kmInicioNum < vehicle.km_actuales) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Los km de inicio (${kmInicioNum}) no pueden ser menores a los actuales del vehículo (${vehicle.km_actuales}).` }, { status: 400 });
      }

      let kmPerdidosExtra = 0;
      if (kmInicioNum > vehicle.km_actuales) {
        kmPerdidosExtra = kmInicioNum - vehicle.km_actuales;
      }

      await client.query('UPDATE vehiculos SET en_uso = TRUE, km_actuales = $2, km_perdidos = km_perdidos + $3 WHERE matricula = $1', [matricula, kmInicioNum, kmPerdidosExtra]);
      
      const insertShift = await client.query(
        `INSERT INTO jornadas (id_conductor, matricula, km_inicio, url_foto_km, estado, hora_inicio, id_parte) 
         VALUES ($1, $2, $3, $4, 'ACTIVA', NOW(), $5) RETURNING *`,
        [auth.user.id, matricula, kmInicioNum, url_foto_km || null, id_parte || null]
      );

      if (id_parte) {
        await client.query("UPDATE partes_trabajo SET estado = 'EN_CURSO' WHERE id = $1 AND id_conductor = $2", [id_parte, auth.user.id]);
      }

      await client.query('COMMIT');
      return NextResponse.json(insertShift.rows[0], { status: 201 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}