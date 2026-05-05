import { useState, useRef, useEffect } from 'react';

const MOODS = [
  { emoji: '😄', label: 'Happy' },
  { emoji: '😊', label: 'Content' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😢', label: 'Upset' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🤒', label: 'Sick' },
];

interface Props {
  mood: string | null | undefined;
  onChange: (mood: string | null) => void;
}

export default function MoodPicker({ mood, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Set mood"
        style={{
          width: 34, height: 34, borderRadius: '50%',
          border: mood ? '2px solid rgba(92,74,30,0.35)' : '2px dashed rgba(92,74,30,0.25)',
          background: mood ? 'rgba(92,74,30,0.08)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: mood ? 18 : 14,
          transition: 'all 0.15s',
        }}
      >
        {mood ?? <span style={{ color: 'rgba(92,74,30,0.35)', fontSize: 16 }}>☺</span>}
      </button>

      {open && (
        <div
          className="fade-up"
          style={{
            position: 'absolute', bottom: 44, left: '50%',
            transform: 'translateX(-50%)',
            background: '#FBF3A2',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(92,74,30,0.22)',
            padding: '12px 14px',
            zIndex: 50,
            width: 220,
          }}
        >
          <div
            className="font-sans"
            style={{ fontSize: 10.5, color: 'rgba(92,74,30,0.5)', marginBottom: 10, textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            How are you feeling?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {MOODS.map(m => (
              <button
                key={m.emoji}
                title={m.label}
                onClick={() => { onChange(mood === m.emoji ? null : m.emoji); setOpen(false); }}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none',
                  background: mood === m.emoji ? 'rgba(92,74,30,0.18)' : 'transparent',
                  cursor: 'pointer', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.12s',
                  outline: mood === m.emoji ? '2px solid rgba(92,74,30,0.35)' : 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(92,74,30,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = mood === m.emoji ? 'rgba(92,74,30,0.18)' : 'transparent'; }}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          {mood && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="font-sans"
              style={{
                marginTop: 10, width: '100%', background: 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 11,
                color: 'rgba(92,74,30,0.45)', textAlign: 'center',
              }}
            >
              Clear mood
            </button>
          )}
        </div>
      )}
    </div>
  );
}
