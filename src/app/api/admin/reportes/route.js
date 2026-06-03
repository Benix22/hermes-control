import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const conductorId = searchParams.get('conductorId');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const matricula = searchParams.get('matricula');

    let sql = `SELECT 
      j.id, j.id_conductor, u.username AS conductor, j.matricula, j.km_inicio, j.km_fin, 
      (j.km_fin - j.km_inicio) AS km_recorridos, j.hora_inicio, j.hora_fin, j.estado, j.url_foto_km,
      (
        SELECT COALESCE(json_agg(
            json_build_object(
                'hora_inicio', p.hora_inicio,
                'hora_fin', p.hora_fin
            ) ORDER BY p.hora_inicio ASC
        ), '[]'::json)
        FROM pausas_jornada p WHERE p.id_jornada = j.id
      ) as pausas,
      (
        SELECT COALESCE(json_agg(
            json_build_object(
                'fecha_hora', r.fecha_hora,
                'cantidad_euros', r.cantidad_euros,
                'km_repostaje', r.km_repostaje
            ) ORDER BY r.fecha_hora ASC
        ), '[]'::json)
        FROM repostajes r WHERE r.id_jornada = j.id
      ) as repostajes
      FROM jornadas j JOIN usuarios u ON j.id_conductor = u.id WHERE j.estado = 'FINALIZADA'`;
    const params = [];

    if (conductorId && conductorId !== 'todos') {
      params.push(parseInt(conductorId, 10));
      sql += ` AND j.id_conductor = $${params.length}`;
    }
    if (matricula && matricula !== 'todas') {
      params.push(matricula.toUpperCase());
      sql += ` AND j.matricula = $${params.length}`;
    }
    if (fechaInicio) {
      params.push(`${fechaInicio} 00:00:00+00`);
      sql += ` AND j.hora_inicio >= $${params.length}`;
    }
    if (fechaFin) {
      params.push(`${fechaFin} 23:59:59+00`);
      sql += ` AND j.hora_inicio <= $${params.length}`;
    }
    sql += ' ORDER BY j.hora_inicio DESC';

    const result = await pool.query(sql, params);
    const rows = result.rows;
    let totalKilometros = 0;
    rows.forEach(row => totalKilometros += row.km_recorridos || 0);

    return NextResponse.json({ resumen: { totalKilometros, totalJornadas: rows.length }, detalles: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}