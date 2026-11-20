import { useState } from "react";
import { useAuth } from "../services/context/AuthContext";
import { apiRequest } from "../services/api";
import { DEFAULT_COVER } from "../utils/assets";
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

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const isLogin = mode === "login";

  function change(e) {
    const { name, value } = e.target;
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if ((isRegister || isReset) && form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if ((isRegister || isReset) && form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else if (isRegister) {
        await register({
          full_name: form.full_name,
          nickname: form.nickname,
          email: form.email,
          password: form.password,
          ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
        });
      } else if (isForgot) {
        const data = await apiRequest("/auth/password/forgot", {
          method: "POST",
          body: {
            email: form.email,
          },
        });
        setMessage(data.message);
      } else if (isReset) {
        const data = await apiRequest("/auth/password/reset", {
          method: "POST",
          body: {
            resetToken,
            newPassword: form.password,
            confirmPassword: form.confirmPassword,
          },
        });

        setMessage(data.message);
        window.history.replaceState({}, document.title, window.location.pathname);
        setMode("login");
        setForm((old) => ({
          ...old,
          password: "",
          confirmPassword: "",
        }));
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const heading = isRegister
    ? "Tạo tài khoản"
    : isForgot
      ? "Quên mật khẩu?"
      : isReset
        ? "Đặt lại mật khẩu"
        : "Chào mừng trở lại";

  const description = isRegister
    ? "Đăng ký để tiếp tục hành trình âm nhạc của bạn."
    : isForgot
      ? "Nhập địa chỉ email để nhận hướng dẫn đặt lại mật khẩu."
      : isReset
        ? "Tạo mật khẩu mới cho tài khoản của bạn."
        : "Đăng nhập để tiếp tục giai điệu của bạn.";

  const submitText = loading
    ? "Đang xử lý..."
    : isLogin
      ? "Đăng nhập"
      : isRegister
        ? "Đăng ký ngay"
        : isForgot
          ? "Gửi liên kết đặt lại"
          : "Xác nhận mật khẩu mới";

  return (
    <div className="figma-auth-wrapper">
      <div className="figma-auth-card">
        {/* Left Column: "Không gian âm nhạc" (Figma Frame 6:1122) */}
        <section className="auth-left-banner">
          <div className="banner-top-brand">
            <span className="banner-logo-icon">◖◖</span>
            <span className="banner-logo-text">Music Application</span>
          </div>

          <div className="banner-artwork">
            <img src={DEFAULT_COVER} alt="Music Application" />
          </div>

          <div className="banner-bottom-text">
            <h2>
              Mọi cảm xúc,<br />
              một giai điệu.
            </h2>
            <p>Khám phá. Lưu giữ. Lắng nghe cùng nhau.</p>
          </div>
        </section>

        {/* Right Column: "Biểu mẫu tài khoản" (Figma Frame 6:1130) */}
        <section className="auth-right-content">
          <div className="auth-form-box">
            <div className="auth-header-meta">
              <span className="auth-eyebrow">ÂM NHẠC KẾT NỐI CHÚNG TA</span>
              <h1>{heading}</h1>
              <p className="auth-subtitle">{description}</p>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span>!</span> {error}
              </div>
            )}

            {message && (
              <div className="success-message" role="status">
                <span>✓</span> {message}
              </div>
            )}

            <form onSubmit={submit} className="auth-input-form">
              {isRegister && (
                <>
                  <div className="auth-field-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={change}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div className="auth-field-group">
                    <label>Tên hiển thị</label>
                    <input
                      type="text"
                      name="nickname"
                      value={form.nickname}
                      onChange={change}
                      placeholder="Anh Minh"
                    />
                  </div>

                  <div className="auth-field-group">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={change}
                    />
                  </div>
                </>
              )}

              {(isLogin || isRegister || isForgot) && (
                <div className="auth-field-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={change}
                    placeholder="anhminh@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              )}

              {(isLogin || isRegister || isReset) && (
                <div className="auth-field-group">
                  <label>{isReset ? "Mật khẩu mới *" : "Mật khẩu *"}</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={change}
                      placeholder="••••••••••••"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>
              )}

              {(isRegister || isReset) && (
                <div className="auth-field-group">
                  <label>Xác nhận mật khẩu *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={change}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="auth-remember-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-link-btn"
                    onClick={() => switchMode("forgot")}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="primary-button auth-submit-btn"
                disabled={loading || (isReset && !resetToken)}
              >
                {submitText}
              </button>

              <div className="auth-switch-box">
                {isLogin && (
                  <p>
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => switchMode("register")}
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                )}

                {isRegister && (
                  <p>
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => switchMode("login")}
                    >
                      Đăng nhập
                    </button>
                  </p>
                )}

                {(isForgot || isReset) && (
                  <p>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => switchMode("login")}
                    >
                      ← Quay lại đăng nhập
                    </button>
                  </p>
                )}

                <span className="auth-note-text">
                  Chỉ một tài khoản, cả thế giới âm nhạc.
                </span>
              </div>
            </form>

            <footer className="auth-copyright">
              Music Application © 2026
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
