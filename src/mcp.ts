import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getExchangeRate, getAllRates } from "./services/forex.js";
import { getCoinBySymbol, getTopCoins, getFearGreedIndex } from "./services/crypto.js";
import { getCurrentWeather, getWeatherForecast } from "./services/weather.js";
import { extractContent } from "./services/web.js";
import { geocodeSearch } from "./services/geo.js";
import { fetchNewsFeed, getAvailableCategories } from "./services/news.js";
import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:dns/promises";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "ai-api",
    version: "2.0.0",
  });

  // --- Web ---

  server.tool(
    "web_extract",
    "Extract text content from any URL. Supports text, markdown, and links output formats.",
    {
      url: z.string().describe("URL to extract content from"),
      format: z.enum(["text", "markdown", "links"]).default("text").describe("Output format"),
    },
    async ({ url, format }) => {
      const result = await extractContent(url, format);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Geocoding ---

  server.tool(
    "geo_search",
    "Geocode an address or place name to coordinates. Useful for getting lat/lng before calling weather tools.",
    {
      query: z.string().describe("Place name or address (e.g. 'Tokyo', 'New York')"),
    },
    async ({ query }) => {
      const result = await geocodeSearch(query);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Weather ---

  server.tool(
    "weather_current",
    "Get current weather conditions by latitude/longitude. Use geo_search first if you only have a city name.",
    {
      latitude: z.number().describe("Latitude"),
      longitude: z.number().describe("Longitude"),
    },
    async ({ latitude, longitude }) => {
      const result = await getCurrentWeather(latitude, longitude);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "weather_forecast",
    "Get 7-day weather forecast by latitude/longitude.",
    {
      latitude: z.number().describe("Latitude"),
      longitude: z.number().describe("Longitude"),
    },
    async ({ latitude, longitude }) => {
      const result = await getWeatherForecast(latitude, longitude);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Finance ---

  server.tool(
    "finance_forex",
    "Get real-time exchange rate between two currencies.",
    {
      from: z.string().describe("Source currency code (e.g. USD)"),
      to: z.string().describe("Target currency code (e.g. JPY)"),
    },
    async ({ from, to }) => {
      const result = await getExchangeRate(from, to);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "finance_forex_rates",
    "Get all exchange rates for a base currency.",
    {
      base: z.string().describe("Base currency code (e.g. USD)"),
    },
    async ({ base }) => {
      const result = await getAllRates(base);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "finance_crypto",
    "Get real-time cryptocurrency price by symbol.",
    {
      symbol: z.string().describe("Crypto symbol (e.g. BTC, ETH)"),
    },
    async ({ symbol }) => {
      const result = await getCoinBySymbol(symbol);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "finance_crypto_top",
    "Get top cryptocurrencies by market cap.",
    {
      limit: z.number().default(10).describe("Number of coins (1-100)"),
    },
    async ({ limit }) => {
      const result = await getTopCoins(limit);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "finance_crypto_fear_greed",
    "Get Crypto Fear & Greed Index — real-time market sentiment.",
    {},
    async () => {
      const result = await getFearGreedIndex();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- News ---

  server.tool(
    "news_feed",
    `Fetch and parse RSS/news feed. Available categories: ${getAvailableCategories().join(", ")}. Or provide a custom RSS URL.`,
    {
      category: z.string().optional().describe("Preset category: tech, crypto, business, world"),
      url: z.string().optional().describe("Custom RSS feed URL"),
    },
    async ({ category, url }) => {
      const result = await fetchNewsFeed({ category, url });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Network ---

  server.tool(
    "net_dns",
    "DNS lookup for a domain. Returns A, AAAA, MX, TXT, NS, CNAME, or SOA records.",
    {
      domain: z.string().describe("Domain name (e.g. example.com)"),
      type: z.enum(["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"]).default("A").describe("Record type"),
    },
    async ({ domain, type }) => {
      const records = await resolve(domain, type as any);
      const result = { domain, type, records, timestamp: new Date().toISOString() };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Text ---

  server.tool(
    "text_transform",
    "Transform text: uppercase, lowercase, reverse, trim, capitalize, camelCase, snakeCase, kebabCase.",
    {
      text: z.string().describe("Text to transform"),
      operation: z.enum(["uppercase", "lowercase", "reverse", "trim", "capitalize", "camelCase", "snakeCase", "kebabCase"]).default("uppercase"),
    },
    async ({ text, operation }) => {
      const ops: Record<string, (s: string) => string> = {
        uppercase: (s) => s.toUpperCase(),
        lowercase: (s) => s.toLowerCase(),
        reverse: (s) => [...s].reverse().join(""),
        trim: (s) => s.trim(),
        capitalize: (s) => s.replace(/\b\w/g, (c) => c.toUpperCase()),
        camelCase: (s) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()),
        snakeCase: (s) => s.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "_"),
        kebabCase: (s) => s.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-"),
      };
      return { content: [{ type: "text", text: JSON.stringify({ result: ops[operation](text), operation }) }] };
    }
  );

  server.tool(
    "text_analyze",
    "Analyze text: character count, word count, sentence count, top characters.",
    {
      text: z.string().describe("Text to analyze"),
    },
    async ({ text }) => {
      const words = text.split(/\s+/).filter(Boolean);
      const sentences = text.split(/[.!?]+/).filter(Boolean);
      const charFreq: Record<string, number> = {};
      for (const c of text.toLowerCase()) {
        if (c.match(/[a-z]/)) charFreq[c] = (charFreq[c] || 0) + 1;
      }
      const result = {
        characters: text.length,
        words: words.length,
        sentences: sentences.length,
        topCharacters: Object.entries(charFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([char, count]) => ({ char, count })),
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  // --- Data ---

  server.tool(
    "data_json_transform",
    "Transform JSON data: flatten nested objects, pick/omit fields, get keys/values.",
    {
      data: z.string().describe("JSON string to transform"),
      operation: z.enum(["flatten", "pick", "omit", "keys", "values"]).default("flatten"),
      fields: z.array(z.string()).optional().describe("Fields for pick/omit operations"),
    },
    async ({ data, operation, fields }) => {
      const parsed = JSON.parse(data);
      if (operation === "flatten" && typeof parsed === "object" && parsed !== null) {
        const flat: Record<string, unknown> = {};
        const walk = (obj: Record<string, unknown>, prefix = "") => {
          for (const [k, v] of Object.entries(obj)) {
            const key = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === "object" && !Array.isArray(v)) walk(v as Record<string, unknown>, key);
            else flat[key] = v;
          }
        };
        walk(parsed);
        return { content: [{ type: "text", text: JSON.stringify({ result: flat }) }] };
      }
      if (operation === "keys") return { content: [{ type: "text", text: JSON.stringify({ result: Object.keys(parsed) }) }] };
      if (operation === "values") return { content: [{ type: "text", text: JSON.stringify({ result: Object.values(parsed) }) }] };
      if (operation === "pick" && fields) {
        const result: Record<string, unknown> = {};
        for (const f of fields) if (f in parsed) result[f] = parsed[f];
        return { content: [{ type: "text", text: JSON.stringify({ result }) }] };
      }
      if (operation === "omit" && fields) {
        const result = { ...parsed };
        for (const f of fields) delete result[f];
        return { content: [{ type: "text", text: JSON.stringify({ result }) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify({ error: "Invalid operation or data" }) }] };
    }
  );

  // --- Crypto (hashing) ---

  server.tool(
    "crypto_hash",
    "Generate hash of input data. Supports SHA-256, SHA-512, MD5, SHA-1.",
    {
      input: z.string().describe("String to hash"),
      algorithm: z.enum(["sha256", "sha512", "md5", "sha1"]).default("sha256"),
    },
    async ({ input, algorithm }) => {
      const hash = createHash(algorithm).update(input).digest("hex");
      return { content: [{ type: "text", text: JSON.stringify({ hash, algorithm }) }] };
    }
  );

  // --- Utility ---

  server.tool(
    "util_uuid",
    "Generate UUID v4 identifiers.",
    {
      count: z.number().default(1).describe("Number of UUIDs to generate (1-100)"),
    },
    async ({ count }) => {
      const n = Math.min(Math.max(count, 1), 100);
      const uuids = Array.from({ length: n }, () => randomUUID());
      return { content: [{ type: "text", text: JSON.stringify({ uuids, count: n }) }] };
    }
  );

  return server;
}
