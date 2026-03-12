const CACHE_TTL = 3_600_000; // 1 hour (geocoding results rarely change)
const cache = new Map<string, { data: GeoResult; timestamp: number }>();

interface GeoResult {
  query: string;
  results: {
    name: string;
    display_name: string;
    latitude: number;
    longitude: number;
    type: string;
    country: string;
    country_code: string;
  }[];
  count: number;
  timestamp: string;
  attribution: string;
}

export async function geocodeSearch(query: string): Promise<GeoResult> {
  const cacheKey = query.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    addressdetails: "1",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "User-Agent": "ai-api/1.0 (https://ai-api-1c5n.onrender.com)",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Nominatim API error: HTTP ${res.status}`);
  }

  const raw = (await res.json()) as {
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    name: string;
    address?: { country?: string; country_code?: string };
  }[];

  const results = raw.map((r) => ({
    name: r.name || r.display_name.split(",")[0].trim(),
    display_name: r.display_name,
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    type: r.type,
    country: r.address?.country || "",
    country_code: (r.address?.country_code || "").toUpperCase(),
  }));

  const data: GeoResult = {
    query,
    results,
    count: results.length,
    timestamp: new Date().toISOString(),
    attribution: "OpenStreetMap Nominatim (https://nominatim.openstreetmap.org)",
  };

  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
