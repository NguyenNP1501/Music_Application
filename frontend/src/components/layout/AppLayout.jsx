import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./NotificationPanel";

export default function AppLayout({ page, navigate, children }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar page={page} navigate={navigate} />

      <div className="app-main">
        <Header
          navigate={navigate}
          onNotifications={() => setShowNotifications((v) => !v)}
        />

        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
