import express from 'express';

import { initDB } from './db.js';
import { watchRSSFeeds } from './rssWatcher.js';

const app = express();

app.get('/', async (req, res) => {``
  const db = await initDB();
  const feeds = await db.all('SELECT * FROM feeds ORDER BY last_updated DESC');
  await db.close();
  res.json(feeds);
});

app.post('/watch-rss-feeds', async (req, res) => {
  await watchRSSFeeds();
  res.send('✅ RSS feeds watched');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
