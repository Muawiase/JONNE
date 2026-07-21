import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const getInitials = (name) => {
  if (!name) return "";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = user?.role === "admin" ? "/dashboard/admin" : user?.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student";

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = (e) => {
    e.stopPropagation();
    setMobileOpen((prev) => !prev);
  };

  return (
    <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 200, background: "white" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", position: "relative" }}>
        <Link to="/" className="navbar-logo" onClick={closeMobile} style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="JONNE"
            style={{
              height: "40px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links desktop-only" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link to="/browse" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Browse</Link>
          <Link to="/about" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>About</Link>
          <Link to="/contact" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Contact</Link>

          <span style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }}></span>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {user.role === "student" && (
                <Link to="/post" className="btn btn-sm btn-secondary" style={{ borderRadius: "var(--radius-sm)" }}>
                  Post Question
                </Link>
              )}
              <Link to={dashboardPath} style={{ fontWeight: 600, color: "var(--primary)" }}>
                Dashboard
              </Link>
              <div className="navbar-user" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  className="navbar-avatar"
                  style={{ background: user.avatarColor, width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, position: "relative", overflow: "hidden" }}
                >
                  <span style={{ position: "absolute", zIndex: 1 }}>{getInitials(user.name)}</span>
                  <img
                    src={`https://unavatar.io/${user.email}`}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => { onLogout(); navigate("/"); }}
                  style={{ background: "transparent", color: "var(--accent)", fontWeight: 600, padding: "4px 8px" }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary nav-cta" style={{ borderRadius: "99px" }}>
              Log In / Sign Up
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
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
            justify-content: "center"
          }}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop overlay to close menu when tapping outside */}
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
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Mobile Menu Dropdown */}
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
              boxShadow: "var(--shadow-md)",
              padding: "20px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              zIndex: 200,
              maxHeight: "calc(100vh - 72px)",
              overflowY: "auto",
            }}
          >
            {/* Top Action Section: Log In & Sign Up at the top */}
            {!user ? (
              <div style={{ display: "flex", gap: 12, width: "100%", marginBottom: 4 }}>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", color: "white", textAlign: "center" }}
                >
                  Log In
                </Link>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: "center", textAlign: "center" }}
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    className="navbar-avatar"
                    style={{ background: user.avatarColor, width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, position: "relative", overflow: "hidden" }}
                  >
                    <span style={{ position: "absolute", zIndex: 1 }}>{getInitials(user.name)}</span>
                    <img
                      src={`https://unavatar.io/${user.email}`}
                      alt={user.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{user.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.role === "admin" ? "Admin" : user.role === "tutor" ? "Tutor" : "Student"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {user.role === "student" && (
                    <Link to="/post" onClick={closeMobile} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                      Post Question
                    </Link>
                  )}
                  <Link to={dashboardPath} onClick={closeMobile} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", color: "white" }}>
                    My Dashboard
                  </Link>
                </div>
                <button
                  className="btn"
                  onClick={() => { closeMobile(); onLogout(); navigate("/"); }}
                  style={{ width: "100%", justifyContent: "center", background: "var(--bg-main)", color: "var(--accent)" }}
                >
                  Sign Out
                </button>
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "0" }} />

            {/* Navigation Links */}
            <Link to="/browse" onClick={closeMobile} style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", padding: "4px 0" }}>
              Browse Questions
            </Link>
            <Link to="/about" onClick={closeMobile} style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", padding: "4px 0" }}>
              About Us
            </Link>
            <Link to="/contact" onClick={closeMobile} style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", padding: "4px 0" }}>
              Contact Us
            </Link>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
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

