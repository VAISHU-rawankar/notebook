import express from 'express';
import postgres from 'postgres';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Use the URL from the user's .env if available, otherwise use the provided one
const dbUrl = process.env.DATABASE_URL || "postgres://postgres:WDq5gN3fapruXJ9h7c5Ax8LWwKAA77yaiEU2fiX6SlXYdPLiAb5MsYKeOUe1Iqso@46.202.164.5:5415/postgres";
const sql = postgres(dbUrl, { ssl: false });

app.use(cors());
app.use(express.json());

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id          TEXT PRIMARY KEY,
      content     TEXT NOT NULL DEFAULT '',
      mood        TEXT DEFAULT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS journal_attachments (
      id         TEXT PRIMARY KEY,
      entry_id   TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      file_url   TEXT NOT NULL,
      file_type  TEXT NOT NULL,
      file_name  TEXT NOT NULL
    )
  `;
  console.log('Database tables verified.');
}

// Routes
app.get('/journal', async (req, res) => {
  console.log('GET /journal - Fetching entries');
  try {
    const entries = await sql`SELECT * FROM journal_entries ORDER BY created_at DESC`;
    const attachments = await sql`SELECT * FROM journal_attachments`;
    
    const result = entries.map(e => ({
      ...e,
      attachments: attachments.filter(a => a.entry_id === e.id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/journal', async (req, res) => {
  console.log('POST /journal - Creating entry');
  try {
    const body = req.body;
    const [entry] = await sql`
      INSERT INTO journal_entries (id, content, mood, created_at, updated_at)
      VALUES (${body.id}, ${body.content ?? ''}, ${body.mood ?? null}, ${body.created_at}, ${body.updated_at})
      RETURNING *
    `;
    res.json({ ...entry, attachments: [] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/journal/:id', async (req, res) => {
  console.log(`PUT /journal/${req.params.id} - Updating entry`);
  try {
    const entryId = req.params.id;
    const body = req.body;
    const [entry] = await sql`
      UPDATE journal_entries
      SET content = ${body.content}, mood = ${body.mood ?? null}, updated_at = ${body.updated_at}
      WHERE id = ${entryId}
      RETURNING *
    `;
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/journal/:id', async (req, res) => {
  try {
    const entryId = req.params.id;
    await sql`DELETE FROM journal_entries WHERE id = ${entryId}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/journal/:id/attachments', async (req, res) => {
  try {
    const entryId = req.params.id;
    const body = req.body;
    const [att] = await sql`
      INSERT INTO journal_attachments (id, entry_id, file_url, file_type, file_name)
      VALUES (${body.id}, ${entryId}, ${body.file_url}, ${body.file_type}, ${body.file_name})
      RETURNING *
    `;
    res.json(att);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/journal/:id/attachments/:attId', async (req, res) => {
  try {
    const attId = req.params.attId;
    await sql`DELETE FROM journal_attachments WHERE id = ${attId}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(port, async () => {
  await ensureTables();
  console.log(`Server running at http://localhost:${port}`);
});
