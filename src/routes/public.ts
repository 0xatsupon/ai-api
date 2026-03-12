import { Router } from "express";
import { config } from "../config.js";

const router = Router();

router.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/api/info", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const networkName = config.network === "eip155:8453" ? "Base (mainnet)" : "Base Sepolia (testnet)";

  res.json({
    name: "ai-api",
    version: "2.0.0",
    description: "Paid API for AI agents — web extraction, real-time finance, weather, news, geocoding, and utilities. Pay per request with USDC via x402.",
    openapi_spec: `${baseUrl}/api/v1/openapi.json`,
    base_url: baseUrl,
    x402: {
      version: "2",
      protocol: "x402",
      currency: "USDC",
      network: config.network,
      network_name: networkName,
      facilitator: config.facilitatorUrl,
      pay_to: config.walletAddress,
    },
    endpoints: {
      free: [
        { method: "GET", path: "/api/health", url: `${baseUrl}/api/health`, description: "Health check" },
        { method: "GET", path: "/api/info", url: `${baseUrl}/api/info`, description: "API information and x402 discovery" },
        { method: "GET", path: "/.well-known/x402.json", url: `${baseUrl}/.well-known/x402.json`, description: "x402 protocol discovery" },
        { method: "GET", path: "/api/v1/openapi.json", url: `${baseUrl}/api/v1/openapi.json`, description: "OpenAPI 3.0 specification" },
        { method: "POST", path: "/mcp", url: `${baseUrl}/mcp`, description: "MCP Server (Streamable HTTP) — 16 tools for Claude Desktop / Cursor" },
      ],
      paid: [
        {
          method: "POST", path: "/api/v1/echo", url: `${baseUrl}/api/v1/echo`,
          price: "$0.001", description: "Echo API — returns the data you send",
          example: { body: { message: "hello" } },
        },
        {
          method: "POST", path: "/api/v1/text/transform", url: `${baseUrl}/api/v1/text/transform`,
          price: "$0.001", description: "Text transformation (uppercase, lowercase, reverse, camelCase, snakeCase, kebabCase)",
          example: { body: { text: "hello world", operation: "uppercase" } },
        },
        {
          method: "POST", path: "/api/v1/text/analyze", url: `${baseUrl}/api/v1/text/analyze`,
          price: "$0.002", description: "Text analysis — character count, word count, sentence count, top characters",
          example: { body: { text: "Hello world. This is a test." } },
        },
        {
          method: "POST", path: "/api/v1/data/json-transform", url: `${baseUrl}/api/v1/data/json-transform`,
          price: "$0.002", description: "JSON transformation (flatten, pick, omit, keys, values)",
          example: { body: { data: { a: { b: 1 } }, operation: "flatten" } },
        },
        {
          method: "POST", path: "/api/v1/crypto/hash", url: `${baseUrl}/api/v1/crypto/hash`,
          price: "$0.001", description: "Hash generation — SHA-256, SHA-512, MD5, SHA-1",
          example: { body: { input: "hello", algorithm: "sha256" } },
        },
        {
          method: "POST", path: "/api/v1/util/uuid", url: `${baseUrl}/api/v1/util/uuid`,
          price: "$0.001", description: "UUID v4 generation (1-100 at once)",
          example: { body: { count: 5 } },
        },
        {
          method: "POST", path: "/api/v1/finance/forex", url: `${baseUrl}/api/v1/finance/forex`,
          price: "$0.002", description: "Real-time exchange rate between two currencies",
          example: { body: { from: "USD", to: "JPY" } },
        },
        {
          method: "POST", path: "/api/v1/finance/forex/rates", url: `${baseUrl}/api/v1/finance/forex/rates`,
          price: "$0.002", description: "All exchange rates for a base currency",
          example: { body: { base: "USD" } },
        },
        {
          method: "POST", path: "/api/v1/finance/crypto", url: `${baseUrl}/api/v1/finance/crypto`,
          price: "$0.002", description: "Real-time cryptocurrency price by symbol",
          example: { body: { symbol: "BTC" } },
        },
        {
          method: "POST", path: "/api/v1/finance/crypto/top", url: `${baseUrl}/api/v1/finance/crypto/top`,
          price: "$0.002", description: "Top cryptocurrencies by market cap",
          example: { body: { limit: 10 } },
        },
        {
          method: "POST", path: "/api/v1/finance/crypto/fear-greed", url: `${baseUrl}/api/v1/finance/crypto/fear-greed`,
          price: "$0.001", description: "Crypto Fear & Greed Index — real-time market sentiment",
          example: { body: {} },
        },
        {
          method: "POST", path: "/api/v1/weather/current", url: `${baseUrl}/api/v1/weather/current`,
          price: "$0.002", description: "Current weather conditions by latitude/longitude",
          example: { body: { latitude: 40.71, longitude: -74.01 } },
        },
        {
          method: "POST", path: "/api/v1/weather/forecast", url: `${baseUrl}/api/v1/weather/forecast`,
          price: "$0.002", description: "7-day weather forecast by latitude/longitude",
          example: { body: { latitude: 40.71, longitude: -74.01 } },
        },
        {
          method: "POST", path: "/api/v1/web/extract", url: `${baseUrl}/api/v1/web/extract`,
          price: "$0.005", description: "Extract text content from any URL (text, markdown, or links)",
          example: { body: { url: "https://example.com", format: "text" } },
        },
        {
          method: "POST", path: "/api/v1/geo/search", url: `${baseUrl}/api/v1/geo/search`,
          price: "$0.002", description: "Geocode an address or place name to coordinates",
          example: { body: { query: "Tokyo" } },
        },
        {
          method: "POST", path: "/api/v1/news/feed", url: `${baseUrl}/api/v1/news/feed`,
          price: "$0.003", description: "Fetch and parse RSS/news feed (tech, crypto, business, world)",
          example: { body: { category: "tech" } },
        },
        {
          method: "POST", path: "/api/v1/net/dns", url: `${baseUrl}/api/v1/net/dns`,
          price: "$0.001", description: "DNS lookup for a domain",
          example: { body: { domain: "example.com", type: "A" } },
        },
      ],
    },
  });
});

