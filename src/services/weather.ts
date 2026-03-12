const CACHE_TTL = 60_000; // 60 seconds

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(lat: number, lng: number, type: string): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}:${type}`;
}

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function weatherDescription(code: number): string {
  return WEATHER_CODES[code] ?? "Unknown";
}

interface CurrentWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  current_units: {
    temperature_2m: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
  };
}

interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
  };
  daily_units: {
    temperature_2m_max: string;
    temperature_2m_min: string;
    precipitation_sum: string;
  };
}

export async function getCurrentWeather(lat: number, lng: number) {
  const key = cacheKey(lat, lng, "current");
  const cached = getCached(key);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);

  const json = (await res.json()) as CurrentWeatherResponse;

  const result = {
    latitude: json.latitude,
    longitude: json.longitude,
    timezone: json.timezone,
    timezone_abbreviation: json.timezone_abbreviation,
    current: {
      time: json.current.time,
      temperature: json.current.temperature_2m,
      temperature_unit: json.current_units.temperature_2m,
      humidity: json.current.relative_humidity_2m,
      humidity_unit: json.current_units.relative_humidity_2m,
      wind_speed: json.current.wind_speed_10m,
      wind_speed_unit: json.current_units.wind_speed_10m,
      weather_code: json.current.weather_code,
      weather_description: weatherDescription(json.current.weather_code),
    },
    timestamp: new Date().toISOString(),
    attribution: "Data provided by Open-Meteo (https://open-meteo.com)",
  };

  setCache(key, result);
  return result;
}

export async function getWeatherForecast(lat: number, lng: number) {
  const key = cacheKey(lat, lng, "forecast");
  const cached = getCached(key);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);

  const json = (await res.json()) as ForecastResponse;

  const days = json.daily.time.map((date, i) => ({
    date,
    temperature_max: json.daily.temperature_2m_max[i],
    temperature_min: json.daily.temperature_2m_min[i],
    temperature_unit: json.daily_units.temperature_2m_max,
    precipitation: json.daily.precipitation_sum[i],
    precipitation_unit: json.daily_units.precipitation_sum,
    weather_code: json.daily.weather_code[i],
    weather_description: weatherDescription(json.daily.weather_code[i]),
  }));

  const result = {
    latitude: json.latitude,
    longitude: json.longitude,
    timezone: json.timezone,
    timezone_abbreviation: json.timezone_abbreviation,
    forecast: days,
    timestamp: new Date().toISOString(),
    attribution: "Data provided by Open-Meteo (https://open-meteo.com)",
  };

  setCache(key, result);
  return result;
}
