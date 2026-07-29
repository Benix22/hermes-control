import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  if (auth.user.rol !== 'CONDUCTOR' && auth.user.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json({ error: 'No se envió ningún audio' }, { status: 400 });
    }

    // 1. Transcribir el audio usando Whisper
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile, 'audio.webm');
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'es'); // Asumimos español para mayor velocidad y precisión

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: whisperFormData
    });

    if (!whisperRes.ok) {
      const errData = await whisperRes.json();
      console.error('Error Whisper:', errData);
      return NextResponse.json({ error: 'Error al transcribir el audio' }, { status: 500 });
    }

    const whisperData = await whisperRes.json();
    const text = whisperData.text;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'No se detectó voz en el audio' }, { status: 400 });
    }

    // 2. Extraer datos con GPT-4o-mini
    const systemPrompt = `Eres un asistente de flota. El conductor ha enviado el siguiente mensaje de voz (transcrito).
Extrae los datos y devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional ni formateo markdown.

Posibles acciones: "repostaje", "limpieza", "check_out", "desconocido".

Si es repostaje, devuelve:
{
  "action": "repostaje",
  "data": {
    "cantidad_euros": <número>,
    "km_repostaje": <número>
  }
}

Si es limpieza, devuelve:
{
  "action": "limpieza",
  "data": {
    "cantidad_euros": <número>
  }
}

Si el conductor dice que termina la jornada, deja el coche, o indica los kilómetros finales, devuelve:
{
  "action": "check_out",
  "data": {
    "km_fin": <número>
  }
}

Si no entiendes o no es ninguna de las anteriores, devuelve:
{
  "action": "desconocido",
  "data": {}
}

Reglas:
- Los números pueden tener decimales, usa punto en lugar de coma para JSON.
- Si falta algún dato (ej. kilómetros no dichos), pon null.
- Sé inteligente para deducir el coste (euros) o los kilómetros por el contexto.`;

    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      })
    });

    if (!chatRes.ok) {
      const errData = await chatRes.json();
      console.error('Error GPT:', errData);
      return NextResponse.json({ error: 'Error procesando los datos con IA' }, { status: 500 });
    }

    const chatData = await chatRes.json();
    const jsonOutput = JSON.parse(chatData.choices[0].message.content);

    return NextResponse.json({ text, ...jsonOutput });

  } catch (err) {
    console.error('Error general API de voz:', err);
    return NextResponse.json({ error: 'Error del servidor procesando la voz' }, { status: 500 });
  }
}
