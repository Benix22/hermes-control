import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { km_fin, url_foto_fin_km } = await req.json();
    if (km_fin === undefined) return NextResponse.json({ error: 'Kilómetros finales obligatorios.' }, { status: 400 });
    if (!url_foto_fin_km) return NextResponse.json({ error: 'La fotografía del cuentakilómetros es obligatoria para finalizar la jornada.' }, { status: 400 });

    const kmFinNum = parseInt(km_fin, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const shiftResult = await client.query('SELECT * FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL FOR UPDATE', [auth.user.id]);
      if (shiftResult.rows.length === 0) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'No tienes jornada activa.' }, { status: 400 }); }
      
      const shift = shiftResult.rows[0];
      if (kmFinNum < shift.km_inicio) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Km finales menores a los iniciales.' }, { status: 400 }); }

      if (shift.estado === 'PAUSADA') {
        await client.query('UPDATE pausas_jornada SET hora_fin = NOW() WHERE id_jornada = $1 AND hora_fin IS NULL', [shift.id]);
      }

      const updateShift = await client.query(
        "UPDATE jornadas SET km_fin = $1, hora_fin = NOW(), url_foto_fin_km = $2, estado = 'FINALIZADA' WHERE id = $3 RETURNING *",
        [kmFinNum, url_foto_fin_km, shift.id]
      );
      await client.query('UPDATE vehiculos SET en_uso = FALSE, km_actuales = $2 WHERE matricula = $1', [shift.matricula, kmFinNum]);
      await client.query('COMMIT');
      return NextResponse.json({ success: true, jornada: updateShift.rows[0] });
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