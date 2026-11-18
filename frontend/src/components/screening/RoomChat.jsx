export default function RoomChat({
  messages,
  message,
  onMessageChange,
  onSend,
}) {
  return (
    <aside className="room-chat-card">
      <div className="room-chat-heading">
        <h3>Trò chuyện</h3>
        <span>
          <i /> Trực tuyến
        </span>
      </div>

      <div className="room-chat-date">Hôm nay, 20:30</div>

      <div className="room-chat-messages">
        {messages.map((item) => (
          <div
            className={`room-chat-message ${item.mine ? "mine" : ""}`}
            key={item.id}
          >
            <span className="room-chat-sender">
              {item.mine ? "Bạn" : item.name} · {item.time}
            </span>
            <div className="room-chat-bubble">{item.content}</div>
          </div>
        ))}
      </div>

      <form className="room-chat-form" onSubmit={onSend}>
        <label htmlFor="room-message">Tin nhắn</label>
        <input
          id="room-message"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Viết tin nhắn..."
          maxLength={255}
        />
        <button type="submit" disabled={!message.trim()}>
          Gửi ↑
        </button>
      </form>
    </aside>
  );
}
