import { useEffect, useState } from "react";
import { useAuth } from "./services/context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import SongsPage from "./pages/SongsPage";
import ArtistsPage from "./pages/ArtistsPage";
import AlbumsPage from "./pages/AlbumsPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import ScreeningRoomPage from "./pages/ScreeningRoomPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import MyContentPage from "./pages/MyContentPage";

import "./App.css";
import "./components/layout/AppLayout.css";
import "./components/layout/Sidebar.css";
import "./components/layout/Header.css";
import "./components/layout/NotificationPanel.css";

import "./pages/Homepage.css";
import "./pages/ArtistsPage.css";
import "./pages/AlbumsPage.css";

import "./components/common/SongCard.css";
import "./components/common/EmptyState.css";

function LibraryPage({ activeTab, onTabChange }) {
  const tabs = [
    { id: "songs", label: "Bài hát" },
    { id: "artists", label: "Nghệ sĩ" },
    { id: "albums", label: "Album" },
  ];

  return (
    <section className="library-page">
      <div className="library-header">
        <span className="library-eyebrow">YOUR COLLECTION</span>
        <h1>Thư viện</h1>
        <p>Quản lý và khám phá kho âm nhạc của bạn.</p>
      </div>

      <div className="library-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`library-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="library-content">
        {activeTab === "songs" && <SongsPage />}
        {activeTab === "artists" && <ArtistsPage />}
        {activeTab === "albums" && <AlbumsPage />}
      </div>
    </section>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  const [page, setPage] = useState("home");
  const [libraryTab, setLibraryTab] = useState("songs");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("music-space-theme") === "dark"
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("music-space-theme", theme);
  }, [theme]);

  const hasResetToken = new URLSearchParams(window.location.search).has(
    "resetToken",
  );

  if (hasResetToken) return <AuthPage />;

  if (loading) {
    return <div className="loading-screen">Đang tải...</div>;
  }

  if (!user) return <AuthPage />;

  const currentPage =
    ["admin", "create"].includes(page) && user.role !== "admin" ? "home" : page;

  const pages = {
    home: <HomePage navigate={setPage} />,

    library: <LibraryPage activeTab={libraryTab} onTabChange={setLibraryTab} />,

    songs: <SongsPage />,
    artists: <ArtistsPage />,
    albums: <AlbumsPage />,

    playlists: <PlaylistsPage />,
    screening: <ScreeningRoomPage />,
    "my-content": <MyContentPage />,

    profile: <ProfilePage theme={theme} onThemeChange={setTheme} />,

    admin: <AdminDashboardPage />,
    create: <AdminDashboardPage mode="create" />,
  };

  const sidebarPage = ["library", "songs", "artists", "albums"].includes(
    currentPage,
  )
    ? "library"
    : currentPage;

  return (
    <AppLayout page={sidebarPage} navigate={setPage}>
      {pages[currentPage] || pages.home}
    </AppLayout>
  );
}
