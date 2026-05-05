import { useState, useEffect, useCallback, useRef } from 'react';
import { JournalEntry, Attachment } from '../types';

const BASE = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) h['Authorization'] = `Bearer ${API_KEY}`;
  return { ...h, ...(extra as Record<string, string> | undefined) };
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: buildHeaders(opts?.headers as HeadersInit) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useJournal() {
  const [entries, setEntries]   = useState<JournalEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Keep a ref of latest entries for use inside debounce closures
  const entriesRef = useRef<JournalEntry[]>([]);
  entriesRef.current = entries;

  useEffect(() => {
    apiFetch('')
      .then((data: JournalEntry[]) => setEntries(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createEntry = useCallback(async (): Promise<JournalEntry> => {
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      content: '',
      mood: null,
      created_at: now,
      updated_at: now,
      attachments: [],
    };
    setEntries(prev => [entry, ...prev]);
    try {
      const saved = await apiFetch('', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      setEntries(prev => prev.map(e => e.id === saved.id ? { ...saved, attachments: e.attachments ?? [] } : e));
      return saved;
    } catch (err) {
      console.error(err);
      return entry;
    }
  }, []);

  const updateEntry = useCallback((id: string, content: string) => {
    const updated_at = new Date().toISOString();
    setEntries(prev =>
      prev.map(e => e.id === id ? { ...e, content, updated_at } : e)
    );
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      const entry = entriesRef.current.find(e => e.id === id);
      apiFetch(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content, mood: entry?.mood ?? null, updated_at }),
      }).catch(console.error);
    }, 800);
  }, []);

  const updateMood = useCallback((id: string, mood: string | null) => {
    const updated_at = new Date().toISOString();
    setEntries(prev =>
      prev.map(e => e.id === id ? { ...e, mood, updated_at } : e)
    );
    const entry = entriesRef.current.find(e => e.id === id);
    apiFetch(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content: entry?.content ?? '', mood, updated_at }),
    }).catch(console.error);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      await apiFetch(`/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addAttachment = useCallback(async (
    entryId: string,
    attachment: { id: string; file_url: string; file_type: Attachment['file_type']; file_name: string }
  ) => {
    const att: Attachment = { ...attachment, entry_id: entryId };
    setEntries(prev =>
      prev.map(e => e.id === entryId
        ? { ...e, attachments: [...(e.attachments ?? []), att] }
        : e
      )
    );
    try {
      await apiFetch(`/${entryId}/attachments`, {
        method: 'POST',
        body: JSON.stringify(attachment),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const removeAttachment = useCallback(async (entryId: string, attachmentId: string) => {
    setEntries(prev =>
      prev.map(e => e.id === entryId
        ? { ...e, attachments: (e.attachments ?? []).filter(a => a.id !== attachmentId) }
        : e
      )
    );
    try {
      await apiFetch(`/${entryId}/attachments/${attachmentId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `my-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  return { entries, loading, createEntry, updateEntry, updateMood, deleteEntry, addAttachment, removeAttachment, exportJSON };
}
