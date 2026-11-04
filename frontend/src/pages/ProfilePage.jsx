import { useEffect, useState } from "react";
import { useAuth } from "../services/context/AuthContext";
import { apiRequest } from "../services/api";
import PageTitles from "../components/common/PageTitles";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    nickname: "",
    avatar_url: "",
    dateOfBirth: "",
    password: "",
  });
  const [stats, setStats] = useState({
    playlists: 0,
    following: 0,
    followers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    setForm({
      full_name: user.full_name || "",
      nickname: user.nickname || "",
      avatar_url: user.avatar_url || "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      password: "",
    });

    Promise.all([
      apiRequest("/playlists"),
      apiRequest("/users/me/following"),
      apiRequest("/users/me/followers"),
    ])
      .then(([p, following, followers]) => {
        setStats({
          playlists: p.playlists?.length || 0,
          following: following.followings?.length || 0,
          followers: followers.followers?.length || 0,
        });
      })
      .catch(() => {});
  }, [user]);

  function change(e) {
    setForm((old) => ({ ...old, [e.target.name]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const payload = { ...form };
    if (!payload.password) delete payload.password;
    if (!payload.dateOfBirth) delete payload.dateOfBirth;

    try {
      await updateUser(payload);
      setForm((old) => ({ ...old, password: "" }));
      setMessage("Thông tin cá nhân đã được cập nhật.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <PageTitles
        eyebrow="ACCOUNT"
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin và tài khoản của bạn."
      />

      <section className="profile-summary">
        <div className="profile-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Ảnh đại diện" />
          ) : (
            (user?.full_name || "U").charAt(0).toUpperCase()
          )}
        </div>
        <div className="profile-summary-info">
          <h2>{user?.full_name}</h2>
          <p>{user?.email}</p>
          <span>{user?.role === "admin" ? "Quản trị viên" : "Thành viên"}</span>
        </div>
      </section>

      <div className="profile-stats">
        <div>
          <strong>{stats.playlists}</strong>
          <span>Playlist</span>
        </div>
        <div>
          <strong>{stats.following}</strong>
          <span>Đang theo dõi</span>
        </div>
        <div>
          <strong>{stats.followers}</strong>
          <span>Người theo dõi</span>
        </div>
      </div>

      <form className="profile-form" onSubmit={save}>
        <h3>Thông tin tài khoản</h3>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <div className="profile-form-grid">
          <label>
            Họ và tên
            <input
              name="full_name"
              value={form.full_name}
              onChange={change}
              required
            />
          </label>

          <label>
            Tên hiển thị
            <input name="nickname" value={form.nickname} onChange={change} />
          </label>

          <label>
            Email
            <input value={user?.email || ""} disabled />
          </label>

          <label>
            Ngày sinh
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={change}
            />
          </label>

          <label className="profile-full">
            Đường dẫn ảnh đại diện
            <input
              name="avatar_url"
              value={form.avatar_url}
              onChange={change}
              placeholder="https://..."
            />
          </label>

          <label className="profile-full">
            Mật khẩu mới
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={change}
              placeholder="Để trống nếu không đổi mật khẩu"
              minLength={8}
            />
          </label>
        </div>

        <div className="profile-form-actions">
          <button className="primary-button" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button type="button" className="secondary-button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </form>
    </div>
  );
}
