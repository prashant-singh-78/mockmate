import { LayoutDashboard, LogOut, Plus, Settings } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Brand } from "./Brand";
import { useAuth } from "../context/AuthContext";

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand to="/dashboard" />
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink to="/dashboard"><LayoutDashboard size={18} /> Overview</NavLink>
          <NavLink to="/practice"><Plus size={18} /> New interview</NavLink>
          <span className="side-link-muted"><Settings size={18} /> Settings <small>Soon</small></span>
        </nav>
        <div className="side-profile">
          <span className="avatar">{user?.name.charAt(0).toUpperCase()}</span>
          <span><strong>{user?.name}</strong><small>{user?.email}</small></span>
          <button onClick={handleLogout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="app-main">
        {import.meta.env.VITE_DEMO_MODE === "true" && <div className="demo-notice">Private demo · data is saved only in this browser</div>}
        <Outlet />
      </main>
    </div>
  );
}
