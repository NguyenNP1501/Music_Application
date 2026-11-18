import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import PageTitles from "../components/common/PageTitles";
import EmptyState from "../components/common/EmptyState";
import { showToast } from "../utils/toast";

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
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const loadContent = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);

      const [allSongs, allAlbums] = await Promise.all([
        loadAllPages("/songs", "songs"),
        loadAllPages("/albums", "albums"),
      ]);

      setSongs(allSongs.filter((song) => song.Useruser_id === user.user_id));

      setAlbums(
        allAlbums.filter((album) => album.Useruser_id === user.user_id),
      );
    } catch (error) {
      showToast(error.message || "Không thể tải nội dung.", "error");
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

  async function handleDelete() {
    if (!confirm) return;

    const { type, item } = confirm;
    const id = type === "song" ? item.song_id : item.album_id;

    try {
      setDeleting(true);
      if (type === "song") {
        const result = await apiRequest(`/songs/${id}`, {
          method: "DELETE",
        });
        setSongs((old) => old.filter((song) => song.song_id !== id));
        showToast(
          result.cleanup_pending
            ? "Đã xóa bài hát. File lưu trữ cần được kiểm tra thêm."
            : "Đã xóa bài hát thành công.",
        );
      } else {
        await apiRequest(`/albums/${id}`, { method: "DELETE" });
        setAlbums((old) => old.filter((album) => album.album_id !== id));
        showToast("Đã xóa album thành công.");
      }
      setConfirm(null);
    } catch (error) {
      showToast(error.message || "Không thể thực hiện thao tác.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const currentItems = tab === "songs" ? filteredSongs : filteredAlbums;

  return (
    <div className="my-content-page">
      <PageTitles
        eyebrow="YOUR CONTENT"
        title="Nội dung của tôi"
        description="Quản lý những bài hát và album do bạn sở hữu."
      />

      <div className="my-content-overview">
        <article className="my-content-stat">
          <div className="my-content-stat-icon">♫</div>
          <div>
            <span>Bài hát của tôi</span>
            <strong>{songs.length}</strong>
          </div>
        </article>

        <article className="my-content-stat">
          <div className="my-content-stat-icon">▣</div>
          <div>
            <span>Album của tôi</span>
            <strong>{albums.length}</strong>
          </div>
        </article>
      </div>

      <section className="my-content-section">
        <div className="my-content-toolbar">
          <div className="my-content-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "songs"}
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
              role="tab"
              aria-selected={tab === "albums"}
              className={tab === "albums" ? "active" : ""}
              onClick={() => {
                setTab("albums");
                setKeyword("");
              }}
            >
              Album ({albums.length})
            </button>
          </div>

          <label className="my-content-search">
            <span>⌕</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
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
          </label>
        </div>

        <div className="my-content-table-heading">
          <span>{tab === "songs" ? "TÊN BÀI HÁT" : "TÊN ALBUM"}</span>
          <span>NGÀY PHÁT HÀNH</span>
          <span>THAO TÁC</span>
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
                <div className="my-content-item-main">
                  <div className="my-content-cover">
                    {song.album?.cover_image_url ? (
                      <img
                        src={song.album.cover_image_url}
                        alt={song.album.title || song.title}
                      />
                    ) : (
                      <span>♫</span>
                    )}
                  </div>

                  <div className="my-content-item-info">
                    <strong>{song.title}</strong>
                    <span>{song.singer || "Chưa rõ ca sĩ"}</span>
                    <small>
                      {song.genre || "Chưa phân loại"}
                      {" · "}
                      {song.album?.title || "Chưa thuộc album"}
                    </small>
                  </div>
                </div>

                <div className="my-content-item-date">
                  {formatDate(song.release)}
                </div>

                <div className="my-content-item-actions">
                  <button
                    type="button"
                    className="my-content-delete"
                    onClick={() => setConfirm({ type: "song", item: song })}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="my-content-list">
            {filteredAlbums.map((album) => (
              <article className="my-content-item" key={album.album_id}>
                <div className="my-content-item-main">
                  <div className="my-content-cover">
                    {album.cover_image_url ? (
                      <img src={album.cover_image_url} alt={album.title} />
                    ) : (
                      <span>♫</span>
                    )}
                  </div>

                  <div className="my-content-item-info">
                    <strong>{album.title}</strong>
                    <span>{(album.songs || []).length} bài hát</span>
                    <small>{album.description || "Chưa có mô tả"}</small>
                  </div>
                </div>

                <div className="my-content-item-date">
                  {formatDate(album.release)}
                </div>

                <div className="my-content-item-actions">
                  <button
                    type="button"
                    className="my-content-delete"
                    onClick={() => setConfirm({ type: "album", item: album })}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {confirm && (
        <div
          className="my-content-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setConfirm(null);
            }
          }}
        >
          <section
            className="my-content-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-content-confirm-title"
          >
            <button
              type="button"
              className="my-content-modal-close"
              onClick={() => setConfirm(null)}
              disabled={deleting}
              aria-label="Đóng"
            >
              ×
            </button>

            <div className="my-content-confirm-icon">!</div>

            <h2 id="my-content-confirm-title">
              {confirm.type === "song" ? "Xóa bài hát?" : "Xóa album?"}
            </h2>

            <p>
              Bạn có chắc muốn xóa <strong>{confirm.item.title}</strong>?
              {confirm.type === "song"
                ? " Thao tác này sẽ xóa bài hát khỏi hệ thống."
                : " Album chỉ có thể xóa khi không còn bài hát."}
            </p>

            <div className="my-content-modal-actions">
              <button
                type="button"
                className="my-content-cancel"
                onClick={() => setConfirm(null)}
                disabled={deleting}
              >
                Giữ lại
              </button>

              <button
                type="button"
                className="my-content-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
