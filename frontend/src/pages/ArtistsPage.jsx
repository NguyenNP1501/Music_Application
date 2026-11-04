import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import PageTitle from "../components/common/PageTitle";
import EmptyState from "../components/common/EmptyState";

export default function ArtistsPage() {
  const [songs, setSongs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/songs")
      .then((data) => setSongs(data.songs || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const artists = useMemo(() => {
    const map = new Map();
    songs.forEach((song) => {
      const name = song.singer?.trim();
      if (!name) return;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(song);
    });
    return [...map.entries()]
      .map(([name, items]) => ({ name, songs: items }))
      .filter((artist) =>
        artist.name.toLowerCase().includes(keyword.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [songs, keyword]);

  return (
    <>
      <PageTitle
        eyebrow="ARTISTS"
        title="Nghệ sĩ"
        description="Danh sách nghệ sĩ được tổng hợp từ dữ liệu bài hát."
      />
      <div className="page-search">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm nghệ sĩ..."
        />
      </div>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <div className="loading">Đang tải nghệ sĩ...</div>
      ) : artists.length ? (
        <div className="artist-grid">
          {artists.map((artist) => (
            <article className="artist-card" key={artist.name}>
              <div className="artist-avatar">
                {artist.name.charAt(0).toUpperCase()}
              </div>
              <strong>{artist.name}</strong>
              <span>{artist.songs.length} bài hát</span>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>Chưa có dữ liệu nghệ sĩ.</EmptyState>
      )}
    </>
  );
}
