import React from 'react';
import { usePlayer } from '../../context/PlayerContext';

export const ErrorBanner = () => {
  const { error, clearError, currentSong, playSong } = usePlayer();

  if (!error) return null;

  const handleRetry = () => {
    if (currentSong) {
      clearError();
      playSong(currentSong);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#7f1d1d',
        border: '1px solid #ef4444',
        color: '#fef2f2',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        maxWidth: '90%',
        width: '520px'
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <div style={{ flex: 1, fontSize: '14px' }}>
        <div style={{ fontWeight: 600 }}>Lỗi mạng âm thanh</div>
        <div style={{ fontSize: '13px', color: '#fecaca', marginTop: '2px' }}>{error}</div>
      </div>

      {currentSong && (
        <button
          onClick={handleRetry}
          style={{
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Thử lại
        </button>
      )}

      <button
        onClick={clearError}
        style={{
          background: 'none',
          border: 'none',
          color: '#fca5a5',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1
        }}
        title="Đóng"
      >
        ×
      </button>
    </div>
  );
};
