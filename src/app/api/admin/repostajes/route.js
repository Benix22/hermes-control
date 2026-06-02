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

    let sql = `
      SELECT 
        r.id, 
        r.cantidad_euros, 
        r.fecha_hora, 
        j.matricula, 
        u.username AS conductor
      FROM repostajes r 
      JOIN jornadas j ON r.id_jornada = j.id 
      JOIN usuarios u ON j.id_conductor = u.id 
      WHERE 1=1
    `;
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
      sql += ` AND r.fecha_hora >= $${params.length}`;
    }
    if (fechaFin) {
      params.push(`${fechaFin} 23:59:59+00`);
      sql += ` AND r.fecha_hora <= $${params.length}`;
    }
    sql += ' ORDER BY r.fecha_hora DESC';

    const result = await pool.query(sql, params);
    const rows = result.rows;
    let totalEuros = 0;
    rows.forEach(row => totalEuros += parseFloat(row.cantidad_euros) || 0);

    return NextResponse.json({ resumen: { totalEuros, totalRepostajes: rows.length }, detalles: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
