import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const dbUrl =
  Deno.env.get("JOURNAL_DB_URL") ||
  "postgres://postgres:WDq5gN3fapruXJ9h7c5Ax8LWwKAA77yaiEU2fiX6SlXYdPLiAb5MsYKeOUe1Iqso@46.202.164.5:5415/postgres";
const sql = postgres(dbUrl, { ssl: false });

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
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'journal_entries' AND column_name = 'mood'
      ) THEN
        ALTER TABLE journal_entries ADD COLUMN mood TEXT DEFAULT NULL;
      END IF;
    END $$
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
}

let tablesReady = false;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!tablesReady) {
      await ensureTables();
      tablesReady = true;
    }

    const url    = new URL(req.url);
    const parts  = url.pathname.split("/").filter(Boolean);
    // parts: ["journal"] or ["journal", entryId] or ["journal", entryId, "attachments"] etc.
    const method = req.method;

    // ── GET /journal  →  list all entries with attachments
    if (method === "GET" && parts.length === 1) {
      const entries = await sql`
        SELECT * FROM journal_entries ORDER BY created_at DESC
      `;
      const attachments = await sql`
        SELECT * FROM journal_attachments
      `;
      const result = entries.map((e: Record<string, unknown>) => ({
        ...e,
        attachments: attachments.filter((a: Record<string, unknown>) => a.entry_id === e.id),
      }));
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST /journal  →  create entry
    if (method === "POST" && parts.length === 1) {
      const body = await req.json();
      const [entry] = await sql`
        INSERT INTO journal_entries (id, content, mood, created_at, updated_at)
        VALUES (${body.id}, ${body.content ?? ''}, ${body.mood ?? null}, ${body.created_at}, ${body.updated_at})
        RETURNING *
      `;
      return new Response(JSON.stringify({ ...entry, attachments: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PUT /journal/:id  →  update entry content + mood
    if (method === "PUT" && parts.length === 2) {
      const entryId = parts[1];
      const body    = await req.json();
      const [entry] = await sql`
        UPDATE journal_entries
        SET content = ${body.content}, mood = ${body.mood ?? null}, updated_at = ${body.updated_at}
        WHERE id = ${entryId}
        RETURNING *
      `;
      return new Response(JSON.stringify(entry), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE /journal/:id  →  delete entry (cascades attachments)
    if (method === "DELETE" && parts.length === 2) {
      const entryId = parts[1];
      await sql`DELETE FROM journal_entries WHERE id = ${entryId}`;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST /journal/:id/attachments  →  add attachment
    if (method === "POST" && parts.length === 3 && parts[2] === "attachments") {
      const entryId = parts[1];
      const body    = await req.json();
      const [att]   = await sql`
        INSERT INTO journal_attachments (id, entry_id, file_url, file_type, file_name)
        VALUES (${body.id}, ${entryId}, ${body.file_url}, ${body.file_type}, ${body.file_name})
        RETURNING *
      `;
      return new Response(JSON.stringify(att), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE /journal/:id/attachments/:attId  →  remove attachment
    if (method === "DELETE" && parts.length === 4 && parts[2] === "attachments") {
      const attId = parts[3];
      await sql`DELETE FROM journal_attachments WHERE id = ${attId}`;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
