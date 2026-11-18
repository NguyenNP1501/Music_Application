export default function RoomMusicPlayer({ song, isOwner }) {
  const hasSong = Boolean(song);

  return (
    <section className="room-player-card">
      <div className="room-player-heading">
        <span>{isOwner ? "BẠN LÀ CHỦ PHÒNG" : "BẠN LÀ THÀNH VIÊN"}</span>
        <span>{hasSong ? "ĐANG PHÁT CHUNG" : "CHƯA CÓ BÀI HÁT"}</span>
      </div>

      <div className="room-song-info">
        <div className="room-cover">
          {song?.cover_image_url ? (
            <img
              src={song.cover_image_url}
              alt={song.title || "Ảnh bìa bài hát"}
            />
          ) : (
            <span>♫</span>
          )}
        </div>

        <div className="room-song-details">
          {hasSong ? (
            <>
              <span className="room-playing-label">ĐANG PHÁT CHUNG</span>

              <h2>{song.title}</h2>

              <p className="room-artist">
                {song.singer || song.composer || ""}
              </p>

              {song.album?.title && (
                <p className="room-album">Từ album {song.album.title}</p>
              )}
            </>
          ) : (
            <div className="room-no-song">
              <span className="room-playing-label">PHÒNG CÔNG CHIẾU</span>

              <h2>Chưa có bài hát đang phát</h2>

              <p className="room-artist">
                Bài hát sẽ hiển thị tại đây khi được chọn.
              </p>
            </div>
          )}

          {hasSong && isOwner && (
            <div className="room-owner-actions">
              <button type="button" className="room-secondary-button" disabled>
                Đổi bài hát
              </button>

              <button type="button" className="room-primary-button" disabled>
                Bắt đầu bài mới
              </button>
            </div>
          )}

          {hasSong && !isOwner && (
            <p className="room-member-note">
              Bạn đang tham gia nghe nhạc cùng phòng.
            </p>
          )}
        </div>
      </div>

      <div className="room-progress">
        <input
          type="range"
          min="0"
          max="100"
          value="0"
          disabled
          aria-label="Tiến trình bài hát"
        />

        <div className="room-time-labels">
          <span>0:00</span>
          <span>--:--</span>
        </div>
      </div>

      <div className="room-main-controls">
        <button
          type="button"
          className="room-play-button"
          disabled
          aria-label="Điều khiển phát nhạc"
        >
          ▶
        </button>
      </div>

      <p className="room-player-note">
        Thông tin và trạng thái phát nhạc sẽ được cập nhật khi tích hợp chức
        năng nghe nhạc chung.
      </p>
    </section>
  );
}
