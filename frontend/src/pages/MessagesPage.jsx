import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import EmptyState from "../components/common/EmptyState";
import PageTitles from "../components/common/PageTitles";
import "./MessagesPage.css";

export default function MessagesPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRooms() {
    try {
      setError("");
      const data = await apiRequest("/rooms");
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(room) {
    try {
      setActiveRoom(room);
      const data = await apiRequest(`/rooms/${room.room_id}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      setMessages([]);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  async function createRoom(e) {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const data = await apiRequest("/rooms", {
        method: "POST",
        body: { room_name: roomName.trim() },
      });
      setRoomName("");
      await loadRooms();
      await loadMessages(data.room);
    } catch (err) {
      setError(err.message);
    }
  }

  async function joinRoom(room) {
    try {
      await apiRequest(`/rooms/${room.room_id}/join`, { method: "POST" });
      await loadRooms();
      await loadMessages(room);
    } catch (err) {
      setError(err.message);
    }
  }

  async function leaveRoom(room) {
    if (!window.confirm("Bạn muốn rời khỏi phòng này?")) return;

    try {
      await apiRequest(`/rooms/${room.room_id}/leave`, { method: "DELETE" });
      if (activeRoom?.room_id === room.room_id) {
        setActiveRoom(null);
        setMessages([]);
      }
      await loadRooms();
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!content.trim() || !activeRoom) return;

    try {
      const data = await apiRequest(`/rooms/${activeRoom.room_id}/messages`, {
        method: "POST",
        body: { content: content.trim() },
      });
      setMessages((old) => [...old, data.message]);
      setContent("");
    } catch (err) {
      setError(err.message);
    }
  }

  function isMember(room) {
    return room.users?.some((member) => member.Useruser_id === user?.user_id);
  }

  return (
    <div className="messages-page">
      <PageTitles
        eyebrow="COMMUNICATION"
        title="Tin nhắn"
        description="Kết nối và trò chuyện trong các phòng âm nhạc."
      />

      {error && <p className="error-message">{error}</p>}

      <div className="messages-layout">
        <aside className="room-sidebar">
          <form className="room-create-form" onSubmit={createRoom}>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Tên phòng mới..."
              required
            />
            <button className="primary-button">+</button>
          </form>

          <div className="room-list">
            <h3>Danh sách phòng</h3>

            {loading ? (
              <p className="loading">Đang tải...</p>
            ) : rooms.length ? (
              rooms.map((room) => {
                const joined = isMember(room);

                return (
                  <div
                    className={`room-item ${activeRoom?.room_id === room.room_id ? "active" : ""}`}
                    key={room.room_id}
                  >
                    <button
                      className="room-select"
                      onClick={() =>
                        joined ? loadMessages(room) : joinRoom(room)
                      }
                    >
                      <span className="room-icon">♫</span>
                      <span className="room-info">
                        <strong>{room.room_name}</strong>
                        <small>{room._count?.users || 0} thành viên</small>
                      </span>
                    </button>

                    {joined && room.created_by !== user?.user_id && (
                      <button
                        className="room-leave"
                        onClick={() => leaveRoom(room)}
                        title="Rời phòng"
                      >
                        ⋯
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState>Chưa có phòng chat.</EmptyState>
            )}
          </div>
        </aside>

        <section className="chat-panel">
          {activeRoom ? (
            <>
              <div className="chat-header">
                <div>
                  <h3>{activeRoom.room_name}</h3>
                  <span>Phòng trò chuyện</span>
                </div>
              </div>

              <div className="chat-messages">
                {messages.length ? (
                  messages.map((message) => {
                    const mine = message.sender_id === user?.user_id;

                    return (
                      <div
                        key={message.message_id}
                        className={`message-row ${mine ? "mine" : ""}`}
                      >
                        <div className="message-content">
                          {!mine && <small>{message.sender?.full_name}</small>}
                          <p>{message.content}</p>
                          <time>
                            {message.created_at
                              ? new Date(message.created_at).toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </time>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState>Chưa có tin nhắn trong phòng.</EmptyState>
                )}
              </div>

              <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  maxLength={255}
                  required
                />
                <button className="primary-button">Gửi</button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <span>✉</span>
              <h3>Chọn một phòng trò chuyện</h3>
              <p>Chọn phòng có sẵn hoặc tạo phòng mới để bắt đầu.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
