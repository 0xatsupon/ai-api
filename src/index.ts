import express, { type Request, type Response, type NextFunction } from "express";
import { config } from "./config.js";
import { x402Payment } from "./middleware/x402.js";
import { requestLogger } from "./middleware/logger.js";
import publicRoutes from "./routes/public.js";
import paidRoutes from "./routes/paid.js";

const app = express();
app.use(express.json());
app.use(requestLogger);

// Free routes (no payment required)
app.use(publicRoutes);

// x402 payment middleware (checks payment for paid routes)
app.use(x402Payment);

// Paid routes (requires x402 payment)
app.use(paidRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${new Date().toISOString()} ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`x402 API server running on http://localhost:${config.port}`);
  console.log(`Wallet: ${config.walletAddress}`);
  console.log(`Network: ${config.network}`);
  console.log();
  console.log("Free endpoints:");
  console.log("  GET  /api/health");
  console.log("  GET  /api/info");
  console.log();
  console.log("Paid endpoints:");
  console.log("  POST /api/v1/echo            $0.001");
  console.log("  POST /api/v1/text/transform  $0.001");
  console.log("  POST /api/v1/text/analyze    $0.002");
  console.log("  POST /api/v1/data/json-transform $0.002");
  console.log("  POST /api/v1/crypto/hash     $0.001");
  console.log("  POST /api/v1/util/uuid        $0.001");
  console.log();
  console.log("Finance endpoints:");
  console.log("  POST /api/v1/finance/forex            $0.002");
  console.log("  POST /api/v1/finance/forex/rates      $0.002");
  console.log("  POST /api/v1/finance/crypto            $0.002");
  console.log("  POST /api/v1/finance/crypto/top        $0.002");
  console.log("  POST /api/v1/finance/crypto/fear-greed $0.001");
  console.log();
  console.log("Weather endpoints:");
  console.log("  POST /api/v1/weather/current           $0.002");
  console.log("  POST /api/v1/weather/forecast          $0.002");
});
