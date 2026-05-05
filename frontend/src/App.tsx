import { useState, useEffect, useRef } from 'react';
import { useJournal } from './hooks/useJournal';
import HomeEditor from './pages/HomeEditor';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import PasscodeLock, { getStoredPasscode } from './components/PasscodeLock';

type View = 'home' | 'dashboard' | 'settings';

export default function App() {
  const {
    entries, loading, createEntry, updateEntry, updateMood, deleteEntry,
    addAttachment, removeAttachment, exportJSON,
  } = useJournal();

  const [view, setView]         = useState<View>('home');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [locked, setLocked]     = useState(() => !!getStoredPasscode());
  const initialized             = useRef(false);

  // Once entries load, find or create today's entry
  useEffect(() => {
    if (loading || initialized.current) return;
    initialized.current = true;

    const todayStr = new Date().toDateString();
    const existing = entries.find(e => new Date(e.created_at).toDateString() === todayStr);
    if (existing) {
      setActiveId(existing.id);
    } else {
      createEntry().then(e => setActiveId(e.id));
    }
  }, [loading, entries, createEntry]);

  const openEntry = (id: string) => { setActiveId(id); setView('home'); };

  const newEntry = () => {
    createEntry().then(e => { setActiveId(e.id); setView('home'); });
  };

  const activeEntry = entries.find(e => e.id === activeId);

  const moodEntries = entries
    .filter(e => e.mood)
    .map(e => ({
      date: new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      mood: e.mood!,
    }));

  if (locked) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
        <PasscodeLock mode="verify" onSuccess={() => setLocked(false)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 480, margin: '0 auto', minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F2EDD8',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(92,74,30,0.15)',
            borderTopColor: '#7A6B30',
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 12px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span className="font-sans" style={{ fontSize: 13, color: '#9A8A50' }}>Loading journal…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      {view === 'home' && activeEntry && (
        <HomeEditor
          entry={activeEntry}
          onUpdate={updateEntry}
          onUpdateMood={updateMood}
          onAddAttachment={addAttachment}
          onRemoveAttachment={(attId) => removeAttachment(activeEntry.id, attId)}
          onOpenMenu={() => setView('dashboard')}
          onOpenSettings={() => setView('settings')}
        />
      )}

      {view === 'dashboard' && (
        <Dashboard
          entries={entries}
          onNewEntry={newEntry}
          onOpenEntry={openEntry}
          onDeleteEntry={id => { deleteEntry(id); if (id === activeId) newEntry(); }}
          onOpenSettings={() => setView('settings')}
          onBack={() => setView('home')}
        />
      )}

      {view === 'settings' && (
        <Settings
          onBack={() => setView('home')}
          onExport={exportJSON}
          moodEntries={moodEntries}
        />
      )}

    </div>
  );
}
