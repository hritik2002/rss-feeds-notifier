import RssParser from "rss-parser";
import cron from "node-cron";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { feeds } from "./data/feeds.js";
import { initDB } from "./db.js";
import { sendNewPostEmail } from "./notifier.js";
import { interests } from "./data/interests.js";
import { generatePostSummary } from "./llmClient.js";
import generateCustomRssFeeds from "./customRssGenerator/index.js";

const parser = new RssParser({
  customFields: {
    item: [],
  },
  requestOptions: {
    rejectUnauthorized: false, // Allow self-signed certificates
    timeout: 10000, // 10 second timeout
  },
});

async function getContent(postLink) {
  try {
    const res = await fetch(postLink, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
      },
    }).then((res) => res.text());

    const $ = cheerio.load(res);
    $(
      "script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar, .comments"
    ).remove();

    return $("body").text().trim();
  } catch (fetchError) {
    console.error(`Failed to fetch ${postLink}:`, fetchError.message);
    return null;
  }
}

async function processPost(latestPost, feedData) {
  const textContent = await getContent(latestPost.link);
  const content = textContent ?? latestPost.content;

  if (!content) return;

  const { summary, isRelevant } = await generatePostSummary({
    post: content,
    interests: interests,
  });

  if (isRelevant === "yes") {
    await sendNewPostEmail({
      feedTitle: feedData.title,
      postTitle: latestPost.title,
      postLink: latestPost.link,
      summary: summary,
    });
  }
}

async function processFeed(feed, existingFeeds, db) {
  try {
    let feedData;
    try {
      feedData = await parser.parseURL(feed.url);
    } catch (parseError) {
      // Check if it's an XML parsing error (likely redirect to HTML page)
      if (
        parseError.message &&
        parseError.message.includes("Unable to parse XML")
      ) {
        console.error(
          `Feed ${feed.url} appears to be invalid or redirects to non-RSS content. Skipping.`
        );
        return;
      }
      console.error(`Error parsing feed ${feed.url}:`, parseError.message);
      return;
    }

    if (!feedData || !feedData.items || feedData.items.length === 0) {
      console.log(`No items found in feed ${feed.url}`);
      return;
    }

    const latestPost = feedData.items[0];
    if (!latestPost || !latestPost.link) {
      console.log(`No valid post found in feed ${feed.url}`);
      return;
    }

    const existingFeed = existingFeeds.find(
      (existingFeed) => existingFeed.url === feed.url
    );
    let isNewPost = false;

    if (existingFeed) {
      if (latestPost.link !== existingFeed.last_link) {
        await db.run(
          "UPDATE feeds SET title = ?, last_link = ?, last_updated = ? WHERE url = ?",
          [
            existingFeed.title,
            latestPost.link,
            new Date().toISOString(),
            feed.url,
          ]
        );
        isNewPost = true;
      }
    } else {
      await db.run(
        "INSERT INTO feeds (url, title, last_link, last_updated) VALUES (?, ?, ?, ?)",
        [feed.url, feedData.title, latestPost.link, new Date().toISOString()]
      );

      isNewPost = true;
    }

    console.log("isNewPost", isNewPost);

    if (isNewPost) {
      await processPost(latestPost, feedData);
    }
  } catch (error) {
    console.error(`Error processing feed ${feed.url}:`, error.message);
  }
}

export async function watchRSSFeeds() {
  const db = await initDB();
  try {
    const existingFeeds = await db.all("SELECT * FROM feeds");

    await Promise.all(
      feeds.map((feed) => processFeed(feed, existingFeeds, db))
    );
  } catch (error) {
    console.error("rss watcher error", error);
  } finally {
    await db.close();
  }
}

export async function addFeedToDb(feed) {
  const db = await initDB();
  try {
    const existingFeeds = await db.all("SELECT * FROM feeds");
    await processFeed(feed, existingFeeds, db);
  } catch (error) {
    throw error;
  } finally {
    await db.close();
  }
}

async function start() {
  await generateCustomRssFeeds();
  watchRSSFeeds();
}

cron.schedule("0 */6 * * *", start);
start();
