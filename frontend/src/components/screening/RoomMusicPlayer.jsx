export default function RoomMusicPlayer({
  song,
  isOwner,
  playing,
  onTogglePlay,
  progress,
  onProgressChange,
  formatTime,
}) {
  const percent = song.duration ? (progress / song.duration) * 100 : 0;

  return (
    <section className="room-player-card">
      <div className="room-player-heading">
        <span>{isOwner ? "BẠN LÀ CHỦ PHÒNG" : "BẠN LÀ THÀNH VIÊN"}</span>
        <span>MÃ PHÒNG&nbsp; MAY026</span>
      </div>

      <div className="room-song-info">
        <div className="room-cover">
          {song.cover ? (
            <img src={song.cover} alt={song.title} />
          ) : (
            <span>☼</span>
          )}
        </div>

        <div className="room-song-details">
          <span className="room-playing-label">ĐANG PHÁT CHUNG</span>
          <h2>{song.title}</h2>
          <p className="room-artist">{song.artist}</p>
          <p className="room-album">Từ album {song.album}</p>

          {isOwner ? (
            <div className="room-owner-actions">
              <button type="button" className="room-secondary-button">
                Đổi bài hát
              </button>
              <button type="button" className="room-primary-button">
                Bắt đầu bài mới
              </button>
            </div>
          ) : (
            <p className="room-member-note">
              Chỉ chủ phòng được đổi hoặc bắt đầu bài mới.
            </p>
          )}
        </div>
      </div>

      <div className="room-progress">
        <input
          type="range"
          min="0"
          max={song.duration}
          value={progress}
          style={{ "--progress": `${percent}%` }}
          onChange={(event) => onProgressChange(Number(event.target.value))}
          disabled={!isOwner}
          aria-label="Tiến trình bài hát"
        />

        <div className="room-time-labels">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(song.duration)}</span>
        </div>
      </div>

      <div className="room-main-controls">
        <button
          type="button"
          className="room-play-button"
          onClick={onTogglePlay}
          aria-label={playing ? "Tạm dừng" : "Phát"}
        >
          {playing ? "Ⅱ" : "▶"}
        </button>
      </div>

      <p className="room-player-note">
        Mọi thành viên đều có thể tạm dừng, tiếp tục và tua.
      </p>
    </section>
  );
}
