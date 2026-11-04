import React, { useState, useEffect } from 'react';
import { getSongs } from '../../api/songApi';
import { usePlayer } from '../../context/PlayerContext';

const formatDuration = (sec) => {
  if (!sec) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const SongList = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const fetchSongs = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSongs();
      setSongs(data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const fallbackCover =
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#f4f4f5' }}>
            Thư viện âm nhạc trực tuyến
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#a1a1aa' }}>
            Module 2: HTTP Audio Streaming (Mã phản hồi HTTP 206 Partial Content)
          </p>
        </div>
        <button
          onClick={fetchSongs}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: '#27272a',
            color: '#e4e4e7',
            border: '1px solid #3f3f46',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Làm mới
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
          Đang tải danh sách bài hát từ server...
        </div>
      )}

      {loadError && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#f87171',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{loadError}</span>
          <button
            onClick={fetchSongs}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !loadError && songs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
          Chưa có bài hát nào trong CSDL.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {songs.map((song, index) => {
          const isCurrent = currentSong?.id === song.id;

          return (
            <div
              key={song.id}
              onClick={() => {
                if (isCurrent) {
                  togglePlay();
                } else {
                  playSong(song, songs);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.15)' : '#18181b',
                border: isCurrent ? '1px solid #3b82f6' : '1px solid #27272a',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                color: '#f4f4f5'
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) e.currentTarget.style.backgroundColor = '#27272a';
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) e.currentTarget.style.backgroundColor = '#18181b';
              }}
            >
              {/* Số thứ tự hoặc Icon đang phát */}
              <div style={{ width: '32px', textAlign: 'center', fontSize: '14px', color: isCurrent ? '#3b82f6' : '#71717a' }}>
                {isCurrent && isPlaying ? (
                  <span>▶</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Ảnh bìa */}
              <img
                src={song.coverUrl || fallbackCover}
                alt={song.title}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  marginRight: '16px',
                  backgroundColor: '#27272a'
                }}
                onError={(e) => {
                  e.target.src = fallbackCover;
                }}
              />

              {/* Tiêu đề & Ca sĩ */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: isCurrent ? '#60a5fa' : '#f4f4f5',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {song.title}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#a1a1aa',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {song.artist}
                </div>
              </div>

              {/* Thể loại */}
              <div style={{ width: '130px', fontSize: '13px', color: '#71717a' }}>
                {song.genre || 'Chưa phân loại'}
              </div>

              {/* Thời lượng */}
              <div style={{ width: '60px', textAlign: 'right', fontSize: '13px', color: '#a1a1aa' }}>
                {formatDuration(song.durationSec)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
