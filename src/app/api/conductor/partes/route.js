import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    // Get partes assigned to this driver that are pending or in progress for today
    // We will just filter by PENDIENTE for now (EN_CURSO means they accepted it and started).
    // Actually, maybe we only want to show PENDIENTE, but let's show both.
    const result = await pool.query(`
      SELECT *
      FROM partes_trabajo
      WHERE id_conductor = $1 
        AND estado IN ('PENDIENTE', 'EN_CURSO')
        AND DATE(fecha_hora_recogida AT TIME ZONE 'UTC') = CURRENT_DATE
      ORDER BY fecha_hora_recogida ASC
    `, [auth.user.id]);
    
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener los partes' }, { status: 500 });
  }
}
