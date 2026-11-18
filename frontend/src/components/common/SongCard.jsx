import { usePlayer } from "../../context/PlayerContext";

export default function SongCard({ song, onAdd }) {
  const { playSong } = usePlayer();

  const cover = song.album?.cover_image_url || song.cover_image_url || "";

  const handlePlay = () => {
    if (!song) return;

    playSong({
      id: song.song_id,
      title: song.title,
      artist: song.singer || "Chưa rõ nghệ sĩ",
      coverUrl: cover,
      durationSec: song.durationSec || 0,
    });
  };

  return (
    <article
      className="song-card"
      onClick={handlePlay}
      style={{ cursor: "pointer", position: "relative" }}
      title="Phát bài hát"
    >
      <div className="song-cover">
        {cover ? (
          <img src={cover} alt={song.title || "Bìa bài hát"} />
        ) : (
          <span>♫</span>
        )}
      </div>

      <div className="song-info">
        <strong>{song.title}</strong>
        <span>{song.singer || "Chưa rõ nghệ sĩ"}</span>
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
