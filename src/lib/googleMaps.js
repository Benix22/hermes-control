export async function getDistanceMatrix(origins, destinations) {
  const apiKey = process.env.MAPS_API_KEY;
  if (!apiKey) {
    console.error('MAPS_API_KEY no está configurada.');
    return null;
  }

  const originsStr = origins.map(o => encodeURIComponent(o)).join('|');
  const destsStr = destinations.map(d => encodeURIComponent(d)).join('|');

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destsStr}&mode=driving&language=es&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK') {
      return data;
    }
    console.error('Error en API de Google Maps:', data);
    return null;
  } catch (err) {
    console.error('Error haciendo fetch a Google Maps:', err);
    return null;
  }
}

export async function getEstimatedDuration(origen, destino) {
  const data = await getDistanceMatrix([origen], [destino]);
  if (data && data.rows && data.rows.length > 0 && data.rows[0].elements.length > 0) {
    const element = data.rows[0].elements[0];
    if (element.status === 'OK') {
      // Devuelve la duración en segundos
      return element.duration.value;
    }
  }
  return null;
}
