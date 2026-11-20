import React from 'react';
import { usePlayer } from '../../context/PlayerContext';

export const VolumeControl = () => {
  const { volume, isMuted, setVolume, toggleMute } = usePlayer();

  const currentVolume = isMuted ? 0 : volume;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
      <button
        onClick={toggleMute}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--music-muted, #a4a6b7)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s ease',
        }}
        title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
      >
        {isMuted || currentVolume === 0 ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={currentVolume}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{
          width: '80px',
          height: '4px',
          accentColor: 'var(--music-primary, #ac91ff)',
          cursor: 'pointer',
        }}
      />
    </div>
  );
};