// OpenAPI 3.0 spec
router.get("/api/v1/openapi.json", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    openapi: "3.0.3",
    info: {
      title: "AI API",
      version: "2.0.0",
      description: "Paid API for AI agents — web extraction, real-time finance, weather, news, geocoding, and utilities. Pay per request with USDC via x402 on Base.",
      "x-x402": { protocol: "x402", network: config.network, currency: "USDC", facilitator: config.facilitatorUrl, pay_to: config.walletAddress },
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/v1/web/extract": { post: { summary: "Extract text content from a URL", "x-x402-price": "$0.005", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["url"], properties: { url: { type: "string", example: "https://example.com" }, format: { type: "string", enum: ["text", "markdown", "links"], default: "text" } } } } } }, responses: { "200": { description: "Extracted content" }, "402": { description: "Payment required" } } } },
      "/api/v1/geo/search": { post: { summary: "Geocode address to coordinates", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["query"], properties: { query: { type: "string", example: "Tokyo" } } } } } }, responses: { "200": { description: "Geocoding results" }, "402": { description: "Payment required" } } } },
      "/api/v1/news/feed": { post: { summary: "Fetch RSS/news feed", "x-x402-price": "$0.003", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { category: { type: "string", enum: ["tech", "crypto", "business", "world"] }, url: { type: "string" } } } } } }, responses: { "200": { description: "Feed items" }, "402": { description: "Payment required" } } } },
      "/api/v1/net/dns": { post: { summary: "DNS lookup", "x-x402-price": "$0.001", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["domain"], properties: { domain: { type: "string", example: "example.com" }, type: { type: "string", enum: ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"], default: "A" } } } } } }, responses: { "200": { description: "DNS records" }, "402": { description: "Payment required" } } } },
      "/api/v1/finance/forex": { post: { summary: "Exchange rate", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["from", "to"], properties: { from: { type: "string", example: "USD" }, to: { type: "string", example: "JPY" } } } } } }, responses: { "200": { description: "Rate" }, "402": { description: "Payment required" } } } },
      "/api/v1/finance/forex/rates": { post: { summary: "All exchange rates", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["base"], properties: { base: { type: "string", example: "USD" } } } } } }, responses: { "200": { description: "Rates" }, "402": { description: "Payment required" } } } },
      "/api/v1/finance/crypto": { post: { summary: "Crypto price", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["symbol"], properties: { symbol: { type: "string", example: "BTC" } } } } } }, responses: { "200": { description: "Price" }, "402": { description: "Payment required" } } } },
      "/api/v1/finance/crypto/top": { post: { summary: "Top crypto by market cap", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { limit: { type: "integer", default: 10 } } } } } }, responses: { "200": { description: "Top coins" }, "402": { description: "Payment required" } } } },
      "/api/v1/finance/crypto/fear-greed": { post: { summary: "Fear & Greed Index", "x-x402-price": "$0.001", requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: { "200": { description: "Index" }, "402": { description: "Payment required" } } } },
      "/api/v1/weather/current": { post: { summary: "Current weather", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["latitude", "longitude"], properties: { latitude: { type: "number", example: 35.68 }, longitude: { type: "number", example: 139.77 } } } } } }, responses: { "200": { description: "Weather" }, "402": { description: "Payment required" } } } },
      "/api/v1/weather/forecast": { post: { summary: "7-day forecast", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["latitude", "longitude"], properties: { latitude: { type: "number", example: 35.68 }, longitude: { type: "number", example: 139.77 } } } } } }, responses: { "200": { description: "Forecast" }, "402": { description: "Payment required" } } } },
      "/api/v1/echo": { post: { summary: "Echo API", "x-x402-price": "$0.001", requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: { "200": { description: "Echoed data" }, "402": { description: "Payment required" } } } },
      "/api/v1/text/transform": { post: { summary: "Text transformation", "x-x402-price": "$0.001", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string" }, operation: { type: "string", enum: ["uppercase", "lowercase", "reverse", "trim", "capitalize", "camelCase", "snakeCase", "kebabCase"] } } } } } }, responses: { "200": { description: "Result" }, "402": { description: "Payment required" } } } },
      "/api/v1/text/analyze": { post: { summary: "Text analysis", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["text"], properties: { text: { type: "string" } } } } } }, responses: { "200": { description: "Analysis" }, "402": { description: "Payment required" } } } },
      "/api/v1/data/json-transform": { post: { summary: "JSON transformation", "x-x402-price": "$0.002", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["data"], properties: { data: { type: "object" }, operation: { type: "string", enum: ["flatten", "pick", "omit", "keys", "values"] }, fields: { type: "array", items: { type: "string" } } } } } } }, responses: { "200": { description: "Result" }, "402": { description: "Payment required" } } } },
      "/api/v1/crypto/hash": { post: { summary: "Hash generation", "x-x402-price": "$0.001", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["input"], properties: { input: { type: "string" }, algorithm: { type: "string", enum: ["sha256", "sha512", "md5", "sha1"] } } } } } }, responses: { "200": { description: "Hash" }, "402": { description: "Payment required" } } } },
      "/api/v1/util/uuid": { post: { summary: "UUID generation", "x-x402-price": "$0.001", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer", default: 1 } } } } } }, responses: { "200": { description: "UUIDs" }, "402": { description: "Payment required" } } } },
    },
  });
});

// x402 discovery endpoint
router.get("/.well-known/x402.json", (_req, res) => {
  res.json({
    x402: true,
    version: "2",
    info_url: "/api/info",
    facilitator: config.facilitatorUrl,
    network: config.network,
    currency: "USDC",
    pay_to: config.walletAddress,
    description: "Paid API for AI agents — real-time finance data, utilities, and more.",
  });
});

export default router;
