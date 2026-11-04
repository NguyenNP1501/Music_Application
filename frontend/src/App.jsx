import React from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { SongList } from './components/player/SongList';
import { PlayerBar } from './components/player/PlayerBar';
import { ErrorBanner } from './components/player/ErrorBanner';

function App() {
  return (
    <PlayerProvider>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#f4f4f5',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          paddingBottom: '100px', // Khoảng trống cho PlayerBar cố định ở đáy
          boxSizing: 'border-box'
        }}
      >
        {/* Banner hiển thị lỗi mạng / lỗi stream */}
        <ErrorBanner />

        {/* Header ứng dụng */}
        <header
          style={{
            borderBottom: '1px solid #27272a',
            backgroundColor: '#18181b',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎵</span>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f4f4f5' }}>
              Music Streaming Platform
            </h1>
          </div>
          <div
            style={{
              fontSize: '12px',
              backgroundColor: '#27272a',
              color: '#10b981',
              padding: '4px 10px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                display: 'inline-block'
              }}
            />
            HTTP 206 Streaming Active
          </div>
        </header>

        {/* Nội dung danh sách bài hát */}
        <main>
          <SongList />
        </main>

        {/* Thanh phát nhạc cố định dưới đáy màn hình */}
        <PlayerBar />
      </div>
    </PlayerProvider>
  );
}

export default App;
