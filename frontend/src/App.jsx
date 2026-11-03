import { useEffect, useState } from "react";
import { apiRequest } from "./services/api";
import { useAuth } from "./services/context/AuthContext";
import "./App.css";

function App() {
  const { user, loading, login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    dateOfBirth: "2000-01-01",
  });
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;

    apiRequest("/songs")
      .then((data) => setSongs(data.songs || []))
      .catch((err) => setError(err.message));
  }, [user]);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="loading">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-icon">♫</div>
          <h1>Music Application</h1>
          <p className="subtitle">Khám phá và thưởng thức âm nhạc yêu thích.</p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <label>Họ và tên</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={updateForm}
                  placeholder="Nhập họ và tên"
                  required
                />

                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={updateForm}
                  required
                />
              </>
            )}

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateForm}
              placeholder="example@gmail.com"
              required
            />

            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateForm}
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
              {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">♫</span>
          <strong>Music Application</strong>
        </div>

        <div className="user-info">
          <span>{user.full_name}</span>
          <span className="role">{user.role}</span>
          <button className="logout-button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <section className="hero">
        <p>MUSIC APPLICATION</p>
        <h1>Không gian âm nhạc</h1>
        <span>Xin chào {user.full_name}. Hãy khám phá thư viện âm nhạc.</span>
      </section>

      <section className="library">
        <div className="section-heading">
          <div>
            <h2>Bài hát trong thư viện</h2>
            <p>{songs.length} bài hát</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {songs.length === 0 ? (
          <div className="empty-state">Chưa có bài hát trong thư viện.</div>
        ) : (
          <div className="song-grid">
            {songs.map((song) => (
              <article className="song-card" key={song.song_id}>
                <div className="song-cover">♫</div>
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
    </main>
  );
}

export default App;
