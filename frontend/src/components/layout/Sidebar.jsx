import { useAuth } from "../../services/context/AuthContext";

const menus = [
  { id: "home", icon: "⌂", label: "Trang chủ" },
  { id: "songs", icon: "♫", label: "Bài hát" },
  { id: "artists", icon: "♬", label: "Nghệ sĩ" },
  { id: "albums", icon: "▣", label: "Album" },
  { id: "playlists", icon: "▤", label: "Playlist" },
  { id: "messages", icon: "✉", label: "Tin nhắn" },
];

export default function Sidebar({ page, navigate }) {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">♫</span>
        <span>Music Space</span>
      </div>

      <p className="sidebar-label">MENU CHÍNH</p>

      <nav className="sidebar-nav">
        {menus.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => navigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {user?.role === "admin" && (
        <>
          <p className="sidebar-label">QUẢN LÝ</p>
          <button
            className={`nav-item ${page === "admin" ? "active" : ""}`}
            onClick={() => navigate("admin")}
          >
            <span className="nav-icon">⚙</span>
            Quản trị hệ thống
          </button>
        </>
      )}

      <div className="sidebar-bottom">
        <div className="sidebar-note">Âm nhạc kết nối mọi cảm xúc.</div>
      </div>
    </aside>
  );
}
