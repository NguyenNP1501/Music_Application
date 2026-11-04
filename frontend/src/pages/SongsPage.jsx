import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";

export default function SongsPage() {
  const [songs, setSongs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSongs(q = "") {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(
        `/songs${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      );
      setSongs(data.songs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSongs();
    const handleSearch = (event) => {
      setKeyword(event.detail || "");
      loadSongs(event.detail || "");
    };
    window.addEventListener("music-search", handleSearch);
    return () => window.removeEventListener("music-search", handleSearch);
  }, []);

  function search(e) {
    e.preventDefault();
    loadSongs(keyword);
  }

  async function loadSongs(q = keyword, p = page) {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(
        `/songs?page=${p}&limit=12&q=${encodeURIComponent(q)}`,
      );
      setSongs(data.songs || []);
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
        eyebrow="LIBRARY"
        title="Bài hát"
        description="Tìm kiếm và khám phá các bài hát trong hệ thống."
      />
      <form className="page-search" onSubmit={search}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập tên bài hát, nghệ sĩ hoặc thể loại..."
        />
        <button className="primary-button">Tìm kiếm</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <div className="loading">Đang tải bài hát...</div>
      ) : songs.length ? (
        <div className="song-grid">
          {songs.map((song) => (
            <SongCard key={song.song_id} song={song} />
          ))}
        </div>
      ) : (
        <EmptyState>Không tìm thấy bài hát phù hợp.</EmptyState>
      )}

      {!loading && songs.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(nextPage) => loadSongs(keyword, nextPage)}
        />
      )}
    </>
  );
}
