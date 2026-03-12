import express, { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { x402Payment } from "./middleware/x402.js";
import { requestLogger } from "./middleware/logger.js";
import publicRoutes from "./routes/public.js";
import paidRoutes from "./routes/paid.js";
import { createMcpServer } from "./mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());
app.use(requestLogger);

// --- MCP Server (Streamable HTTP, stateful with session management) ---
const mcpSessions = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && mcpSessions.has(sessionId)) {
    await mcpSessions.get(sessionId)!.handleRequest(req, res, req.body);
    return;
  }

  if (sessionId) {
    // Session ID provided but not found
    res.status(404).json({ jsonrpc: "2.0", error: { code: -32000, message: "Session not found. Send initialize without session ID." }, id: null });
    return;
  }

  // No session ID — new initialization request
  const newId = randomUUID();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => newId,
  });
  const server = createMcpServer();
  await server.connect(transport);

  // Store in map immediately (sessionId will be set to newId during handleRequest)
  mcpSessions.set(newId, transport);
  transport.onclose = () => mcpSessions.delete(newId);

  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !mcpSessions.has(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await mcpSessions.get(sessionId)!.handleRequest(req, res);
});

app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && mcpSessions.has(sessionId)) {
    const transport = mcpSessions.get(sessionId)!;
    await transport.close();
    mcpSessions.delete(sessionId);
  }
  res.status(200).end();
});

// Cleanup stale sessions every 30 minutes
setInterval(() => {
  // Simple cleanup: if we have too many sessions, remove oldest
  if (mcpSessions.size > 1000) {
    const keys = Array.from(mcpSessions.keys());
    for (let i = 0; i < keys.length - 500; i++) {
      const transport = mcpSessions.get(keys[i]);
      transport?.close();
      mcpSessions.delete(keys[i]);
    }
  }
}, 30 * 60 * 1000);

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
  console.log();
  console.log("Web & Geo endpoints:");
  console.log("  POST /api/v1/web/extract               $0.005");
  console.log("  POST /api/v1/geo/search                $0.002");
  console.log();
  console.log("News & Network endpoints:");
  console.log("  POST /api/v1/news/feed                 $0.003");
  console.log("  POST /api/v1/net/dns                   $0.001");
  console.log();
  console.log("Discovery:");
  console.log("  GET  /api/v1/openapi.json");
  console.log();
  console.log("MCP Server:");
  console.log("  POST/GET/DELETE /mcp  (Streamable HTTP)");
});
