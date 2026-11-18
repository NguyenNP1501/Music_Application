import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import PageTitles from "../components/common/PageTitles";
import EmptyState from "../components/common/EmptyState";
import "./MyContentPage.css";

async function loadAllPages(endpoint, key) {
  const first = await apiRequest(`${endpoint}?page=1&limit=100`);
  const items = [...(first[key] || [])];
  const totalPages = first.pagination?.totalPages || 1;

  for (let page = 2; page <= totalPages; page++) {
    const data = await apiRequest(`${endpoint}?page=${page}&limit=100`);
    items.push(...(data[key] || []));
  }

  return items;
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật";

  return new Date(value).toLocaleDateString("vi-VN");
}

export default function MyContentPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState("songs");
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadContent = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError("");

      const [allSongs, allAlbums] = await Promise.all([
        loadAllPages("/songs", "songs"),
        loadAllPages("/albums", "albums"),
      ]);

      setSongs(allSongs.filter((song) => song.Useruser_id === user.user_id));

      setAlbums(
        allAlbums.filter((album) => album.Useruser_id === user.user_id),
      );
    } catch (err) {
      setError(err.message || "Không thể tải nội dung của bạn.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const filteredSongs = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return songs;

    return songs.filter((song) =>
      [song.title, song.singer, song.composer, song.genre, song.album?.title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [songs, keyword]);

  const filteredAlbums = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return albums;

    return albums.filter((album) =>
      [album.title, album.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [albums, keyword]);

  async function deleteSong(song) {
    if (!window.confirm(`Bạn có chắc muốn xóa bài hát "${song.title}"?`)) {
      return;
    }

    try {
      setDeletingId(`song-${song.song_id}`);
      setError("");
      setNotice("");

      const result = await apiRequest(`/songs/${song.song_id}`, {
        method: "DELETE",
      });

      setSongs((old) => old.filter((item) => item.song_id !== song.song_id));

      setNotice(
        result.cleanup_pending
          ? "Đã xóa bài hát khỏi hệ thống. File lưu trữ cần được kiểm tra thêm."
          : "Đã xóa bài hát thành công.",
      );
    } catch (err) {
      setError(err.message || "Không thể xóa bài hát.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAlbum(album) {
    const songCount = album.songs?.length || 0;

    if (songCount > 0) {
      setError(
        `Không thể xóa album "${album.title}" vì vẫn còn ${songCount} bài hát.`,
      );
      setNotice("");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa album "${album.title}"?`)) {
      return;
    }

    try {
      setDeletingId(`album-${album.album_id}`);
      setError("");
      setNotice("");

      await apiRequest(`/albums/${album.album_id}`, {
        method: "DELETE",
      });

      setAlbums((old) =>
        old.filter((item) => item.album_id !== album.album_id),
      );

      setNotice("Đã xóa album thành công.");
    } catch (err) {
      setError(err.message || "Không thể xóa album.");
    } finally {
      setDeletingId(null);
    }
  }

  const currentItems = tab === "songs" ? filteredSongs : filteredAlbums;

  return (
    <div className="my-content-page">
      <PageTitles
        eyebrow="YOUR CONTENT"
        title="Nội dung của tôi"
        description="Quản lý các bài hát và album do bạn sở hữu."
      />

      <div className="my-content-overview">
        <div className="my-content-stat">
          <div className="my-content-stat-icon">♫</div>
          <div>
            <span>Bài hát của tôi</span>
            <strong>{songs.length}</strong>
          </div>
        </div>

        <div className="my-content-stat">
          <div className="my-content-stat-icon">▣</div>
          <div>
            <span>Album của tôi</span>
            <strong>{albums.length}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="my-content-alert error-message" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="my-content-alert success-message" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      <section className="my-content-section">
        <div className="my-content-toolbar">
          <div className="my-content-tabs">
            <button
              type="button"
              className={tab === "songs" ? "active" : ""}
              onClick={() => {
                setTab("songs");
                setKeyword("");
              }}
            >
              Bài hát ({songs.length})
            </button>

            <button
              type="button"
              className={tab === "albums" ? "active" : ""}
              onClick={() => {
                setTab("albums");
                setKeyword("");
              }}
            >
              Album ({albums.length})
            </button>
          </div>

          <form
            className="my-content-search"
            onSubmit={(e) => e.preventDefault()}
          >
            <span>⌕</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={
                tab === "songs"
                  ? "Tìm bài hát, ca sĩ, thể loại..."
                  : "Tìm album..."
              }
            />

            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="my-content-loading">Đang tải nội dung...</div>
        ) : currentItems.length === 0 ? (
          <EmptyState>
            {keyword
              ? "Không tìm thấy nội dung phù hợp."
              : tab === "songs"
                ? "Bạn chưa có bài hát nào."
                : "Bạn chưa có album nào."}
          </EmptyState>
        ) : tab === "songs" ? (
          <div className="my-content-list">
            {filteredSongs.map((song) => (
              <article className="my-content-item" key={song.song_id}>
                <div className="my-content-cover">♫</div>

                <div className="my-content-item-info">
                  <strong>{song.title}</strong>
                  <span>{song.singer || "Chưa rõ ca sĩ"}</span>
                  <small>
                    {song.genre || "Chưa phân loại"}
                    {" · "}
                    {song.album?.title || "Chưa thuộc album"}
                  </small>
                </div>

                <div className="my-content-item-date">
                  <span>Ngày phát hành</span>
                  <strong>{formatDate(song.release)}</strong>
                </div>

                <button
                  type="button"
                  className="my-content-delete"
                  disabled={deletingId === `song-${song.song_id}`}
                  onClick={() => deleteSong(song)}
                >
                  {deletingId === `song-${song.song_id}`
                    ? "Đang xóa..."
                    : "Xóa"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="my-content-album-grid">
            {filteredAlbums.map((album) => (
              <article className="my-content-album-card" key={album.album_id}>
                <div className="my-content-album-cover">
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt={album.title} />
                  ) : (
                    <span>♫</span>
                  )}
                </div>

                <div className="my-content-album-info">
                  <strong>{album.title}</strong>
                  <span>{(album.songs || []).length} bài hát</span>
                  <small>Phát hành: {formatDate(album.release)}</small>
                </div>

                <button
                  type="button"
                  className="my-content-delete"
                  disabled={deletingId === `album-${album.album_id}`}
                  onClick={() => deleteAlbum(album)}
                >
                  {deletingId === `album-${album.album_id}`
                    ? "Đang xóa..."
                    : "Xóa album"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
