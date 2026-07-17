import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

//  MOCK DATA 
const initialMockBids = [
  {
    id: 1,
    tutor: "Dr. Fatima Al-Hassan",
    tutorId: 1,
    avatar: "",
    color: "#6C63FF",
    question: "How do I solve quadratic equations using the quadratic formula?",
    questionId: 1,
    rate: "$20/hr",
    message: "I specialize in Algebra and can walk you through this step by step with examples!",
    rating: 4.9,
    reviews: 143,
    status: "pending",
    submittedAt: "2026-07-03T11:00:00Z",
    isVerified: true,
  },
  {
    id: 2,
    tutor: "Zara Williams",
    tutorId: 5,
    avatar: "",
    color: "#A29BFE",
    question: "How do I solve quadratic equations using the quadratic formula?",
    questionId: 1,
    rate: "FREE",
    message: "Happy to help! I'm a peer tutor who aced this topic last semester.",
    rating: 4.5,
    reviews: 67,
    status: "pending",
    submittedAt: "2026-07-03T12:30:00Z",
    isVerified: false,
  },
  {
    id: 3,
    tutor: "James K.",
    tutorId: 6,
    avatar: "",
    color: "#00CEC9",
    question: "Explain the causes and consequences of the French Revolution",
    questionId: 3,
    rate: "$15/hr",
    message: "History grad student here. I can provide detailed notes and a video session.",
    rating: 4.7,
    reviews: 89,
    status: "pending",
    submittedAt: "2026-07-02T09:00:00Z",
    isVerified: true,
  },
];

// Helper: persist accepted bid events to localStorage so TutorDashboard can react
function saveAcceptedBidEvent(bid) {
  try {
    const existing = JSON.parse(localStorage.getItem("jonne_accepted_bids") || "[]");
    const alreadySaved = existing.some((b) => b.bidId === bid.id);
    if (!alreadySaved) {
      existing.push({
        bidId: bid.id,
        tutorId: bid.tutorId,
        tutorName: bid.tutor,
        questionId: bid.questionId,
        questionTitle: bid.question,
        rate: bid.rate,
        acceptedAt: new Date().toISOString(),
      });
      localStorage.setItem("jonne_accepted_bids", JSON.stringify(existing));
      // Trigger storage event for the TutorDashboard listening in the same tab
      window.dispatchEvent(new StorageEvent("storage", {
        key: "jonne_accepted_bids",
        newValue: JSON.stringify(existing),
      }));
    }
  } catch (e) {
    console.warn("localStorage not available", e);
  }
}

const mockPayments = [
  {
    id: "PAY-001",
    description: "Tutoring Session – Quadratic Equations",
    tutor: "Dr. Fatima Al-Hassan",
    amount: 20,
    currency: "$",
    status: "completed",
    date: "2026-07-01T10:00:00Z",
    method: "Card •••• 4242",
  },
  {
    id: "PAY-002",
    description: "Tutoring Session – French Revolution Essay",
    tutor: "James K.",
    amount: 15,
    currency: "$",
    status: "completed",
    date: "2026-06-28T14:30:00Z",
    method: "Card •••• 4242",
  },
  {
    id: "PAY-003",
    description: "Tutoring Session – Python Flask Debugging",
    tutor: "David R.",
    amount: 18,
    currency: "$",
    status: "pending",
    date: "2026-07-03T08:00:00Z",
    method: "Card •••• 4242",
  },
];

const mockDownloads = [
  {
    id: 1,
    title: "Quadratic Formula – Step-by-Step Guide",
    type: "PDF",
    icon: "",
    size: "1.2 MB",
    tutor: "Dr. Fatima Al-Hassan",
    date: "2026-07-01",
    color: "#E53935",
  },
  {
    id: 2,
    title: "French Revolution – Summary Notes",
    type: "DOCX",
    icon: "",
    size: "890 KB",
    tutor: "James K.",
    date: "2026-06-29",
    color: "#1565C0",
  },
  {
    id: 3,
    title: "Session Recording – Algebra Review",
    type: "MP4",
    icon: "",
    size: "248 MB",
    tutor: "Dr. Fatima Al-Hassan",
    date: "2026-07-01",
    color: "#6A1B9A",
  },
  {
    id: 4,
    title: "Python Flask Cheat Sheet",
    type: "PDF",
    icon: "",
    size: "320 KB",
    tutor: "David R.",
    date: "2026-07-03",
    color: "#E53935",
  },
];

