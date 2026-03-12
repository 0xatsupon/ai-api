# ai-api

Paid API for AI agents — web extraction, real-time finance, weather, news, geocoding, and utilities. Pay per request with USDC via [x402](https://x402.org) on Base.

**Live:** https://ai-api-1c5n.onrender.com

## How it works

1. Call any paid endpoint
2. Get a `402 Payment Required` response with payment instructions
3. Send USDC payment on Base via x402 protocol
4. Receive your data

No API keys. No subscriptions. Just pay-per-request with crypto.

## Quick start

```bash
# Check API status
curl https://ai-api-1c5n.onrender.com/api/health

# Discover all endpoints and pricing
curl https://ai-api-1c5n.onrender.com/api/info

# OpenAPI 3.0 spec (for agent frameworks)
curl https://ai-api-1c5n.onrender.com/api/v1/openapi.json

# x402 protocol discovery
curl https://ai-api-1c5n.onrender.com/.well-known/x402.json
```

## Endpoints

### Free (no payment required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/info` | API info and x402 discovery |
| GET | `/api/v1/openapi.json` | OpenAPI 3.0 specification |
| GET | `/.well-known/x402.json` | x402 protocol discovery |

### Paid (USDC via x402)

| Method | Path | Price | Description |
|--------|------|-------|-------------|
| POST | `/api/v1/web/extract` | $0.005 | Extract text content from any URL |
| POST | `/api/v1/news/feed` | $0.003 | Fetch and parse RSS/news feed |
| POST | `/api/v1/finance/forex` | $0.002 | Real-time exchange rate |
| POST | `/api/v1/finance/forex/rates` | $0.002 | All exchange rates for a base currency |
| POST | `/api/v1/finance/crypto` | $0.002 | Cryptocurrency price by symbol |
| POST | `/api/v1/finance/crypto/top` | $0.002 | Top cryptocurrencies by market cap |
| POST | `/api/v1/finance/crypto/fear-greed` | $0.001 | Crypto Fear & Greed Index |
| POST | `/api/v1/weather/current` | $0.002 | Current weather by coordinates |
| POST | `/api/v1/weather/forecast` | $0.002 | 7-day weather forecast |
| POST | `/api/v1/geo/search` | $0.002 | Geocode address to coordinates |
| POST | `/api/v1/net/dns` | $0.001 | DNS lookup |
| POST | `/api/v1/text/transform` | $0.001 | Text transformation |
| POST | `/api/v1/text/analyze` | $0.002 | Text analysis |
| POST | `/api/v1/data/json-transform` | $0.002 | JSON data transformation |
| POST | `/api/v1/crypto/hash` | $0.001 | Hash generation (SHA-256, etc.) |
| POST | `/api/v1/util/uuid` | $0.001 | UUID generation |
| POST | `/api/v1/echo` | $0.001 | Echo API |

### Example requests

**Extract web content** (the killer feature — AI agents can't browse the web themselves):
```bash
curl -X POST https://ai-api-1c5n.onrender.com/api/v1/web/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "format": "text"}'
# Returns 402 with x402 payment instructions
```

**Get crypto price:**
```bash
curl -X POST https://ai-api-1c5n.onrender.com/api/v1/finance/crypto \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC"}'
```

**Current weather (Tokyo):**
```bash
curl -X POST https://ai-api-1c5n.onrender.com/api/v1/weather/current \
  -H "Content-Type: application/json" \
  -d '{"latitude": 35.68, "longitude": 139.77}'
```

**Geocode a city name:**
```bash
curl -X POST https://ai-api-1c5n.onrender.com/api/v1/geo/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Tokyo"}'
```

**Latest tech news:**
```bash
curl -X POST https://ai-api-1c5n.onrender.com/api/v1/news/feed \
  -H "Content-Type: application/json" \
  -d '{"category": "tech"}'
```

**DNS lookup:**
```bash
curl -X POST https://ai-api-1c5n.onrender.com/api/v1/net/dns \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "type": "A"}'
```

## x402 Payment Flow

All paid endpoints return `402 Payment Required` with a response like:

```json
{
  "error": "X-PAYMENT header is required",
  "accepts": {
    "scheme": "exact",
    "network": "eip155:8453",
    "price": "$0.005",
    "payTo": "0xFB3A0085fa2e7852f24e96C49EA77e080bE55CAB"
  }
}
```

To complete payment, use the [x402 client library](https://github.com/x402/x402):

```typescript
import { paymentClient } from "@x402/client";

const client = paymentClient("https://ai-api-1c5n.onrender.com", wallet);
const response = await client.post("/api/v1/web/extract", {
  url: "https://example.com",
  format: "markdown"
});
```

See [`examples/client.ts`](examples/client.ts) for a complete working example.

## For AI agent frameworks

This API is designed for AI agents. Integrate with:

- **OpenAPI spec** at `/api/v1/openapi.json` — compatible with LangChain, CrewAI, and other agent frameworks
- **x402 discovery** at `/.well-known/x402.json` — standard x402 protocol discovery
- **MCP Server** at `/mcp` — connect Claude Desktop, Cursor, or any MCP client directly (free, no payment required)

Each endpoint in the OpenAPI spec includes `x-x402-price` for automatic price discovery.

## MCP Server (Claude Desktop / Cursor)

This API exposes all 16 tools as an MCP server via Streamable HTTP transport.

**Claude Desktop config** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "ai-api": {
      "url": "https://ai-api-1c5n.onrender.com/mcp"
    }
  }
}
```

Available tools: `web_extract`, `geo_search`, `weather_current`, `weather_forecast`, `finance_forex`, `finance_forex_rates`, `finance_crypto`, `finance_crypto_top`, `finance_crypto_fear_greed`, `news_feed`, `net_dns`, `text_transform`, `text_analyze`, `data_json_transform`, `crypto_hash`, `util_uuid`

## Technical details

- **Network:** Base Mainnet (`eip155:8453`)
- **Currency:** USDC
- **Facilitator:** XPay (`https://facilitator.xpay.sh`)
- **Runtime:** Node.js + Express 5 + TypeScript
- **Hosting:** Render (free tier)
- **Running cost:** $0/month

## Data sources

| Service | Source | License |
|---------|--------|---------|
| Forex rates | [ExchangeRate-API](https://www.exchangerate-api.com) | Free tier |
| Crypto prices | [Coinlore](https://www.coinlore.com) | Free API |
| Fear & Greed | [Alternative.me](https://alternative.me) | Free API |
| Weather | [Open-Meteo](https://open-meteo.com) | CC BY 4.0 |
| Geocoding | [Nominatim/OSM](https://nominatim.openstreetmap.org) | ODbL |
| News feeds | Various RSS | Public RSS |
| DNS | Node.js built-in | N/A |

## License

ISC
