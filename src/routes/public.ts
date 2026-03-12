import { Router } from "express";

const router = Router();

router.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/api/info", (_req, res) => {
  res.json({
    name: "ai-api",
    version: "1.0.0",
    description: "AI API with x402 payment protocol",
    endpoints: {
      free: [
        { method: "GET", path: "/api/health", description: "Health check" },
        { method: "GET", path: "/api/info", description: "API information" },
      ],
      paid: [
        { method: "POST", path: "/api/v1/echo", price: "$0.001", description: "Echo API" },
        { method: "POST", path: "/api/v1/text/transform", price: "$0.001", description: "Text transformation (uppercase, lowercase, reverse, etc.)" },
        { method: "POST", path: "/api/v1/text/analyze", price: "$0.002", description: "Text analysis (word count, readability)" },
        { method: "POST", path: "/api/v1/data/json-transform", price: "$0.002", description: "JSON transformation (flatten, pick, omit)" },
        { method: "POST", path: "/api/v1/crypto/hash", price: "$0.001", description: "Hash generation (SHA-256, MD5, etc.)" },
        { method: "POST", path: "/api/v1/util/uuid", price: "$0.001", description: "UUID generation" },
        { method: "POST", path: "/api/v1/finance/forex", price: "$0.002", description: "Exchange rate between two currencies" },
        { method: "POST", path: "/api/v1/finance/forex/rates", price: "$0.002", description: "All exchange rates for a base currency" },
        { method: "POST", path: "/api/v1/finance/crypto", price: "$0.002", description: "Cryptocurrency price by symbol" },
        { method: "POST", path: "/api/v1/finance/crypto/top", price: "$0.002", description: "Top cryptocurrencies by market cap" },
        { method: "POST", path: "/api/v1/finance/crypto/fear-greed", price: "$0.001", description: "Crypto Fear & Greed Index" },
      ],
    },
    payment: {
      protocol: "x402",
      currency: "USDC",
      network: "Base Sepolia (testnet)",
    },
  });
});

export default router;
