import { useState } from "react";
import { useAuth } from "../services/context/AuthContext";
import { apiRequest } from "../services/api";
import "./AuthPage.css";

export default function AuthPage() {
  const { login, register } = useAuth();
  const initialToken = new URLSearchParams(window.location.search).get(
    "resetToken",
  );

  const [mode, setMode] = useState(initialToken ? "reset" : "login");
  const [resetToken] = useState(initialToken || "");
  const [form, setForm] = useState({
    full_name: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function change(e) {
    setForm((old) => ({ ...old, [e.target.name]: e.target.value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (
      (mode === "register" || mode === "reset") &&
      form.password !== form.confirmPassword
    ) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);

    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else if (mode === "register") {
        await register({
          full_name: form.full_name,
          nickname: form.nickname,
          email: form.email,
          password: form.password,
          ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
        });
      } else if (mode === "forgot") {
        const data = await apiRequest("/auth/password/forgot", {
          method: "POST",
          body: { email: form.email },
        });
        setMessage(data.message);
      } else if (mode === "reset") {
        const data = await apiRequest("/auth/password/reset", {
          method: "POST",
          body: {
            resetToken,
            newPassword: form.password,
            confirmPassword: form.confirmPassword,
          },
        });

        setMessage(data.message);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        setMode("login");
        setForm((old) => ({
          ...old,
          password: "",
          confirmPassword: "",
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

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
            {isRegister
              ? "JOIN MUSIC SPACE"
              : isForgot
                ? "ACCOUNT RECOVERY"
                : isReset
                  ? "NEW PASSWORD"
                  : "WELCOME BACK"}
          </span>

          <h2>
            {isRegister
              ? "Tạo tài khoản"
              : isForgot
                ? "Quên mật khẩu"
                : isReset
                  ? "Đặt lại mật khẩu"
                  : "Đăng nhập"}
          </h2>

          <p className="auth-description">
            {isRegister
              ? "Điền thông tin để bắt đầu sử dụng Music Space."
              : isForgot
                ? "Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
                : isReset
                  ? "Nhập mật khẩu mới cho tài khoản của bạn."
                  : "Đăng nhập để tiếp tục trải nghiệm âm nhạc."}
          </p>

          {!isForgot && !isReset && (
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
          )}

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          {isRegister && (
            <>
              <label className="auth-field">
                Họ và tên
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={change}
                  required
                />
              </label>
              <label className="auth-field">
                Tên hiển thị
                <input
                  name="nickname"
                  value={form.nickname}
                  onChange={change}
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

          {(mode === "login" || isRegister || isForgot) && (
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
          )}

          {(mode === "login" || isRegister || isReset) && (
            <label className="auth-field">
              {isReset ? "Mật khẩu mới" : "Mật khẩu"}
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={change}
                placeholder="Nhập mật khẩu"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={isRegister || isReset ? 8 : undefined}
                required
              />
              {(isRegister || isReset) && (
                <small>Mật khẩu phải có ít nhất 8 ký tự.</small>
              )}
            </label>
          )}

          {(isRegister || isReset) && (
            <label className="auth-field">
              Xác nhận mật khẩu
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={change}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {mode === "login" && (
            <p className="auth-switch-text">
              <button type="button" onClick={() => switchMode("forgot")}>
                Quên mật khẩu?
              </button>
            </p>
          )}

          <button
            className="auth-submit"
            disabled={loading || (isReset && !resetToken)}
          >
            {loading
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : isRegister
                  ? "Tạo tài khoản"
                  : isForgot
                    ? "Gửi liên kết đặt lại"
                    : "Xác nhận mật khẩu mới"}
          </button>

          {(isForgot || isReset) && (
            <p className="auth-switch-text">
              <button type="button" onClick={() => switchMode("login")}>
                Quay lại đăng nhập
              </button>
            </p>
          )}

          {!isForgot && !isReset && (
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
          )}
        </form>
      </section>
    </main>
  );
}
