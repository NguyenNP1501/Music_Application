import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import PageTitles from "../components/common/PageTitles";
import Pagination from "../components/common/Pagination";

import "./AdminDashboardPage.css";

const tabs = [
  { id: "users", label: "Tài khoản" },
  { id: "songs", label: "Bài hát" },
  { id: "albums", label: "Album" },
];

const emptySong = {
  title: "",
  singer: "",
  composer: "",
  genre: "",
  audio_url: "",
  Albumalbum_id: "",
  release: new Date().toISOString().slice(0, 10),
  description: "",
};

const emptyAlbum = {
  title: "",
  release: new Date().toISOString().slice(0, 10),
  cover_image_url: "",
  description: "",
};

export default function AdminDashboardPage({ mode = "manage" }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(mode === "create" ? "songs" : "users");
  const [users, setUsers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [songForm, setSongForm] = useState(emptySong);
  const [albumForm, setAlbumForm] = useState(emptyAlbum);
  const [editingSongId, setEditingSongId] = useState(null);
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [songFile, setSongFile] = useState(null);
  const [showSongForm, setShowSongForm] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [songPage, setSongPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const [songTotalPages, setSongTotalPages] = useState(1);
  const [albumTotalPages, setAlbumTotalPages] = useState(1);
  const [songTotal, setSongTotal] = useState(0);
  const [albumTotal, setAlbumTotal] = useState(0);
  const [allAlbums, setAllAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);

  async function loadUsers(q = "", page = userPage) {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (q.trim()) {
      params.set("q", q.trim());
    }

    const data = await apiRequest(`/users/admin/users?${params}`);

    setUsers(data.users || []);
    setUserPage(data.pagination?.page || 1);
    setUserTotal(data.pagination?.total || 0);
    setUserTotalPages(data.pagination?.totalPages || 1);

    return data;
  }

  async function loadSongs(q = keyword, page = songPage) {
    const data = await apiRequest(
      `/songs?page=${page}&limit=12&q=${encodeURIComponent(q)}`,
    );
    setSongs(data.songs || []);
    setSongPage(page);
    setSongTotal(data.pagination?.total || 0);
    setSongTotalPages(data.pagination?.totalPages || 1);
  }

  async function loadAlbums(q = keyword, page = albumPage) {
    const data = await apiRequest(
      `/albums?page=${page}&limit=12&q=${encodeURIComponent(q)}`,
    );
    setAlbums(data.albums || []);
    setAlbumPage(page);
    setAlbumTotal(data.pagination?.total || 0);
    setAlbumTotalPages(data.pagination?.totalPages || 1);
  }

  async function loadAllAlbums() {
    const first = await apiRequest("/albums?page=1&limit=100");
    const rows = [...(first.albums || [])];
    const totalPages = first.pagination?.totalPages || 1;

    for (let page = 2; page <= totalPages; page++) {
      const data = await apiRequest(`/albums?page=${page}&limit=100`);
      rows.push(...(data.albums || []));
    }

    setAllAlbums(rows);
  }

  async function reloadSongsAfterDelete() {
    const nextPage =
      songs.length === 1 && songPage > 1 ? songPage - 1 : songPage;

    await loadSongs(keyword, nextPage);
  }

  async function reloadAlbumsAfterDelete() {
    const nextPage =
      albums.length === 1 && albumPage > 1 ? albumPage - 1 : albumPage;

    await loadAlbums(keyword, nextPage);
    await loadAllAlbums();
  }

  async function loadCurrentTab(q = keyword) {
    setLoading(true);
    setError("");

    try {
      if (tab === "users") await loadUsers(q, 1);
      if (tab === "songs") await loadSongs(q, 1);
      if (tab === "albums") await loadAlbums(q, 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        await Promise.all([
          loadUsers("", 1),
          loadSongs("", 1),
          loadAlbums("", 1),
          loadAllAlbums(),
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function changeTab(nextTab) {
    setTab(nextTab);
    setKeyword("");
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (nextTab === "users") await loadUsers("", 1);
      if (nextTab === "songs") await loadSongs("", 1);
      if (nextTab === "albums") await loadAlbums("", 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function search(e) {
    e.preventDefault();
    await loadCurrentTab(keyword);
  }

  async function changeRole(target) {
    const nextRole = target.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Đổi vai trò tài khoản này thành ${nextRole}?`)) return;

    try {
      setError("");
      setMessage("");
      await apiRequest(`/users/admin/users/${target.user_id}/role`, {
        method: "PATCH",
        body: { role: nextRole },
      });
      setMessage("Đã cập nhật vai trò tài khoản.");
      await loadUsers(keyword, userPage);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteUser(target) {
    if (!window.confirm(`Bạn chắc chắn muốn xóa tài khoản ${target.email}?`))
      return;

    try {
      setError("");
      setMessage("");
      await apiRequest(`/users/admin/users/${target.user_id}`, {
        method: "DELETE",
      });
      setMessage("Đã xóa tài khoản.");
      const nextPage =
        users.length === 1 && userPage > 1 ? userPage - 1 : userPage;

      await loadUsers(keyword, nextPage);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createSong(e) {
    e.preventDefault();
    if (!songFile) {
      setError("Vui lòng chọn file MP3.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      Object.entries(songForm).forEach(([key, value]) => {
        if (key !== "audio_url") formData.append(key, value);
      });
      formData.append("audio", songFile);

      await apiRequest("/songs/upload", {
        method: "POST",
        body: formData,
      });

      setSongForm(emptySong);
      setSongFile(null);
      setShowSongForm(false);
      setMessage("Đã tải nhạc lên và thêm bài hát vào thư viện.");
      await loadSongs(keyword, 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditSong(song) {
    setEditingSongId(song.song_id);
    setSongFile(null);

    setSongForm({
      title: song.title || "",
      singer: song.singer || "",
      composer: song.composer || "",
      genre: song.genre || "",
      audio_url: song.audio_url || "",
      Albumalbum_id: String(song.Albumalbum_id || ""),
      release: song.release
        ? new Date(song.release).toISOString().slice(0, 10)
        : "",
      description: song.description || "",
    });

    setShowSongForm(true);
    setError("");
    setMessage("");
  }

  async function updateSong(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { audio_url, ...songData } = songForm;
      let body = {
        ...songData,
        Albumalbum_id: songForm.Albumalbum_id
          ? Number(songForm.Albumalbum_id)
          : null,
      };

      // Nếu có chọn file mới, gửi multipart/form-data
      if (songFile) {
        const formData = new FormData();
        Object.entries(body).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append("audio", songFile);
        body = formData;
      }
      const result = await apiRequest(`/songs/${editingSongId}`, {
        method: "PATCH",
        body,
      });

      setSongForm(emptySong);
      setSongFile(null);
      setEditingSongId(null);
      setShowSongForm(false);
      setMessage(
        result.cleanup_pending
          ? "Đã cập nhật bài hát, nhưng file nhạc cũ cần được dọn dẹp trên Cloudinary."
          : "Đã cập nhật bài hát thành công.",
      );
      await loadSongs(keyword, 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSong(song) {
    if (
      !window.confirm(
        `Bạn chắc chắn muốn xóa bài hát "${song.title}"?\n\nBài hát cũng sẽ bị xóa khỏi các playlist có chứa bài hát này.`,
      )
    )
      return;

    try {
      const result = await apiRequest(`/songs/${song.song_id}`, {
        method: "DELETE",
      });
      setMessage(
        result.cleanup_pending
          ? "Đã xóa bài hát khỏi hệ thống, nhưng file Cloudinary cần được dọn dẹp."
          : "Đã xóa bài hát và file lưu trữ.",
      );
      await reloadSongsAfterDelete();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAlbum(album) {
    const songCount = album.songs?.length || 0;

    if (songCount > 0) {
      setError(
        `Không thể xóa album "${album.title}" vì vẫn còn ${songCount} bài hát. Hãy xử lý các bài hát trước.`,
      );
      setMessage("");
      return;
    }

    if (!window.confirm(`Bạn chắc chắn muốn xóa album "${album.title}"?`))
      return;

    try {
      setError("");
      setMessage("");
      await apiRequest(`/albums/${album.album_id}`, { method: "DELETE" });
      setMessage("Đã xóa album.");
      await reloadAlbumsAfterDelete();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createAlbum(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("/albums", {
        method: "POST",
        body: albumForm,
      });

      setAlbumForm(emptyAlbum);
      setShowAlbumForm(false);
      setMessage("Đã thêm album.");
      await loadAlbums(keyword, 1);
      await loadAllAlbums();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditAlbum(album) {
    setEditingAlbumId(album.album_id);
    setAlbumForm({
      title: album.title || "",
      release: album.release
        ? new Date(album.release).toISOString().slice(0, 10)
        : "",
      cover_image_url: album.cover_image_url || "",
      description: album.description || "",
    });
    setShowAlbumForm(true);
    setError("");
    setMessage("");
  }

  async function updateAlbum(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/albums/${editingAlbumId}`, {
        method: "PATCH",
        body: albumForm,
      });

      setAlbumForm(emptyAlbum);
      setEditingAlbumId(null);
      setShowAlbumForm(false);
      setMessage("Đã cập nhật album.");
      await loadAlbums(keyword, albumPage);
      await loadAllAlbums();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="admin-page">
        <PageTitles title="Quản trị hệ thống" />
        <p className="admin-error">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageTitles
        eyebrow={mode === "create" ? "CONTENT CREATION" : "SYSTEM MANAGEMENT"}
        title={mode === "create" ? "Tạo nội dung mới" : "Quản trị hệ thống"}
        description={
          mode === "create"
            ? "Thêm bài hát và album mới vào thư viện Music Space."
            : "Quản lý tài khoản người dùng và thư viện âm nhạc."
        }
      />

      {mode !== "create" && (
        <div className="admin-overview">
          <div>
            <span>Tài khoản</span>
            <strong>{userTotal}</strong>
          </div>
          <div>
            <span>Bài hát</span>
            <strong>{songTotal}</strong>
          </div>
          <div>
            <span>Album</span>
            <strong>{albumTotal}</strong>
          </div>
        </div>
      )}

      {mode !== "create" && (
        <div className="admin-toolbar">
          <div className="admin-tabs">
            {tabs.map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => changeTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form className="admin-search" onSubmit={search}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={
                tab === "users"
                  ? "Tìm theo tên hoặc email..."
                  : tab === "songs"
                    ? "Tìm bài hát, ca sĩ..."
                    : "Tìm album..."
              }
            />
            <button type="submit">Tìm kiếm</button>
          </form>
        </div>
      )}

      {error && <p className="admin-alert error">{error}</p>}
      {message && <p className="admin-alert success">{message}</p>}

      {mode === "create" && (
        <div className="create-content-options">
          <button
            type="button"
            className={tab === "songs" ? "active" : ""}
            onClick={() => {
              setTab("songs");
              setShowSongForm(true);
              setShowAlbumForm(false);
              setEditingSongId(null);
              setEditingAlbumId(null);
              setSongForm(emptySong);
              setAlbumForm(emptyAlbum);
              setSongFile(null);
              setError("");
              setMessage("");
            }}
          >
            <span className="create-content-icon">♫</span>
            <span>
              <strong>Thêm bài hát mới</strong>
              <small>Upload file MP3 và nhập thông tin bài hát.</small>
            </span>
            <span className="create-content-arrow">→</span>
          </button>

          <button
            type="button"
            className={tab === "albums" ? "active" : ""}
            onClick={() => {
              setTab("albums");
              setShowAlbumForm(true);
              setShowSongForm(false);
              setEditingSongId(null);
              setEditingAlbumId(null);
              setSongForm(emptySong);
              setAlbumForm(emptyAlbum);
              setSongFile(null);
              setError("");
              setMessage("");
            }}
          >
            <span className="create-content-icon">▣</span>
            <span>
              <strong>Thêm album mới</strong>
              <small>Tạo album và bổ sung thông tin, ảnh bìa.</small>
            </span>
            <span className="create-content-arrow">→</span>
          </button>
        </div>
      )}

      {mode !== "create" && tab === "songs" && (
        <div className="admin-actions">
          <button onClick={() => setShowSongForm((v) => !v)}>
            {showSongForm ? "Đóng biểu mẫu" : "+ Thêm bài hát"}
          </button>
        </div>
      )}

      {mode !== "create" && tab === "albums" && (
        <div className="admin-actions">
          <button onClick={() => setShowAlbumForm((v) => !v)}>
            {showAlbumForm ? "Đóng biểu mẫu" : "+ Thêm album"}
          </button>
        </div>
      )}

      {showSongForm && tab === "songs" && (
        <form
          className="admin-form"
          onSubmit={editingSongId ? updateSong : createSong}
        >
          <h3>{editingSongId ? "Chỉnh sửa bài hát" : "Thêm bài hát mới"}</h3>
          <div className="admin-form-grid">
            <label>
              Tên bài hát *
              <input
                value={songForm.title}
                onChange={(e) =>
                  setSongForm({ ...songForm, title: e.target.value })
                }
                required
              />
            </label>
            <label>
              Ca sĩ *
              <input
                value={songForm.singer}
                onChange={(e) =>
                  setSongForm({ ...songForm, singer: e.target.value })
                }
                required
              />
            </label>
            <label>
              Nhạc sĩ *
              <input
                value={songForm.composer}
                onChange={(e) =>
                  setSongForm({ ...songForm, composer: e.target.value })
                }
                required
              />
            </label>
            <label>
              Thể loại *
              <input
                value={songForm.genre}
                onChange={(e) =>
                  setSongForm({ ...songForm, genre: e.target.value })
                }
                required
              />
            </label>
            <label className="admin-form-wide">
              File nhạc MP3 {editingSongId ? "(không bắt buộc)" : "*"}
              <input
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={(e) => setSongFile(e.target.files?.[0] || null)}
                required={!editingSongId}
              />
              <small>Chỉ chấp nhận file MP3, dung lượng tối đa 20 MB.</small>
              {songFile && <small>Đã chọn: {songFile.name}</small>}
              {editingSongId && (
                <small>
                  Không chọn file mới nếu bạn chỉ muốn sửa thông tin bài hát.
                </small>
              )}
            </label>
            <label>
              Album
              <select
                value={songForm.Albumalbum_id}
                onChange={(e) =>
                  setSongForm({
                    ...songForm,
                    Albumalbum_id: e.target.value,
                  })
                }
              >
                <option value="">Không thuộc album</option>

                {allAlbums.map((album) => (
                  <option key={album.album_id} value={album.album_id}>
                    {album.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ngày phát hành *
              <input
                type="date"
                value={songForm.release}
                onChange={(e) =>
                  setSongForm({ ...songForm, release: e.target.value })
                }
                required
              />
            </label>
            <label className="admin-form-wide">
              Mô tả
              <textarea
                value={songForm.description}
                onChange={(e) =>
                  setSongForm({ ...songForm, description: e.target.value })
                }
              />
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="admin-submit" disabled={saving}>
              {saving
                ? "Đang lưu..."
                : editingSongId
                  ? "Cập nhật bài hát"
                  : "Lưu bài hát"}
            </button>

            {editingSongId && (
              <button
                type="button"
                className="admin-cancel"
                onClick={() => {
                  setEditingSongId(null);
                  setSongForm(emptySong);
                  setShowSongForm(false);
                  setSongFile(null);
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      {showAlbumForm && tab === "albums" && (
        <form
          className="admin-form"
          onSubmit={editingAlbumId ? updateAlbum : createAlbum}
        >
          <h3>{editingAlbumId ? "Chỉnh sửa album" : "Thêm album mới"}</h3>
          <div className="admin-form-grid">
            <label>
              Tên album *
              <input
                value={albumForm.title}
                onChange={(e) =>
                  setAlbumForm({ ...albumForm, title: e.target.value })
                }
                required
              />
            </label>
            <label>
              Ngày phát hành *
              <input
                type="date"
                value={albumForm.release}
                onChange={(e) =>
                  setAlbumForm({ ...albumForm, release: e.target.value })
                }
                required
              />
            </label>
            <label className="admin-form-wide">
              Đường dẫn ảnh bìa
              <input
                type="url"
                value={albumForm.cover_image_url}
                onChange={(e) =>
                  setAlbumForm({
                    ...albumForm,
                    cover_image_url: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </label>
            <label className="admin-form-wide">
              Mô tả
              <textarea
                value={albumForm.description}
                onChange={(e) =>
                  setAlbumForm({ ...albumForm, description: e.target.value })
                }
              />
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="admin-submit" disabled={saving}>
              {saving
                ? "Đang lưu..."
                : editingAlbumId
                  ? "Cập nhật album"
                  : "Lưu album"}
            </button>

            {editingAlbumId && (
              <button
                type="button"
                className="admin-cancel"
                onClick={() => {
                  setEditingAlbumId(null);
                  setAlbumForm(emptyAlbum);
                  setShowAlbumForm(false);
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      {mode !== "create" && (
        <section className="admin-table-section">
          {loading ? (
            <p className="admin-loading">Đang tải dữ liệu...</p>
          ) : tab === "users" ? (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ảnh bìa</th>
                    <th>Tên album</th>
                    <th>Ngày phát hành</th>
                    <th>Số bài hát</th>
                    <th>Người tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {albums.map((album) => (
                    <tr key={album.album_id}>
                      <td>
                        {album.cover_image_url ? (
                          <img
                            src={album.cover_image_url}
                            alt={album.title}
                            className="admin-album-cover"
                          />
                        ) : (
                          <div className="admin-album-cover-placeholder">♫</div>
                        )}
                      </td>

                      <td>
                        <div className="admin-album-info">
                          <strong>{album.title}</strong>
                          <small>{album.description || "Chưa có mô tả"}</small>
                        </div>
                      </td>

                      <td>
                        {album.release
                          ? new Date(album.release).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>

                      <td>{album.songs?.length || 0}</td>

                      <td>{album.user?.full_name || "—"}</td>

                      <td>
                        <div className="admin-row-actions">
                          <button onClick={() => startEditAlbum(album)}>
                            Sửa
                          </button>

                          <button
                            className="delete"
                            onClick={() => deleteAlbum(album)}
                            disabled={(album.songs?.length || 0) > 0}
                            title={
                              album.songs?.length > 0
                                ? "Album vẫn còn bài hát"
                                : "Xóa album"
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                page={albumPage}
                totalPages={albumTotalPages}
                onChange={async (nextPage) => {
                  setLoading(true);
                  setError("");

                  try {
                    await loadAlbums(keyword, nextPage);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </>
          ) : tab === "songs" ? (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bài hát</th>
                    <th>Ca sĩ</th>
                    <th>Nhạc sĩ</th>
                    <th>Thể loại</th>
                    <th>Album</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => (
                    <tr key={song.song_id}>
                      <td>{song.title}</td>
                      <td>{song.singer}</td>
                      <td>{song.composer}</td>
                      <td>{song.genre}</td>
                      <td>{song.album?.title || "Không thuộc album"}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button onClick={() => startEditSong(song)}>
                            Sửa
                          </button>
                          <button
                            className="delete"
                            onClick={() => deleteSong(song)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                page={songPage}
                totalPages={songTotalPages}
                onChange={async (nextPage) => {
                  setLoading(true);
                  setError("");
                  try {
                    await loadSongs(keyword, nextPage);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Album</th>
                    <th>Số bài hát</th>
                    <th>Ngày phát hành</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((album) => (
                    <tr key={album.album_id}>
                      <td>{album.title}</td>
                      <td>{album.songs?.length || 0}</td>
                      <td>
                        {album.release
                          ? new Date(album.release).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button onClick={() => startEditAlbum(album)}>
                            Sửa
                          </button>
                          <button
                            className="delete"
                            onClick={() => deleteAlbum(album)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                page={albumPage}
                totalPages={albumTotalPages}
                onChange={async (nextPage) => {
                  setLoading(true);
                  setError("");
                  try {
                    await loadAlbums(keyword, nextPage);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </>
          )}

          {!loading &&
            ((tab === "users" && users.length === 0) ||
              (tab === "songs" && songs.length === 0) ||
              (tab === "albums" && albums.length === 0)) && (
              <p className="admin-empty">Không có dữ liệu phù hợp.</p>
            )}
        </section>
      )}
    </div>
  );
}
