import { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./NotificationPanel";
import { PlayerBar } from "../player/PlayerBar";
import { usePlayer } from "../../context/PlayerContext";

export default function AppLayout({
  page,
  navigate,
  theme,
  onThemeChange,
  children,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const { currentSong } = usePlayer() || {};
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [page]);

  useEffect(() => {
    function handleToast(event) {
      setToast({
        message: event.detail?.message || "Đã thực hiện thao tác.",
        type: event.detail?.type || "success",
      });
    }

    window.addEventListener("music-toast", handleToast);

    return () => {
      window.removeEventListener("music-toast", handleToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className={`app-shell ${currentSong ? "has-player" : ""}`}>
      <Sidebar page={page} navigate={navigate} />

      <div className="app-main" ref={mainRef}>
        <Header
          navigate={navigate}
          onNotifications={() => setShowNotifications((v) => !v)}
          theme={theme}
          onThemeChange={onThemeChange}
        />

        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}

        <main className="page-content">{children}</main>
      </div>

      {toast && (
        <div
          className={`app-toast app-toast-${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <span className="app-toast-icon">
            {toast.type === "error" ? "!" : "✓"}
          </span>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      )}

      <PlayerBar />
    </div>
  );
}
