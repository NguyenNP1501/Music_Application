import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";

export default function ArtistsPage({
  selectedArtist,
  onSelectArtist,
  onBack,
}) {
  const [artists, setArtists] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [artistSongs, setArtistSongs] = useState([]);
  const [songPage, setSongPage] = useState(1);
  const [songTotalPages, setSongTotalPages] = useState(1);
  const [songLoading, setSongLoading] = useState(false);

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

  async function loadArtistSongs(name, p = 1) {
    try {
      setSongLoading(true);
      setError("");

      const data = await apiRequest(
        `/songs?page=${p}&limit=100&q=${encodeURIComponent(name)}`,
      );

      const songs = Array.isArray(data) ? data : data?.songs || [];

      // API tìm kiếm theo contains, nên lọc lại để lấy đúng nghệ sĩ.
      const exactSongs = songs.filter(
        (song) =>
          String(song.singer || "")
            .trim()
            .toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
      );

      setArtistSongs(exactSongs);
      setSongTotalPages(data.pagination?.totalPages || 1);
      setSongPage(p);
    } catch (err) {
      setError(err.message);
      setArtistSongs([]);
    } finally {
      setSongLoading(false);
    }
  }

  useEffect(() => {
    loadArtists("", 1);
  }, []);

  useEffect(() => {
    if (selectedArtist) {
      loadArtistSongs(selectedArtist, 1);
    }
  }, [selectedArtist]);

  if (selectedArtist) {
    return (
      <section className="catalog-detail-page">
        <button type="button" className="catalog-back-button" onClick={onBack}>
          ← Quay lại danh sách nghệ sĩ
        </button>

        <div className="artist-detail-header">
          <div className="artist-detail-avatar">
            {selectedArtist.charAt(0).toUpperCase()}
          </div>

          <div className="catalog-detail-info">
            <span className="catalog-detail-eyebrow">ARTIST</span>
            <h1>{selectedArtist}</h1>
            <span>{artistSongs.length} bài hát trên trang hiện tại</span>
          </div>
        </div>

        <section className="catalog-detail-songs">
          <h2>Tất cả bài hát</h2>

          {error && <p className="error-message">{error}</p>}

          {songLoading ? (
            <div className="loading">Đang tải bài hát...</div>
          ) : artistSongs.length ? (
            <div className="song-grid">
              {artistSongs.map((song) => (
                <SongCard key={song.song_id || song.id} song={song} />
              ))}
            </div>
          ) : (
            <EmptyState>Không tìm thấy bài hát của nghệ sĩ này.</EmptyState>
          )}

          {!songLoading && songTotalPages > 1 && (
            <Pagination
              page={songPage}
              totalPages={songTotalPages}
              onChange={(nextPage) => loadArtistSongs(selectedArtist, nextPage)}
            />
          )}
        </section>
      </section>
    );
  }

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
            <article
              className="artist-card"
              key={artist.name}
              onClick={() => onSelectArtist?.(artist.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectArtist?.(artist.name);
                }
              }}
              title={`Xem bài hát của ${artist.name}`}
            >
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
