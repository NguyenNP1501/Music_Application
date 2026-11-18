import { useState } from "react";
import { usePlayer } from "../../context/PlayerContext";

export default function SongCard({ song, onAdd, onRemoveSaved }) {
  const { playSong } = usePlayer();

  const [saved, setSaved] = useState(() => {
    try {
      const userId = JSON.parse(
        localStorage.getItem("music-current-user") || "null",
      )?.user_id;

      if (!userId) return false;

      const items = JSON.parse(
        localStorage.getItem(`music-space-saved-${userId}`) || "[]",
      );

      return items.some((item) => item.song_id === song.song_id);
    } catch {
      return false;
    }
  });

  const cover = song.album?.cover_image_url || song.cover_image_url || "";

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

    if (!userId) return;

    const key = `music-space-saved-${userId}`;

    let items = [];

    try {
      items = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      items = [];
    }

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

    localStorage.setItem(key, JSON.stringify(items));
    setSaved(!saved);

    window.dispatchEvent(new Event("music-saved-change"));
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
