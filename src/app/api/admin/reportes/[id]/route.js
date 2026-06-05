import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { km_inicio, km_fin, hora_inicio, hora_fin, repostajes, limpiezas } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si existe la jornada
      const current = await client.query('SELECT estado, hora_fin, matricula FROM jornadas WHERE id = $1 FOR UPDATE', [id]);
      if (current.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Jornada no encontrada' }, { status: 404 });
      }

      const currentState = current.rows[0].estado;
      const matricula = current.rows[0].matricula;

      let newEstado = currentState;
      if (hora_fin && currentState !== 'FINALIZADA') {
        newEstado = 'FINALIZADA';
        await client.query('UPDATE vehiculos SET en_uso = false WHERE matricula = $1', [matricula]);
      }

      const valKmInicio = km_inicio !== '' && km_inicio !== null && km_inicio !== undefined ? parseFloat(km_inicio) : null;
      const valKmFin = km_fin !== '' && km_fin !== null && km_fin !== undefined ? parseFloat(km_fin) : null;
      const valHoraInicio = hora_inicio ? new Date(hora_inicio).toISOString() : null;
      const valHoraFin = hora_fin ? new Date(hora_fin).toISOString() : null;

      const sqlJornada = `
        UPDATE jornadas 
        SET km_inicio = $1, km_fin = $2, hora_inicio = $3, hora_fin = $4, estado = $5
        WHERE id = $6 RETURNING *
      `;
      const result = await client.query(sqlJornada, [valKmInicio, valKmFin, valHoraInicio, valHoraFin, newEstado, id]);

      // --- Sincronizar Repostajes ---
      if (repostajes && Array.isArray(repostajes)) {
        // Eliminar los que ya no están
        const idsToKeep = repostajes.filter(r => r.id).map(r => r.id);
        if (idsToKeep.length > 0) {
          await client.query(`DELETE FROM repostajes WHERE id_jornada = $1 AND id != ALL($2::int[])`, [id, idsToKeep]);
        } else {
          await client.query(`DELETE FROM repostajes WHERE id_jornada = $1`, [id]);
        }

        // Insertar o actualizar
        for (const rep of repostajes) {
          const euros = rep.cantidad_euros || 0;
          const adblueL = rep.adblue_litros || 0;
          const adblueE = rep.adblue_euros || 0;
          const kmR = rep.km_repostaje || null;

          if (rep.id) {
            await client.query(`
              UPDATE repostajes 
              SET cantidad_euros = $1, adblue_litros = $2, adblue_euros = $3, km_repostaje = $4
              WHERE id = $5 AND id_jornada = $6
            `, [euros, adblueL, adblueE, kmR, rep.id, id]);
          } else {
            await client.query(`
              INSERT INTO repostajes (id_jornada, cantidad_euros, adblue_litros, adblue_euros, km_repostaje, fecha_hora)
              VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))
            `, [id, euros, adblueL, adblueE, kmR, valHoraFin]);
          }
        }
      }

      // --- Sincronizar Limpiezas ---
      if (limpiezas && Array.isArray(limpiezas)) {
        const idsToKeep = limpiezas.filter(l => l.id).map(l => l.id);
        if (idsToKeep.length > 0) {
          await client.query(`DELETE FROM limpiezas WHERE id_jornada = $1 AND id != ALL($2::int[])`, [id, idsToKeep]);
        } else {
          await client.query(`DELETE FROM limpiezas WHERE id_jornada = $1`, [id]);
        }

        for (const lim of limpiezas) {
          const euros = lim.cantidad_euros || 0;
          if (lim.id) {
            await client.query(`UPDATE limpiezas SET cantidad_euros = $1 WHERE id = $2 AND id_jornada = $3`, [euros, lim.id, id]);
          } else {
            await client.query(`
              INSERT INTO limpiezas (id_jornada, cantidad_euros, fecha_hora)
              VALUES ($1, $2, COALESCE($3, NOW()))
            `, [id, euros, valHoraFin]);
          }
        }
      }

      await client.query('COMMIT');
      return NextResponse.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error actualizando jornada:', err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = verifyAuth(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const current = await client.query('SELECT estado, matricula FROM jornadas WHERE id = $1 FOR UPDATE', [id]);
      if (current.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Jornada no encontrada' }, { status: 404 });
      }

      const { estado, matricula } = current.rows[0];

      // Borrar en cascada simulada (o manual si no hay ON DELETE CASCADE en la DB)
      await client.query('DELETE FROM pausas WHERE id_jornada = $1', [id]);
      await client.query('DELETE FROM repostajes WHERE id_jornada = $1', [id]);
      await client.query('DELETE FROM limpiezas WHERE id_jornada = $1', [id]);
      await client.query('DELETE FROM jornadas WHERE id = $1', [id]);

      // Si estaba activa o pausada, liberar el vehículo
      if (estado === 'ACTIVA' || estado === 'PAUSADA') {
        await client.query('UPDATE vehiculos SET en_uso = false WHERE matricula = $1', [matricula]);
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, message: 'Jornada eliminada completamente' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error eliminando jornada:', err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}
