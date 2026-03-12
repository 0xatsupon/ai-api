const CACHE_TTL = 60_000; // 60 seconds

let cache: { data: Record<string, number>; base: string; timestamp: number } | null = null;

async function fetchRates(base: string): Promise<Record<string, number>> {
  if (cache && cache.base === base && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
  if (!res.ok) throw new Error(`ExchangeRate-API returned ${res.status}`);

  const json = (await res.json()) as { result: string; rates: Record<string, number> };
  if (json.result !== "success") throw new Error("ExchangeRate-API returned error");

  cache = { data: json.rates, base, timestamp: Date.now() };
  return json.rates;
}

export async function getExchangeRate(from: string, to: string) {
  const rates = await fetchRates(from.toUpperCase());
  const toUpper = to.toUpperCase();

  if (!(toUpper in rates)) {
    throw new Error(`Currency '${toUpper}' not found`);
  }

  return {
    from: from.toUpperCase(),
    to: toUpper,
    rate: rates[toUpper],
    timestamp: new Date().toISOString(),
    attribution: "Data provided by ExchangeRate-API (https://www.exchangerate-api.com)",
  };
}

export async function getAllRates(base: string) {
  const rates = await fetchRates(base.toUpperCase());

  return {
    base: base.toUpperCase(),
    rates,
    timestamp: new Date().toISOString(),
    attribution: "Data provided by ExchangeRate-API (https://www.exchangerate-api.com)",
  };
}
