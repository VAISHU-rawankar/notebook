import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bell, Smile, Lock, Download, Info, ChevronRight, X, Check, Clock } from 'lucide-react';
import PasscodeLock, { getStoredPasscode, clearStoredPasscode } from '../components/PasscodeLock';

interface Props {
  onBack: () => void;
  onExport: () => void;
}

const STORAGE_KEY = 'journal_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { reminder: false, reminderTime: '21:00', mood: true, passcode: false };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: on ? '#5C4A1E' : 'rgba(92,74,30,0.22)',
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'transform 0.18s',
        transform: on ? 'translateX(18px)' : 'none',
        display: 'block',
      }} />
    </button>
  );
}

// ── Time picker modal ─────────────────────────────────
function TimePickerModal({ value, onSave, onClose }: {
  value: string;
  onSave: (t: string) => void;
  onClose: () => void;
}) {
  const [hour, setHour]     = useState(() => parseInt(value.split(':')[0]));
  const [minute, setMinute] = useState(() => parseInt(value.split(':')[1]));
  const [ampm, setAmpm]     = useState<'AM' | 'PM'>(() => parseInt(value.split(':')[0]) >= 12 ? 'PM' : 'AM');

  const display12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  const handleSave = () => {
    let h = display12;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    onSave(`${String(h).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.2)' }} onClick={onClose} />
      <div
        className="fixed z-50 fade-up"
        style={{
          bottom: 0, left: 0, right: 0,
          background: '#FBF3A2',
          borderRadius: '20px 20px 0 0',
          padding: '20px 24px 36px',
          boxShadow: '0 -4px 32px rgba(92,74,30,0.18)',
          maxWidth: 480, margin: '0 auto',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span className="font-sans font-semibold text-ink" style={{ fontSize: 16 }}>Set Reminder Time</span>
          <button onClick={onClose} className="text-ink-lt hover:text-ink"><X size={18} strokeWidth={2} /></button>
        </div>

        {/* Time display */}
        <div className="flex items-center justify-center gap-4" style={{ marginBottom: 24 }}>
          {/* Hour */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setHour(h => { const v = (h === 0 ? 11 : h > 12 ? h - 13 : h - 1); return v < 0 ? 11 : v; })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C4A1E', fontSize: 18 }}
            >▲</button>
            <div style={{
              width: 64, height: 64, borderRadius: 14,
              background: 'rgba(92,74,30,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 600, color: '#5C4A1E',
            }}>
              {String(display12).padStart(2,'0')}
            </div>
            <button
              onClick={() => setHour(h => { const v12 = h === 0 ? 12 : h > 12 ? h - 12 : h; return v12 === 12 ? (ampm === 'PM' ? 12 : 0) : (ampm === 'PM' ? v12 + 1 + 12 : v12 + 1); })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C4A1E', fontSize: 18 }}
            >▼</button>
          </div>

          <span className="font-sans font-bold text-ink" style={{ fontSize: 28 }}>:</span>

          {/* Minute */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setMinute(m => m === 0 ? 55 : m - 5)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C4A1E', fontSize: 18 }}
            >▲</button>
            <div style={{
              width: 64, height: 64, borderRadius: 14,
              background: 'rgba(92,74,30,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 600, color: '#5C4A1E',
            }}>
              {String(minute).padStart(2,'0')}
            </div>
            <button
              onClick={() => setMinute(m => m === 55 ? 0 : m + 5)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C4A1E', fontSize: 18 }}
            >▼</button>
          </div>

          {/* AM/PM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 4 }}>
            {(['AM','PM'] as const).map(p => (
              <button
                key={p}
                onClick={() => {
                  setAmpm(p);
                  if (p === 'PM' && hour < 12) setHour(h => h + 12);
                  if (p === 'AM' && hour >= 12) setHour(h => h - 12);
                }}
                className="font-sans font-semibold"
                style={{
                  width: 46, height: 30, borderRadius: 8, border: 'none',
                  background: ampm === p ? '#5C4A1E' : 'rgba(92,74,30,0.10)',
                  color: ampm === p ? '#FBF3A2' : '#5C4A1E',
                  cursor: 'pointer', fontSize: 13,
                  transition: 'all 0.15s',
                }}
              >{p}</button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full font-sans font-semibold"
          style={{
            background: '#5C4A1E', color: '#FBF3A2',
            borderRadius: 14, padding: '14px 0',
            border: 'none', cursor: 'pointer', fontSize: 15,
          }}
        >
          Save
        </button>
      </div>
    </>
  );
}

// ── Mood History view ─────────────────────────────────
function MoodHistoryModal({ onClose, entries }: { onClose: () => void; entries: Array<{ date: string; mood: string }> }) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.2)' }} onClick={onClose} />
      <div
        className="fixed z-50 fade-up"
        style={{
          bottom: 0, left: 0, right: 0,
          background: '#FBF3A2',
          borderRadius: '20px 20px 0 0',
          padding: '20px 24px 36px',
          boxShadow: '0 -4px 32px rgba(92,74,30,0.18)',
          maxWidth: 480, margin: '0 auto',
          maxHeight: '70vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div className="flex items-center justify-between shrink-0" style={{ marginBottom: 16 }}>
          <span className="font-sans font-semibold text-ink" style={{ fontSize: 16 }}>Mood History</span>
          <button onClick={onClose} className="text-ink-lt hover:text-ink"><X size={18} strokeWidth={2} /></button>
        </div>

        {entries.length === 0 ? (
          <p className="font-sans text-ink-ghost text-center" style={{ paddingTop: 32, fontSize: 14 }}>
            No moods logged yet. Set a mood on any journal entry.
          </p>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {entries.map((e, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < entries.length - 1 ? '1px solid rgba(180,155,50,0.18)' : 'none',
                }}
              >
                <span className="font-sans text-sm text-ink">{e.date}</span>
                <span style={{ fontSize: 24 }}>{e.mood}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── About modal ───────────────────────────────────────
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.2)' }} onClick={onClose} />
      <div
        className="fixed z-50 fade-up"
        style={{
          bottom: 0, left: 0, right: 0,
          background: '#FBF3A2',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 40px',
          boxShadow: '0 -4px 32px rgba(92,74,30,0.18)',
          maxWidth: 480, margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(92,74,30,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', fontSize: 28,
        }}>📔</div>
        <p className="font-sans font-bold text-ink" style={{ fontSize: 18 }}>My Journal</p>
        <p className="font-sans text-ink-lt" style={{ fontSize: 13, marginTop: 4 }}>Version 1.0</p>
        <p className="font-sans text-ink-lt" style={{ fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>
          A private, beautiful space for your thoughts, feelings, and memories. Write freely.
        </p>
        <button
          onClick={onClose}
          className="font-sans font-semibold"
          style={{
            marginTop: 24, background: '#5C4A1E', color: '#FBF3A2',
            border: 'none', borderRadius: 12, padding: '12px 32px',
            cursor: 'pointer', fontSize: 14,
          }}
        >Close</button>
      </div>
    </>
  );
}

// ── Main Settings component ───────────────────────────
interface SettingsProps extends Props {
  moodEntries?: Array<{ date: string; mood: string }>;
}

export default function Settings({ onBack, onExport, moodEntries = [] }: SettingsProps) {
  const saved = loadSettings();
  const [reminder, setReminder]       = useState<boolean>(saved.reminder);
  const [reminderTime, setReminderTime] = useState<string>(saved.reminderTime ?? '21:00');
  const [mood, setMood]               = useState<boolean>(saved.mood);
  const [passcode, setPasscode]       = useState<boolean>(saved.passcode && !!getStoredPasscode());

  const [showTimePicker, setShowTimePicker]   = useState(false);
  const [showMoodHistory, setShowMoodHistory] = useState(false);
  const [showAbout, setShowAbout]             = useState(false);
  const [passcodeMode, setPasscodeMode]       = useState<'setup' | 'verify' | null>(null);

  const notifScheduledRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist settings on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reminder, reminderTime, mood, passcode }));
  }, [reminder, reminderTime, mood, passcode]);

  // Schedule browser notification when reminder is on
  useEffect(() => {
    if (notifScheduledRef.current) clearTimeout(notifScheduledRef.current);
    if (!reminder) return;

    const scheduleNext = () => {
      const now = new Date();
      const [h, m] = reminderTime.split(':').map(Number);
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target.getTime() - now.getTime();

      notifScheduledRef.current = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('My Journal', {
            body: "Time to write in your journal today!",
            icon: '/image.png',
          });
        }
        scheduleNext();
      }, delay);
    };

    if (Notification.permission === 'granted') {
      scheduleNext();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { if (p === 'granted') scheduleNext(); });
    }

    return () => { if (notifScheduledRef.current) clearTimeout(notifScheduledRef.current); };
  }, [reminder, reminderTime]);

  const fmt12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
  };

  const handleToggleReminder = () => {
    if (!reminder) {
      setReminder(true);
      setShowTimePicker(true);
    } else {
      setReminder(false);
    }
  };

  const handleTogglePasscode = () => {
    if (!passcode) {
      setPasscodeMode('setup');
    } else {
      setPasscodeMode('verify');
    }
  };

  const ROW: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid rgba(180,155,50,0.18)',
    cursor: 'pointer',
  };
  const ICON_LABEL: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14,
  };

  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ background: '#F2EDD8' }}>
        <div
          className="paper-curl flex flex-col"
          style={{
            background: '#FBF3A2',
            margin: '16px 14px',
            borderRadius: 18,
            boxShadow: '0 6px 40px rgba(92,74,30,0.14)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 shrink-0"
            style={{ padding: '14px 18px', borderBottom: '1px solid rgba(180,155,50,0.18)' }}
          >
            <button onClick={onBack} className="text-ink-mid hover:text-ink transition-colors">
              <ArrowLeft size={20} strokeWidth={1.9} />
            </button>
            <span className="font-sans font-semibold text-ink" style={{ fontSize: 16 }}>Settings</span>
          </div>

          {/* Daily Reminder */}
          <div style={ROW} onClick={reminder ? () => setShowTimePicker(true) : undefined}>
            <div style={ICON_LABEL}>
              <Bell size={18} strokeWidth={1.7} className="text-ink-mid" />
              <div>
                <span className="font-sans text-sm text-ink">Daily Reminder</span>
                {reminder && (
                  <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
                    <Clock size={10} strokeWidth={1.8} style={{ color: 'rgba(92,74,30,0.45)' }} />
                    <span className="font-sans text-ink-lt" style={{ fontSize: 11 }}>{fmt12(reminderTime)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {reminder && (
                <button
                  onClick={() => setShowTimePicker(true)}
                  className="font-sans text-ink-lt hover:text-ink transition-colors"
                  style={{ fontSize: 11, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Edit
                </button>
              )}
              <Toggle on={reminder} onToggle={handleToggleReminder} />
            </div>
          </div>

          {/* Mood Tracker */}
          <div style={ROW} onClick={() => mood && setShowMoodHistory(true)}>
            <div style={ICON_LABEL}>
              <Smile size={18} strokeWidth={1.7} className="text-ink-mid" />
              <div>
                <span className="font-sans text-sm text-ink">Mood Tracker</span>
                {mood && moodEntries.length > 0 && (
                  <div className="font-sans text-ink-lt" style={{ fontSize: 11, marginTop: 2 }}>
                    {moodEntries.length} mood{moodEntries.length !== 1 ? 's' : ''} logged · tap to view
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {mood && moodEntries.length > 0 && (
                <ChevronRight size={14} strokeWidth={1.8} className="text-ink-ghost" />
              )}
              <Toggle on={mood} onToggle={() => setMood(v => !v)} />
            </div>
          </div>

          {/* Passcode Lock */}
          <div style={ROW} onClick={e => e.stopPropagation()}>
            <div style={ICON_LABEL}>
              <Lock size={18} strokeWidth={1.7} className="text-ink-mid" />
              <div>
                <span className="font-sans text-sm text-ink">Passcode Lock</span>
                {passcode && (
                  <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
                    <Check size={10} strokeWidth={2.5} style={{ color: '#5C4A1E' }} />
                    <span className="font-sans text-ink-lt" style={{ fontSize: 11 }}>Protected</span>
                  </div>
                )}
              </div>
            </div>
            <Toggle on={passcode} onToggle={handleTogglePasscode} />
          </div>

          {/* Backup & Export */}
          <button
            onClick={onExport}
            className="w-full text-left transition-colors"
            style={{
              ...ROW,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(180,155,50,0.18)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(92,74,30,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={ICON_LABEL}>
              <Download size={18} strokeWidth={1.7} className="text-ink-mid" />
              <span className="font-sans text-sm text-ink">Backup &amp; Export</span>
            </div>
            <ChevronRight size={16} strokeWidth={1.8} className="text-ink-ghost" />
          </button>

          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="w-full text-left transition-colors"
            style={{ ...ROW, background: 'transparent', border: 'none', borderBottom: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(92,74,30,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={ICON_LABEL}>
              <Info size={18} strokeWidth={1.7} className="text-ink-mid" />
              <div>
                <span className="font-sans text-sm text-ink">About</span>
                <div className="font-sans text-ink-lt" style={{ fontSize: 11, marginTop: 1 }}>My Journal v1.0</div>
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={1.8} className="text-ink-ghost" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showTimePicker && (
        <TimePickerModal
          value={reminderTime}
          onSave={t => { setReminderTime(t); setReminder(true); }}
          onClose={() => setShowTimePicker(false)}
        />
      )}

      {showMoodHistory && (
        <MoodHistoryModal
          entries={moodEntries}
          onClose={() => setShowMoodHistory(false)}
        />
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* Passcode setup flow */}
      {passcodeMode === 'setup' && (
        <PasscodeLock
          mode="setup"
          onSuccess={() => { setPasscode(true); setPasscodeMode(null); }}
          onCancel={() => { setPasscode(false); setPasscodeMode(null); }}
        />
      )}

      {/* Passcode verify to disable */}
      {passcodeMode === 'verify' && (
        <PasscodeLock
          mode="verify"
          onSuccess={() => { clearStoredPasscode(); setPasscode(false); setPasscodeMode(null); }}
          onCancel={() => setPasscodeMode(null)}
        />
      )}
    </>
  );
}
