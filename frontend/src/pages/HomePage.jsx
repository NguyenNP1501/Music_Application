import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitles";
import SongCard from "../components/common/SongCard";
import EmptyState from "../components/common/EmptyState";

export default function HomePage({ navigate }) {
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([apiRequest("/songs"), apiRequest("/albums")])
      .then(([songRes, albumRes]) => {
        if (songRes.status === "fulfilled") {
          const sData = songRes.value;
          setSongs(Array.isArray(sData) ? sData : (sData?.songs || []));
        } else {
          setError(songRes.reason?.message || "Không thể tải danh sách bài hát.");
        }
        if (albumRes.status === "fulfilled") {
          const aData = albumRes.value;
          setAlbums(Array.isArray(aData) ? aData : (aData?.albums || []));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="home-hero">
        <div>
          <span className="eyebrow">MUSIC SPACE</span>
          <h1>Âm nhạc dành riêng cho bạn</h1>
          <p>Khám phá những bài hát và album đang có trong thư viện.</p>
          <button className="primary-button" onClick={() => navigate("songs")}>
            Khám phá bài hát
          </button>
        </div>
        <div className="hero-decoration">♫</div>
      </section>

      {error && <p className="error-message">{error}</p>}

      <section className="content-section">
        <PageTitle
          eyebrow="YOUR MUSIC"
          title="Bài hát mới"
          description="Những bài hát được thêm gần đây."
          action={
            <button className="text-button" onClick={() => navigate("songs")}>
              Xem tất cả →
            </button>
          }
        />
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : songs.length ? (
          <div className="song-grid">
            {songs.slice(0, 8).map((song) => (
              <SongCard key={song.id || song.song_id} song={song} />
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có bài hát trong hệ thống.</EmptyState>
        )}
      </section>

      <section className="content-section">
        <PageTitle
          eyebrow="COLLECTION"
          title="Album"
          description="Các album hiện có trong thư viện."
          action={
            <button className="text-button" onClick={() => navigate("albums")}>
              Xem tất cả →
            </button>
          }
        />
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : albums.length ? (
          <div className="album-grid">
            {albums.slice(0, 4).map((album) => (
              <article className="album-card" key={album.album_id}>
                <div className="album-cover">
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt={album.title} />
                  ) : (
                    "▣"
                  )}
                </div>
                <strong>{album.title}</strong>
                <span>{album.songs?.length || 0} bài hát</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có album.</EmptyState>
        )}
      </section>
    </>
  );
}
