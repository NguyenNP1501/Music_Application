import React from "react";
import { usePlayer } from "../../context/PlayerContext";

export default function SongCard({ song, onAdd }) {
  let playSong;
  try {
    const player = usePlayer();
    playSong = player?.playSong;
  } catch {
    // Nếu nằm ngoài PlayerProvider
  }

  const handlePlay = (e) => {
    // Ngăn chặn nếu bấm nút onAdd
    if (e.target.closest(".text-button")) return;

    if (playSong && song) {
      playSong({
        id: song.song_id || song.id,
        title: song.title,
        artist: song.singer || song.artist || "Chưa rõ nghệ sĩ",
        coverUrl: song.album?.cover_image_url || song.coverUrl,
        durationSec: song.durationSec || 200,
      });
    }
  };

  return (
    <article
      className="song-card"
      onClick={handlePlay}
      style={{ cursor: "pointer", position: "relative" }}
      title="Bấm để phát nhạc trực tuyến (HTTP 206 Streaming)"
    >
      <div className="song-cover">
        {song.album?.cover_image_url || song.coverUrl ? (
          <img
            src={song.album?.cover_image_url || song.coverUrl}
            alt={song.album?.title || song.title || ""}
          />
        ) : (
          <span>♫</span>
        )}
      </div>

      <div className="song-info">
        <strong>{song.title}</strong>
        <span>{song.singer || song.artist || "Chưa rõ nghệ sĩ"}</span>
        <small>{song.album?.title || song.genre || "Chưa có album"}</small>

        {onAdd && (
          <button className="text-button" onClick={() => onAdd(song)}>
            + Thêm vào playlist
          </button>
        )}
      </div>
    </article>
  );
}
