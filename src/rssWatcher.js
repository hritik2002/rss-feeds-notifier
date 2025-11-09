import RssParser from "rss-parser";
import cron from "node-cron";
import { feeds } from "./data/feeds.js";
import { initDB } from "./db.js";
import { sendNewPostEmail } from "./notifier.js";
import { interests } from "./data/interests.js";
import { generatePostSummary } from "./llmClient.js";

const parser = new RssParser({
  customFields: {
    item: [],
  },
  requestOptions: {
    rejectUnauthorized: false, // Allow self-signed certificates
    timeout: 10000, // 10 second timeout
  },
});

export async function watchRSSFeeds() {
  const db = await initDB();
  try {
    const existingFeeds = await db.all("SELECT * FROM feeds");

    for (const feed of feeds) {
      const feedData = await parser.parseURL(feed.url);
      // only the last feed item is considered (temporary)
      const latestPost = feedData.items?.[0];
      const content = latestPost.content || latestPost.contentSnippet;
      if (!latestPost || !content) continue;

      const existingFeed = existingFeeds.find(
        (existingFeed) => existingFeed.url === feed.url
      );

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
      } else {
        await db.run(
          "INSERT INTO feeds (url, title, last_link, last_updated) VALUES (?, ?, ?, ?)",
          [feed.url, feedData.title, latestPost.link, new Date().toISOString()]
        );
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
    }
  } catch (error) {
    console.error("rss watcher error", error);
  } finally {
    await db.close();
  }
}

cron.schedule("0 */6 * * *", watchRSSFeeds);

watchRSSFeeds();
