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
    if (keyword.trim()) {
      navigate("songs");
      window.dispatchEvent(new CustomEvent("music-search", { detail: keyword.trim() }));
    }
  }

  const userInitial = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="top-header">
      {/* Search Bar - Figma Frame 6:34 */}
      <form className="header-search-bar" onSubmit={search}>
        <span className="search-icon">⌕</span>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm bài hát, album, nghệ sĩ..."
        />
      </form>

      <div className="header-actions">
        {user?.role === "admin" && (
          <button
            type="button"
            className="secondary-button header-create-btn"
            onClick={() => navigate("create")}
          >
            <span>＋</span> Tạo mới
          </button>
        )}

        <button
          type="button"
          className="header-action-btn"
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
          className="header-action-btn"
          onClick={onNotifications}
          aria-label="Thông báo"
          title="Thông báo"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </button>

        {/* User Avatar - Figma Frame 6:37 */}
        <button
          type="button"
          className="header-user-avatar"
          onClick={() => navigate("profile")}
          aria-label="Hồ sơ cá nhân"
          title={user?.full_name || user?.email}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" />
          ) : (
            <span>{userInitial}</span>
          )}
        </button>
      </div>
    </header>
  );
}
