import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDB() {
  const db = await open({
    filename: './feeds.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE,
      title TEXT,
      last_link TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}
