import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { getStreamUrl } from "../api/songApi";

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
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
  const updateQueue = (items, index) => {
    queueRef.current = items;
    indexRef.current = index;
    setQueue(items);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playSong = useCallback(async (song, newQueue = null) => {
    if (!song?.id) return;
    let items = queueRef.current;
    let index = indexRef.current;

    if (Array.isArray(newQueue)) {
      items = newQueue;
      index = items.findIndex((item) => item.id === song.id);
      if (index < 0) {
        items = [...items, song];
        index = items.length - 1;
      }
    } else {
      index = items.findIndex((item) => item.id === song.id);
      if (index < 0) {
        items = [...items, song];
        index = items.length - 1;
      }
    }

    updateQueue(items, index);

    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(0);
    setBufferedEnd(0);
    setError(null);
    setIsBuffering(true);

    const audio = audioRef.current;
    if (!audio) return;
    audio.src = getStreamUrl(song.id);
    audio.load();

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      setIsPlaying(false);
      setIsBuffering(false);
      if (err.name === "NotAllowedError") {
        setError("Trình duyệt chặn tự động phát. Hãy bấm Play để nghe nhạc.");
      } else {
        setError(`Không thể phát nhạc: ${err.message}`);
      }
    }
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      const first = queueRef.current[0];
      if (first) await playSong(first);
      return;
    }

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setError(null);
      setIsPlaying(true);
    } catch (err) {
      setError(`Không thể phát nhạc: ${err.message}`);
      setIsPlaying(false);
    }
  };

  const next = async () => {
    const items = queueRef.current;
    if (items.length === 0) return;

    const nextIndex = (indexRef.current + 1) % items.length;
    await playSong(items[nextIndex]);
  };

  const prev = async () => {
    const audio = audioRef.current;
    if (!audio || queueRef.current.length === 0) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const items = queueRef.current;
    const prevIndex = (indexRef.current - 1 + items.length) % items.length;
    await playSong(items[prevIndex]);
  };

  const seek = (seconds) => {
    const audio = audioRef.current;

    if (audio && Number.isFinite(seconds) && Number.isFinite(audio.duration)) {
      const target = Math.max(0, Math.min(seconds, audio.duration));
      audio.currentTime = target;
      setCurrentTime(target);
    }
  };

  const setVolume = (value) => {
    const nextVolume = Math.max(0, Math.min(1, Number(value)));
    if (!Number.isFinite(nextVolume)) return;

    setVolumeState(nextVolume);
    if (nextVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((old) => !old);
  };
  const clearError = () => setError(null);
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) setCurrentTime(audio.currentTime);
  };

  const handleProgress = () => {
    const audio = audioRef.current;

    if (audio?.buffered.length) {
      setBufferedEnd(audio.buffered.end(audio.buffered.length - 1));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);

    if (queueRef.current.length > 1) {
      next();
    }
  };

  const handleError = () => {
    setIsPlaying(false);
    setIsBuffering(false);

    const code = audioRef.current?.error?.code;

    const messages = {
      1: "Quá trình phát nhạc đã bị hủy.",
      2: "Mất kết nối mạng khi tải nhạc.",
      3: "Không thể giải mã file âm thanh.",
      4: "Không tìm thấy file nhạc hoặc định dạng không được hỗ trợ.",
    };

    setError(messages[code] || "Đã xảy ra lỗi khi tải âm thanh.");
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
        clearError,
      }}
    >
      {children}

      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onError={handleError}
      />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer phải được sử dụng bên trong PlayerProvider");
  }

  return context;
};
