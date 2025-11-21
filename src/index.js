import express from "express";

import { initDB } from "./db.js";
import { addFeedToDb, watchRSSFeeds } from "./rssWatcher.js";

const app = express();
app.use(express.json());


app.get("/", async (req, res) => {
  ``;
  const db = await initDB();
  const feeds = await db.all("SELECT * FROM feeds ORDER BY last_updated DESC");
  await db.close();
  res.json(feeds);
});

app.post("/watch-rss-feeds", async (req, res) => {
  await watchRSSFeeds();
  res.send("✅ RSS feeds watched");
});

app.post("/add-to-db", async (req, res) => {
  try {
    const { feed } = req.body;
    await addFeedToDb(feed);

    return res.status(200).json({ status: "success", message: "Feed added to db" });
  } catch (error) { 
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/refresh-feeds-db", async (req, res) => {
  try {
    const { feeds } = req.body;
    
    const db = await initDB();

    // clear all feeds from db
    await db.exec("DELETE FROM feeds");

    await Promise.all(
      feeds.map(async (feed) => {
        return db.run(
          "INSERT INTO feeds (id, url, title, last_link, last_updated) VALUES (?, ?, ?, ?, ?)",
          [
            feed.id,
            feed.url,
            feed.title,
            feed.last_link,
            feed.last_updated || new Date().toISOString(),
          ]
        );
      })
    );
    await db.close();
    res.send("Feeds added to db");
  } catch (error) {
    res.status(500).send("Error adding feeds to db");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
