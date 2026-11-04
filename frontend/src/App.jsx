import { useState } from "react";
import { useAuth } from "./services/context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import SongsPage from "./pages/SongsPage";
import ArtistsPage from "./pages/ArtistsPage";
import AlbumsPage from "./pages/AlbumsPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import "./components/layout/NotificationPanel.css";

// CSS chung
import "./App.css";

// CSS bố cục và điều hướng
import "./components/layout/AppLayout.css";
import "./components/layout/Sidebar.css";
import "./components/layout/Header.css";

// CSS các trang
import "./pages/Homepage.css";
import "./pages/ArtistsPage.css";
import "./pages/AlbumsPage.css";

// CSS thành phần dùng chung
import "./components/common/SongCard.css";
import "./components/common/EmptyState.css";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("home");

  const hasResetToken = new URLSearchParams(window.location.search).has(
    "resetToken",
  );

  if (hasResetToken) return <AuthPage />;
  if (loading) return <div className="loading-screen">Đang tải...</div>;
  if (!user) return <AuthPage />;

  const currentPage = page === "admin" && user.role !== "admin" ? "home" : page;

  const pages = {
    home: <HomePage navigate={setPage} />,
    songs: <SongsPage />,
    artists: <ArtistsPage />,
    albums: <AlbumsPage />,
    playlists: <PlaylistsPage />,
    messages: <MessagesPage />,
    profile: <ProfilePage />,
    admin: <AdminPage />,
  };

  return (
    <AppLayout page={currentPage} navigate={setPage}>
      {pages[currentPage] || pages.home}
    </AppLayout>
  );
}
