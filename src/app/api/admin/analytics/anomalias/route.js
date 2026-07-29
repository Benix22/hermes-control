import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.user.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
  }

  try {
    // 1. Obtener los partes completados con tiempos estimados y reales
    const query = `
      SELECT 
          p.id as parte_id,
          p.nombre_pasajero,
          p.direccion_recogida,
          p.direccion_destino,
          EXTRACT(EPOCH FROM (p.fecha_hora_fin_estimada - p.fecha_hora_recogida))/60 AS mins_estimados,
          MIN(h_inicio.creado_en) AS hora_inicio_real,
          MAX(h_fin.creado_en) AS hora_fin_real,
          u.username as conductor_nombre
      FROM partes_trabajo p
      JOIN usuarios u ON p.id_conductor = u.id
      JOIN historial_partes h_inicio ON h_inicio.id_parte = p.id AND h_inicio.accion = 'ACEPTADO_POR_CONDUCTOR'
      JOIN historial_partes h_fin ON h_fin.id_parte = p.id AND h_fin.accion = 'COMPLETADO'
      WHERE p.estado = 'COMPLETADO' 
      GROUP BY p.id, p.nombre_pasajero, p.direccion_recogida, p.direccion_destino, p.fecha_hora_recogida, p.fecha_hora_fin_estimada, u.username
    `;
    
    const result = await pool.query(query);
    const partes = result.rows;

    // 2. Procesar los datos en JS (calcular desviaciones)
    const partesConDesviacion = partes.map(p => {
      const inicio = new Date(p.hora_inicio_real);
      const fin = new Date(p.hora_fin_real);
      const mins_reales = Math.round((fin - inicio) / 1000 / 60);
      const mins_estimados = Math.round(p.mins_estimados || 0);
      
      let desviacion_porcentaje = 0;
      if (mins_estimados > 0) {
        desviacion_porcentaje = Math.round(((mins_reales - mins_estimados) / mins_estimados) * 100);
      }

      return {
        ...p,
        mins_reales,
        mins_estimados,
        desviacion_porcentaje
      };
    });

    // Quedarnos solo con las anomalías reales (donde el porcentaje de desviación sea > 0)
    // Para no saturar el prompt, y ordenar de mayor a menor anomalía
    const anomalias = partesConDesviacion
      .filter(p => p.desviacion_porcentaje > 10) // Más de un 10% de retraso
      .sort((a, b) => b.desviacion_porcentaje - a.desviacion_porcentaje);

    // Si no hay datos suficientes
    if (anomalias.length === 0) {
      return NextResponse.json({
        reporteIA: "No se han detectado anomalías significativas en las rutas recientes. Todos los conductores están cumpliendo los tiempos estimados de Google Maps con una desviación menor al 10%.",
        anomalias: []
      });
    }

    // 3. Agrupar por conductor para enviar un resumen claro a la IA
    const porConductor = {};
    anomalias.forEach(a => {
      if (!porConductor[a.conductor_nombre]) {
        porConductor[a.conductor_nombre] = { total_anomalias: 0, suma_desviacion: 0, max_desviacion: 0 };
      }
      porConductor[a.conductor_nombre].total_anomalias++;
      porConductor[a.conductor_nombre].suma_desviacion += a.desviacion_porcentaje;
      if (a.desviacion_porcentaje > porConductor[a.conductor_nombre].max_desviacion) {
        porConductor[a.conductor_nombre].max_desviacion = a.desviacion_porcentaje;
      }
    });

    const resumenIA = Object.entries(porConductor).map(([nombre, datos]) => {
      return `Conductor: ${nombre} | Partes con retraso: ${datos.total_anomalias} | Desviación Media: ${Math.round(datos.suma_desviacion / datos.total_anomalias)}% | Peor retraso: ${datos.max_desviacion}%`;
    }).join('\n');

    // 4. Llamada a GPT-4o-mini
    const systemPrompt = `Eres un auditor de flotas de vehículos. Tu tarea es analizar el siguiente resumen de desviaciones de tiempo de los conductores.
Los datos muestran cuánto porcentaje de tiempo DE MÁS han tardado en completar las rutas respecto al tiempo estimado original.
Redacta un breve reporte ejecutivo (2-3 párrafos) destacando a los conductores más problemáticos y sugiriendo qué hacer (revisar si hay atascos, preguntarles directamente, sospecha de tiempos muertos injustificados). 
Usa un tono profesional, claro y directo. No uses sintaxis markdown compleja, solo texto y algunos emojis si quieres.

Datos de anomalías de este mes:
${resumenIA}`;

    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt }
        ],
        temperature: 0.5
      })
    });

    if (!chatRes.ok) {
      console.error('Error GPT:', await chatRes.text());
      return NextResponse.json({ error: 'Error generando reporte IA' }, { status: 500 });
    }

    const chatData = await chatRes.json();
    const reporteIA = chatData.choices[0].message.content;

    return NextResponse.json({
      reporteIA,
      anomalias: anomalias.slice(0, 50) // Devolver top 50 anomalías
    });

  } catch (err) {
    console.error('Error general API anomalías:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
