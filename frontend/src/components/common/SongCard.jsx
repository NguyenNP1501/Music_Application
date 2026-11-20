import { useEffect, useState } from "react";
import { useAuth } from "../../services/context/AuthContext";
import { usePlayer } from "../../context/PlayerContext";
import { showToast } from "../../utils/toast";
import { getCoverUrl } from "../../utils/assets";

export default function SongCard({
  song,
  onAdd,
  onRemoveSaved,
  coverUrl,
  playlist = null,
}) {
  const { playSong } = usePlayer();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.user_id) {
      setSaved(false);
      return;
    }

    try {
      const items = JSON.parse(
        localStorage.getItem(`music-space-saved-${user.user_id}`) || "[]",
      );
      setSaved(
        items.some((item) => Number(item.song_id) === Number(song.song_id)),
      );
    } catch {
      setSaved(false);
    }
  }, [user?.user_id, song.song_id]);

  useEffect(() => {
    const handleSavedChange = () => {
      if (!user?.user_id) {
        setSaved(false);
        return;
      }
      try {
        const items = JSON.parse(
          localStorage.getItem(`music-space-saved-${user.user_id}`) || "[]",
        );
        setSaved(
          items.some((item) => Number(item.song_id) === Number(song.song_id)),
        );
      } catch {
        setSaved(false);
      }
    };
    window.addEventListener("music-saved-change", handleSavedChange);
    return () => {
      window.removeEventListener("music-saved-change", handleSavedChange);
    };
  }, [user?.user_id, song.song_id]);

  const rawCover =
    coverUrl || song.album?.cover_image_url || song.cover_image_url || song.coverUrl;
  const cover = getCoverUrl(rawCover);

  const handlePlay = () => {
    if (!song) return;
    playSong(
      {
        id: song.song_id || song.id,
        title: song.title,
        artist: song.singer || song.artist || "Chưa rõ nghệ sĩ",
        coverUrl: cover,
        durationSec: song.durationSec || 0,
      },
      playlist
    );
  };

  const toggleSaved = (event) => {
    event.stopPropagation();
    const userId = JSON.parse(
      localStorage.getItem("music-current-user") || "null",
    )?.user_id;
    if (!userId) {
      showToast("Vui lòng đăng nhập để lưu bài hát.", "error");
      return;
    }

    const key = `music-space-saved-${userId}`;
    let items = [];

    try {
      items = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      items = [];
    }

    const nextSaved = !saved;
    if (saved) {
      items = items.filter((item) => item.song_id !== song.song_id);
    } else {
      items = [
        {
          song_id: song.song_id,
          title: song.title,
          singer: song.singer,
          cover_image_url: cover,
        },
        ...items,
      ];
    }

    try {
      localStorage.setItem(key, JSON.stringify(items));
      setSaved(nextSaved);
      window.dispatchEvent(new Event("music-saved-change"));
      showToast(
        nextSaved
          ? "Đã lưu bài hát vào danh sách yêu thích."
          : "Đã bỏ lưu bài hát.",
      );
    } catch {
      showToast("Không thể cập nhật danh sách bài hát đã lưu.", "error");
    }
  };

  const durationFormatted = song.durationSec
    ? `${Math.floor(song.durationSec / 60)}:${(song.durationSec % 60).toString().padStart(2, "0")}`
    : "3:42";

  return (
    <article
      className="figma-song-row"
      onClick={handlePlay}
      title="Bấm để phát bài hát"
    >
      <div className="song-row-cover">
        <img
          src={cover}
          alt={song.title || "Bìa bài hát"}
          onError={(e) => {
            e.target.src = getCoverUrl(null);
          }}
        />
        <div className="song-row-play-overlay">▶</div>
      </div>

      <div className="song-row-meta">
        <strong className="song-row-title">{song.title}</strong>
        <span className="song-row-artist">{song.singer || song.artist || "Chưa rõ nghệ sĩ"}</span>
      </div>

      <div className="song-row-extra">
        <span className="song-row-duration">{durationFormatted}</span>

        <button
          type="button"
          className={`song-row-action-btn ${saved ? "saved" : ""}`}
          onClick={toggleSaved}
          title={saved ? "Bỏ lưu bài hát" : "Lưu vào yêu thích"}
        >
          {saved ? "♥" : "♡"}
        </button>

        {onAdd && (
          <button
            type="button"
            className="song-row-action-btn"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(song);
            }}
            title="Thêm vào playlist"
          >
            ＋
          </button>
        )}

        {onRemoveSaved && (
          <button
            type="button"
            className="song-row-action-btn danger"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveSaved();
            }}
            title="Bỏ khỏi danh sách"
          >
            ✕
          </button>
        )}
      </div>
    </article>
  );
}
