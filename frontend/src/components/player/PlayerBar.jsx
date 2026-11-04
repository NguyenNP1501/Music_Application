import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SeekBar } from './SeekBar';
import { VolumeControl } from './VolumeControl';
import { BufferingSpinner } from './BufferingSpinner';

export const PlayerBar = () => {
  const { currentSong, isPlaying, isBuffering, togglePlay, next, prev } = usePlayer();

  if (!currentSong) {
    return null;
  }

  const fallbackCover =
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#18181b',
        borderTop: '1px solid #27272a',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#f4f4f5',
        zIndex: 1000,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
        gap: '20px'
      }}
    >
      {/* 1. Thông tin bài hát (Bên trái) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', maxWidth: '300px' }}>
        <img
          src={currentSong.coverUrl || fallbackCover}
          alt={currentSong.title}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '6px',
            objectFit: 'cover',
            backgroundColor: '#27272a'
          }}
          onError={(e) => {
            e.target.src = fallbackCover;
          }}
        />
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {currentSong.title}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#a1a1aa',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {currentSong.artist}
          </div>
        </div>
      </div>

      {/* 2. Cụm điều khiển trung tâm & Thanh tua SeekBar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
          maxWidth: '650px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Nút Prev */}
          <button
            onClick={prev}
            style={{
              background: 'none',
              border: 'none',
              color: '#d4d4d8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex'
            }}
            title="Bài trước đó"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/* Nút Play / Pause */}
          <button
            onClick={togglePlay}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.1s ease',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
            }}
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              // Icon Pause
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              // Icon Play
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Nút Next */}
          <button
            onClick={next}
            style={{
              background: 'none',
              border: 'none',
              color: '#d4d4d8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex'
            }}
            title="Bài kế tiếp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/* Spinner loading khi đang buffer qua mạng */}
          {isBuffering && <BufferingSpinner size={18} />}
        </div>

        {/* Thanh tua nhạc */}
        <SeekBar />
      </div>

      {/* 3. Âm lượng (Bên phải) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '180px' }}>
        <VolumeControl />
      </div>
    </div>
  );
};
