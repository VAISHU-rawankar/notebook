/*
  # Create Journal Tables

  1. New Tables
    - `journal_entries`
      - `id` (text, primary key) - client-generated UUID
      - `content` (text) - journal entry text content
      - `created_at` (timestamptz) - entry creation time
      - `updated_at` (timestamptz) - last edit time

    - `journal_attachments`
      - `id` (text, primary key) - client-generated UUID
      - `entry_id` (text, FK → journal_entries, CASCADE delete)
      - `file_url` (text) - URL/object URL of the attachment
      - `file_type` (text) - one of: image, video, audio, file
      - `file_name` (text) - original filename for display

  2. Security
    - RLS enabled on both tables
    - Public read/write policies since this app has no auth (single-user journal)
    - Policies restrict to authenticated-style access via anon key

  3. Notes
    - Attachments cascade-delete when their parent entry is deleted
    - Tables are created with IF NOT EXISTS to be idempotent
*/

CREATE TABLE IF NOT EXISTS journal_entries (
  id          TEXT PRIMARY KEY,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_attachments (
  id         TEXT PRIMARY KEY,
  entry_id   TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  file_url   TEXT NOT NULL,
  file_type  TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'file')),
  file_name  TEXT NOT NULL DEFAULT ''
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_attachments ENABLE ROW LEVEL SECURITY;

-- Allow anon/service role to read all entries (journal is single-user, no auth)
CREATE POLICY "Allow read journal entries"
  ON journal_entries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert journal entries"
  ON journal_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update journal entries"
  ON journal_entries FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete journal entries"
  ON journal_entries FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow read journal attachments"
  ON journal_attachments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert journal attachments"
  ON journal_attachments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow delete journal attachments"
  ON journal_attachments FOR DELETE
  TO anon, authenticated
  USING (true);

-- Index for fast attachment lookups by entry
CREATE INDEX IF NOT EXISTS journal_attachments_entry_id_idx ON journal_attachments(entry_id);
-- Index for sorting entries by date
CREATE INDEX IF NOT EXISTS journal_entries_created_at_idx ON journal_entries(created_at DESC);
