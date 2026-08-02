import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Compass,
  BookOpen,
  Info,
  Mail,
  HeartPulse,
  Sparkles,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X
} from "lucide-react";

const getInitials = (name) => {
  if (!name) return "";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = user?.role === "admin" ? "/dashboard/admin" : user?.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student";

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = (e) => {
    e.stopPropagation();
    setMobileOpen((prev) => !prev);
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", position: "relative" }}>
        {/* LOGO */}
        <Link to="/" className="navbar-logo" onClick={closeMobile} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="JONNE"
            style={{
              height: "38px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links desktop-only" style={{ display: "flex", alignItems: "center", gap: "12px", whiteSpace: "nowrap" }}>
          <Link to="/browse" className="nav-item-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Compass size={16} />
            Browse
          </Link>
          <Link to="/knowledge-hub" className="nav-item-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <BookOpen size={16} />
            Knowledge Hub
          </Link>
          <Link to="/about" className="nav-item-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Info size={16} />
            About
          </Link>
          <Link to="/contact" className="nav-item-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Mail size={16} />
            Contact
          </Link>
          <Link to="/wellness" className="nav-item-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <HeartPulse size={16} />
            Wellness
          </Link>
          <Link to="/ai-assistant" className="nav-item-link ai-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={16} />
            AI Assistant
          </Link>

          <span style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px", flexShrink: 0 }}></span>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {user.role === "student" && (
                <Link to="/post" className="btn btn-sm btn-secondary" style={{ borderRadius: "var(--radius-sm)", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <PlusCircle size={14} />
                  Post Question
                </Link>
              )}
              <Link to={dashboardPath} style={{ fontWeight: 600, color: "var(--primary)", whiteSpace: "nowrap", fontSize: "14px", padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <div className="navbar-user" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  className="navbar-avatar"
                  style={{ background: user.avatarColor || "var(--primary)", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, position: "relative", overflow: "hidden", flexShrink: 0 }}
                >
                  <span style={{ position: "absolute", zIndex: 1 }}>{getInitials(user.name)}</span>
                  <img
                    src={user.avatar_url || user.photo || user.avatar || `https://unavatar.io/${user.email}`}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => { onLogout(); navigate("/"); }}
                  style={{ background: "transparent", color: "var(--accent)", fontWeight: 600, padding: "4px 8px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary nav-cta" style={{ borderRadius: "99px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <LogIn size={14} />
              Log In / Sign Up
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="hamburger-btn"
          onClick={toggleMobile}
          style={{
            display: "none",
            background: "none",
            fontSize: "24px",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
            padding: "8px",
            minWidth: "44px",
            minHeight: "44px",
            alignItems: "center",
            justifyContent: "center"
          }}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <>
          <div
            className="mobile-menu-backdrop"
            onClick={closeMobile}
            style={{
              position: "fixed",
              top: "72px",
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.4)",
              zIndex: 190,
              backdropFilter: "blur(4px)",
            }}
          />

          <div
            className="mobile-menu"
            style={{
              position: "absolute",
              top: "72px",
              left: 0,
              right: 0,
              width: "100%",
              background: "white",
              borderBottom: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              padding: "20px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              zIndex: 200,
              maxHeight: "calc(100vh - 72px)",
              overflowY: "auto",
            }}
          >
            {/* Top User Account / Login Section */}
            {!user ? (
              <div style={{ display: "flex", gap: 12, width: "100%", marginBottom: 4 }}>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", color: "white", textAlign: "center", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <LogIn size={16} />
                  Log In
                </Link>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: "center", textAlign: "center", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <UserPlus size={16} />
                  Sign Up
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    className="navbar-avatar"
                    style={{ background: user.avatarColor || "var(--primary)", width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, position: "relative", overflow: "hidden", flexShrink: 0 }}
                  >
                    <span style={{ position: "absolute", zIndex: 1 }}>{getInitials(user.name)}</span>
                    <img
                      src={user.avatar_url || user.photo || user.avatar || `https://unavatar.io/${user.email}`}
                      alt={user.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>{user.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize" }}>{user.role === "admin" ? "Admin" : user.role === "tutor" ? "Tutor" : "Student"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {user.role === "student" && (
                    <Link to="/post" onClick={closeMobile} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <PlusCircle size={16} />
                      Post Question
                    </Link>
                  )}
                  <Link to={dashboardPath} onClick={closeMobile} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", color: "white", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <LayoutDashboard size={16} />
                    My Dashboard
                  </Link>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { closeMobile(); onLogout(); navigate("/"); }}
                  style={{ width: "100%", justifyContent: "center", background: "var(--bg-main)", color: "var(--accent)", borderRadius: "var(--radius-sm)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "4px 0" }} />

            {/* Navigation Links */}
            <Link to="/browse" onClick={closeMobile} className="mobile-nav-item" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Compass size={18} />
              Browse Questions
            </Link>
            <Link to="/knowledge-hub" onClick={closeMobile} className="mobile-nav-item" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BookOpen size={18} />
              Knowledge Hub
            </Link>
            <Link to="/about" onClick={closeMobile} className="mobile-nav-item" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Info size={18} />
              About Us
            </Link>
            <Link to="/contact" onClick={closeMobile} className="mobile-nav-item" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Mail size={18} />
              Contact Us
            </Link>
            <Link to="/wellness" onClick={closeMobile} className="mobile-nav-item" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HeartPulse size={18} />
              Wellness Center
            </Link>
            <Link to="/ai-assistant" onClick={closeMobile} className="mobile-nav-item ai-mobile-link" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={18} />
              AI Study Assistant
            </Link>
          </div>
        </>
      )}

      <style>{`
        .nav-item-link {
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 99px;
          transition: all 0.2s;
          white-space: nowrap;
          word-break: keep-all;
          overflow-wrap: normal;
          display: inline-flex;
          align-items: center;
        }
        .nav-item-link:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
        .nav-item-link.ai-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .mobile-nav-item {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
          word-break: keep-all;
          overflow-wrap: normal;
          display: flex;
          align-items: center;
        }
        .mobile-nav-item:hover {
          background: var(--bg-main);
          color: var(--primary);
        }
        .mobile-nav-item.ai-mobile-link {
          color: var(--primary);
          gap: 8px;
        }
        @media (max-width: 1024px) {
          .desktop-only {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}
