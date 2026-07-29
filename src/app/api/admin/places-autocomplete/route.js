import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPlacesAutocomplete } from '@/lib/googleMaps';

export async function GET(req) {
  const auth = verifyAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Tanto administradores como conductores podrían llegar a usar esto, así que permitimos a ambos.
  // Pero por ahora solo lo usamos en admin.

  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input');

  if (!input || input.trim() === '') {
    return NextResponse.json([]);
  }

  try {
    const predictions = await getPlacesAutocomplete(input);
    return NextResponse.json(predictions);
  } catch (err) {
    console.error('Error en endpoint places-autocomplete:', err);
    return NextResponse.json({ error: 'Error al buscar direcciones.' }, { status: 500 });
  }
}
