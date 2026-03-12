import { Router } from "express";
import { createHash, randomUUID } from "node:crypto";

const router = Router();

// Echo API
router.post("/api/v1/echo", (req, res) => {
  res.json({
    echo: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Text Transform API
router.post("/api/v1/text/transform", (req, res) => {
  const { text, operation } = req.body as { text?: string; operation?: string };

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Missing or invalid 'text' field" });
    return;
  }

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

  const op = operation || "uppercase";
  const fn = ops[op];
  if (!fn) {
    res.status(400).json({
      error: `Unknown operation '${op}'`,
      available: Object.keys(ops),
    });
    return;
  }

  res.json({ result: fn(text), operation: op });
});

// Text Analyze API
router.post("/api/v1/text/analyze", (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Missing or invalid 'text' field" });
    return;
  }

  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const charFreq: Record<string, number> = {};
  for (const c of text.toLowerCase()) {
    if (c.match(/[a-z]/)) {
      charFreq[c] = (charFreq[c] || 0) + 1;
    }
  }

  res.json({
    characters: text.length,
    words: words.length,
    sentences: sentences.length,
    paragraphs: text.split(/\n\n+/).filter(Boolean).length,
    averageWordLength: words.length > 0
      ? +(words.reduce((sum, w) => sum + w.length, 0) / words.length).toFixed(2)
      : 0,
    averageSentenceLength: sentences.length > 0
      ? +(words.length / sentences.length).toFixed(2)
      : 0,
    topCharacters: Object.entries(charFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([char, count]) => ({ char, count })),
  });
});

// JSON Transform API
router.post("/api/v1/data/json-transform", (req, res) => {
  const { data, operation, fields } = req.body as {
    data?: unknown;
    operation?: string;
    fields?: string[];
  };

  if (data === undefined) {
    res.status(400).json({ error: "Missing 'data' field" });
    return;
  }

  const op = operation || "flatten";

  if (op === "flatten" && typeof data === "object" && data !== null) {
    const flat: Record<string, unknown> = {};
    const walk = (obj: Record<string, unknown>, prefix = "") => {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          walk(v as Record<string, unknown>, key);
        } else {
          flat[key] = v;
        }
      }
    };
    walk(data as Record<string, unknown>);
    res.json({ result: flat });
    return;
  }

  if (op === "pick" && typeof data === "object" && data !== null && Array.isArray(fields)) {
    const result: Record<string, unknown> = {};
    for (const f of fields) {
      if (f in (data as Record<string, unknown>)) {
        result[f] = (data as Record<string, unknown>)[f];
      }
    }
    res.json({ result });
    return;
  }

  if (op === "omit" && typeof data === "object" && data !== null && Array.isArray(fields)) {
    const result = { ...(data as Record<string, unknown>) };
    for (const f of fields) {
      delete result[f];
    }
    res.json({ result });
    return;
  }

  if (op === "keys" && typeof data === "object" && data !== null) {
    res.json({ result: Object.keys(data as Record<string, unknown>) });
    return;
  }

  if (op === "values" && typeof data === "object" && data !== null) {
    res.json({ result: Object.values(data as Record<string, unknown>) });
    return;
  }

  res.status(400).json({
    error: `Unknown operation '${op}' or invalid data type`,
    available: ["flatten", "pick", "omit", "keys", "values"],
  });
});

// Hash API
router.post("/api/v1/crypto/hash", (req, res) => {
  const { input, algorithm } = req.body as { input?: string; algorithm?: string };

  if (!input || typeof input !== "string") {
    res.status(400).json({ error: "Missing or invalid 'input' field" });
    return;
  }

  const algo = algorithm || "sha256";
  const supported = ["sha256", "sha512", "md5", "sha1"];
  if (!supported.includes(algo)) {
    res.status(400).json({ error: `Unsupported algorithm '${algo}'`, available: supported });
    return;
  }

  const hash = createHash(algo).update(input).digest("hex");
  res.json({ hash, algorithm: algo });
});

// UUID API
router.post("/api/v1/util/uuid", (req, res) => {
  const { count } = req.body as { count?: number };
  const n = Math.min(Math.max(count || 1, 1), 100);
  const uuids = Array.from({ length: n }, () => randomUUID());
  res.json({ uuids, count: n });
});

export default router;
