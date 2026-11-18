import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import PageTitle from "../components/common/PageTitles";
import EmptyState from "../components/common/EmptyState";
import "./PlaylistsPage.css";
import { showToast } from "../utils/toast";

export default function PlaylistsPage() {
  const { user } = useAuth();

  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [selectedSongs, setSelectedSongs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const [playlistData, songData] = await Promise.all([
        apiRequest("/playlists"),
        apiRequest("/songs"),
      ]);

      setPlaylists(
        Array.isArray(playlistData)
          ? playlistData
          : playlistData?.playlists || [],
      );

      setSongs(Array.isArray(songData) ? songData : songData?.songs || []);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu playlist.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createPlaylist(e) {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Vui lòng nhập tên playlist.", "error");
      return;
    }

    try {
      setSaving(true);

      await apiRequest("/playlists", {
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          visibility,
        },
      });

      setTitle("");
      setDescription("");
      setVisibility("private");

      showToast("Đã tạo playlist thành công.");
      await loadData(false);
    } catch (err) {
      showToast(err.message || "Không thể tạo playlist.", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(playlist) {
    setEditingPlaylist({
      playlist_id: playlist.playlist_id,
      title: playlist.title || "",
      description: playlist.description || "",
      visibility: playlist.visibility || "private",
    });
  }

  function cancelEdit() {
    setEditingPlaylist(null);
  }

  function changeEditForm(e) {
    const { name, value } = e.target;

    setEditingPlaylist((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function updatePlaylist(e) {
    e.preventDefault();

    if (!editingPlaylist?.title.trim()) {
      showToast("Tên playlist không được để trống.", "error");
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`/playlists/${editingPlaylist.playlist_id}`, {
        method: "PATCH",
        body: {
          title: editingPlaylist.title.trim(),
          description: editingPlaylist.description.trim(),
          visibility: editingPlaylist.visibility,
        },
      });

      setEditingPlaylist(null);
      showToast("Đã cập nhật playlist thành công.");
      await loadData(false);
    } catch (err) {
      showToast(err.message || "Không thể cập nhật playlist.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function addSong(playlistId) {
    const songId = selectedSongs[playlistId];

    if (!songId) {
      showToast("Bạn cần chọn bài hát trước.", "error");
      return;
    }

    try {
      await apiRequest(`/playlists/${playlistId}/songs`, {
        method: "POST",
        body: {
          song_id: Number(songId),
        },
      });

      setSelectedSongs((old) => ({
        ...old,
        [playlistId]: "",
      }));

      showToast("Đã thêm bài hát vào playlist.");
      await loadData(false);
    } catch (err) {
      showToast(err.message || "Không thể thêm bài hát.", "error");
    }
  }

  async function removeSong(playlistId, songId) {
    if (!window.confirm("Bạn có chắc muốn xóa bài hát này khỏi playlist?")) {
      return;
    }

    try {
      await apiRequest(`/playlists/${playlistId}/songs/${songId}`, {
        method: "DELETE",
      });

      showToast("Đã xóa bài hát khỏi playlist.");
      await loadData(false);
    } catch (err) {
      showToast(err.message || "Không thể xóa bài hát.", "error");
    }
  }
  async function deletePlaylist(playlistId) {
    if (!window.confirm("Bạn có chắc muốn xóa playlist này?")) {
      return;
    }

    try {
      await apiRequest(`/playlists/${playlistId}`, {
        method: "DELETE",
      });

      if (editingPlaylist?.playlist_id === playlistId) {
        setEditingPlaylist(null);
      }

      showToast("Đã xóa playlist thành công.");
      await loadData(false);
    } catch (err) {
      showToast(err.message || "Không thể xóa playlist.", "error");
    }
  }

  return (
    <div className="playlists-page">
      <PageTitle
        eyebrow="YOUR COLLECTION"
        title="Playlist"
        description="Tạo danh sách phát và quản lý những bài hát yêu thích."
      />

      <section className="playlist-create-form">
        <div className="playlist-section-heading">
          <div className="playlist-section-icon">＋</div>
          <div>
            <h3>Tạo playlist mới</h3>
            <p>Tạo một danh sách phát theo sở thích của bạn.</p>
          </div>
        </div>

        <form onSubmit={createPlaylist}>
          <div className="playlist-form-grid">
            <label>
              <span>Tên playlist</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Những bài hát yêu thích"
                maxLength={255}
                required
              />
            </label>

            <label>
              <span>Mô tả</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về playlist"
                maxLength={255}
              />
            </label>

            <label>
              <span>Quyền riêng tư</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="private">Riêng tư</option>
                <option value="public">Công khai</option>
              </select>
            </label>

            <button
              type="submit"
              className="primary-button playlist-create-button"
              disabled={saving}
            >
              {saving ? "Đang tạo..." : "＋ Tạo playlist"}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="playlist-alert playlist-alert-error" role="alert">
          <span>!</span>
          {error}
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      <div className="playlist-list-heading">
        <div>
          <span className="playlist-eyebrow">LIBRARY</span>
          <h2>Danh sách playlist</h2>
          <p>Những danh sách phát hiện có trong hệ thống.</p>
        </div>

        {!loading && (
          <span className="playlist-count">{playlists.length} playlist</span>
        )}
      </div>

      {loading ? (
        <div className="playlist-loading">
          <span className="playlist-spinner" />
          Đang tải playlist...
        </div>
      ) : playlists.length > 0 ? (
        <div className="playlist-list">
          {playlists.map((playlist) => {
            const isOwner = playlist.Useruser_id === user?.user_id;

            const isEditing =
              editingPlaylist?.playlist_id === playlist.playlist_id;

            const playlistSongs = playlist.songs || [];

            return (
              <article className="playlist-card" key={playlist.playlist_id}>
                <div className="playlist-card-heading">
                  <div className="playlist-cover">
                    <span>♫</span>
                  </div>

                  <div className="playlist-details">
                    <div className="playlist-title-row">
                      <h3>{playlist.title}</h3>

                      <span
                        className={`playlist-visibility ${
                          playlist.visibility === "public"
                            ? "public"
                            : "private"
                        }`}
                      >
                        {playlist.visibility === "public"
                          ? "Công khai"
                          : "Riêng tư"}
                      </span>
                    </div>

                    <p>{playlist.description || "Chưa có mô tả"}</p>

                    <span className="playlist-owner">
                      {playlist.user?.full_name || "Người dùng"}
                      {" · "}
                      {playlistSongs.length} bài hát
                    </span>
                  </div>

                  {isOwner && (
                    <div className="playlist-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          isEditing ? cancelEdit() : startEdit(playlist)
                        }
                      >
                        {isEditing ? "Đóng" : "Chỉnh sửa"}
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => deletePlaylist(playlist.playlist_id)}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <form
                    className="playlist-edit-form"
                    onSubmit={updatePlaylist}
                  >
                    <h4>Chỉnh sửa playlist</h4>

                    <div className="playlist-edit-grid">
                      <label>
                        <span>Tên playlist</span>
                        <input
                          name="title"
                          value={editingPlaylist.title}
                          onChange={changeEditForm}
                          maxLength={255}
                          required
                        />
                      </label>

                      <label>
                        <span>Mô tả</span>
                        <input
                          name="description"
                          value={editingPlaylist.description}
                          onChange={changeEditForm}
                          maxLength={255}
                        />
                      </label>

                      <label>
                        <span>Quyền riêng tư</span>
                        <select
                          name="visibility"
                          value={editingPlaylist.visibility}
                          onChange={changeEditForm}
                        >
                          <option value="private">Riêng tư</option>
                          <option value="public">Công khai</option>
                        </select>
                      </label>
                    </div>

                    <div className="playlist-edit-actions">
                      <button
                        type="submit"
                        className="primary-button"
                        disabled={saving}
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}

                <div className="playlist-songs">
                  <div className="playlist-songs-heading">
                    <h4>Bài hát trong playlist</h4>
                    <span>{playlistSongs.length} bài</span>
                  </div>

                  {playlistSongs.length > 0 ? (
                    playlistSongs.map((item) => {
                      const song = item.song;
                      if (!song) return null;

                      return (
                        <div className="playlist-song-row" key={song.song_id}>
                          <div className="playlist-song-icon">♫</div>

                          <div className="playlist-song-info">
                            <strong>{song.title}</strong>
                            <span>{song.singer || "Chưa rõ nghệ sĩ"}</span>
                          </div>

                          {isOwner && (
                            <button
                              type="button"
                              className="playlist-remove-song"
                              onClick={() =>
                                removeSong(playlist.playlist_id, song.song_id)
                              }
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState>Playlist chưa có bài hát.</EmptyState>
                  )}
                </div>

                {isOwner && (
                  <div className="playlist-add-song">
                    <select
                      aria-label="Chọn bài hát muốn thêm"
                      value={selectedSongs[playlist.playlist_id] || ""}
                      onChange={(e) =>
                        setSelectedSongs((old) => ({
                          ...old,
                          [playlist.playlist_id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Chọn bài hát muốn thêm</option>

                      {songs.map((song) => (
                        <option key={song.song_id} value={song.song_id}>
                          {song.title} - {song.singer || "Chưa rõ nghệ sĩ"}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => addSong(playlist.playlist_id)}
                    >
                      ＋ Thêm bài hát
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState>Bạn chưa có playlist nào.</EmptyState>
      )}
    </div>
  );
}
