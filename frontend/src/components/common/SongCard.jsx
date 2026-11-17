import { usePlayer } from "../../context/PlayerContext";

export default function SongCard({ song, onAdd }) {
  const { playSong } = usePlayer();

  const handlePlay = (e) => {
    if (e.target.closest(".text-button")) return;

    if (song) {
      playSong({
        id: song.song_id || song.id,
        title: song.title,
        artist: song.singer || song.artist || "Chưa rõ nghệ sĩ",
        coverUrl: song.album?.cover_image_url || song.coverUrl,
        durationSec: song.durationSec,
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
          <button
            className="text-button"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(song);
            }}
          >
            + Thêm vào playlist
          </button>
        )}
      </div>
    </article>
  );
}
