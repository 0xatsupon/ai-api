import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const paid = status !== 402 && req.path.startsWith("/api/v1/");
    const tag = status === 402 ? "[402]" : paid ? "[PAID]" : "[FREE]";
    console.log(
      `${tag} ${req.method} ${req.path} → ${status} (${duration}ms)`,
    );
  });

  next();
}
