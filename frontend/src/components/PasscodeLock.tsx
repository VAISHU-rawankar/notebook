import { useState } from 'react';
import { Delete, Lock } from 'lucide-react';

const PASSCODE_KEY = 'journal_passcode';

export function getStoredPasscode(): string | null {
  return localStorage.getItem(PASSCODE_KEY);
}
export function setStoredPasscode(pin: string) {
  localStorage.setItem(PASSCODE_KEY, pin);
}
export function clearStoredPasscode() {
  localStorage.removeItem(PASSCODE_KEY);
}

type Mode = 'verify' | 'setup' | 'confirm';

interface Props {
  mode: Mode;
  onSuccess: (pin?: string) => void;
  onCancel?: () => void;
}

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PasscodeLock({ mode, onSuccess, onCancel }: Props) {
  const [input, setInput]       = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [phase, setPhase]       = useState<'enter' | 'confirm'>(mode === 'confirm' ? 'enter' : 'enter');
  const [shake, setShake]       = useState(false);
  const [hint, setHint]         = useState(
    mode === 'verify' ? 'Enter your passcode' :
    mode === 'setup'  ? 'Create a 4-digit passcode' :
    'Enter new passcode'
  );

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setInput(''); }, 500);
  };

  const handleDigit = (d: string) => {
    if (d === '⌫') { setInput(p => p.slice(0, -1)); return; }
    if (!d) return;
    const next = input + d;
    if (next.length > 4) return;
    setInput(next);

    if (next.length === 4) {
      setTimeout(() => {
        if (mode === 'verify') {
          if (next === getStoredPasscode()) {
            onSuccess();
          } else {
            setHint('Incorrect passcode. Try again.');
            triggerShake();
          }
        } else if (mode === 'setup') {
          if (phase === 'enter') {
            setFirstPin(next);
            setPhase('confirm');
            setInput('');
            setHint('Confirm your passcode');
          } else {
            if (next === firstPin) {
              setStoredPasscode(next);
              onSuccess(next);
            } else {
              setFirstPin('');
              setPhase('enter');
              setHint('Passcodes did not match. Try again.');
              triggerShake();
            }
          }
        }
      }, 120);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: '#F2EDD8',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#FBF3A2',
          boxShadow: '0 2px 12px rgba(92,74,30,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Lock size={24} strokeWidth={1.6} style={{ color: '#5C4A1E' }} />
        </div>
        <p className="font-sans font-semibold text-ink" style={{ fontSize: 17 }}>My Journal</p>
        <p className="font-sans text-ink-lt" style={{ fontSize: 13, marginTop: 4 }}>{hint}</p>
      </div>

      {/* Dots */}
      <div
        style={{
          display: 'flex', gap: 16, marginBottom: 40,
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}
      >
        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>
        {[0,1,2,3].map(i => (
          <div
            key={i}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < input.length ? '#5C4A1E' : 'rgba(92,74,30,0.20)',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, width: 240 }}>
        {DIGITS.map((d, i) => (
          <button
            key={i}
            onClick={() => handleDigit(d)}
            disabled={!d && d !== '0'}
            style={{
              height: 64, borderRadius: 14,
              background: d ? '#FBF3A2' : 'transparent',
              border: 'none',
              boxShadow: d ? '0 2px 8px rgba(92,74,30,0.10)' : 'none',
              cursor: d ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              fontSize: d === '⌫' ? 18 : 22,
              fontWeight: 500,
              color: '#5C4A1E',
              transition: 'background 0.1s, transform 0.08s',
            }}
            onMouseEnter={e => { if (d) (e.currentTarget as HTMLElement).style.background = 'rgba(251,243,162,0.6)'; }}
            onMouseLeave={e => { if (d) (e.currentTarget as HTMLElement).style.background = d ? '#FBF3A2' : 'transparent'; }}
            onMouseDown={e => { if (d) (e.currentTarget as HTMLElement).style.transform = 'scale(0.94)'; }}
            onMouseUp={e => { if (d) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {d === '⌫' ? <Delete size={20} strokeWidth={1.8} style={{ color: '#5C4A1E' }} /> : d}
          </button>
        ))}
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="font-sans text-ink-lt"
          style={{ marginTop: 28, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
