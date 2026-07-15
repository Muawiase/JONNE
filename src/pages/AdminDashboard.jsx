import { useState } from "react";
import { Link } from "react-router-dom";
import {
  mockQuestions,
  mockTutors,
  subjects as initialSubjects,
  mockPlatformTransactions as initialTransactions,
  mockReports as initialReports
} from "../mockData";

// Expanded initial users list for the management screen
const initialUsers = [
  { id: 1, name: "Amara K.", email: "amara@example.com", role: "student", status: "Active", joinedAt: "2026-01-15", avatar: "", color: "#6C63FF" },
  { id: 2, name: "Marcus Chen", email: "marcus@example.com", role: "tutor", status: "Active", joinedAt: "2025-09-10", avatar: "", color: "#FF6584" },
  { id: 3, name: "Dr. Fatima Al-Hassan", email: "fatima@example.com", role: "tutor", status: "Active", joinedAt: "2025-05-12", avatar: "", color: "#6C63FF" },
  { id: 4, name: "Isabelle Moreau", email: "isabelle@example.com", role: "tutor", status: "Active", joinedAt: "2025-11-20", avatar: "", color: "#43C59E" },
  { id: 5, name: "Ayaan Patel", email: "ayaan@example.com", role: "tutor", status: "Active", joinedAt: "2026-02-02", avatar: "", color: "#FF9F43" },
  { id: 6, name: "Zara Williams", email: "zara@example.com", role: "tutor", status: "Active", joinedAt: "2026-03-10", avatar: "", color: "#A29BFE" },
  { id: 7, name: "Daniel O.", email: "daniel@example.com", role: "student", status: "Active", joinedAt: "2026-01-18", avatar: "", color: "#FF6B6B" },
  { id: 8, name: "Sophie L.", email: "sophie@example.com", role: "student", status: "Active", joinedAt: "2026-02-25", avatar: "", color: "#10AC84" },
  { id: 9, name: "Keita N.", email: "keita@example.com", role: "student", status: "Active", joinedAt: "2026-03-01", avatar: "", color: "#FF9F43" },
  { id: 10, name: "Rachel T.", email: "rachel@example.com", role: "student", status: "Banned", joinedAt: "2026-01-05", avatar: "", color: "#2E86DE" },
  { id: 11, name: "Alex Mercer", email: "admin@jonne.com", role: "admin", status: "Active", joinedAt: "2024-01-01", avatar: "", color: "#2C3E50" }
];

