import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import PageTitle from "../components/common/PageTitles";
import EmptyState from "../components/common/EmptyState";

import "./PlaylistsPage.css";

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

      setPlaylists(playlistData.playlists || []);
      setSongs(songData.songs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createPlaylist(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await apiRequest("/playlists", {
        method: "POST",
        body: { title, description, visibility },
      });

      setTitle("");
      setDescription("");
      setVisibility("private");
      setMessage("Đã tạo playlist.");
      await loadData(false);
    } catch (err) {
      setError(err.message);
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
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingPlaylist(null);
  }

  function changeEditForm(e) {
    const { name, value } = e.target;
    setEditingPlaylist((old) => ({ ...old, [name]: value }));
  }

  async function updatePlaylist(e) {
    e.preventDefault();

    if (!editingPlaylist?.title.trim()) {
      setError("Tên playlist không được để trống.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await apiRequest(`/playlists/${editingPlaylist.playlist_id}`, {
        method: "PATCH",
        body: {
          title: editingPlaylist.title.trim(),
          description: editingPlaylist.description.trim(),
          visibility: editingPlaylist.visibility,
        },
      });

      setEditingPlaylist(null);
      setMessage("Đã cập nhật playlist.");
      await loadData(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addSong(playlistId) {
    const songId = selectedSongs[playlistId];

    if (!songId) {
      setError("Bạn cần chọn bài hát trước.");
      return;
    }

    try {
      setError("");
      setMessage("");

      await apiRequest(`/playlists/${playlistId}/songs`, {
        method: "POST",
        body: { song_id: Number(songId) },
      });

      setMessage("Đã thêm bài hát vào playlist.");
      setSelectedSongs((old) => ({ ...old, [playlistId]: "" }));
      await loadData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSong(playlistId, songId) {
    if (!window.confirm("Bạn có chắc muốn xóa bài hát này khỏi playlist?"))
      return;

    try {
      setError("");
      setMessage("");

      await apiRequest(`/playlists/${playlistId}/songs/${songId}`, {
        method: "DELETE",
      });

      setMessage("Đã xóa bài hát khỏi playlist.");
      await loadData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePlaylist(playlistId) {
    if (!window.confirm("Bạn có chắc muốn xóa playlist này?")) return;

    try {
      setError("");
      setMessage("");

      await apiRequest(`/playlists/${playlistId}`, {
        method: "DELETE",
      });

      if (editingPlaylist?.playlist_id === playlistId) {
        setEditingPlaylist(null);
      }

      setMessage("Đã xóa playlist.");
      await loadData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="YOUR COLLECTION"
        title="Playlist"
        description="Tạo danh sách phát và lưu những bài hát yêu thích."
      />

      <form className="playlist-create-form" onSubmit={createPlaylist}>
        <h3>Tạo playlist mới</h3>
        <div className="playlist-form-grid">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên playlist"
            maxLength={255}
            required
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả playlist"
            maxLength={255}
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="private">Riêng tư</option>
            <option value="public">Công khai</option>
          </select>
          <button className="primary-button" disabled={saving}>
            {saving ? "Đang tạo..." : "Tạo playlist"}
          </button>
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {loading ? (
        <div className="loading">Đang tải playlist...</div>
      ) : playlists.length ? (
        <div className="playlist-list">
          {playlists.map((playlist) => {
            const isOwner = playlist.Useruser_id === user?.user_id;
            const isEditing =
              editingPlaylist?.playlist_id === playlist.playlist_id;

            return (
              <article className="playlist-card" key={playlist.playlist_id}>
                <div className="playlist-card-heading">
                  <div className="playlist-cover">♫</div>

                  <div className="playlist-details">
                    <h3>{playlist.title}</h3>
                    <p>{playlist.description || "Chưa có mô tả"}</p>
                    <span>
                      {playlist.user?.full_name || "Người dùng"} ·{" "}
                      {playlist.visibility === "public"
                        ? "Công khai"
                        : "Riêng tư"}
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
                        {isEditing ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => deletePlaylist(playlist.playlist_id)}
                      >
                        Xóa playlist
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
                      <input
                        name="title"
                        value={editingPlaylist.title}
                        onChange={changeEditForm}
                        placeholder="Tên playlist"
                        maxLength={255}
                        required
                      />

                      <input
                        name="description"
                        value={editingPlaylist.description}
                        onChange={changeEditForm}
                        placeholder="Mô tả playlist"
                        maxLength={255}
                      />

                      <select
                        name="visibility"
                        value={editingPlaylist.visibility}
                        onChange={changeEditForm}
                      >
                        <option value="private">Riêng tư</option>
                        <option value="public">Công khai</option>
                      </select>

                      <div className="playlist-edit-actions">
                        <button className="primary-button" disabled={saving}>
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
                    </div>
                  </form>
                )}

                <div className="playlist-songs">
                  {(playlist.songs || []).length ? (
                    playlist.songs.map((item) => {
                      const song = item.song;
                      if (!song) return null;

                      return (
                        <div className="playlist-song-row" key={song.song_id}>
                          <div>
                            <strong>{song.title}</strong>
                            <span>{song.singer || "Chưa rõ nghệ sĩ"}</span>
                          </div>

                          {isOwner && (
                            <button
                              type="button"
                              className="text-button danger-text"
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
                          {song.title} - {song.singer}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => addSong(playlist.playlist_id)}
                    >
                      + Thêm bài hát
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
    </>
  );
}
