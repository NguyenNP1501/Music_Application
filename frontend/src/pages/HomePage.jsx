import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";
import { DEFAULT_COVER, getCoverUrl } from "../utils/assets";

export default function HomePage({ navigate, onSelectAlbum }) {
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      setLoading(true);
      setError("");

      const [songRes, albumRes] = await Promise.allSettled([
        apiRequest("/songs"),
        apiRequest("/albums"),
      ]);

      if (!active) return;

      if (songRes.status === "fulfilled") {
        const data = songRes.value;
        setSongs(Array.isArray(data) ? data : data?.songs || []);
      } else {
        setError(songRes.reason?.message || "Không thể tải danh sách bài hát.");
      }

      if (albumRes.status === "fulfilled") {
        const data = albumRes.value;
        setAlbums(Array.isArray(data) ? data : data?.albums || []);
      }

      setLoading(false);
    }

    loadHomeData();

    return () => {
      active = false;
    };
  }, []);

  const displayedSongs = songs.slice(0, 6);
  const displayedAlbums = albums.slice(0, 5);

  const greetingName = (user?.nickname || user?.full_name || "BẠN").toUpperCase();

  const handlePlayFeatured = () => {
    if (songs.length > 0) {
      const first = songs[0];
      playSong({
        id: first.song_id || first.id,
        title: first.title,
        artist: first.singer || first.artist || "Chưa rõ nghệ sĩ",
        coverUrl: getCoverUrl(first.cover_image_url || first.album?.cover_image_url),
        durationSec: first.durationSec || 0,
      }, songs);
    } else {
      navigate("songs");
    }
  };

  return (
    <div className="figma-home-container">
      {/* 1. Header Greeting (Figma Frame 6:885 & 6:886) */}
      <div className="home-greeting-section">
        <span className="home-eyebrow-text">CHÀO BUỔI TỐI, {greetingName}</span>
        <h1 className="home-main-title">Hôm nay, bạn muốn nghe gì?</h1>
      </div>

      {/* 2. Playlist nổi bật (Figma Frame 6:887) */}
      <section className="home-featured-banner">
        <div className="featured-banner-content">
          <span className="featured-tag">TUYỂN CHỌN TUẦN NÀY</span>
          <h2 className="featured-heading">
            Chạm vào giai điệu<br />
            của riêng bạn.
          </h2>
          <p className="featured-sub">Những thanh âm mới, những cảm xúc quen.</p>

          <button
            type="button"
            className="primary-button featured-play-btn"
            onClick={handlePlayFeatured}
          >
            <span>▶</span> Nghe ngay
          </button>
        </div>

        <div className="featured-banner-cover">
          <img src={DEFAULT_COVER} alt="Tuyển chọn tuần này" />
        </div>
      </section>

      {error && (
        <div className="error-message" role="alert">
          <span>!</span> {error}
        </div>
      )}

      {/* 3. Section 1: Album mới khám phá (Figma Frame 6:894) */}
      <section className="home-section-group">
        <div className="section-header-row">
          <h2 className="section-title">Album mới khám phá</h2>
          <button
            type="button"
            className="section-link-btn"
            onClick={() => navigate("albums")}
          >
            Xem tất cả →
          </button>
        </div>

        {loading ? (
          <div className="loading">Đang tải danh sách album...</div>
        ) : displayedAlbums.length > 0 ? (
          <div className="figma-album-row">
            {displayedAlbums.map((album) => {
              const albumCover = getCoverUrl(album.cover_image_url);
              const songCount = Array.isArray(album.songs)
                ? album.songs.length
                : (album.song_count ?? 0);

              return (
                <article
                  key={album.album_id || album.id}
                  className="figma-album-card"
                  onClick={() => onSelectAlbum?.(album)}
                  role="button"
                  tabIndex={0}
                  title={`Xem album ${album.title}`}
                >
                  <div className="album-card-cover">
                    <img
                      src={albumCover}
                      alt={album.title || "Album"}
                      onError={(e) => {
                        e.target.src = getCoverUrl(null);
                      }}
                    />
                    <div className="album-card-play-overlay">▶</div>
                  </div>

                  <strong className="album-card-title" title={album.title}>
                    {album.title || "Album mới"}
                  </strong>
                  <span className="album-card-subtitle">
                    {album.artist || "Nhiều nghệ sĩ"} · {songCount} bài hát
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState>Chưa có album nào được phát hành.</EmptyState>
        )}
      </section>

      {/* 4. Section 2: Dành riêng cho bạn (Figma Frame 6:916) */}
      <section className="home-section-group">
        <div className="section-header-row">
          <h2 className="section-title">Dành riêng cho bạn</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("songs")}
          >
            Khám phá gợi ý
          </button>
        </div>

        {loading ? (
          <div className="loading">Đang tải danh sách bài hát...</div>
        ) : displayedSongs.length > 0 ? (
          <div className="song-grid">
            {displayedSongs.map((song) => (
              <SongCard
                key={song.song_id || song.id}
                song={song}
                playlist={displayedSongs}
              />
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có bài hát trong hệ thống.</EmptyState>
        )}
      </section>
    </div>
  );
}
