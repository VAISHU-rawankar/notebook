import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Mic, Paperclip, MoreVertical,
  ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { useSuggestions } from '../hooks/useSuggestions';
import AttachmentModal from '../components/AttachmentModal';
import AttachmentPreview from '../components/AttachmentPreview';
import VoiceOverlay from '../components/VoiceOverlay';
interface Props {
  entry: JournalEntry;
  onUpdate: (id: string, content: string) => void;
  onUpdateMood: (id: string, mood: string | null) => void;
  onAddAttachment: (
    entryId: string,
    att: { id: string; file_url: string; file_type: 'image' | 'video' | 'audio' | 'file'; file_name: string },
  ) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
}

// ── Formatting helpers ────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
// function fmtSec(s: number) {
//   return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
// }

// ── Calendar constants ────────────────────────────────
const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Calendar picker ───────────────────────────────────
function Calendar({ selected, onSelect, onClose }: {
  selected: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewing, setViewing] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  const year  = viewing.getFullYear();
  const month = viewing.getMonth();

  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel   = (d: number) => d === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();
  const isToday = (d: number) => { const t = new Date(); return d === t.getDate() && month === t.getMonth() && year === t.getFullYear(); };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose} />
      <div
        className="absolute left-1/2 z-50 fade-up"
        style={{
          top: 46, transform: 'translateX(-50%)',
          background: '#FBF3A2', borderRadius: 16,
          boxShadow: '0 8px 36px rgba(92,74,30,0.22)',
          padding: '14px 14px 16px', width: 268, userSelect: 'none',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <button onClick={() => setViewing(new Date(year, month - 1, 1))} className="text-ink-mid hover:text-ink p-1 transition-colors">
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <span className="font-sans font-semibold text-ink" style={{ fontSize: 13 }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={() => setViewing(new Date(year, month + 1, 1))} className="text-ink-mid hover:text-ink p-1 transition-colors">
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 3 }}>
          {DAYS.map(d => (
            <div key={d} className="font-sans text-ink-ghost" style={{ fontSize: 10, textAlign: 'center', paddingBottom: 3 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {cells.map((d, i) => (
            <button
              key={i}
              disabled={!d}
              onClick={() => { if (d) { onSelect(new Date(year, month, d)); onClose(); } }}
              style={{
                height: 30, borderRadius: 7, border: 'none',
                cursor: d ? 'pointer' : 'default',
                background: d && isSel(d) ? '#5C4A1E' : d && isToday(d) ? 'rgba(92,74,30,0.14)' : 'transparent',
                color: d && isSel(d) ? '#FBF3A2' : d ? '#5C4A1E' : 'transparent',
                fontFamily: 'Inter, sans-serif', fontSize: 12,
                fontWeight: d && isSel(d) ? 600 : 400,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (d && !isSel(d)) (e.currentTarget as HTMLElement).style.background = 'rgba(92,74,30,0.10)'; }}
              onMouseLeave={e => { if (d && !isSel(d)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {d ?? ''}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────
export default function HomeEditor({
  entry, onUpdate, onAddAttachment, onRemoveAttachment, onOpenMenu, onOpenSettings,
}: Props) {
  const [content, setContent]       = useState(entry.content);
  const [showAttach, setShowAttach] = useState(false);
  const [moreOpen, setMoreOpen]     = useState(false);
  const [calOpen, setCalOpen]       = useState(false);
  const [entryDate, setEntryDate]   = useState(() => new Date(entry.created_at));
  const [now, setNow]               = useState(() => new Date());

  // Tick every second for live time display
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Voice state ───────────────────────────────────
  const [voiceOpen, setVoiceOpen]     = useState(false);
  const [voiceSec, setVoiceSec]       = useState(0);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulatedRef = useRef('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestion  = useSuggestions(content);

  useEffect(() => {
    setContent(entry.content);
    setEntryDate(new Date(entry.created_at));
    stopVoice();
  }, [entry.id]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [content]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    });
    return () => cancelAnimationFrame(id);
  }, [entry.id]);

  const persist = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdate(entry.id, val), 800);
  }, [entry.id, onUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    persist(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const next = content + suggestion;
      setContent(next);
      persist(next);
    }
  };

  // ── Voice start / stop ────────────────────────────
  const startVoice = () => {
    const SR =
      (window as any)['SpeechRecognition']
      || (window as any)['webkitSpeechRecognition'];
    if (!SR) return;

    accumulatedRef.current = content;

    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = 'en-US';

    rec.onresult = (e: any) => {
      let finalChunk = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (finalChunk) {
        const next = accumulatedRef.current
          ? `${accumulatedRef.current} ${finalChunk}`
          : finalChunk;
        accumulatedRef.current = next;
        setContent(next);
        persist(next);
      }
      setInterimText(interim);
    };

    rec.onerror = () => stopVoice();
    rec.onend   = () => stopVoice();

    recognitionRef.current = rec;
    rec.start();
    setVoiceOpen(true);
    setVoiceSec(0);
    setInterimText('');
    timerRef.current = setInterval(() => setVoiceSec(s => s + 1), 1000);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setVoiceOpen(false);
    setInterimText('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleAttach = (url: string, type: 'image' | 'video' | 'audio' | 'file', name: string) => {
    onAddAttachment(entry.id, { id: crypto.randomUUID(), file_url: url, file_type: type, file_name: name });
  };

  const attachments = entry.attachments ?? [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F2EDD8' }}>
      {/* ── Full-page yellow sticky note ─────────── */}
      <div
        className="flex-1 paper-curl flex flex-col"
        style={{
          background: '#FBF3A2',
          margin: '16px 14px',
          borderRadius: 18,
          boxShadow: '0 6px 40px rgba(92,74,30,0.14)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Toolbar ──────────────────────────── */}
        <div
          className="flex items-center shrink-0"
          style={{ padding: '13px 18px 10px' }}
        >
          {/* Back */}
          <button
            onClick={onOpenMenu}
            className="text-ink-mid hover:text-ink transition-colors"
            style={{ marginRight: 'auto', padding: '2px 0' }}
          >
            <ArrowLeft size={20} strokeWidth={1.9} />
          </button>

          {/* Center: date · time ∨ */}
          <div className="relative" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            <button
              className="flex items-center gap-1.5 select-none"
              onClick={() => setCalOpen(v => !v)}
              style={{ padding: '2px 4px' }}
            >
              <span className="font-sans font-medium text-ink" style={{ fontSize: 13.5 }}>
                {fmtDate(entryDate.toISOString())}
              </span>
              <span className="text-ink-ghost font-sans" style={{ fontSize: 13 }}>·</span>
              <span className="font-sans text-ink-lt" style={{ fontSize: 13.5 }}>
                {fmtTime(now.toISOString())}
              </span>
              <ChevronDown
                size={13} strokeWidth={2.2} className="text-ink-lt"
                style={{ transform: calOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}
              />
            </button>

            {calOpen && (
              <Calendar
                selected={entryDate}
                onSelect={d => setEntryDate(d)}
                onClose={() => setCalOpen(false)}
              />
            )}
          </div>

          {/* Right: mic · paperclip · three-dot */}
          <div className="flex items-center" style={{ gap: 18, marginLeft: 'auto' }}>
            <button
              onClick={startVoice}
              className="text-ink-mid hover:text-ink transition-colors"
              aria-label="Voice"
            >
              <Mic size={19} strokeWidth={1.9} />
            </button>

            <button
              onClick={() => setShowAttach(v => !v)}
              className="text-ink-mid hover:text-ink transition-colors"
              aria-label="Attach"
            >
              <Paperclip size={19} strokeWidth={1.9} />
            </button>

            <div className="relative">
              <button
                onClick={() => setMoreOpen(v => !v)}
                className="text-ink-mid hover:text-ink transition-colors"
                aria-label="More"
              >
                <MoreVertical size={19} strokeWidth={1.9} />
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 z-30 bg-white rounded-2xl shadow-card-lg py-1.5 fade-up"
                  style={{ top: 30, minWidth: 150 }}
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <button
                    onClick={() => { onOpenSettings(); setMoreOpen(false); }}
                    className="w-full text-left font-sans text-sm text-ink hover:bg-card transition-colors"
                    style={{ padding: '10px 16px' }}
                  >
                    Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(180,155,50,0.20)', margin: '0 18px' }} />

        {/* ── Attachments inline ───────────────── */}
        {attachments.length > 0 && (
          <AttachmentPreview attachments={attachments} onRemove={onRemoveAttachment} />
        )}

        {/* ── Writing area ─────────────────────── */}
        <div className="flex-1 relative" style={{ padding: '14px 18px 52px' }}>
          {/* Ghost suggestion */}
          {suggestion && content && (
            <div
              className="absolute pointer-events-none wf text-lg leading-relaxed"
              style={{
                inset: 0, padding: '14px 18px 52px',
                color: '#C0AE70',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word',
              }}
            >
              <span style={{ visibility: 'hidden' }}>{content}</span>
              <span>{suggestion}</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your journal..."
            className="w-full wf text-lg leading-relaxed relative z-10"
            style={{
              color: '#5C4A1E',
              caretColor: '#5C4A1E',
              minHeight: 'calc(100vh - 180px)',
              display: 'block',
            }}
          />
        </div>

        {/* Tab hint */}
        {suggestion && (
          <div
            className="absolute bottom-4 left-5 flex items-center gap-1.5 pointer-events-none fade-in"
            style={{ zIndex: 2 }}
          >
            <span className="wf text-sm text-ink-ghost">{suggestion}</span>
            <span
              className="font-sans text-xs text-ink-ghost rounded px-1.5 py-0.5"
              style={{ background: 'rgba(92,74,30,0.09)' }}
            >
              Tab
            </span>
          </div>
        )}

        {/* ── Realistic page curl bottom-right ─── */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 160 160"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 160,
            height: 160,
            pointerEvents: 'none',
            zIndex: 10,
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Soft shadow on page surface swept toward center */}
            <radialGradient id="pgShadow" cx="100%" cy="100%" r="80%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="rgba(50,38,5,0.28)" />
              <stop offset="50%"  stopColor="rgba(50,38,5,0.10)" />
              <stop offset="100%" stopColor="rgba(50,38,5,0)" />
            </radialGradient>

            {/* Underside of peel — creamy light yellow fading to richer gold at crease */}
            <linearGradient id="peelFace" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%"   stopColor="#EDE070" />
              <stop offset="30%"  stopColor="#F5EE9A" />
              <stop offset="65%"  stopColor="#FEFCE2" />
              <stop offset="100%" stopColor="#FFFFF5" />
            </linearGradient>

            {/* Crease edge gradient */}
            <linearGradient id="creaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#A89420" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#C8B030" stopOpacity="0.30" />
            </linearGradient>

            {/* Drop shadow filter for the lifted flap */}
            <filter id="flapShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="-3" dy="-3" stdDeviation="5" floodColor="rgba(40,30,0,0.22)" />
            </filter>
          </defs>

          {/* Shadow pool on page surface */}
          <path
            d="M 160,160 C 118,148 82,114 48,48 C 88,90 124,126 160,160 Z"
            fill="url(#pgShadow)"
          />

          {/* Peeled flap — large curved triangle lifting off the corner */}
          <path
            d="M 160,160
               C 160,108 136,68  72,48
               C 96,78  128,116 160,160
               Z"
            fill="url(#peelFace)"
            filter="url(#flapShadow)"
          />

          {/* Crease fold line */}
          <path
            d="M 72,48 C 96,78 128,116 160,160"
            fill="none"
            stroke="url(#creaseGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Curled tip — reveals the page background underneath, creating the "rolled" illusion */}
          <path
            d="M 160,160
               C 148,138 138,136 128,146
               C 140,140 152,146 160,160
               Z"
            fill="#F2EDD8"
            opacity="0.95"
          />

          {/* Tiny highlight along the curled edge for glossiness */}
          <path
            d="M 72,48 C 88,62 106,82 126,106"
            fill="none"
            stroke="rgba(255,255,220,0.70)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── Voice overlay (centered floating card) ── */}
      {voiceOpen && (
        <VoiceOverlay
          seconds={voiceSec}
          interim={interimText}
          onStop={stopVoice}
        />
      )}

      {/* ── Attachment picker (top-right panel) ───── */}
      {showAttach && (
        <AttachmentModal
          onClose={() => setShowAttach(false)}
          onAttach={(url, type, name) => { handleAttach(url, type, name); setShowAttach(false); }}
        />
      )}
    </div>
  );
}
