import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const { id } = params;
    const body = await req.json();
    const { km_inicio, km_fin, hora_inicio, hora_fin } = body;

    // Verificar si existe la jornada
    const current = await pool.query('SELECT estado, hora_fin FROM jornadas WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Jornada no encontrada' }, { status: 404 });
    }

    const currentState = current.rows[0].estado;
    const currentHoraFin = current.rows[0].hora_fin;

    // Si nos pasan una hora de fin y la jornada no estaba finalizada, la finalizamos
    let newEstado = currentState;
    if (hora_fin && currentState !== 'FINALIZADA') {
      newEstado = 'FINALIZADA';
    }

    const sql = `
      UPDATE jornadas 
      SET 
        km_inicio = $1, 
        km_fin = $2, 
        hora_inicio = $3, 
        hora_fin = $4,
        estado = $5
      WHERE id = $6
      RETURNING *
    `;
    
    // km pueden ser null, las horas si vienen string vacío las pasamos a null
    const valKmInicio = km_inicio !== '' && km_inicio !== null && km_inicio !== undefined ? parseFloat(km_inicio) : null;
    const valKmFin = km_fin !== '' && km_fin !== null && km_fin !== undefined ? parseFloat(km_fin) : null;
    const valHoraInicio = hora_inicio ? new Date(hora_inicio).toISOString() : null;
    const valHoraFin = hora_fin ? new Date(hora_fin).toISOString() : null;

    const values = [valKmInicio, valKmFin, valHoraInicio, valHoraFin, newEstado, id];

    const result = await pool.query(sql, values);

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando jornada:', err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}
