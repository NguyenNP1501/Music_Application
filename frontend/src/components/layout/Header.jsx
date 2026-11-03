import { useState } from "react";
import { useAuth } from "../../services/context/AuthContext";

export default function Header({ navigate, onNotifications }) {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");

  function search(e) {
    e.preventDefault();
    navigate("songs");
    window.dispatchEvent(new CustomEvent("music-search", { detail: keyword }));
  }

  return (
    <header className="top-header">
      <div className="header-intro">
        <h2>Không gian âm nhạc</h2>
        <p>Khám phá và thưởng thức những giai điệu yêu thích</p>
      </div>

      <div className="header-actions">
        <form className="search-box" onSubmit={search}>
          <span>⌕</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm bài hát, nghệ sĩ..."
          />
        </form>

        <button
          className="header-icon"
          onClick={onNotifications}
          aria-label="Thông báo"
        >
          ♧
        </button>

        <button
          className="user-avatar"
          onClick={() => navigate("profile")}
          aria-label="Hồ sơ cá nhân"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" />
          ) : (
            (user?.full_name || user?.email || "U").charAt(0).toUpperCase()
          )}
        </button>
      </div>
    </header>
  );
}
