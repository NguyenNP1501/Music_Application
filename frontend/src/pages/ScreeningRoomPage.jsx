import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/context/AuthContext";
import EmptyState from "../components/common/EmptyState";
import { showToast } from "../utils/toast";

import "./ScreeningRoomPage.css";

import RoomMusicPlayer from "../components/screening/RoomMusicPlayer";
import RoomMembers from "../components/screening/RoomMembers";
import RoomChat from "../components/screening/RoomChat";

export default function ScreeningRoomPage() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/rooms");
      const roomList = data.rooms || [];

      setRooms(roomList);

      // Ưu tiên phòng mà người dùng đã tham gia.
      const joinedRoom = roomList.find((room) =>
        room.users?.some((member) => member.Useruser_id === user?.user_id),
      );

      if (joinedRoom) {
        setActiveRoom((current) => {
          if (current && current.room_id === joinedRoom.room_id) {
            return joinedRoom;
          }

          return joinedRoom;
        });
      } else {
        setActiveRoom(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phòng.");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) return;

    try {
      setLoadingMessages(true);
      const data = await apiRequest(`/rooms/${roomId}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      setMessages([]);
      setError(err.message || "Không thể tải tin nhắn.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (activeRoom?.room_id) {
      loadMessages(activeRoom.room_id);
    }
  }, [activeRoom?.room_id, loadMessages]);

  const isMember = (room) =>
    room.users?.some((member) => member.Useruser_id === user?.user_id);

  const isOwner = activeRoom?.created_by === user?.user_id;

  async function joinRoom(room) {
    try {
      await apiRequest(`/rooms/${room.room_id}/join`, {
        method: "POST",
      });

      const data = await apiRequest("/rooms");
      const updatedRooms = data.rooms || [];

      setRooms(updatedRooms);

      const joinedRoom = updatedRooms.find(
        (item) => item.room_id === room.room_id,
      );

      setActiveRoom(joinedRoom || null);
      showToast("Đã tham gia phòng công chiếu.");
    } catch (err) {
      showToast(err.message || "Không thể tham gia phòng.", "error");
    }
  }

  async function leaveRoom() {
    if (!activeRoom) return;

    try {
      await apiRequest(`/rooms/${activeRoom.room_id}/leave`, {
        method: "DELETE",
      });

      setActiveRoom(null);
      setMessages([]);
      showToast("Đã rời phòng công chiếu.");

      await loadRooms();
    } catch (err) {
      showToast(err.message || "Không thể rời phòng.", "error");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    const content = message.trim();

    if (!content || !activeRoom || sending) return;

    try {
      setSending(true);

      const data = await apiRequest(`/rooms/${activeRoom.room_id}/messages`, {
        method: "POST",
        body: { content },
      });

      setMessages((current) => [...current, data.message]);
      setMessage("");
    } catch (err) {
      showToast(err.message || "Không thể gửi tin nhắn.", "error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="screening-loading-page">
        Đang tải dữ liệu phòng công chiếu...
      </div>
    );
  }

  return (
    <div className="screening-page">
      {error && (
        <div className="screening-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      )}

      {!activeRoom ? (
        <section className="screening-empty-room">
          <span className="screening-eyebrow">LISTEN TOGETHER</span>

          <h1>Phòng công chiếu</h1>

          {rooms.length === 0 ? (
            <EmptyState>Hiện chưa có phòng công chiếu nào.</EmptyState>
          ) : (
            <>
              <p>
                Bạn chưa tham gia phòng nào. Hãy chọn một phòng để tham gia.
              </p>

              <div className="screening-available-rooms">
                {rooms.map((room) => (
                  <article
                    className="screening-available-room"
                    key={room.room_id}
                  >
                    <div>
                      <strong>{room.room_name}</strong>
                      <span>{room._count?.users || 0} thành viên</span>
                    </div>

                    {isMember(room) ? (
                      <button type="button" onClick={() => setActiveRoom(room)}>
                        Vào phòng
                      </button>
                    ) : (
                      <button type="button" onClick={() => joinRoom(room)}>
                        Tham gia
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <>
          <header className="screening-top">
            <div>
              <span className="screening-eyebrow">LISTEN TOGETHER</span>

              <h1>{activeRoom.room_name}</h1>

              <div className="screening-connection">
                <span className="online-dot" />
                Phòng công chiếu
              </div>
            </div>

            <button
              className="screening-leave-room"
              type="button"
              onClick={leaveRoom}
            >
              Rời phòng
            </button>
          </header>

          <div className="screening-content">
            <main className="screening-main">
              <RoomMusicPlayer
                song={activeRoom.song || null}
                isOwner={isOwner}
              />

              <RoomMembers
                roomId={activeRoom.room_id}
                totalMembers={activeRoom._count?.users || 0}
                currentUserId={user?.user_id}
                creatorId={activeRoom.created_by}
              />
            </main>

            <RoomChat
              messages={messages}
              message={message}
              onMessageChange={setMessage}
              onSend={sendMessage}
              loading={loadingMessages}
              sending={sending}
            />
          </div>
        </>
      )}
    </div>
  );
}
