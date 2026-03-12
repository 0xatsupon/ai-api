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
    version: "1.0.0",
    description: "Paid API for AI agents — real-time finance data, utilities, and more. Pay per request with USDC via x402.",
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
      ],
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
