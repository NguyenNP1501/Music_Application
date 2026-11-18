import { useEffect, useRef, useState } from "react";

export default function RoomChat({
  messages = [],
  message,
  onMessageChange,
  onSend,
  loading,
  sending,
  currentUserId,
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const formatTime = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    setShouldAutoScroll(distanceFromBottom < 100);
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  return (
    <aside className="room-chat-card">
      <div className="room-chat-heading">
        <div>
          <h3>Trò chuyện</h3>
          <span className="room-chat-subtitle">
            Tin nhắn trong phòng công chiếu
          </span>
        </div>

        <span className="room-chat-live">
          <i />
          LIVE
        </span>
      </div>

      <div
        className="room-chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="room-chat-empty">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="room-chat-empty">
            Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          messages.map((item) => {
            const sender = item.sender || {};
            const senderName = sender.full_name || "Người dùng";
            const isMine = sender.user_id === currentUserId;
            const initial = senderName.trim().charAt(0).toUpperCase();

            return (
              <div
                className={`room-chat-message ${isMine ? "mine" : ""}`}
                key={item.message_id}
              >
                <div className="room-chat-avatar">
                  {sender.avatar_url ? (
                    <img src={sender.avatar_url} alt={senderName} />
                  ) : (
                    initial
                  )}
                </div>

                <div className="room-chat-message-content">
                  <div className="room-chat-message-meta">
                    <strong>{senderName}</strong>
                    <span>{formatTime(item.created_at)}</span>
                  </div>

                  <div className="room-chat-bubble">{item.content}</div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {!shouldAutoScroll && messages.length > 0 && (
        <button
          type="button"
          className="room-chat-new-messages"
          onClick={() => {
            setShouldAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          ↓ Tin nhắn mới nhất
        </button>
      )}

      <form className="room-chat-form" onSubmit={onSend}>
        <input
          id="room-message"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Viết tin nhắn..."
          maxLength={255}
          disabled={sending}
          aria-label="Nhập tin nhắn"
        />

        <button type="submit" disabled={!message?.trim() || sending}>
          {sending ? "Đang gửi..." : "Gửi ↑"}
        </button>
      </form>
    </aside>
  );
}
