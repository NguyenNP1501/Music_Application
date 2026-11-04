import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getStreamUrl } from '../api/songApi';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Khởi tạo thẻ audio và đồng bộ volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Phát bài hát
  const playSong = async (song, newQueue = null) => {
    if (!song) return;

    if (newQueue && Array.isArray(newQueue)) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((s) => s.id === song.id);
      setCurrentIndex(idx !== -1 ? idx : 0);
    } else if (queue.length === 0) {
      setQueue([song]);
      setCurrentIndex(0);
    } else {
      const idx = queue.findIndex((s) => s.id === song.id);
      if (idx !== -1) {
        setCurrentIndex(idx);
      } else {
        setQueue((prev) => [...prev, song]);
        setCurrentIndex(queue.length);
      }
    }

    setCurrentSong(song);
    setError(null);
    setCurrentTime(0);
    setBufferedEnd(0);

    const streamUrl = getStreamUrl(song.id);

    if (audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Lỗi autoplay / play():', err);
        setIsPlaying(false);
        if (err.name === 'NotAllowedError') {
          setError('Trình duyệt chặn tự động phát. Hãy bấm nút Play để nghe nhạc.');
        } else {
          setError(`Lỗi phát nhạc: ${err.message}`);
        }
      }
    }
  };

  // Bật/tắt phát nhạc
  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (!currentSong) {
      if (queue.length > 0) {
        playSong(queue[0]);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tiếp tục phát:', err);
        if (err.name === 'NotAllowedError') {
          setError('Cần tương tác để phát nhạc.');
        } else {
          setError(`Không thể phát nhạc: ${err.message}`);
        }
      }
    }
  };

  // Chuyển bài kế tiếp
  const next = () => {
    if (queue.length === 0) return;
    const nextIdx = (currentIndex + 1) % queue.length;
    playSong(queue[nextIdx]);
  };

  // Quay lại bài trước
  const prev = () => {
    if (queue.length === 0) return;
    // Nếu đã nghe quá 3 giây, bấm prev sẽ tua về đầu bài
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    playSong(queue[prevIdx]);
  };

  // Tua nhạc đến số giây chỉ định (kích hoạt HTTP Range Request)
  const seek = (seconds) => {
    if (audioRef.current && Number.isFinite(seconds)) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  // Điều chỉnh âm lượng (0 - 1)
  const setVolume = (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Bật/tắt câm tiếng
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const clearError = () => {
    setError(null);
  };

  // --- Các bộ lắng nghe sự kiện mạng từ HTML5 Audio ---
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || currentSong?.durationSec || 0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleProgress = () => {
    if (audioRef.current && audioRef.current.buffered.length > 0) {
      const buffered = audioRef.current.buffered;
      const end = buffered.end(buffered.length - 1);
      setBufferedEnd(end);
    }
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
  };

  const handlePlaying = () => {
    setIsBuffering(false);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    // Nếu còn bài trong queue, tự động chuyển bài tiếp theo
    if (queue.length > 1) {
      next();
    }
  };

  const handleError = () => {
    setIsBuffering(false);
    setIsPlaying(false);
    const audioErr = audioRef.current?.error;
    let msg = 'Đã xảy ra lỗi khi tải luồng âm thanh.';

    if (audioErr) {
      switch (audioErr.code) {
        case 1: // MEDIA_ERR_ABORTED
          msg = 'Quá trình truyền luồng bị hủy.';
          break;
        case 2: // MEDIA_ERR_NETWORK
          msg = 'Mất kết nối mạng khi đang stream nhạc từ server.';
          break;
        case 3: // MEDIA_ERR_DECODE
          msg = 'Lỗi giải mã file âm thanh.';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          msg = 'Không tìm thấy file nhạc trên server hoặc định dạng không hỗ trợ (404/416).';
          break;
        default:
          msg = `Lỗi mạng âm thanh mã ${audioErr.code}`;
      }
    }
    setError(msg);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isBuffering,
        bufferedEnd,
        error,
        queue,
        currentIndex,
        playSong,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        clearError
      }}
    >
      {children}
      {/* Thẻ audio duy nhất toàn ứng dụng để nhạc không bị ngắt quãng */}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onPlaying={handlePlaying}
        onEnded={handleEnded}
        onError={handleError}
      />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer phải được sử dụng bên trong PlayerProvider');
  }
  return context;
};
