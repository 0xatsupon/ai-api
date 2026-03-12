import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { Network } from "@x402/core/types";
import { config } from "../config.js";

const network = config.network as Network;

const facilitatorClient = new HTTPFacilitatorClient({
  url: config.facilitatorUrl,
});

const resourceServer = new x402ResourceServer(facilitatorClient).register(
  network,
  new ExactEvmScheme(),
);

function route(price: string, description: string) {
  return {
    accepts: {
      scheme: "exact" as const,
      price,
      network,
      payTo: config.walletAddress,
    },
    description,
  };
}

const routes = {
  "POST /api/v1/echo": route("$0.001", "Echo API - returns the data you send"),
  "POST /api/v1/text/transform": route("$0.001", "Text transformation (uppercase, lowercase, reverse, etc.)"),
  "POST /api/v1/text/analyze": route("$0.002", "Text analysis (word count, character count, readability)"),
  "POST /api/v1/data/json-transform": route("$0.002", "JSON data transformation (flatten, pick, omit fields)"),
  "POST /api/v1/crypto/hash": route("$0.001", "Generate hash (SHA-256, MD5) of input data"),
  "POST /api/v1/util/uuid": route("$0.001", "Generate UUIDs"),
  // Finance APIs
  "POST /api/v1/finance/forex": route("$0.002", "Exchange rate between two currencies"),
  "POST /api/v1/finance/forex/rates": route("$0.002", "All exchange rates for a base currency"),
  "POST /api/v1/finance/crypto": route("$0.002", "Cryptocurrency price by symbol"),
  "POST /api/v1/finance/crypto/top": route("$0.002", "Top cryptocurrencies by market cap"),
  "POST /api/v1/finance/crypto/fear-greed": route("$0.001", "Crypto Fear & Greed Index"),
  // Weather APIs
  "POST /api/v1/weather/current": route("$0.002", "Current weather by latitude/longitude"),
  "POST /api/v1/weather/forecast": route("$0.002", "7-day weather forecast by latitude/longitude"),
  // Web APIs
  "POST /api/v1/web/extract": route("$0.005", "Extract text content from a URL"),
  // Geo APIs
  "POST /api/v1/geo/search": route("$0.002", "Geocode an address or place name to coordinates"),
  // News APIs
  "POST /api/v1/news/feed": route("$0.003", "Fetch and parse RSS/news feed"),
  // Network APIs
  "POST /api/v1/net/dns": route("$0.001", "DNS lookup for a domain"),
};

export const x402Payment = paymentMiddleware(routes, resourceServer);
export { routes };
