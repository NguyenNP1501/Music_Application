import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadArtists(q = keyword, p = 1) {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(
        `/artists?page=${p}&limit=12&q=${encodeURIComponent(q)}`,
      );
      setArtists(data.artists || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArtists("", 1);
  }, []);

  return (
    <>
      <PageTitle
        eyebrow="ARTISTS"
        title="Nghệ sĩ"
        description="Danh sách nghệ sĩ trong hệ thống."
      />
      <form
        className="page-search"
        onSubmit={(e) => {
          e.preventDefault();
          loadArtists(keyword, 1);
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm nghệ sĩ..."
        />
        <button className="primary-button">Tìm kiếm</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <div className="loading">Đang tải nghệ sĩ...</div>
      ) : artists.length ? (
        <div className="artist-grid">
          {artists.map((artist) => (
            <article className="artist-card" key={artist.name}>
              <div className="artist-avatar">
                {artist.name.charAt(0).toUpperCase()}
              </div>
              <strong>{artist.name}</strong>
              <span>{artist.songCount} bài hát</span>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>Chưa có dữ liệu nghệ sĩ.</EmptyState>
      )}
      {!loading && artists.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(nextPage) => loadArtists(keyword, nextPage)}
        />
      )}
    </>
  );
}
