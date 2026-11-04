import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlbums(q = keyword, p = page) {
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
          loadAlbums(keyword);
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
            >
              <div className="album-cover">
                {album.cover_image_url ? (
                  <img src={album.cover_image_url} alt={album.title} />
                ) : (
                  "▣"
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
