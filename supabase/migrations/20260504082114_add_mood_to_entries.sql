/*
  # Add mood column to journal_entries

  1. Changes
    - `journal_entries`: add `mood` column (text, nullable)
      Stores the emoji mood string for the entry (e.g. "😊", "😢", etc.)

  2. Notes
    - Nullable so existing entries without a mood are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journal_entries' AND column_name = 'mood'
  ) THEN
    ALTER TABLE journal_entries ADD COLUMN mood TEXT DEFAULT NULL;
  END IF;
END $$;
