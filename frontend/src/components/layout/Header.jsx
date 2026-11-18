import { useState } from "react";
import { useAuth } from "../../services/context/AuthContext";

export default function Header({
  navigate,
  onNotifications,
  theme,
  onThemeChange,
}) {
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
          type="button"
          className="header-theme-toggle"
          onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          aria-label={
            theme === "dark"
              ? "Chuyển sang giao diện sáng"
              : "Chuyển sang giao diện tối"
          }
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>

        <button
          type="button"
          className="header-icon"
          onClick={onNotifications}
          aria-label="Thông báo"
          title="Thông báo"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </button>

        <button
          type="button"
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
