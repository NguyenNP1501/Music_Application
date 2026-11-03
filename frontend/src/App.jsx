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

import "./App.css";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("home");

  if (loading) {
    return <div className="loading-screen">Đang tải...</div>;
  }

  if (!user) return <AuthPage />;

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

  if (page === "admin" && user.role !== "admin") {
    setPage("home");
    return null;
  }

  return (
    <AppLayout page={page} navigate={setPage}>
      {pages[page] || pages.home}
    </AppLayout>
  );
}
