import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";
import { getCoverUrl } from "../utils/assets";

export default function AlbumsPage({ selectedAlbum, onSelectAlbum, onBack }) {
  const [albums, setAlbums] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlbums(q = keyword, p = 1) {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        `/albums?page=${p}&limit=12&q=${encodeURIComponent(q)}`,
      );

      setAlbums(data.albums || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbums("", 1);
  }, []);

  if (selectedAlbum) {
    const songs = selectedAlbum.songs || [];
    const cover = getCoverUrl(selectedAlbum.cover_image_url);

    return (
      <section className="catalog-detail-page">
        <button type="button" className="secondary-button" onClick={onBack} style={{ marginBottom: "24px" }}>
          ← Quay lại danh sách album
        </button>

        <div className="catalog-detail-header">
          <div className="catalog-detail-cover">
            <img
              src={cover}
              alt={selectedAlbum.title}
              onError={(e) => {
                e.target.src = getCoverUrl(null);
              }}
            />
          </div>

          <div className="catalog-detail-info">
            <span className="eyebrow">ALBUM</span>
            <h1>{selectedAlbum.title}</h1>
            {selectedAlbum.description && <p>{selectedAlbum.description}</p>}
            <span className="catalog-song-count">{songs.length} bài hát</span>
          </div>
        </div>

        <section className="catalog-detail-songs">
          <h2 className="section-title" style={{ marginBottom: "20px" }}>Bài hát trong album</h2>

          {songs.length ? (
            <div className="song-grid">
              {songs.map((song) => (
                <SongCard
                  key={song.song_id || song.id}
                  song={song}
                  coverUrl={selectedAlbum.cover_image_url}
                  playlist={songs}
                />
              ))}
            </div>
          ) : (
            <EmptyState>Album này chưa có bài hát.</EmptyState>
          )}
        </section>
      </section>
    );
  }

  return (
    <>
      <PageTitle
        eyebrow="BỘ SƯU TẬP"
        title="Album"
        description="Khám phá các album âm nhạc trong hệ thống."
      />

      <form
        className="page-search"
        onSubmit={(e) => {
          e.preventDefault();
          loadAlbums(keyword, 1);
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm album theo tên..."
        />
        <button type="submit" className="primary-button">
          Tìm kiếm
        </button>
      </form>

      {error && (
        <div className="error-message" role="alert">
          <span>!</span> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Đang tải danh sách album...</div>
      ) : albums.length ? (
        <>
          <div className="figma-album-row">
            {albums.map((album) => {
              const albumCover = getCoverUrl(album.cover_image_url);
              const songCount = Array.isArray(album.songs)
                ? album.songs.length
                : (album.song_count ?? 0);

              return (
                <article
                  className="figma-album-card"
                  key={album.album_id || album.id}
                  onClick={() => onSelectAlbum?.(album)}
                  role="button"
                  tabIndex={0}
                  title={`Xem album ${album.title}`}
                >
                  <div className="album-card-cover">
                    <img
                      src={albumCover}
                      alt={`Bìa album ${album.title}`}
                      onError={(e) => {
                        e.target.src = getCoverUrl(null);
                      }}
                    />
                    <div className="album-card-play-overlay">▶</div>
                  </div>

                  <strong className="album-card-title">{album.title || "Album"}</strong>
                  <span className="album-card-subtitle">{songCount} bài hát</span>
                </article>
              );
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => loadAlbums(keyword, nextPage)}
          />
        </>
      ) : (
        <EmptyState>Không tìm thấy album nào.</EmptyState>
      )}
    </>
  );
}
