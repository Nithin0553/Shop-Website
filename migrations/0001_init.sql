-- Run once with: npx wrangler d1 migrations apply sssa-shop-data --remote
-- All shop data is private. Only Worker routes can access the database binding.
CREATE TABLE IF NOT EXISTS documents (
  doc_key TEXT NOT NULL PRIMARY KEY,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('new', 'in-progress', 'closed')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  part TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE PRIMARY KEY,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS subscribers_created_at_idx ON subscribers(created_at DESC);
CREATE TABLE IF NOT EXISTS images (
  filename TEXT NOT NULL PRIMARY KEY,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS images_created_at_idx ON images(created_at DESC);
CREATE TABLE IF NOT EXISTS throttles (
  bucket TEXT NOT NULL,
  client_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  PRIMARY KEY(bucket, client_key)
);