export default function AdminDashboard({ user }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core states to support real-time user action feedback
  const [users, setUsers] = useState(initialUsers);
  const [questions, setQuestions] = useState(mockQuestions);
  const [categories, setCategories] = useState(initialSubjects);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [reports, setReports] = useState(initialReports);
  const [reviews, setReviews] = useState(() => {
    // Flatten reviews from tutor records for ease of moderation
    const allReviews = [];
    mockTutors.forEach((tutor) => {
      tutor.reviews.forEach((r, idx) => {
        allReviews.push({
          id: `${tutor.id}-${idx}`,
          tutorName: tutor.name,
          author: r.author,
          text: r.text,
          rating: r.rating,
          verified: false
        });
      });
    });
    return allReviews;
  });

  // Settings state
  const [settings, setSettings] = useState({
    siteName: "JONNE Tutoring & Q&A Platform",
    commissionFee: "15",
    supportEmail: "support@jonne.com",
    maintenanceMode: false,
    allowRegistrations: true,
    securityLevel: "Medium"
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Add User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "student" });

  // Add Category State
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });

  // Manage Users handlers
  const handleToggleBan = (userId) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === "Active" ? "Banned" : "Active" };
      }
      return u;
    }));
  };

  const handleChangeRole = (userId, newRole) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const userObj = {
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "Active",
      joinedAt: new Date().toISOString().split("T")[0],
      avatar: newUser.role === "tutor" ? "" : newUser.role === "admin" ? "" : "",
      color: newUser.role === "tutor" ? "#4CAF50" : newUser.role === "admin" ? "#2C3E50" : "#6C63FF"
    };
    setUsers([userObj, ...users]);
    setNewUser({ name: "", email: "", role: "student" });
    setShowAddUser(false);
  };

  // Questions handlers
  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleFlagQuestion = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, status: q.status === "flagged" ? "open" : "flagged" };
      }
      return q;
    }));
  };

  // Categories handlers
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    const cat = {
      label: newCategory.name.trim(),
      icon: newCategory.icon || ""
    };
    setCategories([...categories, cat]);
    setNewCategory({ name: "", icon: "" });
  };

  const handleDeleteCategory = (label) => {
    setCategories(categories.filter(c => c.label !== label));
  };

  // Payments handlers
  const handleRefundTransaction = (txnId) => {
    setTransactions(transactions.map(t => {
      if (t.id === txnId) {
        return { ...t, status: "refunded" };
      }
      return t;
    }));
  };

  const handleApproveTransaction = (txnId) => {
    setTransactions(transactions.map(t => {
      if (t.id === txnId) {
        return { ...t, status: "completed" };
      }
      return t;
    }));
  };

  // Reviews handlers
  const handleDeleteReview = (reviewId) => {
    setReviews(reviews.filter(r => r.id !== reviewId));
  };

  const handleToggleVerifyReview = (reviewId) => {
    setReviews(reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, verified: !r.verified };
      }
      return r;
    }));
  };

  // Reports handlers
  const handleResolveReport = (reportId, action = "dismiss") => {
    // If action is "delete", find target item and remove it
    if (action === "delete") {
      const rep = reports.find(r => r.id === reportId);
      if (rep) {
        if (rep.type === "question") {
          handleDeleteQuestion(rep.targetId);
        } else if (rep.type === "review") {
          handleDeleteReview(rep.targetId);
        } else if (rep.type === "user") {
          setUsers(users.filter(u => u.id !== rep.targetId));
        }
      }
    }
    // Update report status to resolved
    setReports(reports.map(r => {
      if (r.id === reportId) {
        return { ...r, status: "resolved" };
      }
      return r;
    }));
  };

  // Settings submit handler
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const [questionSearch, setQuestionSearch] = useState("");
  const [questionStatusFilter, setQuestionStatusFilter] = useState("all");

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "" },
    { id: "users", label: "Manage Users", icon: "", badge: users.filter(u => u.status === "Banned").length },
    { id: "questions", label: "Questions", icon: "" },
    { id: "categories", label: "Categories", icon: "" },
    { id: "payments", label: "Payments", icon: "" },
    { id: "reviews", label: "Reviews", icon: "" },
    { id: "reports", label: "Reports", icon: "", badge: reports.filter(r => r.status === "pending").length },
    { id: "settings", label: "Settings", icon: "" }
  ];

  return (
    <div className="sd-root admin-theme">
      {/* Visual overrides to convert student style to admin dark theme */}
      <style>{`
        .admin-theme {
          --primary: #34495e;
          --primary-dark: #2c3e50;
          --primary-light: #eaeded;
          --accent: #1abc9c;
        }
        .admin-theme .sd-sidebar {
          background: #2c3e50;
          color: white;
        }
        .admin-theme .sd-sidebar-name {
          color: white;
        }
        .admin-theme .sd-sidebar-role {
          color: #1abc9c;
        }
        .admin-theme .sd-nav-item {
          color: rgba(255,255,255,0.7);
        }
        .admin-theme .sd-nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .admin-theme .sd-nav-item-active {
          background: #1abc9c !important;
          color: white !important;
          font-weight: 700;
        }
        .admin-theme .sd-sidebar-back {
          color: #1abc9c;
        }
        .admin-theme .sd-welcome-banner {
          background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
          box-shadow: 0 8px 32px rgba(44, 62, 80, 0.2);
        }
        
        /* Table styles for dashboard */
        .admin-table-container {
          overflow-x: auto;
          margin-top: 15px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }
        .admin-table th {
          background: var(--primary-light);
          color: var(--text-primary);
          padding: 14px 18px;
          font-weight: 700;
          border-bottom: 1px solid var(--border);
        }
        .admin-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .admin-table tr:last-child td {
          border-bottom: none;
        }
        .admin-table tr:hover {
          background: #fbfbfb;
        }
        .role-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .role-student { background: #e3f2fd; color: #1e88e5; }
        .role-tutor { background: #e8f5e9; color: #43a047; }
        .role-admin { background: #f3e5f5; color: #8e24aa; }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }
        .status-active { background: #e8f5e9; color: #2e7d32; }
        .status-banned { background: #ffebee; color: #c62828; }
        .status-pending { background: #fff8e1; color: #f57f17; }
        .status-resolved { background: #eceff1; color: #37474f; }
        .status-refunded { background: #f5f5f5; color: #616161; }

        .btn-table {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 4px;
          font-weight: 600;
          margin-right: 6px;
        }
        .btn-danger {
          background: #ffebee;
          color: #c62828;
        }
        .btn-danger:hover {
          background: #ef5350;
          color: white;
        }
        .btn-success-solid {
          background: #2e7d32;
          color: white;
        }
        .btn-success-solid:hover {
          background: #1b5e20;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }
        .btn-outline:hover {
          background: var(--primary-light);
        }

        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .admin-modal {
          background: white;
          border-radius: var(--radius-lg);
          max-width: 500px;
          width: 100%;
          padding: 30px;
          box-shadow: var(--shadow-lg);
          position: relative;
        }
        
        .admin-input-group {
          margin-bottom: 16px;
        }
        .admin-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }
        .admin-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--border);
          outline: none;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .admin-input:focus {
          border-color: var(--primary);
        }

        .chart-bar-container {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          height: 150px;
          padding: 15px 0 5px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 12px;
        }
        .chart-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .chart-bar {
          width: 100%;
          background: var(--primary);
          border-radius: 4px 4px 0 0;
          transition: height 0.3s;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding-bottom: 4px;
        }
        .chart-column:hover .chart-bar {
          background: var(--accent);
        }
        .chart-label {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 6px;
          font-weight: 600;
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="sd-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sd-sidebar ${sidebarOpen ? "sd-sidebar-open" : ""}`}>
        <div className="sd-sidebar-user">
          <div className="sd-sidebar-avatar" style={{ background: "linear-gradient(135deg,#34495e,#1abc9c)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", zIndex: 1 }}>{(user?.name || "A").charAt(0).toUpperCase()}</span>
            <img
              src={`https://unavatar.io/${user?.email || 'admin@jonne.com'}`}
              alt={user?.name || "Admin"}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="sd-sidebar-name">{user?.name || "admin"}</div>
            <div className="sd-sidebar-role"> System Administrator</div>
          </div>
        </div>
        <nav className="sd-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sd-nav-item ${active === item.id ? "sd-nav-item-active" : ""}`}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
            >
              <span className="sd-nav-icon">{item.icon}</span>
              <span className="sd-nav-label">{item.label}</span>
              {item.badge > 0 && <span className="sd-nav-badge" style={{ background: item.id === "reports" ? "#F44336" : "#E28743" }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sd-sidebar-footer">
          <Link to="/" className="sd-sidebar-back">← Go to Main Site</Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="sd-main">
        {/* Mobile Header Bar */}
        <div className="sd-mobile-bar" style={{ background: "#2c3e50" }}>
          <button className="sd-hamburger" style={{ color: "white" }} onClick={() => setSidebarOpen(!sidebarOpen)}></button>
          <span className="sd-mobile-title" style={{ color: "white" }}>
            {NAV_ITEMS.find((i) => i.id === active)?.icon}{" "}
            {NAV_ITEMS.find((i) => i.id === active)?.label}
          </span>
        </div>

        <div className="sd-content">
          {/* TAB 1: DASHBOARD */}
          {active === "dashboard" && (
            <div className="sd-section">
              <div className="sd-welcome-banner">
                <div className="sd-welcome-text">
                  <h1> System Control Dashboard</h1>
                  <p>Welcome back, Administrator. Platform operations, security, and statistics are functioning correctly.</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="sd-stats-grid">
                {[
                  { icon: "", num: users.length, label: "Total Users", color: "#2980b9", sub: `${users.filter(u => u.role === "tutor").length} Tutors, ${users.filter(u => u.role === "student").length} Students` },
                  { icon: "", num: questions.length, label: "Total Questions", color: "#27ae60", sub: `${questions.filter(q => q.status === "open").length} Open questions` },
                  { icon: "", num: categories.length, label: "Categories", color: "#8e44ad", sub: "Active academic topics" },
                  { icon: "", num: `$${transactions.reduce((acc, t) => t.status === "completed" ? acc + t.amount : acc, 0)}`, label: "Gross Volume", color: "#f39c12", sub: "Successful transactions" },
                  { icon: "", num: reports.filter(r => r.status === "pending").length, label: "Pending Reports", color: "#c0392b", sub: "Requires admin review" },
                  { icon: "", num: reviews.length, label: "Moderated Reviews", color: "#1abc9c", sub: "Tutor feedback items" }
                ].map((s, idx) => (
                  <div className="sd-stat-card" key={idx} style={{ "--accent-color": s.color }}>
                    <div className="sd-stat-icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
                    <div className="sd-stat-num" style={{ fontSize: 24 }}>{s.num}</div>
                    <div className="sd-stat-label">{s.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Graphical Trend Row */}
              <div className="sd-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
                {/* Registrations Chart */}
                <div className="sd-widget" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}> User Signups Trend</h3>
                    <span style={{ fontSize: 11, background: "var(--primary-light)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>2026 Target</span>
                  </div>
                  <div className="chart-bar-container">
                    {[
                      { l: "Jan", h: 30, v: "15" },
                      { l: "Feb", h: 48, v: "24" },
                      { l: "Mar", h: 60, v: "30" },
                      { l: "Apr", h: 80, v: "40" },
                      { l: "May", h: 110, v: "55" },
                      { l: "Jun", h: 140, v: "70" },
                      { l: "Jul", h: 160, v: "80" }
                    ].map((col) => (
                      <div className="chart-column" key={col.l}>
                        <div className="chart-bar" style={{ height: `${col.h * 0.7}%` }}>{col.v}</div>
                        <span className="chart-label">{col.l}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Monthly registrations showing +25% MoM increase.</p>
                </div>

                {/* Popular Categories */}
                <div className="sd-widget" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}> Popular subjects</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { name: "Mathematics", icon: "", pct: 85, color: "#3498db", count: 32 },
                      { name: "Coding", icon: "", pct: 75, color: "#9b59b6", count: 28 },
                      { name: "Physics", icon: "", pct: 60, color: "#f1c40f", count: 21 },
                      { name: "Languages", icon: "", pct: 45, color: "#e67e22", count: 15 }
                    ].map((subj) => (
                      <div key={subj.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                          <span>{subj.icon} {subj.name}</span>
                          <span style={{ color: "var(--text-muted)" }}>{subj.count} Questions</span>
                        </div>
                        <div style={{ height: 6, background: "var(--primary-light)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${subj.pct}%`, height: "100%", background: subj.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* System Overview Widgets */}
              <div className="sd-widget">
                <div className="sd-widget-header">
                  <h2> System Diagnostics & Alerts</h2>
                  <span style={{ fontSize: 12, color: "#27ae60", fontWeight: 700 }}> All Services Operational</span>
                </div>
                <div className="sd-list">
                  <div className="sd-list-item">
                    <span style={{ fontSize: 20 }}></span>
                    <div className="sd-list-item-body">
                      <div className="sd-list-title">Vite Dev Server Status</div>
                      <div className="sd-list-meta">Running on port 5173 - Hot Module Replacement enabled</div>
                    </div>
                    <span className="sd-time-chip" style={{ background: "#e8f5e9", color: "#2e7d32", padding: "4px 8px", borderRadius: 4, fontWeight: 700 }}>ONLINE</span>
                  </div>
                  <div className="sd-list-item">
                    <span style={{ fontSize: 20 }}></span>
                    <div className="sd-list-item-body">
                      <div className="sd-list-title">Database Storage Mode</div>
                      <div className="sd-list-meta">In-Memory Mock State (changes persist during session)</div>
                    </div>
                    <span className="sd-time-chip" style={{ background: "#fff8e1", color: "#f57f17", padding: "4px 8px", borderRadius: 4, fontWeight: 700 }}>MOCK ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE USERS */}
          {active === "users" && (
            <div className="sd-section">
              <div className="sd-page-header">
                <h1> User Account Management</h1>
                <p>Monitor, ban, modify credentials and toggle administrative status of students and tutors.</p>
              </div>

              {/* Filters Panel */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 280 }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder=" Search name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="admin-input"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    style={{ width: 140 }}
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="tutor">Tutors</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>
                   Add User
                </button>
              </div>

              {/* Users Table */}
              <div className="sd-widget" style={{ padding: "0" }}>
                <div className="admin-table-container" style={{ margin: 0, border: "none" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email Address</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => {
                          const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
                          const matchesRole = userRoleFilter === "all" ? true : u.role === userRoleFilter;
                          return matchesSearch && matchesRole;
                        })
                        .map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                                  {u.avatar}
                                </div>
                                <span style={{ fontWeight: 600 }}>{u.name}</span>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`role-badge role-${u.role}`}>{u.role}</span>
                            </td>
                            <td>
                              <span className={`status-badge status-${u.status.toLowerCase()}`}>{u.status}</span>
                            </td>
                            <td>{u.joinedAt}</td>
                            <td>
                              <button
                                className={`btn-table ${u.status === "Active" ? "btn-danger" : "btn-success-solid"}`}
                                onClick={() => handleToggleBan(u.id)}
                              >
                                {u.status === "Active" ? " Ban" : " Unban"}
                              </button>
                              <select
                                className="btn-table btn-outline"
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                style={{ padding: "4px 8px", fontSize: 12, height: 28 }}
                              >
                                <option value="student">Student</option>
                                <option value="tutor">Tutor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add User Modal */}
              {showAddUser && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal">
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}> Create New Mock Account</h3>
                    <form onSubmit={handleAddUser}>
                      <div className="admin-input-group">
                        <label className="admin-label">Full Name</label>
                        <input
                          type="text"
                          required
                          className="admin-input"
                          placeholder="e.g. John Doe"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label className="admin-label">Email Address</label>
                        <input
                          type="email"
                          required
                          className="admin-input"
                          placeholder="e.g. john@example.com"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                      </div>
                      <div className="admin-input-group">
                        <label className="admin-label">Role Assignment</label>
                        <select
                          className="admin-input"
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                          <option value="student">Student / Learner</option>
                          <option value="tutor">Tutor / Helper</option>
                          <option value="admin">System Administrator</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                        <button type="button" className="btn btn-outline" style={{ borderRadius: 4 }} onClick={() => setShowAddUser(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ borderRadius: 4, background: "#1abc9c" }}>Save User</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUESTIONS */}
          {active === "questions" && (
            <div className="sd-section">
              <div className="sd-page-header">
                <h1> Platform Question Feed Moderation</h1>
                <p>Review current requests, delete answers or text with inappropriate content, and view details.</p>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  className="admin-input"
                  placeholder=" Search questions..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 250 }}
                />
                <select
                  className="admin-input"
                  value={questionStatusFilter}
                  onChange={(e) => setQuestionStatusFilter(e.target.value)}
                  style={{ width: 150 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="solved">Solved</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              {/* Questions Moderation Feed */}
              <div className="sd-question-list">
                {questions
                  .filter((q) => {
                    const matchesSearch = q.title.toLowerCase().includes(questionSearch.toLowerCase()) || q.description.toLowerCase().includes(questionSearch.toLowerCase());
                    const matchesStatus = questionStatusFilter === "all" ? true :
                                          questionStatusFilter === "flagged" ? q.status === "flagged" : q.status === questionStatusFilter;
                    return matchesSearch && matchesStatus;
                  })
                  .map((q) => (
                    <div className="sd-question-card" key={q.id} style={{ borderLeft: q.status === "flagged" ? "4px solid #c0392b" : undefined }}>
                      <div className="sd-question-card-top">
                        <div className="sd-question-badges">
                          <span className="sd-pill" style={{ background: "rgba(108,99,255,0.08)", color: "#6C63FF" }}>
                            {q.subjectIcon} {q.subject}
                          </span>
                          <span className="sd-pill" style={{ background: "#eceff1", color: "#37474f" }}>{q.level}</span>
                          {q.isPaid ? (
                            <span className="sd-pill" style={{ background: "#e3f2fd", color: "#1e88e5" }}> Paid: ${q.pricePerHour}/hr</span>
                          ) : (
                            <span className="sd-pill" style={{ background: "#e8f5e9", color: "#2e7d32" }}> Free / Peer Help</span>
                          )}
                          <span className={`status-badge status-${q.status.replace("-", "")}`} style={{ padding: "2px 6px" }}>{q.status}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn-table btn-outline"
                            onClick={() => handleFlagQuestion(q.id)}
                            style={{ margin: 0, borderColor: q.status === "flagged" ? "#c0392b" : undefined, color: q.status === "flagged" ? "#c0392b" : undefined }}
                          >
                             {q.status === "flagged" ? "Unflag" : "Flag"}
                          </button>
                          <button
                            className="btn-table btn-danger"
                            onClick={() => handleDeleteQuestion(q.id)}
                            style={{ margin: 0 }}
                          >
                             Delete
                          </button>
                        </div>
                      </div>
                      <div>
                        <Link to={`/question/${q.id}`} className="sd-question-title" style={{ fontSize: 16 }}>{q.title}</Link>
                        <p className="sd-question-excerpt" style={{ fontSize: 13, marginTop: 4 }}>{q.description}</p>
                      </div>
                      <div className="sd-question-footer" style={{ padding: "8px 0 0", marginTop: 0 }}>
                        <div className="sd-question-meta">
                          <span> Posted by <strong>{q.studentName}</strong></span>
                          <span> Bids: {q.responses}</span>
                          <span> Limit: {q.deadline}</span>
                        </div>
                        <Link to={`/question/${q.id}`} style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>View Question Details →</Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES */}
          {active === "categories" && (
            <div className="sd-section">
              <div className="sd-page-header">
                <h1> Academic Categories (Subjects)</h1>
                <p>Add new subject tags or edit/delete existing topics in which questions can be categorized.</p>
              </div>

              {/* Add New Category form */}
              <div className="sd-widget" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}> Create New Category Tag</h3>
                <form onSubmit={handleAddCategory} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="admin-label">Subject Label</label>
                    <input
                      type="text"
                      className="admin-input"
                      required
                      placeholder="e.g. Advanced Calculus"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div style={{ width: 100 }}>
                    <label className="admin-label">Emoji Icon</label>
                    <select
                      className="admin-input"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    >
                      <option value=""> Books</option>
                      <option value=""> Triangle</option>
                      <option value=""> Laptop</option>
                      <option value=""> Bolt</option>
                      <option value=""> DNA</option>
                      <option value=""> Scroll</option>
                      <option value=""> Chart</option>
                      <option value=""> Speech</option>
                      <option value=""> Pen</option>
                      <option value=""> Art</option>
                      <option value=""> Microscope</option>
                      <option value=""> Earth</option>
                      <option value=""> Music</option>
                      <option value=""> Bulb</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: 42, display: "flex", alignItems: "center" }}>
                    Create Topic
                  </button>
                </form>
              </div>

              {/* Categories list grid */}
              <div className="sd-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                {categories.map((c) => (
                  <div className="sd-stat-card" key={c.label} style={{ cursor: "default", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{c.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</span>
                    </div>
                    <button
                      className="btn-table btn-danger"
                      onClick={() => handleDeleteCategory(c.label)}
                      style={{ padding: "4px 8px", margin: 0 }}
                      title="Delete category"
                    >
                      
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {active === "payments" && (
            <div className="sd-section">
              <div className="sd-page-header">
                <h1> Platforms Financial Transaction Ledger</h1>
                <p>Track student deposits, process manual payouts, verify commission cuts, and manage refunds.</p>
              </div>

              {/* Stats Summary cards */}
              <div className="sd-stats-grid">
                <div className="sd-stat-card" style={{ "--accent-color": "#2ecc71" }}>
                  <div className="sd-stat-icon" style={{ background: "#2ecc711a", color: "#2ecc71" }}></div>
                  <div className="sd-stat-num">$148.00</div>
                  <div className="sd-stat-label">Total Volume (Gross)</div>
                </div>
                <div className="sd-stat-card" style={{ "--accent-color": "#3498db" }}>
                  <div className="sd-stat-icon" style={{ background: "#3498db1a", color: "#3498db" }}></div>
                  <div className="sd-stat-num">${(148 * (parseFloat(settings.commissionFee) / 100)).toFixed(2)}</div>
                  <div className="sd-stat-label">Platform Fees ({settings.commissionFee}%)</div>
                </div>
                <div className="sd-stat-card" style={{ "--accent-color": "#e74c3c" }}>
                  <div className="sd-stat-icon" style={{ background: "#e74c3c1a", color: "#e74c3c" }}></div>
                  <div className="sd-stat-num">$15.00</div>
                  <div className="sd-stat-label">Refunds Processed</div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="sd-widget">
                <div className="sd-widget-header">
                  <h2> Transaction History Ledger</h2>
                </div>
                <div className="admin-table-container" style={{ margin: 0, border: "none" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Student</th>
                        <th>Tutor</th>
                        <th>Subject</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id}>
                          <td><strong>{t.id}</strong></td>
                          <td>{t.studentName}</td>
                          <td>{t.tutorName}</td>
                          <td>{t.subject}</td>
                          <td style={{ fontWeight: 700, color: t.status === "refunded" ? "#7f8c8d" : "#27ae60" }}>
                            {t.status === "refunded" ? "-" : ""}${t.amount.toFixed(2)}
                          </td>
                          <td>{new Date(t.date).toLocaleDateString("en-GB")}</td>
                          <td>
                            <span className={`status-badge status-${t.status}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            {t.status === "completed" && (
                              <button
                                className="btn-table btn-danger"
                                onClick={() => handleRefundTransaction(t.id)}
                              >
                                 Refund
                              </button>
                            )}
                            {t.status === "pending" && (
                              <button
                                className="btn-table btn-success-solid"
                                onClick={() => handleApproveTransaction(t.id)}
                              >
                                 Approve Payout
                              </button>
                            )}
                            {t.status === "refunded" && (
                              <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No action needed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS */}
          {active === "reviews" && (
            <div className="sd-section">
              <div className="sd-page-header">
                <h1> Tutor Review Moderation Feed</h1>
                <p>Read all feedback ratings written by students. Moderate inappropriate statements or verify top reviews.</p>
              </div>

              {/* Reviews Feed */}
              <div className="sd-question-list">
                {reviews.map((r) => (
                  <div className="sd-question-card" key={r.id} style={{ borderLeft: r.verified ? "4px solid #1abc9c" : undefined }}>
                    <div className="sd-question-card-top">
                      <div className="sd-question-badges">
                        <span style={{ fontSize: 13, fontWeight: 700 }}> Reviewed Tutor: {r.tutorName}</span>
                        <span className="sd-pill" style={{ background: "#fff8e1", color: "#f57f17", fontWeight: 700 }}>
                          {"".repeat(r.rating) + "".repeat(5 - r.rating)} ({r.rating}/5)
                        </span>
                        {r.verified && (
                          <span className="sd-pill" style={{ background: "#e8f5e9", color: "#2e7d32", fontSize: 11 }}>
                             Verified Review
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-table btn-outline"
                          onClick={() => handleToggleVerifyReview(r.id)}
                          style={{ margin: 0, color: r.verified ? "#2e7d32" : undefined }}
                        >
                          {r.verified ? "Unverify" : "Verify Feedback"}
                        </button>
                        <button
                          className="btn-table btn-danger"
                          onClick={() => handleDeleteReview(r.id)}
                          style={{ margin: 0 }}
                        >
                           Delete Review
                        </button>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontStyle: "italic", fontSize: 14, color: "var(--text-secondary)" }}>"{r.text}"</p>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                      Submitted by student <strong>{r.author}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: REPORTS */}
          {active === "reports" && (
            <div className="sd-section">
              <div className="sd-page-header">
                <h1> System Flags & Abuse Reports</h1>
                <p>Investigate claims of harassment, spam, copyright issues, or violation of community standards.</p>
              </div>

              {/* Reports Table */}
              <div className="sd-widget">
                <div className="sd-widget-header">
                  <h2> Flagged Platform Activity</h2>
                </div>
                <div className="admin-table-container" style={{ margin: 0, border: "none" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Report Info</th>
                        <th>Reason for Report</th>
                        <th>Reporter</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((rep) => (
                        <tr key={rep.id}>
                          <td>
                            <div>
                              <span style={{ fontSize: 11, background: "var(--primary-light)", padding: "2px 6px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase" }}>
                                {rep.type}
                              </span>
                              <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                                {rep.targetTitle} (ID: {rep.targetId})
                              </div>
                            </div>
                          </td>
                          <td>{rep.reason}</td>
                          <td>{rep.reportedBy}</td>
                          <td>
                            <span className={`status-badge status-${rep.status}`}>
                              {rep.status}
                            </span>
                          </td>
                          <td>
                            {rep.status === "pending" ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  className="btn-table btn-success-solid"
                                  onClick={() => handleResolveReport(rep.id, "dismiss")}
                                >
                                  Dismiss Report
                                </button>
                                <button
                                  className="btn-table btn-danger"
                                  onClick={() => handleResolveReport(rep.id, "delete")}
                                >
                                   Delete Target
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {active === "settings" && (
            <div className="sd-section">
              <div className="sd-page-header">
                <h1> Global Platform Settings</h1>
                <p>Modify basic portal configs, fee structure rates, toggle maintenance mode, and adjust safety metrics.</p>
              </div>

              {settingsSaved && (
                <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "12px 18px", borderRadius: "var(--radius-md)", border: "1px solid #2e7d32", marginBottom: 20, fontWeight: 600 }}>
                   System configuration settings saved successfully!
                </div>
              )}

              {/* Form Settings */}
              <div className="sd-widget" style={{ padding: 30 }}>
                <form onSubmit={handleSaveSettings}>
                  <div className="sd-stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div className="admin-input-group">
                      <label className="admin-label">Platform Name</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      />
                    </div>
                    <div className="admin-input-group">
                      <label className="admin-label">Platform Fee Commission (%)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={settings.commissionFee}
                        onChange={(e) => setSettings({ ...settings, commissionFee: e.target.value })}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="sd-stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div className="admin-input-group">
                      <label className="admin-label">Support Helpdesk Email</label>
                      <input
                        type="email"
                        className="admin-input"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      />
                    </div>
                    <div className="admin-input-group">
                      <label className="admin-label">Global Security Policy</label>
                      <select
                        className="admin-input"
                        value={settings.securityLevel}
                        onChange={(e) => setSettings({ ...settings, securityLevel: e.target.value })}
                      >
                        <option value="Low">Low - Open registrations, no checks</option>
                        <option value="Medium">Medium - Standard token controls (Default)</option>
                        <option value="High">High - Captcha & manual review verification</option>
                      </select>
                    </div>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "20px 0" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: 14 }}> Maintenance Mode</strong>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>If toggled, the application will display a placeholder warning page to guests.</p>
                      </div>
                      <div
                        className={`sd-toggle ${settings.maintenanceMode ? "sd-toggle-on" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                      >
                        <div className="sd-toggle-thumb"></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: 14 }}> Open Registrations</strong>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Allows new accounts to sign up for learner or helper memberships.</p>
                      </div>
                      <div
                        className={`sd-toggle ${settings.allowRegistrations ? "sd-toggle-on" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSettings({ ...settings, allowRegistrations: !settings.allowRegistrations })}
                      >
                        <div className="sd-toggle-thumb"></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 30 }}>
                    <button type="submit" className="btn btn-primary" style={{ background: "#2c3e50" }}>
                      Save System Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
