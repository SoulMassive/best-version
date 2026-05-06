import {
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  FolderOpen,
  Home,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MessageSquare,
  Settings,
  Star,
  Target,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";
import { BrandLogo } from "../ui/BrandLogo";
import { Button } from "../ui/UI";
import { Footer } from "./Footer";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Assessment", to: "/assessment", icon: Target },
  { label: "Courses", to: "/courses", icon: BookOpen },
  { label: "Projects", to: "/projects", icon: FolderOpen },
  { label: "Earn", to: "/earn", icon: Briefcase },
  { label: "Competitions", to: "/competitions", icon: Trophy },
  { label: "Leaderboard", to: "/leaderboard", icon: Award },
  { label: "Community", to: "/community", icon: Users },
  { label: "Mentorship", to: "/mentorship", icon: Star },
  { label: "Career", to: "/career", icon: Layers },
  { label: "Startup Ideas", to: "/startups", icon: Lightbulb },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { auth, logout } = useAuth();
  const location = useLocation();
  const contentRef = useRef(null);

  const title = useMemo(() => {
    const item = navItems.find((entry) => entry.to === location.pathname);
    return item?.label || "Best Version";
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Link to="/dashboard">
            <BrandLogo compact theme="dark" />
          </Link>
          <button className="icon-btn mobile-only" onClick={() => setOpen(false)} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-profile">
          <Avatar src={auth.user?.avatar} name={auth.user?.name} size={44} />
          <div className="sidebar-profile-text">
            <strong>{auth.user?.name}</strong>
            <span>{auth.user?.headline || auth.user?.role}</span>
          </div>
          <div className="sidebar-xp-badge">
            <Zap size={12} />
            {auth.user?.stats?.xp || 0}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
                <Icon size={16} />
                <span>{item.label}</span>
                <ChevronRight size={13} className="nav-chevron" />
              </NavLink>
            );
          })}
          {["admin", "recruiter"].includes(auth.user?.role) ? (
            <NavLink to="/admin">
              <Home size={16} />
              <span>Admin</span>
              <ChevronRight size={13} className="nav-chevron" />
            </NavLink>
          ) : null}
        </nav>

        <Button variant="ghost" className="sidebar-logout" onClick={logout}>
          Logout
        </Button>
      </aside>

      <div className="app-content" ref={contentRef}>
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn mobile-only" onClick={() => setOpen(true)} type="button">
              <Menu size={18} />
            </button>
            <div>
              <span className="eyebrow">Best Version</span>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="xp-pill">
              <Zap size={13} />
              {auth.user?.stats?.xp || 0} XP
            </div>
            <Link className="avatar-link" to="/profile">
              <Avatar src={auth.user?.avatar} name={auth.user?.name} size={40} />
            </Link>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
        <Footer variant="app" />
      </div>
      {open ? <button className="sidebar-backdrop" onClick={() => setOpen(false)} type="button" /> : null}
    </div>
  );
}
