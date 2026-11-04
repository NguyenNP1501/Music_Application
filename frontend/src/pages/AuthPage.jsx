import { useState } from "react";
import { useAuth } from "../services/context/AuthContext";
import "./AuthPage.css";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    full_name: "",
    nickname: "",
    email: "",
    password: "",
    dateOfBirth: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function change(e) {
    setForm((old) => ({ ...old, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({
          full_name: form.full_name,
          nickname: form.nickname,
          email: form.email,
          password: form.password,
          ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-decoration">
        <div className="auth-brand">
          <span>♫</span>
          <strong>Music Space</strong>
        </div>
        <div className="auth-decoration-content">
          <span className="auth-eyebrow">YOUR MUSIC COMMUNITY</span>
          <h1>Âm nhạc kết nối mọi cảm xúc.</h1>
          <p>
            Khám phá bài hát, tạo playlist và chia sẻ những giai điệu yêu thích
            cùng cộng đồng.
          </p>
          <div className="auth-music-symbol">♫</div>
        </div>
      </section>

      <section className="auth-form-section">
        <form className="auth-form" onSubmit={submit}>
          <span className="auth-form-eyebrow">
            {mode === "login" ? "WELCOME BACK" : "JOIN MUSIC SPACE"}
          </span>

          <h2>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
          <p className="auth-description">
            {mode === "login"
              ? "Đăng nhập để tiếp tục trải nghiệm âm nhạc."
              : "Điền thông tin để bắt đầu sử dụng Music Space."}
          </p>

          <div className="auth-mode-switch">
            <button
              type="button"
              className={mode === "login" ? "selected" : ""}
              onClick={() => switchMode("login")}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={mode === "register" ? "selected" : ""}
              onClick={() => switchMode("register")}
            >
              Đăng ký
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {mode === "register" && (
            <>
              <label className="auth-field">
                Họ và tên
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={change}
                  placeholder="Nhập họ và tên"
                  required
                />
              </label>

              <label className="auth-field">
                Tên hiển thị
                <input
                  name="nickname"
                  value={form.nickname}
                  onChange={change}
                  placeholder="Tên hiển thị (không bắt buộc)"
                />
              </label>

              <label className="auth-field">
                Ngày sinh
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={change}
                />
              </label>
            </>
          )}

          <label className="auth-field">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              placeholder="example@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            Mật khẩu
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={change}
              placeholder="Nhập mật khẩu"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "register" ? 8 : undefined}
              required
            />
            {mode === "register" && (
              <small>Mật khẩu phải có ít nhất 8 ký tự.</small>
            )}
          </label>

          <button className="auth-submit" disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"}
          </button>

          <p className="auth-switch-text">
            {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
            <button
              type="button"
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login" ? " Đăng ký ngay" : " Đăng nhập"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