const mockNotifications = [
  {
    id: 1,
    type: "bid",
    icon: "",
    color: "#6C63FF",
    title: "New bid on your question",
    body: "Dr. Fatima Al-Hassan submitted a bid for \"Quadratic Equations\"",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "bid",
    icon: "",
    color: "#A29BFE",
    title: "New bid on your question",
    body: "Zara Williams submitted a FREE bid for \"Quadratic Equations\"",
    time: "3 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "payment",
    icon: "",
    color: "#4CAF50",
    title: "Payment confirmed",
    body: "Your payment of $20 to Dr. Fatima Al-Hassan was successful.",
    time: "1 day ago",
    read: true,
  },
  {
    id: 4,
    type: "download",
    icon: "",
    color: "#2196F3",
    title: "File ready to download",
    body: "Session notes from James K. are now available.",
    time: "2 days ago",
    read: true,
  },
  {
    id: 5,
    type: "system",
    icon: "",
    color: "#FF9800",
    title: "Question solved!",
    body: "Your question on the French Revolution has been marked as solved.",
    time: "3 days ago",
    read: true,
  },
];

const statusConfig = {
  open: { label: "Open", cls: "status-open", icon: "", color: "#4CAF50" },
  "in-progress": { label: "In Progress", cls: "status-in-progress", icon: "", color: "#FF9800" },
  solved: { label: "Solved", cls: "status-solved", icon: "", color: "#2196F3" },
};

const buildNavItems = (pendingBidsCount, unreadNotifsCount) => [
  { id: "dashboard", label: "Dashboard", icon: "" },
  { id: "post", label: "Post Question", icon: "" },
  { id: "my-questions", label: "My Questions", icon: "" },
  { id: "bids", label: "Bids", icon: "", badge: pendingBidsCount },
  { id: "payments", label: "Payments", icon: "" },
  { id: "downloads", label: "Downloads", icon: "" },
  { id: "notifications", label: "Notifications", icon: "", badge: unreadNotifsCount },
  { id: "profile", label: "Profile", icon: "" },
];

//  SECTIONS 

