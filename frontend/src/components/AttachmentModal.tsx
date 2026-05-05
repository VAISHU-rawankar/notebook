import { useRef, useEffect } from 'react';
import { X, Image, Video, Mic, FileText } from 'lucide-react';

interface Props {
  onClose: () => void;
  onAttach: (url: string, type: 'image' | 'video' | 'audio' | 'file', name: string) => void;
}

const OPTIONS = [
  { label: 'Photo', Icon: Image,    accept: 'image/*', type: 'image'  as const },
  { label: 'Video', Icon: Video,    accept: 'video/*', type: 'video'  as const },
  { label: 'Audio', Icon: Mic,      accept: 'audio/*', type: 'audio'  as const },
  { label: 'File',  Icon: FileText, accept: '*/*',     type: 'file'   as const },
];

export default function AttachmentModal({ onClose, onAttach }: Props) {
  const inputRef      = useRef<HTMLInputElement>(null);
  const pendingType   = useRef<typeof OPTIONS[number]['type'] | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const pick = (opt: typeof OPTIONS[number]) => {
    pendingType.current = opt.type;
    setTimeout(() => {
      if (!inputRef.current) return;
      inputRef.current.accept = opt.accept;
      inputRef.current.value  = '';
      inputRef.current.click();
    }, 10);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingType.current) return;
    onAttach(URL.createObjectURL(file), pendingType.current, file.name);
    onClose();
    e.target.value = '';
  };

  return (
    <>
      {/* Dim backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.20)',
        }}
      />

      {/* Centered full-screen flex layer — same pattern as VoiceOverlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9995,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="voice-card paper-curl"
          style={{
            pointerEvents: 'auto',
            width: 240,
            background: '#FBF3A2',
            borderRadius: 22,
            boxShadow: '0 16px 56px rgba(92,74,30,0.22)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px 12px',
            borderBottom: '1px solid rgba(180,155,50,0.18)',
          }}>
            <span
              className="font-sans font-semibold"
              style={{ fontSize: 14, color: '#5C4A1E' }}
            >
              Add Attachment
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9A8A50', padding: 2,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Options */}
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.type}
              onClick={() => pick(opt)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '15px 20px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left',
                borderBottom: i < OPTIONS.length - 1 ? '1px solid rgba(180,155,50,0.14)' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(92,74,30,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <opt.Icon size={20} strokeWidth={1.6} style={{ color: '#7A6B30', flexShrink: 0 }} />
              <span className="font-sans" style={{ fontSize: 14.5, color: '#5C4A1E' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hidden file input — outside all z-index stacking */}
      <input
        ref={inputRef}
        type="file"
        style={{ position: 'fixed', top: -999, left: -999, opacity: 0, pointerEvents: 'none' }}
        onChange={handleFile}
      />
    </>
  );
}
