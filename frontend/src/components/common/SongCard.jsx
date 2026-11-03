export default function SongCard({ song, onAdd }) {
  return (
    <article className="song-card">
      <div className="song-cover">
        {song.album?.cover_image_url ? (
          <img src={song.album.cover_image_url} alt={song.album.title || ""} />
        ) : (
          <span>♫</span>
        )}
      </div>

      <div className="song-info">
        <strong>{song.title}</strong>
        <span>{song.singer || "Chưa rõ nghệ sĩ"}</span>
        <small>{song.album?.title || "Chưa có album"}</small>

        {onAdd && (
          <button className="text-button" onClick={() => onAdd(song)}>
            + Thêm vào playlist
          </button>
        )}
      </div>
    </article>
  );
}
