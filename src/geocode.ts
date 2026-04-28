export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SignPostApp/1.0' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const road   = a.road ?? a.pedestrian ?? a.path ?? a.footway ?? null;
    const street = road ? (a.house_number ? `${a.house_number} ${road}` : road) : null;
    const area   = a.neighbourhood ?? a.suburb ?? a.city_district ?? null;
    const city   = a.city ?? a.town ?? a.village ?? null;
    return [street, area, city, a.state].filter(Boolean).join(', ') || data.display_name || null;
  } catch {
    return null;
  }
}
