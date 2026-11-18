import { useEffect, useState } from "react";
import { useAuth } from "../../services/context/AuthContext";
import { usePlayer } from "../../context/PlayerContext";
import { showToast } from "../../utils/toast";

export default function SongCard({ song, onAdd, onRemoveSaved, coverUrl }) {
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

  const cover =
    coverUrl || song.album?.cover_image_url || song.cover_image_url || "";

  const handlePlay = () => {
    if (!song) return;
    playSong({
      id: song.song_id || song.id,
      title: song.title,
      artist: song.singer || song.artist || "Chưa rõ nghệ sĩ",
      coverUrl: cover || song.coverUrl || "",
      durationSec: song.durationSec || 0,
    });
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

  return (
    <article className="song-card" onClick={handlePlay} title="Phát bài hát">
      <div className="song-cover">
        {cover ? (
          <img src={cover} alt={song.title || "Bìa bài hát"} />
        ) : (
          <span>♫</span>
        )}
      </div>

      <div className="song-info">
        <strong>{song.title}</strong>
        <span>{song.singer || song.artist || "Chưa rõ nghệ sĩ"}</span>
        <small>{song.album?.title || song.genre || "Chưa có album"}</small>

        <div className="song-card-actions">
          <button
            type="button"
            className={`song-save-button ${saved ? "saved" : ""}`}
            onClick={toggleSaved}
            title={saved ? "Bỏ lưu bài hát" : "Lưu bài hát"}
          >
            {saved ? "♥ Đã lưu" : "♡ Lưu"}
          </button>

          {onAdd && (
            <button
              type="button"
              className="text-button"
              onClick={(event) => {
                event.stopPropagation();
                onAdd(song);
              }}
            >
              + Thêm playlist
            </button>
          )}

          {onRemoveSaved && (
            <button
              type="button"
              className="text-button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveSaved();
              }}
            >
              Bỏ khỏi danh sách
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
