import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import path from "path";

const feeds = [
  {
    name: "Unsloth",
    blogUrl: "https://unsloth.ai/blog",
    blogPostLinkSelector: "a[href*='/blog/'], a[href*='docs.unsloth.ai/new/']",
    rssFeedTitle: "Unsloth Blog",
    rssFeedDescription: "RSS feed of the Unsloth blog",
    rssFilePath: "./public/customFeeds/unsloth.xml",
    baseUrl: "https://unsloth.ai",
  },
];

const getRssItems = async ({ blogUrl, blogPostLinkSelector, baseUrl }) => {
  const html = await fetch(blogUrl).then((res) => res.text());
  const $ = cheerio.load(html);

  const items = [];

  $(blogPostLinkSelector).each((i, el) => {
    const title = $(el).text().trim();
    let href = $(el).attr("href");

    if (!title || !href) return;

    if (href.startsWith("/")) {
      href = `${baseUrl}${href}`;
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

function generateRss({ items, rssFeedTitle, rssFeedDescription, blogUrl }) {
  const now = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
  <channel>
    <title>${rssFeedTitle}</title>
    <link>${blogUrl}</link>
    <description>${rssFeedDescription}</description>
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

async function generateRssFeed(feed) {
  const {
    blogUrl,
    blogPostLinkSelector,
    baseUrl,
    rssFeedTitle,
    rssFeedDescription,
    rssFilePath,
  } = feed;
  const items = await getRssItems({ blogUrl, blogPostLinkSelector, baseUrl });

  const rss = generateRss({ items, rssFeedTitle, rssFeedDescription, blogUrl });

  if (!fs.existsSync(path.dirname(rssFilePath))) {
    fs.mkdirSync(path.dirname(rssFilePath), { recursive: true });
  }

  fs.writeFileSync(rssFilePath, rss);
}

export default async function generateCustomRssFeeds() {
  const promises = feeds.map((feed) => generateRssFeed(feed));
  await Promise.all(promises);
}