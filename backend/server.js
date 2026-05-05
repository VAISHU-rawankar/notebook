import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

// ── DB connection ─────────────────────────────────────
const pool = new Pool({
  connectionString:
    process.env.DB_URL ||
    "postgres://postgres:WDq5gN3fapruXJ9h7c5Ax8LWwKAA77yaiEU2fiX6SlXYdPLiAb5MsYKeOUe1Iqso@46.202.164.5:5415/postgres",
  ssl: false,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

// ── Ensure tables exist ───────────────────────────────
async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id          TEXT PRIMARY KEY,
      content     TEXT NOT NULL DEFAULT '',
      mood        TEXT DEFAULT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'journal_entries' AND column_name = 'mood'
      ) THEN
        ALTER TABLE journal_entries ADD COLUMN mood TEXT DEFAULT NULL;
      END IF;
    END $$
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS journal_attachments (
      id         TEXT PRIMARY KEY,
      entry_id   TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      file_url   TEXT NOT NULL,
      file_type  TEXT NOT NULL,
      file_name  TEXT NOT NULL
    )
  `);
  console.log("Tables ready.");
}

// ── Express app ───────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// GET /journal — list all entries with their attachments
app.get("/journal", async (_req, res) => {
  try {
    const entries = await query(
      "SELECT * FROM journal_entries ORDER BY created_at DESC"
    );
    const attachments = await query("SELECT * FROM journal_attachments");
    const result = entries.map((e) => ({
      ...e,
      attachments: attachments.filter((a) => a.entry_id === e.id),
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /journal — create entry
app.post("/journal", async (req, res) => {
  const { id, content, mood, created_at, updated_at } = req.body;
  try {
    const [entry] = await query(
      `INSERT INTO journal_entries (id, content, mood, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, content ?? "", mood ?? null, created_at, updated_at]
    );
    res.json({ ...entry, attachments: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// PUT /journal/:id — update entry content + mood
app.put("/journal/:id", async (req, res) => {
  const { id } = req.params;
  const { content, mood, updated_at } = req.body;
  try {
    const [entry] = await query(
      `UPDATE journal_entries
       SET content = $1, mood = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      [content, mood ?? null, updated_at, id]
    );
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /journal/:id — delete entry (cascades attachments)
app.delete("/journal/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM journal_entries WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /journal/:id/attachments — add attachment
app.post("/journal/:id/attachments", async (req, res) => {
  const entryId = req.params.id;
  const { id, file_url, file_type, file_name } = req.body;
  try {
    const [att] = await query(
      `INSERT INTO journal_attachments (id, entry_id, file_url, file_type, file_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, entryId, file_url, file_type, file_name]
    );
    res.json(att);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /journal/:id/attachments/:attId — remove attachment
app.delete("/journal/:id/attachments/:attId", async (req, res) => {
  const { attId } = req.params;
  try {
    await query("DELETE FROM journal_attachments WHERE id = $1", [attId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
ensureTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Journal backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize tables:", err);
    process.exit(1);
  });
