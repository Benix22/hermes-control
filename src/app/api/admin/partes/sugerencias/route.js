import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { getDistanceMatrix, getEstimatedDuration } from '@/lib/googleMaps';

export async function POST(req) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'Prohibido.' }, { status: 403 });

  try {
    const { origen, destino, fecha_hora } = await req.json();
    if (!origen || !destino || !fecha_hora) {
      return NextResponse.json({ error: 'Faltan parámetros (origen, destino, fecha_hora)' }, { status: 400 });
    }

    const fechaRecogida = new Date(fecha_hora);

    // Obtener la duración del nuevo servicio
    const duracionNuevoServicioSegundos = await getEstimatedDuration(origen, destino) || 0;
    const horaFinEstimadaNuevoServicio = new Date(fechaRecogida.getTime() + duracionNuevoServicioSegundos * 1000);

    // 1. Obtener a todos los conductores activos
    const conductoresRes = await pool.query(`SELECT id, username FROM usuarios WHERE rol = 'CONDUCTOR' AND activo = true`);
    const conductores = conductoresRes.rows;

    if (conductores.length === 0) return NextResponse.json([]);

    const sugerencias = [];
    const origenesAproximacionPrevia = [];
    const destinosAproximacionSiguiente = [];
    
    // 2. Por cada conductor, obtener su ÚLTIMO parte antes y PRIMER parte después
    for (const c of conductores) {
      // Parte anterior
      const resultAnterior = await pool.query(`
        SELECT direccion_destino, fecha_hora_fin_estimada
        FROM partes_trabajo
        WHERE id_conductor = $1 AND estado != 'CANCELADO' AND fecha_hora_recogida <= $2
        ORDER BY fecha_hora_recogida DESC
        LIMIT 1
      `, [c.id, fechaRecogida.toISOString()]);

      // Parte siguiente (comienza DESPUÉS de la fecha_hora propuesta)
      const resultSiguiente = await pool.query(`
        SELECT direccion_recogida, fecha_hora_recogida
        FROM partes_trabajo
        WHERE id_conductor = $1 AND estado != 'CANCELADO' AND fecha_hora_recogida > $2
        ORDER BY fecha_hora_recogida ASC
        LIMIT 1
      `, [c.id, fechaRecogida.toISOString()]);

      let direccionUltimoDestino = null;
      let libreALas = null;

      if (resultAnterior.rows.length > 0) {
        direccionUltimoDestino = resultAnterior.rows[0].direccion_destino;
        libreALas = resultAnterior.rows[0].fecha_hora_fin_estimada;
        origenesAproximacionPrevia.push(direccionUltimoDestino);
      }

      let direccionSiguienteOrigen = null;
      let horaSiguienteServicio = null;

      if (resultSiguiente.rows.length > 0) {
        // Solo consideraremos conflicto si es el mismo día
        const fechaSiguiente = new Date(resultSiguiente.rows[0].fecha_hora_recogida);
        if (fechaSiguiente.toDateString() === fechaRecogida.toDateString()) {
          direccionSiguienteOrigen = resultSiguiente.rows[0].direccion_recogida;
          horaSiguienteServicio = fechaSiguiente;
          destinosAproximacionSiguiente.push(direccionSiguienteOrigen);
        }
      }

      sugerencias.push({
        id_conductor: c.id,
        username: c.username,
        direccion_origen_viaje_aproximacion: direccionUltimoDestino,
        libre_a_las: libreALas,
        distancia_aproximacion: null,
        duracion_aproximacion_segs: null,
        tiempo_texto: '',
        distancia_texto: '',
        direccion_siguiente_origen: direccionSiguienteOrigen,
        hora_siguiente_servicio: horaSiguienteServicio,
        conflicto: false,
        detalles_conflicto: ''
      });
    }

    // 3. Consultar a Google Maps matriz de aproximaciones PREVIAS
    if (origenesAproximacionPrevia.length > 0) {
      const distData = await getDistanceMatrix(origenesAproximacionPrevia, [origen]);
      if (distData && distData.status === 'OK') {
        let originsIndex = 0;
        for (const s of sugerencias) {
          if (s.direccion_origen_viaje_aproximacion) {
            const element = distData.rows[originsIndex].elements[0];
            if (element && element.status === 'OK') {
              s.distancia_aproximacion = element.distance.value;
              s.duracion_aproximacion_segs = element.duration.value;
              s.tiempo_texto = element.duration.text;
              s.distancia_texto = element.distance.text;
            }
            originsIndex++;
          }
        }
      }
    }

    // 4. Consultar a Google Maps matriz de aproximaciones SIGUIENTES
    if (destinosAproximacionSiguiente.length > 0) {
      const distDataSig = await getDistanceMatrix([destino], destinosAproximacionSiguiente);
      if (distDataSig && distDataSig.status === 'OK') {
        let destsIndex = 0;
        for (const s of sugerencias) {
          if (s.direccion_siguiente_origen) {
            const element = distDataSig.rows[0].elements[destsIndex];
            if (element && element.status === 'OK') {
              const duracionAproximacionSiguiente = element.duration.value;
              const horaLlegadaSiguiente = new Date(horaFinEstimadaNuevoServicio.getTime() + duracionAproximacionSiguiente * 1000);
              
              if (horaLlegadaSiguiente > s.hora_siguiente_servicio) {
                s.conflicto = true;
                s.detalles_conflicto = `Llegaría a las ${horaLlegadaSiguiente.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}, tarde para su servicio de las ${s.hora_siguiente_servicio.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`;
              }
            }
            destsIndex++;
          }
        }
      }
    }

    // 5. Evaluar conflictos también por la aproximación PREVIA (si sale tarde del servicio anterior)
    for (const s of sugerencias) {
      if (s.libre_a_las && s.duracion_aproximacion_segs !== null) {
        const horaLlegadaNuevo = new Date(new Date(s.libre_a_las).getTime() + s.duracion_aproximacion_segs * 1000);
        if (horaLlegadaNuevo > fechaRecogida) {
          s.conflicto = true;
          const detalle = `Llegaría tarde al nuevo servicio a las ${horaLlegadaNuevo.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`;
          s.detalles_conflicto = s.detalles_conflicto ? detalle + " " + s.detalles_conflicto : detalle;
        }
      }
    }

    // 6. Ordenar sugerencias (Conflictos al final, luego por menor tiempo de llegada)
    sugerencias.sort((a, b) => {
      if (a.conflicto && !b.conflicto) return 1;
      if (!a.conflicto && b.conflicto) return -1;
      
      if (a.duracion_aproximacion_segs !== null && b.duracion_aproximacion_segs !== null) {
        return a.duracion_aproximacion_segs - b.duracion_aproximacion_segs;
      }
      if (a.duracion_aproximacion_segs === null) return -1;
      if (b.duracion_aproximacion_segs === null) return 1;
      return 0;
    });

    return NextResponse.json(sugerencias);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al calcular sugerencias.' }, { status: 500 });
  }
}
