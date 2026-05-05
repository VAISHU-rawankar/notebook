import { X } from 'lucide-react';

interface Props {
  seconds: number;
  interim: string;
  onStop: () => void;
}

function fmtSec(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function VoiceOverlay({ seconds, interim, onStop }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onStop}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.20)',
        }}
      />

      {/* Card — truly centered using flexbox on a full-screen layer */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          className="paper-curl voice-card"
          style={{
            pointerEvents: 'auto',
            width: 268,
            background: '#FDF6C3',
            borderRadius: 22,
            boxShadow: '0 16px 56px rgba(92,74,30,0.22)',
            padding: '18px 24px 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Close */}
          <button
            onClick={onStop}
            className="self-start text-ink-mid hover:text-ink transition-colors"
            style={{ marginBottom: 14 }}
          >
            <X size={18} strokeWidth={1.9} />
          </button>

          {/* Big mic circle */}
          <button
            onClick={onStop}
            style={{
              width: 84, height: 84,
              borderRadius: '50%',
              background: 'rgba(92,74,30,0.09)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(92,74,30,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(92,74,30,0.09)')}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#5C4A1E" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          </button>

          {/* Label */}
          <span
            className="font-sans font-semibold text-ink"
            style={{ fontSize: 15.5, marginBottom: 16 }}
          >
            {interim || 'Listening...'}
          </span>

          {/* Waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 22, marginBottom: 14 }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="wave-bar" style={{ width: 2.5, height: 16 }} />
            ))}
          </div>

          {/* Timer */}
          <span className="font-sans text-ink-lt" style={{ fontSize: 13, marginBottom: 10 }}>
            {fmtSec(seconds)}
          </span>

          {/* Hint */}
          <span className="font-sans text-ink-ghost" style={{ fontSize: 12 }}>
            Tap mic to stop
          </span>
        </div>
      </div>
    </>
  );
}
