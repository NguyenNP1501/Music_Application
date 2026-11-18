import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";

export default function HomePage({ navigate }) {
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

  const displayedSongs = songs.slice(0, 8);
  const displayedAlbums = albums.slice(0, 3);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-hero-eyebrow">
            <span className="home-hero-dot" />
            MUSIC SPACE
          </span>

          <h1>
            Không gian âm nhạc
            <br />
            dành riêng cho bạn.
          </h1>

          <p>
            Khám phá những giai điệu yêu thích, tìm kiếm nghệ sĩ và xây dựng thư
            viện âm nhạc của riêng bạn.
          </p>

          <div className="home-hero-actions">
            <button
              type="button"
              className="home-primary-button"
              onClick={() => navigate("songs")}
            >
              Khám phá bài hát
              <span>→</span>
            </button>

            <button
              type="button"
              className="home-secondary-button"
              onClick={() => navigate("albums")}
            >
              Xem album
            </button>
          </div>

          <div className="home-hero-stats">
            <div>
              <strong>{loading ? "—" : songs.length}</strong>
              <span>Bài hát</span>
            </div>

            <span className="home-stat-divider" />

            <div>
              <strong>{loading ? "—" : albums.length}</strong>
              <span>Album</span>
            </div>
          </div>
        </div>

        <div className="home-hero-art" aria-hidden="true">
          <div className="home-art-orbit home-art-orbit-one" />
          <div className="home-art-orbit home-art-orbit-two" />

          <div className="home-art-disc">
            <div className="home-art-disc-inner">
              <span>♫</span>
            </div>
          </div>

          <span className="home-art-note home-art-note-one">♪</span>
          <span className="home-art-note home-art-note-two">♫</span>
        </div>
      </section>

      {error && (
        <div className="home-error" role="alert">
          <span>!</span>
          {error}
        </div>
      )}

      <section className="content-section home-section">
        <PageTitle
          eyebrow="YOUR MUSIC"
          title="Bài hát mới"
          description="Những bài hát hiện có trong thư viện âm nhạc."
          action={
            <button
              type="button"
              className="home-view-all"
              onClick={() => navigate("songs")}
            >
              Xem tất cả <span>→</span>
            </button>
          }
        />

        {loading ? (
          <div className="home-loading">
            <span className="home-loading-spinner" />
            Đang tải danh sách bài hát...
          </div>
        ) : displayedSongs.length > 0 ? (
          <div className="song-grid home-song-grid">
            {displayedSongs.map((song) => (
              <SongCard key={song.song_id || song.id} song={song} />
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có bài hát trong hệ thống.</EmptyState>
        )}
      </section>

      <section className="content-section home-section">
        <PageTitle
          eyebrow="COLLECTION"
          title="Album"
          description="Khám phá các album trong thư viện."
          action={
            <button
              type="button"
              className="home-view-all"
              onClick={() => navigate("albums")}
            >
              Xem tất cả <span>→</span>
            </button>
          }
        />

        {loading ? (
          <div className="home-loading">
            <span className="home-loading-spinner" />
            Đang tải danh sách album...
          </div>
        ) : displayedAlbums.length > 0 ? (
          <div className="home-album-grid">
            {displayedAlbums.map((album) => (
              <article
                className="home-album-card"
                key={album.album_id || album.id}
              >
                <div className="home-album-cover">
                  {album.cover_image_url ? (
                    <img
                      src={album.cover_image_url}
                      alt={`Bìa album ${album.title}`}
                      loading="lazy"
                    />
                  ) : (
                    <span>♫</span>
                  )}

                  <div className="home-album-cover-overlay">
                    <span>♫</span>
                  </div>
                </div>

                <div className="home-album-info">
                  <strong title={album.title}>
                    {album.title || "Album chưa có tên"}
                  </strong>
                  <span>
                    {Array.isArray(album.songs)
                      ? album.songs.length
                      : (album.song_count ?? 0)}{" "}
                    bài hát
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có album trong hệ thống.</EmptyState>
        )}
      </section>
    </div>
  );
}
