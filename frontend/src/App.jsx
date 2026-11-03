import { useEffect, useState } from "react";
import { apiRequest } from "./services/api";
import { useAuth } from "./services/context/AuthContext";
import "./App.css";

function App() {
  const { user, loading, login, register, logout, updateUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [page, setPage] = useState("home");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    dateOfBirth: "2000-01-01",
  });
  const [songs, setSongs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState({});
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSongs();
    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (user)
      setProfile({
        full_name: user.full_name || "",
        nickname: user.nickname || "",
        avatar_url: user.avatar_url || "",
        dateOfBirth: user.dateOfBirth
          ? String(user.dateOfBirth).slice(0, 10)
          : "",
      });
  }, [user]);

  async function loadSongs() {
    try {
      const data = await apiRequest("/songs");
      setSongs(data.songs || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadNotifications() {
    try {
      const data = await apiRequest("/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await register(form);
      else await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const data = { ...profile };
      if (password) data.password = password;
      await updateUser(data);
      setPassword("");
      setNotice("Cập nhật thông tin thành công.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function readNotification(item) {
    if (item.is_read) return;
    try {
      await apiRequest(`/notifications/${item.notification_id}/read`, {
        method: "PATCH",
      });
      setNotifications((old) =>
        old.map((n) =>
          n.notification_id === item.notification_id
            ? { ...n, is_read: true }
            : n,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setShowNotifications(false);
    setError("");
    setNotice("");
  }

  if (loading)
    return <div className="loading">Đang kiểm tra phiên đăng nhập...</div>;

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-icon">♫</div>
          <h1>Music Application</h1>
          <p className="subtitle">Khám phá và thưởng thức âm nhạc yêu thích.</p>
          <form onSubmit={handleAuth}>
            {isRegister && (
              <>
                <label>Họ và tên</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                  required
                />
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                  required
                />
              </>
            )}
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              required
            />
            <label>Mật khẩu</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Tối thiểu 8 ký tự"
              minLength={8}
              required
            />
            {error && <div className="error-message">{error}</div>}
            <button className="primary-button" disabled={busy}>
              {busy ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
            </button>
          </form>
          <p className="switch-auth">
            {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
            >
              {" "}
              {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
            </button>
          </p>
        </section>
      </main>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => changePage("home")}>
          <span className="brand-icon">♫</span>
          <strong>Music Application</strong>
        </button>

        <nav className="main-nav">
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => changePage("home")}
          >
            Trang chủ
          </button>
          <button
            className={page === "library" ? "active" : ""}
            onClick={() => changePage("library")}
          >
            Thư viện nhạc
          </button>
        </nav>

        <div className="header-actions">
          <div className="notification-wrapper">
            <button
              className="icon-button notification-button"
              aria-label="Thông báo"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) loadNotifications();
              }}
            >
              <span>♧</span>
              {unreadCount > 0 && (
                <i>{unreadCount > 99 ? "99+" : unreadCount}</i>
              )}
            </button>
            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-heading">
                  <strong>Thông báo</strong>
                  <button onClick={loadNotifications}>Làm mới</button>
                </div>
                {notifications.length === 0 ? (
                  <p className="empty-state">Bạn chưa có thông báo.</p>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.notification_id}
                      className={`notification-item ${item.is_read ? "" : "unread"}`}
                      onClick={() => readNotification(item)}
                    >
                      <span>{item.content}</span>
                      <small>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("vi-VN")
                          : ""}
                      </small>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            className="profile-avatar"
            aria-label="Thông tin người dùng"
            onClick={() => changePage("profile")}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Ảnh đại diện" />
            ) : (
              (user.full_name || user.email || "U").charAt(0).toUpperCase()
            )}
          </button>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}
        {notice && <div className="success-message">{notice}</div>}

        {page === "profile" ? (
          <section className="content-section profile-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">TÀI KHOẢN</span>
                <h1>Thông tin người dùng</h1>
                <p>Quản lý thông tin cá nhân của bạn.</p>
              </div>
            </div>
            <form className="profile-card" onSubmit={saveProfile}>
              <div className="profile-avatar-large">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Ảnh đại diện" />
                ) : (
                  (user.full_name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="profile-fields">
                <label>
                  Họ và tên
                  <input
                    value={profile.full_name || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Tên hiển thị
                  <input
                    value={profile.nickname || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, nickname: e.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input value={user.email || ""} disabled />
                </label>
                <label>
                  Ngày sinh
                  <input
                    type="date"
                    value={profile.dateOfBirth || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, dateOfBirth: e.target.value })
                    }
                  />
                </label>
                <label>
                  Đường dẫn ảnh đại diện
                  <input
                    value={profile.avatar_url || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, avatar_url: e.target.value })
                    }
                    placeholder="URL ảnh đại diện"
                  />
                </label>
                <label>
                  Mật khẩu mới
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    placeholder="Để trống nếu không muốn đổi"
                  />
                </label>
                <div className="profile-meta">
                  <span>Vai trò: {user.role}</span>
                  <span>
                    Ngày tham gia:{" "}
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </div>
                <div className="profile-actions">
                  <button className="primary-button" disabled={busy}>
                    {busy ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={logout}
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </form>
          </section>
        ) : (
          <>
            {page === "home" && (
              <section className="hero">
                <span className="eyebrow">MUSIC APPLICATION</span>
                <h1>Không gian âm nhạc của bạn</h1>
                <p>
                  Xin chào {user.nickname || user.full_name}. Khám phá những
                  giai điệu yêu thích.
                </p>
                <button onClick={() => changePage("library")}>
                  Khám phá thư viện <span>→</span>
                </button>
              </section>
            )}
            <section className="content-section">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THƯ VIỆN</span>
                  <h1>
                    {page === "home"
                      ? "Bài hát mới trong thư viện"
                      : "Thư viện nhạc"}
                  </h1>
                  <p>{songs.length} bài hát</p>
                </div>
              </div>
              {songs.length === 0 ? (
                <div className="empty-state">
                  Chưa có bài hát trong cơ sở dữ liệu.
                </div>
              ) : (
                <div className="song-grid">
                  {songs.map((song) => (
                    <article className="song-card" key={song.song_id}>
                      <div className="song-cover">
                        {song.album?.cover_image_url ? (
                          <img
                            src={song.album.cover_image_url}
                            alt={song.album.title}
                          />
                        ) : (
                          <span>♫</span>
                        )}
                      </div>
                      <div className="song-info">
                        <strong>{song.title}</strong>
                        <span>{song.singer}</span>
                        <small>{song.album?.title || "Chưa có album"}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <footer className="app-footer">Music Application</footer>
    </div>
  );
}

export default App;
