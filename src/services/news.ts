const CACHE_TTL = 300_000; // 5 minutes
const cache = new Map<string, { data: FeedResult; timestamp: number }>();

const PRESET_FEEDS: Record<string, string> = {
  tech: "https://hnrss.org/frontpage",
  crypto: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  business: "https://feeds.bbci.co.uk/news/business/rss.xml",
  world: "https://feeds.bbci.co.uk/news/world/rss.xml",
};

interface FeedItem {
  title: string;
  link: string;
  published: string;
  summary: string;
}

interface FeedResult {
  source: string;
  category?: string;
  items: FeedItem[];
  count: number;
  timestamp: string;
  attribution: string;
}

export function getAvailableCategories(): string[] {
  return Object.keys(PRESET_FEEDS);
}

export async function fetchNewsFeed(
  options: { category?: string; url?: string }
): Promise<FeedResult> {
  let feedUrl: string;
  let category: string | undefined;

  if (options.url) {
    feedUrl = options.url;
    if (!feedUrl.startsWith("http://") && !feedUrl.startsWith("https://")) {
      throw new Error("URL must start with http:// or https://");
    }
  } else if (options.category) {
    category = options.category.toLowerCase();
    feedUrl = PRESET_FEEDS[category];
    if (!feedUrl) {
      throw new Error(
        `Unknown category '${options.category}'. Available: ${Object.keys(PRESET_FEEDS).join(", ")}`
      );
    }
  } else {
    throw new Error(
      "Provide 'category' (tech, crypto, business, world) or 'url' (RSS feed URL)"
    );
  }

  // Check cache
  const cached = cache.get(feedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "ai-api/1.0 (https://ai-api-1c5n.onrender.com)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch feed: HTTP ${res.status}`);
  }

  const xml = await res.text();
  const items = parseRss(xml);

  const data: FeedResult = {
    source: feedUrl,
    ...(category ? { category } : {}),
    items: items.slice(0, 30),
    count: items.length,
    timestamp: new Date().toISOString(),
    attribution: feedUrl,
  };

  cache.set(feedUrl, { data, timestamp: Date.now() });
  return data;
}

// Lightweight RSS parser using regex (RSS is simple enough)
function parseRss(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // Match <item>...</item> or <entry>...</entry> (RSS 2.0 / Atom)
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTag(block, "title");
    const link =
      extractTag(block, "link") ||
      extractAttribute(block, "link", "href");
    const published =
      extractTag(block, "pubDate") ||
      extractTag(block, "published") ||
      extractTag(block, "dc:date") ||
      extractTag(block, "updated") ||
      "";
    const summary =
      extractTag(block, "description") ||
      extractTag(block, "summary") ||
      extractTag(block, "content:encoded") ||
      "";

    if (title) {
      items.push({
        title: stripHtml(title),
        link: link || "",
        published,
        summary: stripHtml(summary).slice(0, 500),
      });
    }
  }

  return items;
}

function extractTag(block: string, tag: string): string {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataRegex = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i"
  );
  const cdataMatch = cdataRegex.exec(block);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular: <tag>content</tag>
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = regex.exec(block);
  return m ? m[1].trim() : "";
}

function extractAttribute(
  block: string,
  tag: string,
  attr: string
): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const m = regex.exec(block);
  return m ? m[1] : "";
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
