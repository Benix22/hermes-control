import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { username, password, activo } = await req.json();

    let query, queryParams;
    if (password) {
      const hashedPass = await bcrypt.hash(password, 10);
      query = 'UPDATE usuarios SET username = $1, password = $2, activo = $3 WHERE id = $4 RETURNING id, username, rol, activo';
      queryParams = [username.toLowerCase().trim(), hashedPass, activo, id];
    } else {
      query = 'UPDATE usuarios SET username = $1, activo = $2 WHERE id = $3 RETURNING id, username, rol, activo';
      queryParams = [username.toLowerCase().trim(), activo, id];
    }

    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    if (activo === false) {
      const active = await pool.query('SELECT id, matricula FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL', [id]);
      if (active.rows.length > 0) {
        await pool.query("UPDATE jornadas SET hora_fin = NOW(), estado = 'FINALIZADA', km_fin = km_inicio WHERE id = $1", [active.rows[0].id]);
        await pool.query("UPDATE vehiculos SET en_uso = FALSE WHERE matricula = $1", [active.rows[0].matricula]);
      }
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const result = await pool.query('UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id, username, rol, activo', [id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const active = await pool.query('SELECT id, matricula FROM jornadas WHERE id_conductor = $1 AND hora_fin IS NULL', [id]);
    if (active.rows.length > 0) {
      await pool.query("UPDATE jornadas SET hora_fin = NOW(), estado = 'FINALIZADA', km_fin = km_inicio WHERE id = $1", [active.rows[0].id]);
      await pool.query("UPDATE vehiculos SET en_uso = FALSE WHERE matricula = $1", [active.rows[0].matricula]);
    }
    return NextResponse.json({ message: 'Baja exitosa', conductor: result.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Error.' }, { status: 500 });
  }
}