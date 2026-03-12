// Coinlore API
const CRYPTO_CACHE_TTL = 30_000; // 30 seconds
const FEAR_GREED_CACHE_TTL = 300_000; // 5 minutes

interface CoinloreCoin {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  price_usd: string;
  percent_change_1h: string;
  percent_change_24h: string;
  percent_change_7d: string;
  market_cap_usd: string;
  volume24: number;
  csupply: string;
  tsupply: string;
  msupply: string;
}

let topCoinsCache: { data: CoinloreCoin[]; timestamp: number } | null = null;
let fearGreedCache: { data: unknown; timestamp: number } | null = null;

async function fetchTopCoins(limit: number): Promise<CoinloreCoin[]> {
  if (topCoinsCache && Date.now() - topCoinsCache.timestamp < CRYPTO_CACHE_TTL && topCoinsCache.data.length >= limit) {
    return topCoinsCache.data.slice(0, limit);
  }

  const fetchLimit = Math.max(limit, 50); // fetch at least 50 for cache efficiency
  const res = await fetch(`https://api.coinlore.net/api/tickers/?start=0&limit=${fetchLimit}`);
  if (!res.ok) throw new Error(`Coinlore API returned ${res.status}`);

  const json = (await res.json()) as { data: CoinloreCoin[] };
  topCoinsCache = { data: json.data, timestamp: Date.now() };

  return json.data.slice(0, limit);
}

export async function getCoinBySymbol(symbol: string) {
  const coins = await fetchTopCoins(100);
  const upper = symbol.toUpperCase();
  const coin = coins.find((c) => c.symbol.toUpperCase() === upper);

  if (!coin) {
    throw new Error(`Coin '${upper}' not found in top 100. Try a different symbol.`);
  }

  return {
    symbol: coin.symbol,
    name: coin.name,
    rank: coin.rank,
    price_usd: coin.price_usd,
    percent_change_1h: coin.percent_change_1h,
    percent_change_24h: coin.percent_change_24h,
    percent_change_7d: coin.percent_change_7d,
    market_cap_usd: coin.market_cap_usd,
    volume_24h: coin.volume24,
    timestamp: new Date().toISOString(),
    attribution: "Data provided by Coinlore (https://www.coinlore.com)",
  };
}

export async function getTopCoins(limit: number) {
  const clamped = Math.min(Math.max(limit || 10, 1), 100);
  const coins = await fetchTopCoins(clamped);

  return {
    coins: coins.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      rank: c.rank,
      price_usd: c.price_usd,
      percent_change_24h: c.percent_change_24h,
      market_cap_usd: c.market_cap_usd,
    })),
    count: coins.length,
    timestamp: new Date().toISOString(),
    attribution: "Data provided by Coinlore (https://www.coinlore.com)",
  };
}

// Alternative.me Fear & Greed Index
export async function getFearGreedIndex() {
  if (fearGreedCache && Date.now() - fearGreedCache.timestamp < FEAR_GREED_CACHE_TTL) {
    return fearGreedCache.data;
  }

  const res = await fetch("https://api.alternative.me/fng/?limit=1");
  if (!res.ok) throw new Error(`Alternative.me API returned ${res.status}`);

  const json = (await res.json()) as {
    data: Array<{ value: string; value_classification: string; timestamp: string }>;
  };

  const entry = json.data[0];
  const result = {
    value: parseInt(entry.value, 10),
    classification: entry.value_classification,
    description: getDescription(parseInt(entry.value, 10)),
    timestamp: new Date(parseInt(entry.timestamp, 10) * 1000).toISOString(),
    attribution: "Data provided by Alternative.me (https://alternative.me)",
  };

  fearGreedCache = { data: result, timestamp: Date.now() };
  return result;
}

function getDescription(value: number): string {
  if (value <= 25) return "Extreme Fear — investors are very worried, potential buying opportunity";
  if (value <= 45) return "Fear — market sentiment is negative";
  if (value <= 55) return "Neutral — market sentiment is balanced";
  if (value <= 75) return "Greed — investors are getting greedy, market may be overvalued";
  return "Extreme Greed — market is very hot, potential correction ahead";
}
