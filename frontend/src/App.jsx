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
import LibraryPage from "./pages/LibraryPage";

import "./App.css";
import "./components/layout/AppLayout.css";
import "./components/layout/Sidebar.css";
import "./components/layout/Header.css";
import "./components/layout/NotificationPanel.css";

import "./pages/Homepage.css";
import "./pages/ArtistsPage.css";
import "./pages/AlbumsPage.css";
import "./pages/SongsPage.css";

import "./components/common/SongCard.css";
import "./components/common/EmptyState.css";

export default function App() {
  const { user, loading } = useAuth();

  const [page, setPage] = useState("home");
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState("");

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

  const openAlbum = (album) => {
    setSelectedAlbum(album);
    setPage("albums");
  };

  const openArtist = (artistName) => {
    setSelectedArtist(artistName);
    setPage("artists");
  };

  const currentPage =
    ["admin", "create"].includes(page) && user.role !== "admin" ? "home" : page;

  const pages = {
    home: <HomePage navigate={setPage} onSelectAlbum={openAlbum} />,

    library: (
      <LibraryPage
        onNavigate={setPage}
        onSelectAlbum={openAlbum}
        onSelectArtist={openArtist}
      />
    ),

    songs: <SongsPage />,

    artists: (
      <ArtistsPage
        selectedArtist={selectedArtist}
        onSelectArtist={openArtist}
        onBack={() => setSelectedArtist("")}
      />
    ),

    albums: (
      <AlbumsPage
        selectedAlbum={selectedAlbum}
        onSelectAlbum={openAlbum}
        onBack={() => setSelectedAlbum(null)}
      />
    ),

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
    <AppLayout
      page={sidebarPage}
      navigate={setPage}
      theme={theme}
      onThemeChange={setTheme}
    >
      {pages[currentPage] || pages.home}
    </AppLayout>
  );
}
