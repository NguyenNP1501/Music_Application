export default function RoomChat({
  messages = [],
  message,
  onMessageChange,
  onSend,
  loading,
  sending,
}) {
  const formatTime = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <aside className="room-chat-card">
      <div className="room-chat-heading">
        <h3>Trò chuyện</h3>
        <span>Phòng công chiếu</span>
      </div>

      <div className="room-chat-messages">
        {loading ? (
          <div className="room-chat-empty">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="room-chat-empty">
            Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.
          </div>
        ) : (
          messages.map((item) => {
            const senderName = item.sender?.full_name || "Người dùng";

            return (
              <div className="room-chat-message" key={item.message_id}>
                <span className="room-chat-sender">
                  {senderName} · {formatTime(item.created_at)}
                </span>

                <div className="room-chat-bubble">{item.content}</div>
              </div>
            );
          })
        )}
      </div>

      <form className="room-chat-form" onSubmit={onSend}>
        <label htmlFor="room-message">Tin nhắn</label>

        <input
          id="room-message"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Viết tin nhắn..."
          maxLength={255}
          disabled={sending}
        />

        <button type="submit" disabled={!message?.trim() || sending}>
          {sending ? "Đang gửi..." : "Gửi ↑"}
        </button>
      </form>
    </aside>
  );
}
