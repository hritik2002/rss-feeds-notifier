import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import path from "path";

const BASE_URL = "https://unsloth.ai";
const BLOG_URL = "https://unsloth.ai/blog";
const BLOG_POST_LINK_SELECTOR =
  "a[href*='/blog/'], a[href*='docs.unsloth.ai/new/']";
const RSS_FEED_TITLE = "Unsloth Blog";
const RSS_FEED_DESCRIPTION = "RSS feed of the Unsloth blog";
const RSS_FILE_PATH = "./public/customFeeds/unsloth.xml";

const getRssItems = async () => {
  const html = await fetch(BLOG_URL).then((res) => res.text());
  const $ = cheerio.load(html);

  const items = [];

  $(BLOG_POST_LINK_SELECTOR).each((i, el) => {
    const title = $(el).text().trim();
    let href = $(el).attr("href");

    if (!title || !href) return;

    if (href.startsWith("/")) {
      href = `${BASE_URL}${href}`;
    }

    items.push({ title, url: href });
  });

  return items;
};

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRss(items) {
  const now = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
  <channel>
    <title>${RSS_FEED_TITLE}</title>
    <link>${BLOG_URL}</link>
    <description>${RSS_FEED_DESCRIPTION}</description>
    <lastBuildDate>${now}</lastBuildDate>
    ${items
      .map(
        (item) => `
      <item>
        <title>${escapeHtml(item.title)}</title>
        <link>${escapeHtml(item.url)}</link>
        <guid>${escapeHtml(item.url)}</guid>
      </item>
    `
      )
      .join("")}
  </channel>
  </rss>`;
}

export default async function generateUnslothRss() {
  const items = await getRssItems();

  const rss = generateRss(items);

  if (!fs.existsSync(path.dirname(RSS_FILE_PATH))) {
    fs.mkdirSync(path.dirname(RSS_FILE_PATH), { recursive: true });
  }

  fs.writeFileSync(RSS_FILE_PATH, rss);
  console.log(`Generated ${RSS_FILE_PATH}`);
}
