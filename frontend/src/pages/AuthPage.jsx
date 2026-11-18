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
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function renderPasswordField({
    name,
    label,
    value,
    show,
    setShow,
    autoComplete,
    requireConfirmation = false,
  }) {
    return (
      <label className="auth-field">
        <span className="auth-field-label">{label}</span>

        <div className="auth-input-wrapper">
          <input
            type={show ? "text" : "password"}
            name={name}
            value={value}
            onChange={change}
            placeholder="Nhập mật khẩu"
            autoComplete={autoComplete}
            minLength={8}
            required
          />

          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShow(!show)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {show ? "Ẩn" : "Hiện"}
          </button>
        </div>

        {requireConfirmation && (
          <small>Mật khẩu phải có ít nhất 8 ký tự.</small>
        )}
      </label>
    );
  }

  const heading = isRegister
    ? "Tạo tài khoản"
    : isForgot
      ? "Quên mật khẩu?"
      : isReset
        ? "Đặt lại mật khẩu"
        : "Chào mừng trở lại";

  const description = isRegister
    ? "Đăng ký để khám phá và lưu giữ những giai điệu yêu thích."
    : isForgot
      ? "Nhập địa chỉ email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu."
      : isReset
        ? "Tạo mật khẩu mới để tiếp tục sử dụng tài khoản của bạn."
        : "Đăng nhập để tiếp tục hành trình âm nhạc của bạn.";

  const submitText = loading
    ? "Đang xử lý..."
    : isLogin
      ? "Đăng nhập"
      : isRegister
        ? "Tạo tài khoản"
        : isForgot
          ? "Gửi liên kết đặt lại"
          : "Xác nhận mật khẩu mới";

  return (
    <main className="auth-page">
      <section className="auth-decoration">
        <div className="auth-brand">
          <div className="auth-brand-icon">♫</div>
          <span>Music Space</span>
        </div>

        <div className="auth-decoration-content">
          <span className="auth-eyebrow">YOUR MUSIC. YOUR SPACE.</span>

          <h1>
            Âm nhạc là
            <br />
            ngôn ngữ của
            <br />
            cảm xúc.
          </h1>

          <p>
            Khám phá những giai điệu mới, xây dựng thư viện âm nhạc của riêng
            bạn và chia sẻ sở thích âm nhạc với mọi người.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature-icon">♫</span>
              <div>
                <strong>Khám phá âm nhạc</strong>
                <small>Tìm kiếm những bài hát bạn yêu thích</small>
              </div>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">▤</span>
              <div>
                <strong>Thư viện cá nhân</strong>
                <small>Lưu trữ và quản lý bộ sưu tập của bạn</small>
              </div>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">♡</span>
              <div>
                <strong>Kết nối cộng đồng</strong>
                <small>Chia sẻ âm nhạc cùng những người khác</small>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-decoration-footer">
          MUSIC SPACE — FEEL EVERY BEAT
        </div>

        <div className="auth-decoration-circle auth-circle-one" />
        <div className="auth-decoration-circle auth-circle-two" />
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <span>♫</span>
            Music Space
          </div>

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-form-header">
              <span className="auth-form-eyebrow">
                {isRegister
                  ? "CREATE YOUR ACCOUNT"
                  : isForgot
                    ? "ACCOUNT RECOVERY"
                    : isReset
                      ? "SECURITY"
                      : "WELCOME BACK"}
              </span>

              <h2>{heading}</h2>
              <p className="auth-description">{description}</p>
            </div>

            {!isForgot && !isReset && (
              <div className="auth-mode-switch">
                <button
                  type="button"
                  className={isLogin ? "selected" : ""}
                  onClick={() => switchMode("login")}
                >
                  Đăng nhập
                </button>

                <button
                  type="button"
                  className={isRegister ? "selected" : ""}
                  onClick={() => switchMode("register")}
                >
                  Đăng ký
                </button>
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            {message && (
              <div className="auth-success" role="status">
                <span>✓</span>
                {message}
              </div>
            )}

            {isRegister && (
              <>
                <label className="auth-field">
                  <span className="auth-field-label">
                    Họ và tên <span className="required-mark">*</span>
                  </span>

                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={change}
                    placeholder="Nhập họ và tên của bạn"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-field-label">Tên hiển thị</span>

                  <input
                    type="text"
                    name="nickname"
                    value={form.nickname}
                    onChange={change}
                    placeholder="Nhập tên hiển thị"
                    autoComplete="nickname"
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-field-label">Ngày sinh</span>

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={change}
                    autoComplete="bday"
                  />
                </label>
              </>
            )}

            {(isLogin || isRegister || isForgot) && (
              <label className="auth-field">
                <span className="auth-field-label">
                  Địa chỉ email <span className="required-mark">*</span>
                </span>

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

            {(isLogin || isRegister || isReset) &&
              renderPasswordField({
                name: "password",
                label: isReset ? "Mật khẩu mới" : "Mật khẩu",
                value: form.password,
                show: showPassword,
                setShow: setShowPassword,
                autoComplete: isLogin ? "current-password" : "new-password",
                requireConfirmation: isRegister || isReset,
              })}

            {(isRegister || isReset) &&
              renderPasswordField({
                name: "confirmPassword",
                label: "Xác nhận mật khẩu",
                value: form.confirmPassword,
                show: showConfirmPassword,
                setShow: setShowConfirmPassword,
                autoComplete: "new-password",
              })}

            {isLogin && (
              <div className="auth-forgot-row">
                <button type="button" onClick={() => switchMode("forgot")}>
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || (isReset && !resetToken)}
            >
              {submitText}
              {!loading && <span>→</span>}
            </button>

            {(isForgot || isReset) && (
              <p className="auth-switch-text">
                <button type="button" onClick={() => switchMode("login")}>
                  ← Quay lại đăng nhập
                </button>
              </p>
            )}

            {!isForgot && !isReset && (
              <p className="auth-switch-text">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}

                <button
                  type="button"
                  onClick={() => switchMode(isLogin ? "register" : "login")}
                >
                  {isLogin ? " Đăng ký ngay" : " Đăng nhập"}
                </button>
              </p>
            )}

            <div className="auth-form-bottom">
              Bằng việc tiếp tục, bạn đồng ý sử dụng Music Space một cách có
              trách nhiệm.
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
