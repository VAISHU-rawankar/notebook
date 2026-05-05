import { useState, useMemo } from 'react';
import { Search, MoreVertical, Plus, Pin, X, ArrowLeft, BookOpen, CalendarDays, Trash2 } from 'lucide-react';
import { JournalEntry } from '../types';

interface Props {
  entries: JournalEntry[];
  onNewEntry: () => void;
  onOpenEntry: (id: string) => void;
  onDeleteEntry: (id: string) => void;
  onOpenSettings: () => void;
  onBack?: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' });
}
function fmtDayNum(iso: string) {
  return new Date(iso).getDate();
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
function fmtMonthYear(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
function preview(content: string) {
  const plain = content.replace(/<[^>]+>/g, '');
  const lines = plain.split('\n').filter(l => l.trim());
  return lines.slice(0, 3).join(' ').slice(0, 200) || 'No content yet...';
}
function wordCount(content: string) {
  const plain = content.replace(/<[^>]+>/g, '').trim();
  if (!plain) return 0;
  return plain.split(/\s+/).length;
}

export default function Dashboard({
  entries, onNewEntry, onOpenEntry, onDeleteEntry, onOpenSettings, onBack,
}: Props) {
  const [entryMenu, setEntryMenu] = useState<string | null>(null);
  const [moreOpen, setMoreOpen]   = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQ, setSearchQ]     = useState('');

  const filtered = useMemo(() =>
    searchQ
      ? entries.filter(e =>
          e.content.toLowerCase().includes(searchQ.toLowerCase()) ||
          fmtDate(e.created_at).toLowerCase().includes(searchQ.toLowerCase())
        )
      : entries,
    [entries, searchQ]
  );

  // Group entries by "Month Year"
  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of filtered) {
      const key = fmtMonthYear(e.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalWords = useMemo(() =>
    entries.reduce((sum, e) => sum + wordCount(e.content), 0),
    [entries]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#F2EDD8' }}
      onClick={() => { setEntryMenu(null); setMoreOpen(false); }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div
        className="flex items-center justify-between sticky top-0 z-20"
        style={{ background: '#F2EDD8', padding: '14px 18px 10px' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-ink transition-colors"
            style={{ padding: 2 }}
          >
            <ArrowLeft size={20} strokeWidth={1.8} />
          </button>
          <span className="font-sans font-semibold text-ink" style={{ fontSize: 18 }}>
            My Journal
          </span>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            onClick={e => { e.stopPropagation(); setSearching(v => !v); setSearchQ(''); }}
            className="text-ink transition-colors"
            style={{ padding: 6 }}
          >
            <Search size={19} strokeWidth={1.8} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setMoreOpen(v => !v); }}
            className="text-ink transition-colors"
            style={{ padding: 6 }}
          >
            <MoreVertical size={19} strokeWidth={1.8} />
          </button>

          {moreOpen && (
            <div
              className="absolute right-0 z-30 rounded-2xl fade-up"
              style={{
                top: 38, minWidth: 152,
                background: '#FBF3A2',
                boxShadow: '0 4px 20px rgba(92,74,30,0.18)',
                paddingTop: 6, paddingBottom: 6,
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { onOpenSettings(); setMoreOpen(false); }}
                className="w-full text-left font-sans text-sm text-ink transition-colors"
                style={{ padding: '10px 16px' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(92,74,30,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────── */}
      {searching && (
        <div className="fade-up" style={{ padding: '0 16px 10px' }}>
          <div
            className="flex items-center gap-2"
            style={{ background: '#FBF3A2', borderRadius: 12, padding: '8px 14px' }}
          >
            <Search size={15} strokeWidth={1.8} className="text-ink-lt shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search entries..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="flex-1 font-sans text-sm text-ink outline-none bg-transparent"
              style={{ caretColor: '#5C4A1E' }}
            />
            {searchQ && (
              <button onClick={() => setSearchQ('')} className="text-ink-lt hover:text-ink">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Stats strip ─────────────────────────────── */}
      {!searchQ && (
        <div
          className="flex items-center gap-0 shrink-0"
          style={{ margin: '0 16px 14px', borderRadius: 14, overflow: 'hidden' }}
        >
          <div
            style={{
              flex: 1, background: '#FBF3A2', padding: '11px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              borderRight: '1px solid rgba(180,155,50,0.25)',
            }}
          >
            <span className="font-sans font-bold text-ink" style={{ fontSize: 20, lineHeight: 1 }}>
              {entries.length}
            </span>
            <span className="font-sans text-ink-lt" style={{ fontSize: 10.5, marginTop: 3 }}>Entries</span>
          </div>
          <div
            style={{
              flex: 1, background: '#FBF3A2', padding: '11px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              borderRight: '1px solid rgba(180,155,50,0.25)',
            }}
          >
            <span className="font-sans font-bold text-ink" style={{ fontSize: 20, lineHeight: 1 }}>
              {grouped.length}
            </span>
            <span className="font-sans text-ink-lt" style={{ fontSize: 10.5, marginTop: 3 }}>Months</span>
          </div>
          <div
            style={{
              flex: 1, background: '#FBF3A2', padding: '11px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}
          >
            <span className="font-sans font-bold text-ink" style={{ fontSize: 20, lineHeight: 1 }}>
              {totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
            </span>
            <span className="font-sans text-ink-lt" style={{ fontSize: 10.5, marginTop: 3 }}>Words</span>
          </div>
        </div>
      )}

      {/* ── Entry list ──────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '0 14px 100px' }}
      >
        {filtered.length === 0 && (
          <div style={{ paddingTop: 60, textAlign: 'center' }}>
            <BookOpen size={36} strokeWidth={1.2} style={{ color: 'rgba(92,74,30,0.25)', margin: '0 auto 14px' }} />
            <p className="font-sans text-ink-ghost" style={{ fontSize: 14 }}>
              {searchQ ? 'No entries match your search.' : 'No entries yet. Tap + to start writing!'}
            </p>
          </div>
        )}

        {grouped.map(([monthYear, group]) => (
          <div key={monthYear} style={{ marginBottom: 24 }}>
            {/* Month header */}
            <div
              className="flex items-center gap-2"
              style={{ marginBottom: 10, paddingLeft: 2 }}
            >
              <CalendarDays size={13} strokeWidth={1.8} style={{ color: 'rgba(92,74,30,0.45)' }} />
              <span
                className="font-sans font-semibold"
                style={{ fontSize: 11.5, color: 'rgba(92,74,30,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                {monthYear}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(180,155,50,0.28)', marginLeft: 4 }} />
              <span
                className="font-sans"
                style={{ fontSize: 10.5, color: 'rgba(92,74,30,0.38)' }}
              >
                {group.length} {group.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* Entry cards in this month */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.map((entry, idx) => {
                const isFirst = entries[0]?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    style={{
                      background: '#FBF3A2',
                      borderRadius: 14,
                      boxShadow: '0 2px 10px rgba(92,74,30,0.09)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={() => { setEntryMenu(null); onOpenEntry(entry.id); }}
                  >
                    {/* Colored left accent for most recent */}
                    {isFirst && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: 3, background: '#7A6B30', borderRadius: '3px 0 0 3px',
                      }} />
                    )}

                    <div style={{ padding: '12px 14px 12px', paddingLeft: isFirst ? 17 : 14 }}>
                      {/* Top row: date + day badge + pin */}
                      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                        <div className="flex items-center gap-2">
                          {/* Day number badge */}
                          <div
                            style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: isFirst ? '#5C4A1E' : 'rgba(92,74,30,0.12)',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <span
                              className="font-sans font-bold"
                              style={{
                                fontSize: 13, lineHeight: 1,
                                color: isFirst ? '#FBF3A2' : '#5C4A1E',
                              }}
                            >
                              {fmtDayNum(entry.created_at)}
                            </span>
                            <span
                              className="font-sans"
                              style={{
                                fontSize: 7.5, lineHeight: 1, marginTop: 1,
                                color: isFirst ? 'rgba(251,243,162,0.7)' : 'rgba(92,74,30,0.5)',
                                textTransform: 'uppercase', letterSpacing: '0.04em',
                              }}
                            >
                              {fmtDay(entry.created_at)}
                            </span>
                          </div>

                          <div>
                            <div
                              className="font-sans font-semibold text-ink"
                              style={{ fontSize: 12.5, lineHeight: 1 }}
                            >
                              {fmtDate(entry.created_at)}
                            </div>
                            <div
                              className="font-sans text-ink-lt"
                              style={{ fontSize: 10.5, marginTop: 2 }}
                            >
                              {fmtTime(entry.created_at)}
                              {wordCount(entry.content) > 0 && (
                                <> · {wordCount(entry.content)} words</>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isFirst && (
                            <Pin size={13} strokeWidth={1.8} className="text-ink-mid" />
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setEntryMenu(entryMenu === entry.id ? null : entry.id);
                            }}
                            className="text-ink-ghost hover:text-ink transition-colors"
                            style={{ padding: 3 }}
                          >
                            <MoreVertical size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>

                      {/* Preview text */}
                      <div
                        className="wf text-ink"
                        style={{
                          fontSize: 14.5,
                          lineHeight: 1.55,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: entry.content ? '#5C4A1E' : 'rgba(92,74,30,0.38)',
                          fontStyle: entry.content ? 'normal' : 'italic',
                        }}
                      >
                        {preview(entry.content)}
                      </div>

                      {/* Attachment count badge */}
                      {entry.attachments && entry.attachments.length > 0 && (
                        <div
                          className="flex items-center gap-1 font-sans"
                          style={{ marginTop: 8, fontSize: 10.5, color: 'rgba(92,74,30,0.5)' }}
                        >
                          <span style={{
                            background: 'rgba(92,74,30,0.10)',
                            borderRadius: 5, padding: '2px 7px',
                          }}>
                            {entry.attachments.length} attachment{entry.attachments.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Context menu */}
                    {entryMenu === entry.id && (
                      <div
                        className="absolute z-20 rounded-xl fade-up"
                        style={{
                          right: 12, top: 46,
                          minWidth: 140,
                          background: '#FBF3A2',
                          boxShadow: '0 4px 20px rgba(92,74,30,0.18)',
                          paddingTop: 4, paddingBottom: 4,
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { onOpenEntry(entry.id); setEntryMenu(null); }}
                          className="w-full text-left font-sans text-sm text-ink transition-colors flex items-center gap-2.5"
                          style={{ padding: '9px 14px' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(92,74,30,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <BookOpen size={13} strokeWidth={1.8} />
                          Open
                        </button>
                        <button
                          onClick={() => { onDeleteEntry(entry.id); setEntryMenu(null); }}
                          className="w-full text-left font-sans text-sm transition-colors flex items-center gap-2.5"
                          style={{ padding: '9px 14px', color: '#B91C1C' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(185,28,28,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Trash2 size={13} strokeWidth={1.8} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── FAB ─────────────────────────────────────── */}
      <button
        onClick={onNewEntry}
        className="fixed active:scale-95 transition-transform"
        style={{
          bottom: 28, right: 20,
          width: 50, height: 50,
          borderRadius: '50%',
          background: '#5C4A1E',
          color: '#FBF3A2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(92,74,30,0.28)',
        }}
      >
        <Plus size={24} strokeWidth={2} />
      </button>
    </div>
  );
}
