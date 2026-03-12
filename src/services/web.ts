import { parse } from "node-html-parser";

const CACHE_TTL = 300_000; // 5 minutes
const MAX_CACHE_ENTRIES = 100;
const MAX_CONTENT_LENGTH = 50_000; // 50K chars
const FETCH_TIMEOUT = 10_000; // 10 seconds

interface CacheEntry {
  data: ExtractResult;
  timestamp: number;
}

interface ExtractResult {
  url: string;
  title: string;
  description: string;
  content: string;
  format: string;
  content_length: number;
  links?: { text: string; href: string }[];
  timestamp: string;
  attribution: string;
}

const cache = new Map<string, CacheEntry>();

// SSRF protection: block private/internal IPs
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Block private IP ranges
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.2") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      parsed.protocol === "file:"
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

// Evict oldest entries when cache is full
function evictCache() {
  if (cache.size <= MAX_CACHE_ENTRIES) return;

  let oldestKey = "";
  let oldestTime = Infinity;
  for (const [key, entry] of cache) {
    if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp;
      oldestKey = key;
    }
  }
  if (oldestKey) cache.delete(oldestKey);
}

export async function extractContent(
  url: string,
  format: string = "text"
): Promise<ExtractResult> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("URL must start with http:// or https://");
  }

  if (isPrivateUrl(url)) {
    throw new Error("Access to private/internal URLs is not allowed");
  }

  // Check cache
  const cacheKey = `${url}:${format}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Fetch with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ai-api/1.0; +https://ai-api-1c5n.onrender.com)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      // For non-HTML, return raw text
      const text = await res.text();
      const truncated = text.slice(0, MAX_CONTENT_LENGTH);
      const result: ExtractResult = {
        url,
        title: "",
        description: "",
        content: truncated,
        format: "text",
        content_length: truncated.length,
        timestamp: new Date().toISOString(),
        attribution: url,
      };
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      evictCache();
      return result;
    }

    html = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  const root = parse(html);

  // Remove unwanted elements
  for (const tag of [
    "script",
    "style",
    "nav",
    "footer",
    "header",
    "iframe",
    "noscript",
    "svg",
  ]) {
    root.querySelectorAll(tag).forEach((el) => el.remove());
  }

  // Extract metadata
  const title =
    root.querySelector("title")?.text?.trim() ||
    root.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    "";

  const description =
    root
      .querySelector('meta[name="description"]')
      ?.getAttribute("content") ||
    root
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content") ||
    "";

  let content: string;
  let links: { text: string; href: string }[] | undefined;

  if (format === "links") {
    // Extract all links
    links = root
      .querySelectorAll("a[href]")
      .map((a) => ({
        text: a.text.trim(),
        href: a.getAttribute("href") || "",
      }))
      .filter((l) => l.text && l.href && l.href.startsWith("http"));

    content = `Found ${links.length} links`;
  } else if (format === "markdown") {
    // Convert to basic markdown
    content = htmlToMarkdown(root);
  } else {
    // Plain text
    content = root.text.replace(/\s+/g, " ").trim();
  }

  // Truncate
  content = content.slice(0, MAX_CONTENT_LENGTH);

  const result: ExtractResult = {
    url,
    title,
    description,
    content,
    format,
    content_length: content.length,
    ...(links ? { links: links.slice(0, 200) } : {}),
    timestamp: new Date().toISOString(),
    attribution: url,
  };

  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  evictCache();

  return result;
}

function htmlToMarkdown(root: ReturnType<typeof parse>): string {
  const lines: string[] = [];

  // Process headings
  for (let i = 1; i <= 6; i++) {
    root.querySelectorAll(`h${i}`).forEach((el) => {
      const text = el.text.trim();
      if (text) {
        el.set_content(`${"#".repeat(i)} ${text}\n`);
      }
    });
  }

  // Process links
  root.querySelectorAll("a[href]").forEach((el) => {
    const href = el.getAttribute("href") || "";
    const text = el.text.trim();
    if (text && href.startsWith("http")) {
      el.set_content(`[${text}](${href})`);
    }
  });

  // Process paragraphs
  root.querySelectorAll("p").forEach((el) => {
    el.set_content(el.text.trim() + "\n\n");
  });

  // Process list items
  root.querySelectorAll("li").forEach((el) => {
    el.set_content("- " + el.text.trim() + "\n");
  });

  const text = root.text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return text;
}
