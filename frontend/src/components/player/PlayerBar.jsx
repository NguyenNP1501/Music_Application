import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SeekBar } from './SeekBar';
import { VolumeControl } from './VolumeControl';
import { BufferingSpinner } from './BufferingSpinner';
import { getCoverUrl } from '../../utils/assets';

export const PlayerBar = () => {
  const { currentSong, isPlaying, isBuffering, togglePlay, next, prev } = usePlayer();
  const [liked, setLiked] = useState(false);

  if (!currentSong) {
    return null;
  }

  const coverSrc = getCoverUrl(currentSong.coverUrl || currentSong.cover_url);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90px',
        backgroundColor: 'var(--music-panel, #181a23)',
        borderTop: '1px solid var(--music-line, #30323f)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'var(--music-text, #f6f5fb)',
        zIndex: 1000,
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.45)',
        gap: '20px'
      }}
    >
      {/* 1. Thông tin bài hát (Bên trái - Figma Frame 6:85) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', maxWidth: '320px' }}>
        <img
          src={coverSrc}
          alt={currentSong.title}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '10px',
            objectFit: 'cover',
            backgroundColor: 'var(--music-card, #191b23)',
            flexShrink: 0
          }}
          onError={(e) => {
            e.target.src = getCoverUrl(null);
          }}
        />
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--music-text, #f6f5fb)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.4
            }}
          >
            {currentSong.title}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--music-muted, #a4a6b7)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.4
            }}
          >
            {currentSong.artist}
          </div>
        </div>

        {/* Nút yêu thích */}
        <button
          type="button"
          onClick={() => setLiked(!liked)}
          style={{
            background: 'none',
            border: 'none',
            color: liked ? 'var(--music-red, #ff9daa)' : 'var(--music-muted, #a4a6b7)',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.15s ease',
          }}
          title={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          {liked ? '♥' : '♡'}
        </button>
      </div>

      {/* 2. Cụm điều khiển trung tâm & Thanh tua SeekBar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          flex: 1,
          maxWidth: '560px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Nút Prev */}
          <button
            onClick={prev}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--music-text, #f6f5fb)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '16px'
            }}
            title="Bài trước đó"
          >
            ◀
          </button>

          {/* Nút Play / Pause (Figma pill #ac91ff with #171222 text) */}
          <button
            onClick={togglePlay}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--music-primary, #ac91ff)',
              border: 'none',
              color: 'var(--music-primary-text, #171222)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              boxShadow: '0 2px 10px rgba(172, 145, 255, 0.35)',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? 'II' : '▶'}
          </button>

          {/* Nút Next */}
          <button
            onClick={next}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--music-text, #f6f5fb)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '16px'
            }}
            title="Bài kế tiếp"
          >
            ▶
          </button>

          {/* Spinner loading khi đang buffer qua mạng */}
          {isBuffering && <BufferingSpinner size={16} />}
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
