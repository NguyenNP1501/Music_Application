import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import PageTitle from "../components/common/PageTitles";
import EmptyState from "../components/common/EmptyState";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [selectedSongs, setSelectedSongs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createPlaylist(e) {
    e.preventDefault();
    try {
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
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addSong(playlistId) {
    const songId = selectedSongs[playlistId];
    if (!songId) return setError("Bạn cần chọn bài hát trước.");

    try {
      setError("");
      await apiRequest(`/playlists/${playlistId}/songs`, {
        method: "POST",
        body: { song_id: Number(songId) },
      });
      setMessage("Đã thêm bài hát vào playlist.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSong(playlistId, songId) {
    if (!window.confirm("Bạn có chắc muốn xóa bài hát này khỏi playlist?"))
      return;
    try {
      await apiRequest(`/playlists/${playlistId}/songs/${songId}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePlaylist(playlistId) {
    if (!window.confirm("Bạn có chắc muốn xóa playlist này?")) return;
    try {
      await apiRequest(`/playlists/${playlistId}`, { method: "DELETE" });
      await loadData();
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
            required
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả playlist"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="private">Riêng tư</option>
            <option value="public">Công khai</option>
          </select>
          <button className="primary-button">Tạo playlist</button>
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
                    <button
                      className="danger-button"
                      onClick={() => deletePlaylist(playlist.playlist_id)}
                    >
                      Xóa playlist
                    </button>
                  )}
                </div>

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
