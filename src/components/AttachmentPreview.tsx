import { useState, useRef } from 'react';
import { X, FileText, Play, Pause } from 'lucide-react';
import { Attachment } from '../types';

interface Props {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
}

function AudioCard({ att, onRemove }: { att: Attachment; onRemove?: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(att.file_url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(att.id); }}
          style={{
            position: 'absolute', top: -6, right: -6,
            width: 18, height: 18, borderRadius: '50%',
            background: '#5C4A1E', color: '#FBF3A2',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
            zIndex: 10,
          }}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
      <button
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(92,74,30,0.10)',
          borderRadius: 10, padding: '8px 12px',
          minWidth: 130, border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: '#5C4A1E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {playing
            ? <Pause size={11} fill="#FBF3A2" color="#FBF3A2" />
            : <Play  size={11} fill="#FBF3A2" color="#FBF3A2" style={{ marginLeft: 1 }} />
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
          {[5, 10, 14, 9, 16, 12, 8, 15, 10, 7, 13].map((h, i) => (
            <div key={i} style={{
              width: 2.5, height: h,
              background: playing ? '#5C4A1E' : '#7A6B30', borderRadius: 2,
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
      </button>
    </div>
  );
}

function VideoCard({ att, onRemove }: { att: Attachment; onRemove?: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleClick = () => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else         { el.play();  setPlaying(true);  }
  };

  return (
    <div style={{ position: 'relative', width: 110, height: 76, flexShrink: 0 }}>
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(att.id); }}
          style={{
            position: 'absolute', top: -6, right: -6,
            width: 18, height: 18, borderRadius: '50%',
            background: '#5C4A1E', color: '#FBF3A2',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
            zIndex: 10,
          }}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
      <div
        onClick={handleClick}
        style={{
          position: 'relative', width: '100%', height: '100%',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(92,74,30,0.14)',
          cursor: 'pointer',
        }}
      >
        <video
          ref={videoRef}
          src={att.file_url}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onEnded={() => setPlaying(false)}
          playsInline
        />
        {!playing && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,0.88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="#5C4A1E" width={12} height={12} style={{ marginLeft: 2 }}>
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttachmentPreview({ attachments, onRemove }: Props) {
  if (!attachments.length) return null;

  return (
    <div
      className="flex flex-wrap gap-2.5"
      style={{ padding: '10px 20px 6px' }}
    >
      {attachments.map(att => {
        const removeBtn = onRemove ? (
          <button
            onClick={e => { e.stopPropagation(); onRemove(att.id); }}
            style={{
              position: 'absolute', top: -6, right: -6,
              width: 18, height: 18, borderRadius: '50%',
              background: '#5C4A1E', color: '#FBF3A2',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
              zIndex: 10,
            }}
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        ) : null;

        if (att.file_type === 'audio') return <AudioCard key={att.id} att={att} onRemove={onRemove} />;
        if (att.file_type === 'video') return <VideoCard key={att.id} att={att} onRemove={onRemove} />;

        if (att.file_type === 'image') {
          return (
            <div key={att.id} style={{ position: 'relative', display: 'inline-block' }}>
              {removeBtn}
              <img
                src={att.file_url}
                alt={att.file_name}
                style={{
                  width: 90, height: 76, objectFit: 'cover',
                  borderRadius: 10,
                  boxShadow: '0 1px 6px rgba(92,74,30,0.14)',
                  display: 'block',
                }}
              />
            </div>
          );
        }

        return (
          <div key={att.id} style={{ position: 'relative', display: 'inline-flex' }}>
            {removeBtn}
            <a
              href={att.file_url}
              download={att.file_name}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(92,74,30,0.09)',
                borderRadius: 10, padding: '8px 12px',
                textDecoration: 'none',
              }}
            >
              <FileText size={14} style={{ color: '#7A6B30' }} />
              <span
                className="font-sans"
                style={{
                  fontSize: 12, color: '#5C4A1E',
                  maxWidth: 100, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {att.file_name}
              </span>
            </a>
          </div>
        );
      })}
    </div>
  );
}