function DashboardHome({ user, setActive, myQuestions, loading, bids, notifications }) {
  const open = myQuestions.filter((q) => q.status === "open");
  const inProgress = myQuestions.filter((q) => q.status === "in-progress");
  const solved = myQuestions.filter((q) => q.status === "solved");
  const unread = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <div className="sd-section" style={{ padding: 40, textAlign: "center" }}>Loading dashboard...</div>;
  }

  return (
    <div className="sd-section">
      {/* Welcome Banner */}
      <div className="sd-welcome-banner">
        <div className="sd-welcome-text">
          <h1> Welcome back, {user.name.split(" ")[0]}!</h1>
          <p>Track your questions, manage bids, and stay on top of your learning journey.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActive("post")}>
           Post a Question
        </button>
      </div>

      {/* Stats Row */}
      <div className="sd-stats-grid">
        {[
          { icon: "", num: myQuestions.length, label: "Total Questions", color: "#6C63FF", onClick: () => setActive("my-questions") },
          { icon: "", num: open.length, label: "Open", color: "#4CAF50", onClick: () => setActive("my-questions") },
          { icon: "", num: inProgress.length, label: "In Progress", color: "#FF9800", onClick: () => setActive("my-questions") },
          { icon: "", num: solved.length, label: "Solved", color: "#2196F3", onClick: () => setActive("my-questions") },
          { icon: "", num: bids.length, label: "Total Bids", color: "#E91E63", onClick: () => setActive("bids") },
          { icon: "", num: unread, label: "Unread Alerts", color: "#FF5722", onClick: () => setActive("notifications") },
        ].map((s) => (
          <div className="sd-stat-card" key={s.label} onClick={s.onClick} style={{ "--accent-color": s.color }}>
            <div className="sd-stat-icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
            <div className="sd-stat-num">{s.num}</div>
            <div className="sd-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Questions */}
      <div className="sd-widget">
        <div className="sd-widget-header">
          <h2> Recent Questions</h2>
          <button className="sd-link-btn" onClick={() => setActive("my-questions")}>View all →</button>
        </div>
        <div className="sd-list">
          {myQuestions.slice(0, 3).map((q) => {
            const sc = statusConfig[q.status] || statusConfig.open;
            return (
              <div className="sd-list-item" key={q.id}>
                <span className="sd-status-dot" style={{ background: sc.color }}></span>
                <div className="sd-list-item-body">
                  <Link to={`/question/${q.id}`} className="sd-list-title">{q.title}</Link>
                  <div className="sd-list-meta">
                    <span className="sd-pill" style={{ background: sc.color + "18", color: sc.color }}>{sc.icon} {sc.label}</span>
                    <span> {q.responses} bids</span>
                    <span> Due {new Date(q.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <Link to={`/question/${q.id}`}><button className="btn btn-sm btn-secondary">View →</button></Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="sd-widget">
        <div className="sd-widget-header">
          <h2> Recent Notifications</h2>
          <button className="sd-link-btn" onClick={() => setActive("notifications")}>View all →</button>
        </div>
        <div className="sd-list">
          {notifications.slice(0, 3).map((n) => (
            <div className="sd-list-item" key={n.id} style={{ opacity: n.read ? 0.65 : 1 }}>
              <div className="sd-notif-icon" style={{ background: n.color + "18", color: n.color }}>{n.icon}</div>
              <div className="sd-list-item-body">
                <div className="sd-list-title" style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
                <div className="sd-list-meta"><span>{n.body}</span></div>
              </div>
              <span className="sd-time-chip">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/*
  DB TABLE: questions
  -----------------------------------------------
  id            UUID / SERIAL   PRIMARY KEY
  student_id    UUID            REFERENCES users(id)
  title         TEXT            NOT NULL
  subject       TEXT            NOT NULL   -- free-text or chosen from predefined list
  level         TEXT            NOT NULL
  description   TEXT            NOT NULL
  deadline      DATE
  is_paid       BOOLEAN         DEFAULT false
  price_per_hour NUMERIC(10,2)
  status        TEXT            DEFAULT 'open'
  created_at    TIMESTAMPTZ     DEFAULT now()
  -----------------------------------------------
*/
function PostQuestionSection({ user, onPosted }) {
  const [form, setForm] = useState({
    title: "", subject: "", level: "", description: "", deadline: "", isPaid: false, price: "",
  });
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileError, setFileError]   = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const MAX_SIZE_MB = 10;

  const handleFileChange = (file) => {
    setFileError("");
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Only PDF and Word documents (.pdf, .doc, .docx) are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setAttachedFile(file);
  };

  // Predefined subjects — stored in a `subjects` lookup table in the DB
  const subjectOptions = [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "History", "Geography", "English", "Literature",
    "Economics", "Business Studies", "Coding / Computer Science",
    "Art & Design", "Music", "Languages", "Physical Education",
    "Religious Studies", "Psychology", "Sociology", "Philosophy",
    "Engineering", "Medicine / Health", "Law", "Other",
  ];
  const levels = ["Primary", "Middle School", "High School", "University", "Professional"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be logged in to post a question.");
      return;
    }

    if (typeof user.id !== "string" || user.id.length < 10) {
      alert("Your login session is out of date. Logging you out to refresh your session.");
      supabase.auth.signOut().then(() => window.location.reload());
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("questions").insert({
        user_id: user.id,
        title: form.title,
        subject: form.subject,
        level: form.level,
        description: form.description,
        deadline: form.deadline || null,
        payment: form.isPaid ? Number(form.price) : null,
      });

      if (insertError) throw insertError;

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm({ title: "", subject: "", level: "", description: "", deadline: "", isPaid: false, price: "" });
      setAttachedFile(null);
      setFileError("");
      if (onPosted) onPosted();
    } catch (err) {
      console.error("Question insert error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Post a Question</h1>
        <p>Describe your question clearly and let expert tutors bid on it.</p>
      </div>
      {submitted && (
        <div className="sd-alert sd-alert-success"> Your question has been posted! Tutors will start bidding soon.</div>
      )}
      {error && (
        <div className="sd-alert" style={{ background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" }}>
          {error}
        </div>
      )}
      <div className="sd-form-card">
        <form onSubmit={handleSubmit} className="sd-form">
          <div className="sd-form-group">
            <label className="sd-label">Question Title *</label>
            <input
              className="sd-input"
              placeholder="e.g. How do I solve quadratic equations?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="sd-form-row">
            <div className="sd-form-group">
              <label className="sd-label">Subject *</label>
              {/* Combobox: pick from list OR type a custom subject — maps to `subject` TEXT column */}
              <input
                id="subject-input"
                className="sd-input"
                list="subject-list"
                placeholder="Select or type a subject…"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                autoComplete="off"
                required
              />
              <datalist id="subject-list">
                {subjectOptions.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="sd-form-group">
              <label className="sd-label">Level *</label>
              <select className="sd-input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} required>
                <option value="">Select level</option>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="sd-form-group">
            <label className="sd-label">Description *</label>
            <textarea
              className="sd-input sd-textarea"
              placeholder="Give as much detail as possible. Include specific problem areas, concepts you're struggling with, and any relevant context..."
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="sd-form-group">
            <label className="sd-label">Deadline</label>
            <input
              type="date"
              className="sd-input"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              style={{ maxWidth: 260 }}
            />
          </div>

          {/* ── File Attachment (optional) ── */}
          <div className="sd-form-group">
            <label className="sd-label">
              Attach File
              <span className="sd-label-optional"> — optional</span>
            </label>

            {attachedFile ? (
              /* ── Attached state ── */
              <div className="sd-file-attached">
                <span className="sd-file-icon">
                  {attachedFile.name.endsWith(".pdf") ? "📄" : "📝"}
                </span>
                <div className="sd-file-info">
                  <span className="sd-file-name">{attachedFile.name}</span>
                  <span className="sd-file-size">
                    {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  className="sd-file-remove"
                  title="Remove file"
                  onClick={() => { setAttachedFile(null); setFileError(""); }}
                >
                  ✕
                </button>
              </div>
            ) : (
              /* ── Drop zone ── */
              <label
                className="sd-upload-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileChange(e.dataTransfer.files[0]);
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                <span className="sd-upload-icon">📎</span>
                <span className="sd-upload-text">
                  <strong>Click to upload</strong> or drag &amp; drop
                </span>
                <span className="sd-upload-hint">PDF, DOC, DOCX — max 10 MB</span>
              </label>
            )}

            {fileError && (
              <p className="sd-file-error">{fileError}</p>
            )}
          </div>
          <div className="sd-paid-toggle">
            <div className="sd-toggle-wrap" onClick={() => setForm({ ...form, isPaid: !form.isPaid })}>
              <div className={`sd-toggle ${form.isPaid ? "sd-toggle-on" : ""}`}>
                <div className="sd-toggle-thumb"></div>
              </div>
              <span>Offer payment for tutoring</span>
            </div>
            {form.isPaid && (
              <div className="sd-form-group" style={{ marginTop: 12 }}>
                <label className="sd-label">Budget per hour ($)</label>
                <input
                  type="number"
                  className="sd-input"
                  placeholder="e.g. 20"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  min={1}
                  style={{ maxWidth: 200 }}
                />
              </div>
            )}
          </div>
          <div className="sd-form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MyQuestionsSection({ myQuestions, loading }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? myQuestions : myQuestions.filter((q) => q.status === filter);

  if (loading) {
    return <div className="sd-section" style={{ padding: 40, textAlign: "center" }}>Loading questions...</div>;
  }

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> My Questions</h1>
        <p>All questions you've posted on JONNE.</p>
      </div>
      <div className="sd-filter-tabs">
        {[
          { value: "all", label: "All" },
          { value: "open", label: " Open" },
          { value: "in-progress", label: " In Progress" },
          { value: "solved", label: " Solved" },
        ].map((t) => (
          <button
            key={t.value}
            className={`sd-tab ${filter === t.value ? "sd-tab-active" : ""}`}
            onClick={() => setFilter(t.value)}
          >
            {t.label}
            <span className="sd-tab-count">
              {t.value === "all" ? myQuestions.length : myQuestions.filter((q) => q.status === t.value).length}
            </span>
          </button>
        ))}
      </div>
      <div className="sd-question-list">
        {filtered.map((q) => {
          const sc = statusConfig[q.status] || statusConfig.open;
          return (
            <div className="sd-question-card" key={q.id}>
              <div className="sd-question-card-top">
                <div className="sd-question-badges">
                  <span className="sd-pill" style={{ background: sc.color + "18", color: sc.color }}>{sc.icon} {sc.label}</span>
                  <span className="sd-pill" style={{ background: "#6C63FF18", color: "#6C63FF" }}>{q.subjectIcon} {q.subject}</span>
                  {q.isPaid ? (
                    <span className="sd-pill" style={{ background: "#2196F318", color: "#2196F3" }}> ${q.pricePerHour}/hr</span>
                  ) : (
                    <span className="sd-pill" style={{ background: "#4CAF5018", color: "#4CAF50" }}> FREE</span>
                  )}
                </div>
              </div>
              <Link to={`/question/${q.id}`} className="sd-question-title">{q.title}</Link>
              <p className="sd-question-excerpt">{q.description}</p>
              <div className="sd-question-footer">
                <div className="sd-question-meta">
                  <span> {q.responses} bids</span>
                  <span> Due {new Date(q.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span> {q.level}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to={`/question/${q.id}`}><button className="btn btn-sm btn-primary">View →</button></Link>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="sd-empty">
            <div className="sd-empty-icon"></div>
            <div className="sd-empty-title">No questions here</div>
            <div className="sd-empty-sub">Questions with this status will appear here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BidsSection({ bids, setBids, notifications, setNotifications }) {
  const [selected, setSelected] = useState(null);
  const pending = bids.filter((b) => b.status === "pending");
  const accepted = bids.filter((b) => b.status === "accepted");
  const declined = bids.filter((b) => b.status === "declined");

  const handleAccept = async (bid) => {
    const { error } = await supabase.from('bids').update({ accepted: true }).eq('id', bid.id);
    if (!error) {
      // Update bid status
      setBids((prev) => prev.map((b) => b.id === bid.id ? { ...b, status: "accepted" } : b));

      // Notify student
      const notif = {
        id: Date.now(),
        type: "bid_accepted",
        icon: "",
        color: "#4CAF50",
        title: "Bid accepted!",
        body: `You accepted ${bid.tutor}'s bid for "${bid.question.slice(0, 50)}...". Chat is now open!`,
        time: "Just now",
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);

      // Persist event so TutorDashboard can react
      saveAcceptedBidEvent(bid);
    } else {
      alert("Error accepting bid: " + error.message);
    }
  };

  const handleDecline = (bidId) => {
    try {
      const declinedIds = JSON.parse(localStorage.getItem("jonne_declined_bids") || "[]");
      if (!declinedIds.includes(bidId)) {
        declinedIds.push(bidId);
        localStorage.setItem("jonne_declined_bids", JSON.stringify(declinedIds));
      }
    } catch (e) {
      console.warn("localStorage decline error", e);
    }
    setBids((prev) => prev.map((b) => b.id === bidId ? { ...b, status: "declined" } : b));
  };

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Bids</h1>
        <p>Review tutor bids on your questions and accept the best match.</p>
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="sd-subheading"> Pending Bids ({pending.length})</h2>
          <div className="sd-bids-grid">
            {pending.map((bid) => (
              <div className={`sd-bid-card ${selected === bid.id ? "sd-bid-selected" : ""}`} key={bid.id} onClick={() => setSelected(bid.id === selected ? null : bid.id)}>
                <div className="sd-bid-header">
                  <div className="sd-bid-avatar" style={{ background: bid.color + "22", color: bid.color }}>{bid.avatar}</div>
                  <div className="sd-bid-info">
                    <div className="sd-bid-name">{bid.tutor} {bid.isVerified && <span className="sd-verified-tag"> Verified</span>}</div>
                    <div className="sd-bid-rating"> {bid.rating} · {bid.reviews} reviews</div>
                  </div>
                  <div className="sd-bid-rate" style={{ background: bid.rate === "FREE" ? "#4CAF5018" : "#2196F318", color: bid.rate === "FREE" ? "#4CAF50" : "#2196F3" }}>
                    {bid.rate}
                  </div>
                </div>
                <div className="sd-bid-question">For: "{bid.question.slice(0, 55)}..."</div>
                <p className="sd-bid-message">"{bid.message}"</p>
                <div className="sd-bid-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleAccept(bid); }}
                  >
                     Accept Bid
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleDecline(bid.id); }}
                  >
                     Decline
                  </button>
                  <Link to={`/question/${bid.questionId}`}><button className="btn btn-sm" style={{ background: "#f5f5f5", color: "#404040" }}>View Q →</button></Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {accepted.length > 0 && (
        <>
          <h2 className="sd-subheading" style={{ marginTop: 32 }}> Accepted Bids ({accepted.length})</h2>
          <div className="sd-bids-grid">
            {accepted.map((bid) => (
              <div className="sd-bid-card sd-bid-accepted" key={bid.id}>
                <div className="sd-bid-header">
                  <div className="sd-bid-avatar" style={{ background: bid.color + "22", color: bid.color }}>{bid.avatar}</div>
                  <div className="sd-bid-info">
                    <div className="sd-bid-name">{bid.tutor} {bid.isVerified && <span className="sd-verified-tag"> Verified</span>}</div>
                    <div className="sd-bid-rating"> {bid.rating} · {bid.reviews} reviews</div>
                  </div>
                  <div className="sd-bid-rate" style={{ background: "#4CAF5018", color: "#4CAF50" }}> Accepted</div>
                </div>
                <div className="sd-bid-question">For: "{bid.question.slice(0, 55)}..."</div>
                <p className="sd-bid-message">"{bid.message}"</p>
                {/* Chat is unlocked once bid is accepted */}
                <div style={{ background: "linear-gradient(135deg, #E8F5E9, #F1F8E9)", border: "1px solid #A5D6A7", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>
                   Chat is now open with {bid.tutor}!
                </div>
                <div className="sd-bid-actions">
                  <Link to={`/question/${bid.questionId}`} className="btn btn-primary btn-sm">
                     Open Chat
                  </Link>
                  <button className="btn btn-secondary btn-sm"> Schedule Session</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {declined.length > 0 && (
        <>
          <h2 className="sd-subheading" style={{ marginTop: 32 }}> Declined Bids ({declined.length})</h2>
          <div className="sd-bids-grid">
            {declined.map((bid) => (
              <div className="sd-bid-card" key={bid.id} style={{ opacity: 0.6 }}>
                <div className="sd-bid-header">
                  <div className="sd-bid-avatar" style={{ background: bid.color + "22", color: bid.color }}>{bid.avatar}</div>
                  <div className="sd-bid-info">
                    <div className="sd-bid-name">{bid.tutor}</div>
                    <div className="sd-bid-rating"> {bid.rating} · {bid.reviews} reviews</div>
                  </div>
                  <div className="sd-bid-rate" style={{ background: "#FFEBEE", color: "#F44336" }}>Declined</div>
                </div>
                <div className="sd-bid-question">For: "{bid.question.slice(0, 55)}..."</div>
                <p className="sd-bid-message">"{bid.message}"</p>
              </div>
            ))}
          </div>
        </>
      )}

      {bids.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "var(--radius-md)" }}>
           No bids yet. Tutors will start bidding on your questions soon!
        </div>
      )}
    </div>
  );
}

function PaymentsSection() {
  const total = mockPayments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Payments</h1>
        <p>Manage your payment history and billing information.</p>
      </div>

      <div className="sd-stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { icon: "", num: `$${total}`, label: "Total Spent", color: "#4CAF50" },
          { icon: "", num: mockPayments.filter((p) => p.status === "completed").length, label: "Completed", color: "#2196F3" },
          { icon: "", num: mockPayments.filter((p) => p.status === "pending").length, label: "Pending", color: "#FF9800" },
        ].map((s) => (
          <div className="sd-stat-card" key={s.label} style={{ "--accent-color": s.color }}>
            <div className="sd-stat-icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
            <div className="sd-stat-num">{s.num}</div>
            <div className="sd-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="sd-widget">
        <div className="sd-widget-header"><h2> Transaction History</h2></div>
        <div className="sd-payments-table">
          <div className="sd-table-head">
            <span>Description</span>
            <span>Tutor</span>
            <span>Date</span>
            <span>Method</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {mockPayments.map((p) => (
            <div className="sd-table-row" key={p.id}>
              <span className="sd-table-desc">
                <span className="sd-pay-id">{p.id}</span>
                {p.description}
              </span>
              <span>{p.tutor}</span>
              <span>{new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span>{p.method}</span>
              <span style={{ fontWeight: 700 }}>{p.currency}{p.amount}</span>
              <span>
                <span
                  className="sd-pill"
                  style={{
                    background: p.status === "completed" ? "#4CAF5018" : "#FF980018",
                    color: p.status === "completed" ? "#4CAF50" : "#FF9800",
                  }}
                >
                  {p.status === "completed" ? " Paid" : " Pending"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sd-widget">
        <div className="sd-widget-header"><h2> Saved Payment Method</h2></div>
        <div className="sd-payment-method">
          <div className="sd-card-chip">
            <span className="sd-card-icon"></span>
            <div>
              <div style={{ fontWeight: 700 }}>Visa •••• 4242</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Expires 09/28</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm">Change Card</button>
        </div>
      </div>
    </div>
  );
}

function DownloadsSection() {
  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Downloads</h1>
        <p>Access notes, recordings, and files shared by your tutors.</p>
      </div>
      <div className="sd-downloads-grid">
        {mockDownloads.map((file) => (
          <div className="sd-download-card" key={file.id}>
            <div className="sd-download-icon" style={{ background: file.color + "18", color: file.color }}>{file.icon}</div>
            <div className="sd-download-body">
              <div className="sd-download-title">{file.title}</div>
              <div className="sd-download-meta">
                <span className="sd-pill" style={{ background: file.color + "18", color: file.color }}>{file.type}</span>
                <span>{file.size}</span>
                <span>by {file.tutor}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                 {new Date(file.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <button className="btn btn-primary btn-sm sd-download-btn"> Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection({ notifications, setNotifications }) {
  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Notifications</h1>
        <p>{unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "You're all caught up!"}</p>
      </div>
      {unread > 0 && (
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={markAllRead}>
           Mark all as read
        </button>
      )}
      <div className="sd-notif-list">
        {notifications.map((n) => (
          <div
            className={`sd-notif-item ${!n.read ? "sd-notif-unread" : ""}`}
            key={n.id}
            onClick={() => setNotifications(notifications.map((x) => x.id === n.id ? { ...x, read: true } : x))}
          >
            <div className="sd-notif-icon-lg" style={{ background: n.color + "18", color: n.color }}>{n.icon}</div>
            <div className="sd-notif-body">
              <div className="sd-notif-title" style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
              <div className="sd-notif-text">{n.body}</div>
              <div className="sd-notif-time">{n.time}</div>
            </div>
            {!n.read && <div className="sd-unread-dot"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection({ user, myQuestions, bids }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email || "amara@example.com",
    bio: "High school student passionate about mathematics and sciences. I use JONNE to get expert help when I'm stuck.",
    grade: "Grade 10",
    school: "Westfield High School",
  });

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> My Profile</h1>
        <p>Manage your personal details and preferences.</p>
      </div>
      <div className="sd-profile-layout">
        {/* Avatar Card */}
        <div className="sd-profile-avatar-card">
          <div className="sd-profile-avatar" style={{ background: "linear-gradient(135deg,#6C63FF,#4CAF50)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", zIndex: 1 }}>{user.name.charAt(0).toUpperCase()}</span>
            <img
              src={`https://unavatar.io/${user.email || 'amara@example.com'}`}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="sd-profile-name">{form.name}</div>
          <div className="sd-profile-role"> Student</div>
          <div className="sd-profile-stats-mini">
            <div><span>{myQuestions.length}</span><span>Questions</span></div>
            <div><span>{bids.length}</span><span>Bids</span></div>
            <div><span>{mockDownloads.length}</span><span>Files</span></div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => setEditing(!editing)}>
            {editing ? " Save Changes" : " Edit Profile"}
          </button>
        </div>

        {/* Details Card */}
        <div className="sd-profile-details">
          <div className="sd-widget" style={{ padding: "24px", marginBottom: 0 }}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>Personal Information</h2>
            <div className="sd-form">
              <div className="sd-form-row">
                <div className="sd-form-group">
                  <label className="sd-label">Full Name</label>
                  {editing ? (
                    <input className="sd-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">{form.name}</div>
                  )}
                </div>
                <div className="sd-form-group">
                  <label className="sd-label">Email</label>
                  {editing ? (
                    <input className="sd-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">{form.email}</div>
                  )}
                </div>
              </div>
              <div className="sd-form-row">
                <div className="sd-form-group">
                  <label className="sd-label">School / Institution</label>
                  {editing ? (
                    <input className="sd-input" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">{form.school}</div>
                  )}
                </div>
                <div className="sd-form-group">
                  <label className="sd-label">Grade / Year</label>
                  {editing ? (
                    <input className="sd-input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">{form.grade}</div>
                  )}
                </div>
              </div>
              <div className="sd-form-group">
                <label className="sd-label">Bio</label>
                {editing ? (
                  <textarea className="sd-input sd-textarea" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                ) : (
                  <div className="sd-profile-field" style={{ whiteSpace: "pre-wrap" }}>{form.bio}</div>
                )}
              </div>
            </div>
          </div>

          <div className="sd-widget" style={{ padding: "24px", marginTop: 20, marginBottom: 0 }}>
            <h2 style={{ marginBottom: 16, fontSize: 18 }}>Account & Security</h2>
            <div className="sd-security-item">
              <span> Password</span>
              <button className="btn btn-secondary btn-sm">Change Password</button>
            </div>
            <div className="sd-security-item">
              <span> Email Notifications</span>
              <div className={`sd-toggle sd-toggle-on`} style={{ cursor: "pointer" }}>
                <div className="sd-toggle-thumb"></div>
              </div>
            </div>
            <div className="sd-security-item">
              <span> Delete Account</span>
              <button className="btn btn-sm" style={{ background: "#FFEBEE", color: "#F44336", border: "none" }}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//  MAIN COMPONENT 
export default function StudentDashboard({ user }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [myQuestions, setMyQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [bids, setBids] = useState([]);
  const [notifications, setNotifications] = useState(mockNotifications);

  const fetchQuestions = async () => {
    if (!user?.id) return;
    setLoadingQuestions(true);
    const { data: questionsData, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("user_id", user.id)
      .order('created_at', { ascending: false });

    if (!qError && questionsData) {
      const questionIds = questionsData.map(q => q.id);
      
      let realBids = [];
      if (questionIds.length > 0) {
        const { data: bidsData, error: bError } = await supabase
          .from("bids")
          .select("*")
          .in("question_id", questionIds)
          .order("created_at", { ascending: false });
        if (!bError && bidsData) {
          realBids = bidsData;
        }
      }

      let declinedBidIds = [];
      try {
        declinedBidIds = JSON.parse(localStorage.getItem("jonne_declined_bids") || "[]");
      } catch (e) {
        console.warn(e);
      }

      const mappedQuestions = questionsData.map(q => {
        const numBids = realBids.filter(b => String(b.question_id) === String(q.id)).length;
        return {
          ...q,
          isPaid: q.payment !== null && q.payment > 0,
          pricePerHour: q.payment || 0,
          status: q.status || 'open',
          responses: numBids,
        };
      });
      setMyQuestions(mappedQuestions);

      const colors = ["#6C63FF", "#A29BFE", "#00CEC9", "#FF7675", "#FDCB6E", "#E84393"];
      const mappedBids = realBids.map(b => {
        const relatedQuestion = questionsData.find(q => String(q.id) === String(b.question_id));
        const rateStr = b.bid_price && b.bid_price > 0 ? `$${b.bid_price}/hr` : "FREE";
        
        // consistent avatar color based on tutor ID
        const codeSum = (b.tutor_id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = colors[codeSum % colors.length];

        return {
          id: b.id,
          tutor: b.tutor_name || "Tutor",
          tutorId: b.tutor_id,
          avatar: (b.tutor_name || "T").charAt(0).toUpperCase(),
          color: color,
          question: relatedQuestion ? relatedQuestion.title : "Question",
          questionId: b.question_id,
          rate: rateStr,
          message: b.message || "",
          rating: 4.8,
          reviews: 12,
          status: b.accepted ? "accepted" : (declinedBidIds.includes(b.id) ? "declined" : "pending"),
          submittedAt: b.created_at,
          isVerified: true
        };
      });
      setBids(mappedBids);
    }
    setLoadingQuestions(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [user?.id]);

  const pendingBidsCount = bids.filter((b) => b.status === "pending").length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const NAV_ITEMS = buildNavItems(pendingBidsCount, unreadNotifsCount);

  const renderSection = () => {
    switch (active) {
      case "dashboard":      return <DashboardHome user={user} setActive={setActive} myQuestions={myQuestions} loading={loadingQuestions} bids={bids} notifications={notifications} />;
      case "post":           return <PostQuestionSection user={user} onPosted={fetchQuestions} />;
      case "my-questions":   return <MyQuestionsSection myQuestions={myQuestions} loading={loadingQuestions} />;
      case "bids":           return <BidsSection bids={bids} setBids={setBids} notifications={notifications} setNotifications={setNotifications} />;
      case "payments":       return <PaymentsSection />;
      case "downloads":      return <DownloadsSection />;
      case "notifications":  return <NotificationsSection notifications={notifications} setNotifications={setNotifications} />;
      case "profile":        return <ProfileSection user={user} myQuestions={myQuestions} bids={bids} />;
      default:               return <DashboardHome user={user} setActive={setActive} myQuestions={myQuestions} loading={loadingQuestions} bids={bids} notifications={notifications} />;
    }
  };

  return (
    <div className="sd-root">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sd-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sd-sidebar ${sidebarOpen ? "sd-sidebar-open" : ""}`}>
        <div className="sd-sidebar-user">
          <div className="sd-sidebar-avatar" style={{ background: "linear-gradient(135deg,#6C63FF,#4CAF50)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", zIndex: 1 }}>{user.name.charAt(0).toUpperCase()}</span>
            <img
              src={`https://unavatar.io/${user.email || 'amara@example.com'}`}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="sd-sidebar-name">{user.name}</div>
            <div className="sd-sidebar-role"> Student</div>
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
              {item.badge > 0 && <span className="sd-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sd-sidebar-footer">
          <Link to="/" className="sd-sidebar-back">← Back to Site</Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="sd-main">
        {/* Mobile header */}
        <div className="sd-mobile-bar">
          <button className="sd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}></button>
          <span className="sd-mobile-title">
            {NAV_ITEMS.find((i) => i.id === active)?.icon}{" "}
            {NAV_ITEMS.find((i) => i.id === active)?.label}
          </span>
        </div>
        <div className="sd-content">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
