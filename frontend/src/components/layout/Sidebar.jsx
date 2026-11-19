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
      <div className="sidebar-brand">
        <span className="brand-icon">♫</span>
        <span className="brand-name">Music Space</span>
      </div>

      <p className="sidebar-label">MENU CHÍNH</p>

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
      </nav>

      {user?.role === "admin" && (
        <button
          className={`nav-item ${page === "create" ? "active" : ""}`}
          onClick={() => navigate("create")}
        >
          <span className="nav-icon">＋</span>
          Tạo mới
        </button>
      )}

      {user?.role === "admin" && (
        <div className="sidebar-admin">
          <p className="sidebar-label">QUẢN LÝ</p>

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
        <div className="sidebar-note">Âm nhạc kết nối mọi cảm xúc.</div>
      </div>
    </aside>
  );
}
