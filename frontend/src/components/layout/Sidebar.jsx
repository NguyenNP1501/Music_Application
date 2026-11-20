import { useAuth } from "../../services/context/AuthContext";

const menus = [
  { id: "home", icon: "⌂", label: "Trang chủ" },
  { id: "library", icon: "▤", label: "Thư viện" },
  { id: "playlists", icon: "♫", label: "Playlist" },
  { id: "screening", icon: "◉", label: "Phòng công chiếu" },
  { id: "my-content", icon: "▧", label: "Nội dung của tôi" },
];

export default function Sidebar({ page, navigate }) {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand: Match Figma Frame 6:60 */}
      <div className="sidebar-brand" onClick={() => navigate("home")} style={{ cursor: "pointer" }}>
        <span className="brand-icon">◖◖</span>
        <div className="brand-text-group">
          <span className="brand-title">Music</span>
          <span className="brand-subtitle">APPLICATION</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menus.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => navigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </button>
        ))}

        {user?.role === "admin" && (
          <button
            type="button"
            className={`nav-item ${page === "create" ? "active" : ""}`}
            onClick={() => navigate("create")}
          >
            <span className="nav-icon">＋</span>
            <span className="nav-text">Tạo mới</span>
          </button>
        )}
      </nav>

      {user?.role === "admin" && (
        <div className="sidebar-admin">
          <p className="sidebar-label">QUẢN TRỊ</p>

          <button
            type="button"
            className={`nav-item ${page === "admin" ? "active" : ""}`}
            onClick={() => navigate("admin")}
          >
            <span className="nav-icon">⚙</span>
            <span className="nav-text">Quản trị hệ thống</span>
          </button>
        </div>
      )}

      <div className="sidebar-bottom">
        <div className="sidebar-note">Một nhịp điệu. Một hệ thống.</div>
      </div>
    </aside>
  );
}
