import { useState } from "react";
import { useAuth } from "../services/context/AuthContext";
import "./ScreeningRoomPage.css";

import RoomMusicPlayer from "../components/screening/RoomMusicPlayer";
import RoomMembers from "../components/screening/RoomMembers";
import RoomChat from "../components/screening/RoomChat";

const demoRoom = {
  room_name: "Chill cùng Mây",
  room_code: "MAY026",
  members: [
    { id: 1, name: "Anh Minh", role: "Chủ phòng", online: true },
    { id: 2, name: "Hà Anh", role: "Thành viên", online: true },
    { id: 3, name: "Tuấn Anh", role: "Thành viên", online: true },
  ],
  song: {
    title: "Ngày dịu dàng",
    artist: "Mây Lang Thang",
    album: "Những ngày xanh",
    cover: "",
    currentTime: 124,
    duration: 222,
  },
};

const demoMessages = [
  {
    id: 1,
    name: "Hà Anh",
    content: "Bài này nghe lúc hoàng hôn hợp quá!",
    time: "20:31",
  },
  {
    id: 2,
    name: "Tuấn Anh",
    content: "Cùng nghe hết album nhé ♡",
    time: "20:31",
  },
  {
    id: 3,
    name: "Bạn",
    content: "Giai điệu này thật bình yên!",
    time: "20:32",
    mine: true,
  },
];

export default function ScreeningRoomPage() {
  const { user } = useAuth();
  const [activeTab] = useState("room");
  const [messages, setMessages] = useState(demoMessages);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(124);

  // Dữ liệu mẫu để dựng UI.
  // Sau này thay bằng dữ liệu phòng thực tế từ phần xử lý của nhóm.
  const isOwner = user?.role === "admin";

  const sendDemoMessage = (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    setMessages((old) => [
      ...old,
      {
        id: Date.now(),
        name: user?.full_name || "Bạn",
        content: message.trim(),
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mine: true,
      },
    ]);
    setMessage("");
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="screening-page">
      <div className="screening-top">
        <div>
          <span className="screening-eyebrow">LISTEN TOGETHER</span>
          <h1>{demoRoom.room_name}</h1>
          <div className="screening-connection">
            <span className="online-dot" />
            Đã kết nối · Đồng bộ thời gian thực
          </div>
        </div>

        <button className="screening-leave-room" type="button">
          Rời phòng
        </button>
      </div>

      <div className="screening-content">
        <main className="screening-main">
          <RoomMusicPlayer
            song={demoRoom.song}
            isOwner={isOwner}
            playing={playing}
            onTogglePlay={() => setPlaying((value) => !value)}
            progress={progress}
            onProgressChange={setProgress}
            formatTime={formatTime}
          />

          <RoomMembers members={demoRoom.members} />
        </main>

        <RoomChat
          messages={messages}
          message={message}
          onMessageChange={setMessage}
          onSend={sendDemoMessage}
        />
      </div>

      <div className="screening-room-code">
        Mã phòng: <strong>{demoRoom.room_code}</strong>
      </div>
    </div>
  );
}
