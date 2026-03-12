/**
 * Example: Calling ai-api with x402 payment
 *
 * Prerequisites:
 *   npm install @x402/client viem
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx examples/client.ts
 *
 * Your wallet needs USDC on Base Mainnet.
 */

import { createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const API_BASE = "https://ai-api-1c5n.onrender.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Set PRIVATE_KEY env var (e.g. PRIVATE_KEY=0xabc...)");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

// --- Helper: call a paid endpoint with x402 payment ---

async function callPaidEndpoint(path: string, body: Record<string, unknown>) {
  const url = `${API_BASE}${path}`;
  console.log(`\n--- POST ${path} ---`);

  // Step 1: Make the request (will get 402)
  const firstResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (firstResponse.status !== 402) {
    // Might succeed if already paid, or return error
    const data = await firstResponse.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    return data;
  }

  // Step 2: Parse 402 response for payment details
  const paymentInfo = await firstResponse.json();
  console.log("Payment required:", JSON.stringify(paymentInfo.accepts, null, 2));

  // Step 3: Use @x402/client to handle payment automatically
  // For a full implementation, see: https://github.com/x402/x402
  console.log("To complete payment, use @x402/client:");
  console.log(`
  import { paymentClient } from "@x402/client";
  const client = paymentClient("${API_BASE}", wallet);
  const response = await client.post("${path}", ${JSON.stringify(body)});
  `);

  return paymentInfo;
}

// --- Demo: call several endpoints ---

async function main() {
  console.log("ai-api x402 Client Demo");
  console.log(`Wallet: ${account.address}`);
  console.log(`API: ${API_BASE}`);

  // Free endpoint — no payment needed
  console.log("\n=== Free Endpoints ===");
  const health = await fetch(`${API_BASE}/api/health`).then((r) => r.json());
  console.log("Health:", health);

  const info = await fetch(`${API_BASE}/api/info`).then((r) => r.json());
  console.log(`API: ${info.name} v${info.version}`);
  console.log(`Paid endpoints: ${info.endpoints.paid.length}`);

  // Paid endpoints — will return 402
  console.log("\n=== Paid Endpoints (will return 402) ===");

  await callPaidEndpoint("/api/v1/web/extract", {
    url: "https://example.com",
    format: "text",
  });

  await callPaidEndpoint("/api/v1/finance/crypto", {
    symbol: "ETH",
  });

  await callPaidEndpoint("/api/v1/weather/current", {
    latitude: 35.68,
    longitude: 139.77,
  });

  await callPaidEndpoint("/api/v1/geo/search", {
    query: "San Francisco",
  });

  await callPaidEndpoint("/api/v1/news/feed", {
    category: "crypto",
  });
}

main().catch(console.error);
