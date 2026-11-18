import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import EmptyState from "../components/common/EmptyState";
import PageTitle from "../components/common/PageTitles";
import "./ScreeningRoomPage.css";

export default function ScreeningRoomPage() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRooms = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const data = await apiRequest("/rooms");
      const roomList = data.rooms || [];

      setRooms(roomList);
      return roomList;
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phòng.");
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (room) => {
    try {
      setLoadingMessages(true);
      setError("");
      setActiveRoom(room);
      setMessages([]);

      const data = await apiRequest(`/rooms/${room.room_id}/messages`);

      setMessages(data.messages || []);
    } catch (err) {
      setMessages([]);
      setError(err.message || "Không thể tải tin nhắn trong phòng.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  function isMember(room) {
    return room.users?.some((member) => member.Useruser_id === user?.user_id);
  }

  function isOwner(room) {
    return room.created_by === user?.user_id;
  }

  async function createRoom(e) {
    e.preventDefault();

    if (!roomName.trim()) {
      setError("Vui lòng nhập tên phòng.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setNotice("");

      const data = await apiRequest("/rooms", {
        method: "POST",
        body: { room_name: roomName.trim() },
      });

      setRoomName("");
      setNotice("Đã tạo phòng công chiếu.");

      await loadRooms(false);
      await loadMessages(data.room);
    } catch (err) {
      setError(err.message || "Không thể tạo phòng.");
    } finally {
      setCreating(false);
    }
  }

  async function joinRoom(room) {
    try {
      setError("");
      setNotice("");

      await apiRequest(`/rooms/${room.room_id}/join`, {
        method: "POST",
      });

      setNotice(`Bạn đã tham gia phòng "${room.room_name}".`);

      const updatedRooms = await loadRooms(false);
      const updatedRoom = updatedRooms?.find(
        (item) => item.room_id === room.room_id,
      );

      await loadMessages(updatedRoom || room);
    } catch (err) {
      setError(err.message || "Không thể tham gia phòng.");
    }
  }

  async function selectRoom(room) {
    if (isMember(room)) {
      await loadMessages(room);
    } else {
      await joinRoom(room);
    }
  }

  async function leaveRoom(room) {
    if (!window.confirm(`Bạn muốn rời phòng "${room.room_name}"?`)) {
      return;
    }

    try {
      setError("");
      setNotice("");

      await apiRequest(`/rooms/${room.room_id}/leave`, {
        method: "DELETE",
      });

      if (activeRoom?.room_id === room.room_id) {
        setActiveRoom(null);
        setMessages([]);
      }

      setNotice("Bạn đã rời phòng.");
      await loadRooms(false);
    } catch (err) {
      setError(err.message || "Không thể rời phòng.");
    }
  }

  async function deleteRoom(room) {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa phòng "${room.room_name}"? Các tin nhắn trong phòng cũng sẽ bị xóa.`,
      )
    ) {
      return;
    }

    try {
      setError("");
      setNotice("");

      await apiRequest(`/rooms/${room.room_id}`, {
        method: "DELETE",
      });

      if (activeRoom?.room_id === room.room_id) {
        setActiveRoom(null);
        setMessages([]);
      }

      setNotice("Đã xóa phòng công chiếu.");
      await loadRooms(false);
    } catch (err) {
      setError(err.message || "Không thể xóa phòng.");
    }
  }

  async function sendMessage(e) {
    e.preventDefault();

    if (!content.trim() || !activeRoom || sending) return;

    try {
      setSending(true);
      setError("");

      const data = await apiRequest(`/rooms/${activeRoom.room_id}/messages`, {
        method: "POST",
        body: { content: content.trim() },
      });

      setMessages((old) => [...old, data.message]);
      setContent("");
    } catch (err) {
      setError(err.message || "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="screening-page">
      <PageTitle
        eyebrow="LISTEN TOGETHER"
        title="Phòng công chiếu"
        description="Tạo phòng, kết nối thành viên và trò chuyện cùng cộng đồng âm nhạc."
      />

      {error && (
        <div className="screening-alert screening-alert-error" role="alert">
          <span>!</span>
          {error}
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="screening-alert screening-alert-success" role="status">
          <span>✓</span>
          {notice}
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      <section className="screening-create">
        <div className="screening-create-heading">
          <div className="screening-create-icon">＋</div>
          <div>
            <h3>Tạo phòng công chiếu</h3>
            <p>Tạo một không gian để mọi người cùng tham gia.</p>
          </div>
        </div>

        <form onSubmit={createRoom} className="screening-create-form">
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Nhập tên phòng..."
            maxLength={255}
            required
          />

          <button type="submit" className="primary-button" disabled={creating}>
            {creating ? "Đang tạo..." : "＋ Tạo phòng"}
          </button>
        </form>
      </section>

      <div className="screening-layout">
        <aside className="screening-room-panel">
          <div className="screening-room-heading">
            <div>
              <span className="screening-eyebrow">COMMUNITY</span>
              <h2>Khám phá phòng</h2>
            </div>

            <span className="screening-room-count">{rooms.length} phòng</span>
          </div>

          {loading ? (
            <div className="screening-loading">
              <span className="screening-spinner" />
              Đang tải danh sách phòng...
            </div>
          ) : rooms.length > 0 ? (
            <div className="screening-room-list">
              {rooms.map((room) => {
                const joined = isMember(room);
                const owner = isOwner(room);
                const active = activeRoom?.room_id === room.room_id;

                return (
                  <article
                    key={room.room_id}
                    className={`screening-room-card ${active ? "active" : ""}`}
                  >
                    <button
                      type="button"
                      className="screening-room-select"
                      onClick={() => selectRoom(room)}
                    >
                      <span className="screening-room-icon">♫</span>

                      <span className="screening-room-info">
                        <strong>{room.room_name}</strong>
                        <small>
                          {room._count?.users || 0} thành viên
                          {" · "}
                          {room._count?.messages || 0} tin nhắn
                        </small>
                        <span
                          className={`screening-room-status ${
                            joined ? "joined" : ""
                          }`}
                        >
                          {owner
                            ? "Chủ phòng"
                            : joined
                              ? "Đã tham gia"
                              : "Chưa tham gia"}
                        </span>
                      </span>
                    </button>

                    <div className="screening-room-actions">
                      {!owner && joined && (
                        <button
                          type="button"
                          className="screening-leave-button"
                          onClick={() => leaveRoom(room)}
                        >
                          Rời phòng
                        </button>
                      )}

                      {(owner || user?.role === "admin") && (
                        <button
                          type="button"
                          className="screening-delete-button"
                          onClick={() => deleteRoom(room)}
                        >
                          Xóa
                        </button>
                      )}

                      {!joined && (
                        <button
                          type="button"
                          className="screening-join-button"
                          onClick={() => joinRoom(room)}
                        >
                          Tham gia
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState>Chưa có phòng công chiếu nào.</EmptyState>
          )}
        </aside>

        <section className="screening-chat-panel">
          {activeRoom ? (
            <>
              <header className="screening-chat-header">
                <div className="screening-chat-room-icon">♫</div>
                <div>
                  <h3>{activeRoom.room_name}</h3>
                  <span>{activeRoom._count?.users || 0} thành viên</span>
                </div>
                <span className="screening-live-label">PHÒNG ĐANG MỞ</span>
              </header>

              <div className="screening-chat-messages">
                {loadingMessages ? (
                  <div className="screening-loading">
                    <span className="screening-spinner" />
                    Đang tải tin nhắn...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const mine = message.sender_id === user?.user_id;

                    return (
                      <div
                        key={message.message_id}
                        className={`screening-message-row ${
                          mine ? "mine" : ""
                        }`}
                      >
                        {!mine && (
                          <div className="screening-message-avatar">
                            {message.sender?.full_name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>
                        )}

                        <div className="screening-message-bubble">
                          {!mine && (
                            <strong>
                              {message.sender?.full_name || "Người dùng"}
                            </strong>
                          )}

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
                  <div className="screening-chat-empty">
                    <span>♫</span>
                    <h3>Chưa có tin nhắn</h3>
                    <p>Hãy gửi lời chào để bắt đầu cuộc trò chuyện.</p>
                  </div>
                )}
              </div>

              <form className="screening-chat-form" onSubmit={sendMessage}>
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Chia sẻ điều gì đó với mọi người..."
                  maxLength={255}
                  required
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={sending || !content.trim()}
                >
                  {sending ? "Đang gửi..." : "Gửi"}
                  <span>➤</span>
                </button>
              </form>
            </>
          ) : (
            <div className="screening-chat-placeholder">
              <div className="screening-placeholder-disc">♫</div>
              <h3>Chào mừng đến với Phòng công chiếu</h3>
              <p>
                Chọn một phòng để tham gia trò chuyện hoặc tạo phòng mới để kết
                nối với mọi người.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
