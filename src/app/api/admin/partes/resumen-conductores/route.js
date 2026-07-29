import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    let startDate = new Date(0).toISOString(); // Desde el inicio de los tiempos si no hay filtro
    let endDate = new Date('2099-12-31T23:59:59.999Z').toISOString(); // Hasta el 2099

    if (fechaInicio) {
      startDate = new Date(fechaInicio).toISOString();
    }
    if (fechaFin) {
      const d = new Date(fechaFin);
      d.setHours(23, 59, 59, 999);
      endDate = d.toISOString();
    }

    const sql = `
      SELECT
        u.id,
        u.username,
        (SELECT COUNT(*) FROM partes_trabajo p WHERE p.id_conductor = u.id AND p.estado = 'COMPLETADO' AND p.fecha_hora_recogida >= $1 AND p.fecha_hora_recogida <= $2) as partes_completados,
        (SELECT SUM(j.km_fin - j.km_inicio) FROM jornadas j WHERE j.id_conductor = u.id AND j.id_parte IS NOT NULL AND j.hora_inicio >= $1 AND j.hora_inicio <= $2) as total_km,
        (SELECT SUM(r.cantidad_euros) FROM repostajes r JOIN jornadas j ON r.id_jornada = j.id WHERE j.id_conductor = u.id AND j.id_parte IS NOT NULL AND j.hora_inicio >= $1 AND j.hora_inicio <= $2) as total_combustible,
        (SELECT SUM(l.cantidad_euros) FROM limpiezas l JOIN jornadas j ON l.id_jornada = j.id WHERE j.id_conductor = u.id AND j.id_parte IS NOT NULL AND j.hora_inicio >= $1 AND j.hora_inicio <= $2) as total_limpiezas
      FROM usuarios u
      WHERE u.rol = 'CONDUCTOR'
      ORDER BY u.username;
    `;
    
    const params = [startDate, endDate];
    const result = await pool.query(sql, params);

    // Format numbers
    const resumen = result.rows.map(r => ({
      ...r,
      partes_completados: parseInt(r.partes_completados) || 0,
      total_km: parseInt(r.total_km) || 0,
      total_combustible: parseFloat(r.total_combustible) || 0,
      total_limpiezas: parseFloat(r.total_limpiezas) || 0,
    }));

    return NextResponse.json(resumen);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
