import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import SongsPage from "./SongsPage";
import ArtistsPage from "./ArtistsPage";
import AlbumsPage from "./AlbumsPage";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";
import "./LibraryPage.css";

const TABS = [
  { id: "playlists", label: "Playlist của tôi" },
  { id: "saved", label: "Đã lưu" },
  { id: "recent", label: "Nghe gần đây" },
  { id: "songs", label: "Bài hát" },
  { id: "artists", label: "Nghệ sĩ" },
  { id: "albums", label: "Album" },
];

export default function LibraryPage({
  onNavigate,
  onSelectAlbum,
  onSelectArtist,
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("playlists");
  const [playlists, setPlaylists] = useState([]);
  const [savedSongs, setSavedSongs] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const storageKey = (type) => `music-space-${type}-${user?.user_id}`;

  const loadLocalSongs = useCallback(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey("saved")) || "[]",
      );

      const recent = JSON.parse(
        localStorage.getItem(storageKey("recent")) || "[]",
      );

      setSavedSongs(Array.isArray(saved) ? saved : []);
      setRecentSongs(Array.isArray(recent) ? recent : []);
    } catch {
      setSavedSongs([]);
      setRecentSongs([]);
    }
  }, [user?.user_id]);

  const loadPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/playlists");
      const allPlaylists = data.playlists || [];

      setPlaylists(
        allPlaylists.filter(
          (playlist) => playlist.Useruser_id === user?.user_id,
        ),
      );
    } catch (err) {
      setError(err.message || "Không thể tải playlist.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadLocalSongs();
    loadPlaylists();
  }, [loadLocalSongs, loadPlaylists]);

  useEffect(() => {
    const handleSavedChange = () => loadLocalSongs();
    window.addEventListener("music-saved-change", handleSavedChange);
    return () =>
      window.removeEventListener("music-saved-change", handleSavedChange);
  }, [loadLocalSongs]);

  useEffect(() => {
    const handleRecentChange = () => {
      try {
        const recent = JSON.parse(
          localStorage.getItem(storageKey("recent")) || "[]",
        );
        setRecentSongs(Array.isArray(recent) ? recent : []);
      } catch {
        setRecentSongs([]);
      }
    };

    window.addEventListener("music-recent-change", handleRecentChange);

    return () => {
      window.removeEventListener("music-recent-change", handleRecentChange);
    };
  }, [user?.user_id]);

  const removeSavedSong = (songId) => {
    const next = savedSongs.filter((song) => song.song_id !== songId);

    setSavedSongs(next);
    localStorage.setItem(storageKey("saved"), JSON.stringify(next));

    window.dispatchEvent(new Event("music-saved-change"));
  };

  const clearRecent = () => {
    setRecentSongs([]);
    localStorage.removeItem(storageKey("recent"));
  };

  const renderPlaylists = () => {
    if (loading) {
      return <div className="loading">Đang tải playlist...</div>;
    }

    if (!playlists.length) {
      return (
        <EmptyState>
          Bạn chưa có playlist nào. Hãy tạo playlist để lưu những bài hát yêu
          thích.
        </EmptyState>
      );
    }

    return (
      <div className="library-playlist-grid">
        {playlists.map((playlist) => {
          const songs = playlist.songs || [];

          return (
            <article
              className="library-playlist-card"
              key={playlist.playlist_id}
              onClick={() => onNavigate?.("playlists")}
            >
              <div className="library-playlist-cover">
                {playlist.cover_image_url ? (
                  <img src={playlist.cover_image_url} alt={playlist.title} />
                ) : (
                  <span>♫</span>
                )}
              </div>

              <strong>{playlist.title}</strong>

              <span>
                {playlist.visibility === "public" ? "Công khai" : "Riêng tư"} ·{" "}
                {songs.length} bài hát
              </span>
            </article>
          );
        })}
      </div>
    );
  };

  const renderSongs = (songs, emptyText) => {
    if (!songs.length) {
      return <EmptyState>{emptyText}</EmptyState>;
    }

    return (
      <div className="song-grid">
        {songs.map((song) => (
          <SongCard
            key={song.song_id}
            song={song}
            onRemoveSaved={
              activeTab === "saved"
                ? () => removeSavedSong(song.song_id)
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  return (
    <section className="library-page">
      <header className="library-header">
        <span className="library-eyebrow">YOUR COLLECTION</span>
        <h1>Thư viện</h1>
        <p>Quản lý và khám phá kho âm nhạc của bạn.</p>
      </header>

      <nav className="library-tabs" aria-label="Danh mục thư viện">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`library-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="library-content">
        {error && <div className="error-message">{error}</div>}

        {activeTab === "playlists" && (
          <>
            <div className="library-section-heading">
              <div>
                <span className="library-eyebrow">YOUR PLAYLISTS</span>
                <h2>Playlist của tôi</h2>
                <p>Những danh sách phát do bạn tạo.</p>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={() => onNavigate?.("playlists")}
              >
                + Tạo playlist
              </button>
            </div>

            {renderPlaylists()}
          </>
        )}

        {activeTab === "saved" && (
          <>
            <div className="library-section-heading">
              <div>
                <span className="library-eyebrow">YOUR FAVORITES</span>
                <h2>Đã lưu</h2>
                <p>Những bài hát bạn đã lưu lại.</p>
              </div>

              <span className="library-count">{savedSongs.length} bài hát</span>
            </div>

            {renderSongs(savedSongs, "Bạn chưa lưu bài hát nào.")}
          </>
        )}

        {activeTab === "recent" && (
          <>
            <div className="library-section-heading">
              <div>
                <span className="library-eyebrow">LISTENING HISTORY</span>
                <h2>Nghe gần đây</h2>
                <p>Những bài hát bạn đã phát gần đây.</p>
              </div>

              <button
                type="button"
                className="library-clear-button"
                onClick={clearRecent}
                disabled={!recentSongs.length}
              >
                Xóa lịch sử
              </button>
            </div>

            {renderSongs(recentSongs, "Bạn chưa nghe bài hát nào.")}
          </>
        )}

        {activeTab === "songs" && <SongsPage />}

        {activeTab === "artists" && (
          <ArtistsPage onSelectArtist={onSelectArtist} />
        )}

        {activeTab === "albums" && <AlbumsPage onSelectAlbum={onSelectAlbum} />}
      </div>
    </section>
  );
}
