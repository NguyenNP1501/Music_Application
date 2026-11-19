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

export const normalizeSong = (song) => {
  if (!song) return null;
  const id = song.id || song.song_id;
  if (!id) return null;
  const title = song.title || "Không rõ tiêu đề";
  const artist = song.artist || song.singer || "Chưa rõ nghệ sĩ";
  const coverUrl =
    song.coverUrl ||
    song.cover_image_url ||
    song.album?.cover_image_url ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop";
  const durationSec = song.durationSec || 0;
  return { id, song_id: id, title, artist, singer: artist, coverUrl, durationSec };
};

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const defaultQueueRef = useRef([]);

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

  // Tự động tải trước danh sách bài hát mặc định để hàng đợi luôn có đủ bài
  useEffect(() => {
    let isMounted = true;
    async function initQueue() {
      try {
        const res = await fetch("http://localhost:3000/api/songs");
        if (res.ok) {
          const data = await res.json();
          const raw = Array.isArray(data) ? data : (data?.songs || []);
          const normalized = raw.map(normalizeSong).filter(Boolean);
          if (isMounted && normalized.length > 0) {
            defaultQueueRef.current = normalized;
            if (queueRef.current.length === 0) {
              queueRef.current = normalized;
              setQueue(normalized);
            }
          }
        }
      } catch (err) {
        console.warn("Không thể tải danh sách bài hát mặc định:", err);
      }
    }
    initQueue();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playSong = useCallback(async (song, newQueue = null) => {
    const normalizedSong = normalizeSong(song);
    if (!normalizedSong?.id) return;

    let items = queueRef.current;

    if (Array.isArray(newQueue) && newQueue.length > 0) {
      items = newQueue.map(normalizeSong).filter(Boolean);
    } else if (items.length <= 1 && defaultQueueRef.current.length > 0) {
      items = [...defaultQueueRef.current];
    }

    let index = items.findIndex((item) => item.id === normalizedSong.id);
    if (index < 0) {
      items = [...items, normalizedSong];
      index = items.length - 1;
    }

    updateQueue(items, index);

    setCurrentSong(normalizedSong);
    setCurrentTime(0);
    setDuration(0);
    setBufferedEnd(0);
    setError(null);
    setIsBuffering(true);

    const audio = audioRef.current;
    if (!audio) return;
    audio.src = getStreamUrl(normalizedSong.id);
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
      const first = queueRef.current[0] || defaultQueueRef.current[0];
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

  const next = useCallback(async () => {
    let items = queueRef.current;
    if (items.length <= 1 && defaultQueueRef.current.length > 1) {
      items = defaultQueueRef.current;
      queueRef.current = items;
      setQueue(items);
    }
    if (!items || items.length === 0) return;

    let curIdx = indexRef.current;
    if (curIdx < 0 || !items[curIdx] || items[curIdx].id !== currentSong?.id) {
      curIdx = items.findIndex((s) => s.id === currentSong?.id);
    }
    if (curIdx < 0) curIdx = 0;

    const nextIndex = (curIdx + 1) % items.length;
    await playSong(items[nextIndex], items);
  }, [currentSong, playSong]);

  const prev = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    let items = queueRef.current;
    if (items.length <= 1 && defaultQueueRef.current.length > 1) {
      items = defaultQueueRef.current;
      queueRef.current = items;
      setQueue(items);
    }
    if (!items || items.length === 0) return;

    let curIdx = indexRef.current;
    if (curIdx < 0 || !items[curIdx] || items[curIdx].id !== currentSong?.id) {
      curIdx = items.findIndex((s) => s.id === currentSong?.id);
    }
    if (curIdx < 0) curIdx = 0;

    const prevIndex = (curIdx - 1 + items.length) % items.length;
    await playSong(items[prevIndex], items);
  }, [currentSong, playSong]);

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
    next();
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
