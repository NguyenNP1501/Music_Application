import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import { showToast } from "../../utils/toast";

export default function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setError("");

      const data = await apiRequest("/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message || "Không thể tải thông báo.");
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(item) {
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
      showToast(err.message || "Không thể cập nhật thông báo.", "error");
    }
  }

  return (
    <section className="notification-panel">
      <div className="notification-heading">
        <strong>Thông báo</strong>
        <button type="button" onClick={onClose}>
          ✕
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {notifications.length === 0 ? (
        <p className="empty-state">Bạn chưa có thông báo.</p>
      ) : (
        notifications.map((item) => (
          <button
            type="button"
            key={item.notification_id}
            className={`notification-item ${item.is_read ? "" : "unread"}`}
            onClick={() => markAsRead(item)}
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
    </section>
  );
}
