import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";

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

    return (
      <section className="catalog-detail-page">
        <button type="button" className="catalog-back-button" onClick={onBack}>
          ← Quay lại danh sách album
        </button>

        <div className="catalog-detail-header">
          <div className="catalog-detail-cover">
            {selectedAlbum.cover_image_url ? (
              <img
                src={selectedAlbum.cover_image_url}
                alt={selectedAlbum.title}
              />
            ) : (
              <span>♫</span>
            )}
          </div>

          <div className="catalog-detail-info">
            <span className="catalog-detail-eyebrow">ALBUM</span>
            <h1>{selectedAlbum.title}</h1>

            {selectedAlbum.description && <p>{selectedAlbum.description}</p>}

            <span>{songs.length} bài hát</span>
          </div>
        </div>

        <section className="catalog-detail-songs">
          <h2>Bài hát trong album</h2>

          {songs.length ? (
            <div className="song-grid">
              {songs.map((song) => (
                <SongCard
                  key={song.song_id || song.id}
                  song={song}
                  coverUrl={selectedAlbum.cover_image_url}
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
        eyebrow="COLLECTION"
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
          placeholder="Tìm album..."
        />
        <button className="primary-button">Tìm kiếm</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <div className="loading">Đang tải album...</div>
      ) : albums.length ? (
        <div className="album-grid">
          {albums.map((album) => (
            <article
              className="album-card album-card-large"
              key={album.album_id}
              onClick={() => onSelectAlbum?.(album)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectAlbum?.(album);
                }
              }}
              title={`Xem album ${album.title}`}
            >
              <div className="album-cover">
                {album.cover_image_url ? (
                  <img src={album.cover_image_url} alt={album.title} />
                ) : (
                  "♫"
                )}
              </div>

              <strong>{album.title}</strong>
              <span>{album.songs?.length || 0} bài hát</span>

              {album.description && <p>{album.description}</p>}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>Không tìm thấy album.</EmptyState>
      )}

      {!loading && albums.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(nextPage) => loadAlbums(keyword, nextPage)}
        />
      )}
    </>
  );
}
