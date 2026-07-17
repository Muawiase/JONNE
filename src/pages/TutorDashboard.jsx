import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { mockTutors, subjects } from "../mockData";
import { supabase } from "../supabase";

//  INITIAL SEED DATA
const initialBids = [];
const initialWithdrawals = [];
const initialNotifications = [];
const initialLedger = [];

//  NAV ITEMS FOR SIDEBAR 
const getNavItems = (pendingBidsCount, unreadNotifsCount) => [
  { id: "dashboard", label: "Dashboard", icon: "" },
  { id: "browse", label: "Browse Questions", icon: "" },
  { id: "bids", label: "My Bids", icon: "", badge: pendingBidsCount },
  { id: "answers", label: "My Answers", icon: "" },
  { id: "earnings", label: "Earnings", icon: "" },
  { id: "withdrawals", label: "Withdrawals", icon: "" },
  { id: "notifications", label: "Notifications", icon: "", badge: unreadNotifsCount },
  { id: "profile", label: "Profile", icon: "" },
];

//  SUB-COMPONENTS 

// 1. DASHBOARD HOME
function DashboardHome({ user, bids, setBids, notifications, setNotifications, setActive, completedCount, allQuestions }) {
  const activeSessionsCount = allQuestions.filter(q => q.status === "in-progress" && [2, 9].includes(q.id)).length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingBidsCount = bids.filter((b) => b.status === "pending").length;

  return (
    <div className="sd-section">
      {/* Welcome banner */}
      <div className="sd-welcome-banner">
        <div className="sd-welcome-text">
          <h1> Welcome, {user.name.split(" ")[0]}!</h1>
          <p>Manage your sessions, bids, earnings, and check active questions on your student portal.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActive("browse")}>
           Browse Questions
        </button>
      </div>

      {/* Stats Cards */}
      <div className="sd-stats-grid">
        {[
          { icon: "", num: activeSessionsCount, label: "Active Answers", color: "#FF9800", onClick: () => setActive("answers") },
          { icon: "", num: completedCount, label: "Solved Questions", color: "#4CAF50", onClick: () => setActive("answers") },
          { icon: "", num: "4.8", label: "Avg Rating", color: "#2196F3", onClick: () => setActive("profile") },
          { icon: "", num: pendingBidsCount, label: "Pending Bids", color: "#E91E63", onClick: () => setActive("bids") },
          { icon: "", num: "$320", label: "Available Cash", color: "#9C27B0", onClick: () => setActive("earnings") },
          { icon: "", num: unreadCount, label: "Unread Alerts", color: "#FF5722", onClick: () => setActive("notifications") },
        ].map((s) => (
          <div className="sd-stat-card" key={s.label} onClick={s.onClick} style={{ "--accent-color": s.color, cursor: "pointer" }}>
            <div className="sd-stat-icon" style={{ background: s.color + "18", color: s.color }}>{s.icon}</div>
            <div className="sd-stat-num">{s.num}</div>
            <div className="sd-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active sessions list */}
      <div className="sd-widget" style={{ marginTop: 24 }}>
        <div className="sd-widget-header">
          <h2> Active Answering Sessions</h2>
          <button className="sd-link-btn" onClick={() => setActive("answers")}>View all answers →</button>
        </div>
        <div className="sd-list">
          {allQuestions
            .filter((q) => [2, 9].includes(q.id) && q.status !== "solved")
            .map((q) => (
              <div className="sd-list-item" key={q.id}>
                <span className="sd-status-dot" style={{ background: "var(--accent-warm)" }}></span>
                <div className="sd-list-item-body">
                  <Link to={`/question/${q.id}`} className="sd-list-title">{q.title}</Link>
                  <div className="sd-list-meta">
                    <span className="sd-pill" style={{ background: "var(--paid-bg)", color: "var(--paid-color)" }}>${q.pricePerHour}/hr</span>
                    <span>Student: {q.studentName}</span>
                    <span>Due: {new Date(q.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <Link to={`/question/${q.id}`}>
                  <button className="btn btn-sm btn-primary">Open Chat →</button>
                </Link>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="sd-widget" style={{ marginTop: 24 }}>
        <div className="sd-widget-header">
          <h2> Recent Notifications</h2>
          <button className="sd-link-btn" onClick={() => setActive("notifications")}>See all →</button>
        </div>
        <div className="sd-list">
          {notifications.slice(0, 2).map((n) => (
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

// 2. BROWSE QUESTIONS
function BrowseQuestionsSection({ bids, onAddBid, tutorSubjects, allQuestions, loading }) {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, paid, free
  const [biddingOnQuestion, setBiddingOnQuestion] = useState(null);
  const [bidPrice, setBidPrice] = useState(20);
  const [bidMessage, setBidMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleOpenBidForm = (question) => {
    setBiddingOnQuestion(question);
    setBidPrice(question.isPaid ? question.pricePerHour : 0);
    setBidMessage(`Hi! I'm an expert in ${question.subject} and I'd love to help you walk through this step by step. Let's start!`);
  };

  const handleCancelBid = () => {
    setBiddingOnQuestion(null);
    setBidMessage("");
  };

  const handleSubmitBidForm = (e) => {
    e.preventDefault();
    if (!biddingOnQuestion) return;

    onAddBid({
      questionId: biddingOnQuestion.id,
      questionTitle: biddingOnQuestion.title,
      bidPrice: biddingOnQuestion.isPaid ? Number(bidPrice) : 0,
      message: bidMessage,
    });

    setSuccessMsg(`Bid successfully placed on "${biddingOnQuestion.title}"!`);
    setBiddingOnQuestion(null);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Filter open questions
  const openQuestions = allQuestions.filter((q) => q.status === "open");

  const filtered = openQuestions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === "" || q.subject === selectedSubject;
    const matchesType =
      filterType === "all" ||
      (filterType === "paid" && q.isPaid) ||
      (filterType === "free" && !q.isPaid);
    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Browse Student Questions</h1>
        <p>Find students requiring help. Bid on paid sessions or offer free volunteering to boost your rating.</p>
      </div>

      {successMsg && (
        <div style={{ background: "var(--success-light)", color: "var(--success)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 20, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Filters Bar */}
      <div className="sd-widget" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            className="sd-input"
            placeholder="Search questions..."
            style={{ flex: 1, minWidth: 200, padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="sd-input"
            style={{ width: 180, padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>
          <select
            className="sd-input"
            style={{ width: 140, padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="paid">Paid Only</option>
            <option value="free">Free / Volunteer</option>
          </select>
        </div>
      </div>

      {/* Place Bid Inline Modal Form */}
      {biddingOnQuestion && (
        <div className="sd-widget" style={{ border: "2px solid var(--primary)", marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>
             Place Bid on: <span style={{ color: "var(--primary)" }}>{biddingOnQuestion.title}</span>
          </h3>
          <form onSubmit={handleSubmitBidForm} className="sd-form">
            {biddingOnQuestion.isPaid ? (
              <div className="sd-form-group" style={{ marginBottom: 16 }}>
                <label className="sd-label">Your Hourly Bid Rate ($/hr)</label>
                <input
                  type="number"
                  className="sd-input"
                  min="5"
                  max="100"
                  required
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ color: "var(--success)", fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
                 This is a FREE question. You are volunteering your help!
              </div>
            )}
            <div className="sd-form-group" style={{ marginBottom: 16 }}>
              <label className="sd-label">Short Pitch Message</label>
              <textarea
                className="sd-input sd-textarea"
                rows={3}
                required
                placeholder="Explain how you will help the student solve this problem..."
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary btn-sm">
                Submit Bid
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancelBid}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "white", borderRadius: "var(--radius-md)" }}>
            Loading questions...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "white", borderRadius: "var(--radius-md)" }}>
             No open questions matching filters.
          </div>
        ) : (
          filtered.map((q) => {
            const matchesPreferred = tutorSubjects.includes(q.subject);
            const isAlreadyBid = bids.some(b => b.questionId === q.id);

            return (
              <div className="card" key={q.id} style={{ borderLeft: matchesPreferred ? "4px solid var(--primary)" : "none" }}>
                <div className="card-inner" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span className="badge badge-subject">{q.subject}</span>
                        {q.isPaid ? (
                          <span className="badge badge-paid">${q.pricePerHour}/hr</span>
                        ) : (
                          <span className="badge badge-free">FREE</span>
                        )}
                        <span className="badge badge-level">{q.level}</span>
                        {q.urgency === "high" && <span className="badge badge-urgent">Urgent</span>}
                        {matchesPreferred && (
                          <span style={{ fontSize: 11, background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                            Matches Bio
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0" }}>{q.title}</h3>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      Due {new Date(q.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
                    {q.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Posted by <strong>{q.studentName}</strong> · {q.responses} replies
                    </div>
                    <div>
                      {isAlreadyBid ? (
                        <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.6 }}>
                           Bid Submitted
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenBidForm(q)}
                        >
                          {q.isPaid ? "Place Bid" : "Volunteer Help"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 3. MY BIDS
function SubmitBidsSection({ bids, onCancelBid, onEditBid }) {
  const [editingBidId, setEditingBidId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editMsg, setEditMsg] = useState("");

  const startEdit = (bid) => {
    setEditingBidId(bid.id);
    setEditPrice(bid.bidPrice);
    setEditMsg(bid.message);
  };

  const handleSaveEdit = (bidId) => {
    onEditBid(bidId, Number(editPrice), editMsg);
    setEditingBidId(null);
  };

  const pending = bids.filter((b) => b.status === "pending");
  const history = bids.filter((b) => b.status !== "pending");

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> My Bids</h1>
        <p>Manage and update bids you have submitted on student questions.</p>
      </div>

      <h2 className="sd-subheading"> Active Submitted Bids ({pending.length})</h2>
      <div className="sd-bids-grid">
        {pending.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: 24, textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "var(--radius-md)" }}>
            No active bids. Use the 'Browse Questions' page to submit a bid.
          </div>
        ) : (
          pending.map((bid) => {
            const isEditing = editingBidId === bid.id;
            return (
              <div className="sd-bid-card" key={bid.id}>
                <div className="sd-bid-header">
                  <div className="sd-bid-info" style={{ flex: 1 }}>
                    <div className="sd-bid-name" style={{ fontSize: 15, fontWeight: 700 }}>{bid.questionTitle}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                      Submitted on {bid.submittedAt}
                    </div>
                  </div>
                  <div className="sd-bid-rate" style={{ background: "var(--paid-bg)", color: "var(--paid-color)" }}>
                    {bid.bidPrice > 0 ? `$${bid.bidPrice}/hr` : "FREE"}
                  </div>
                </div>

                {isEditing ? (
                  <div className="sd-form" style={{ marginTop: 12, padding: 12, background: "var(--bg-main)", borderRadius: "var(--radius-sm)" }}>
                    {bid.bidPrice > 0 && (
                      <div className="sd-form-group" style={{ marginBottom: 10 }}>
                        <label className="sd-label" style={{ fontSize: 12 }}>New Hourly Rate ($/hr)</label>
                        <input
                          type="number"
                          className="sd-input"
                          style={{ padding: 6, fontSize: 13 }}
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="sd-form-group" style={{ marginBottom: 12 }}>
                      <label className="sd-label" style={{ fontSize: 12 }}>New Pitch Message</label>
                      <textarea
                        className="sd-input"
                        rows={2}
                        style={{ padding: 6, fontSize: 13 }}
                        value={editMsg}
                        onChange={(e) => setEditMsg(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary btn-sm" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleSaveEdit(bid.id)}>
                        Save
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setEditingBidId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="sd-bid-message" style={{ margin: "12px 0 16px", color: "var(--text-secondary)" }}>
                    "{bid.message}"
                  </p>
                )}

                {!isEditing && (
                  <div className="sd-bid-actions" style={{ marginTop: "auto" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => startEdit(bid)}>
                       Edit Bid
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onCancelBid(bid.id)}>
                       Withdraw
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {history.length > 0 && (
        <>
          <h2 className="sd-subheading" style={{ marginTop: 36 }}> Bid History ({history.length})</h2>
          <div className="sd-bids-grid">
            {history.map((bid) => (
              <div className={`sd-bid-card ${bid.status === "accepted" ? "sd-bid-accepted" : ""}`} key={bid.id} style={{ opacity: bid.status === "accepted" ? 1 : 0.85 }}>
                <div className="sd-bid-header">
                  <div className="sd-bid-info">
                    <div className="sd-bid-name">{bid.questionTitle}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Submitted {bid.submittedAt}</div>
                  </div>
                  <div
                    className="sd-bid-rate"
                    style={{
                      background: bid.status === "accepted" ? "#E8F5E9" : "#FFEBEE",
                      color: bid.status === "accepted" ? "#4CAF50" : "#F44336",
                    }}
                  >
                    {bid.status === "accepted" ? " Accepted" : "Declined"}
                  </div>
                </div>
                <p className="sd-bid-message" style={{ margin: "12px 0", fontStyle: "italic" }}>"{ bid.message}"</p>
                {bid.status === "accepted" && (
                  <>
                    {/* Chat unlock banner */}
                    <div style={{
                      background: "linear-gradient(135deg, #E8F5E9, #F1F8E9)",
                      border: "1px solid #A5D6A7",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 14px",
                      marginBottom: 12,
                      fontSize: 13,
                      color: "#2E7D32",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                       The student accepted your bid — chat is now open!
                    </div>
                    <Link to={`/question/${bid.questionId}`} className="btn btn-primary btn-sm" style={{ width: "fit-content" }}>
                       Open Session Chat
                    </Link>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 4. MY ANSWERS
function MyAnswersSection({ onSolveQuestion, completedList, allQuestions }) {
  const activeSessions = allQuestions.filter((q) => [2, 9].includes(q.id) && q.status !== "solved");

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> My Answers</h1>
        <p>Manage your current ongoing study classrooms and complete outstanding questions.</p>
      </div>

      <h2 className="sd-subheading"> Active Tutoring Sessions ({activeSessions.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {activeSessions.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "var(--radius-md)" }}>
            No active sessions. Go to 'Browse Questions' to bid on open questions!
          </div>
        ) : (
          activeSessions.map((q) => (
            <div className="card" key={q.id}>
              <div className="card-inner" style={{ padding: 20, display: "flex", gap: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span className="badge badge-subject">{q.subject}</span>
                    <span className="badge badge-paid">${q.pricePerHour}/hr</span>
                    <span className="status-pill status-in-progress">In Progress</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{q.title}</h3>
                  <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
                    Student: <strong>{q.studentName}</strong> · Due Date: {new Date(q.deadline).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Link to={`/question/${q.id}`} className="btn btn-secondary btn-sm">
                     Chat
                  </Link>
                  <button className="btn btn-primary btn-sm" onClick={() => onSolveQuestion(q)}>
                     Complete Session
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="sd-subheading" style={{ marginTop: 36 }}> Solved Sessions ({completedList.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {completedList.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "var(--radius-md)" }}>
            No solved sessions listed in this period.
          </div>
        ) : (
          completedList.map((q) => (
            <div className="card" key={q.id} style={{ opacity: 0.85 }}>
              <div className="card-inner" style={{ padding: 20, display: "flex", gap: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span className="badge badge-subject">{q.subject}</span>
                    {q.pricePerHour > 0 ? (
                      <span className="badge badge-paid">${q.pricePerHour}/hr</span>
                    ) : (
                      <span className="badge badge-free">FREE</span>
                    )}
                    <span className="status-pill status-solved">Solved</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{q.title}</h3>
                  <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
                    Student: <strong>{q.studentName}</strong> · Solved on {q.solvedDate || "Today"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>+{q.pricePerHour > 0 ? `$${q.pricePerHour * 2}` : "Volunteered"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 5. EARNINGS
function EarningsSection({ balance, ledger }) {
  // Let's compute statistics
  const totalEarned = ledger.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> My Earnings</h1>
        <p>Track your paid tutoring milestones, view statement ledgers, and check pending clearings.</p>
      </div>

      {/* Grid of highlight cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="sd-stat-card" style={{ "--accent-color": "#4CAF50" }}>
          <div className="sd-stat-num" style={{ fontSize: 28, color: "var(--primary)" }}>${balance}</div>
          <div className="sd-stat-label">Available Balance</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Ready for direct withdrawal</div>
        </div>
        <div className="sd-stat-card" style={{ "--accent-color": "#2196F3" }}>
          <div className="sd-stat-num" style={{ fontSize: 28, color: "var(--accent)" }}>${totalEarned}</div>
          <div className="sd-stat-label">Lifetime Earnings</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Across all completed sessions</div>
        </div>
        <div className="sd-stat-card" style={{ "--accent-color": "#FF9800" }}>
          <div className="sd-stat-num" style={{ fontSize: 28, color: "var(--accent-warm)" }}>$88</div>
          <div className="sd-stat-label">Pending Clearing</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>For sessions completed today</div>
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="sd-widget" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Earnings by Subject</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { subject: "Coding", amount: 620, percent: 50, color: "#6C63FF" },
            { subject: "Mathematics", amount: 360, percent: 30, color: "#4CAF50" },
            { subject: "Economics", amount: 240, percent: 20, color: "#FF9800" },
          ].map((item) => (
            <div key={item.subject}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <strong>{item.subject}</strong>
                <span>${item.amount} ({item.percent}%)</span>
              </div>
              <div style={{ height: 8, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${item.percent}%`, background: item.color, borderRadius: 99 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ledgers */}
      <div className="sd-widget" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Transactions</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "10px 6px", color: "var(--text-muted)", fontWeight: 600 }}>TX ID</th>
                <th style={{ padding: "10px 6px", color: "var(--text-muted)", fontWeight: 600 }}>Student</th>
                <th style={{ padding: "10px 6px", color: "var(--text-muted)", fontWeight: 600 }}>Subject</th>
                <th style={{ padding: "10px 6px", color: "var(--text-muted)", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "10px 6px", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 6px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 6px", fontFamily: "monospace" }}>{item.id}</td>
                  <td style={{ padding: "12px 6px", fontWeight: 500 }}>{item.student}</td>
                  <td style={{ padding: "12px 6px" }}>{item.subject}</td>
                  <td style={{ padding: "12px 6px", color: "var(--text-secondary)" }}>{item.date}</td>
                  <td style={{ padding: "12px 6px" }}>
                    <span style={{ fontSize: 11, background: "#E8F5E9", color: "#4CAF50", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 6px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>+${item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 6. WITHDRAWALS
function WithdrawalsSection({ balance, onWithdraw, withdrawalHistory }) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [method, setMethod] = useState("PayPal");
  const [details, setDetails] = useState("marcus@example.com");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleMethodChange = (e) => {
    const val = e.target.value;
    setMethod(val);
    if (val === "PayPal") {
      setDetails("marcus@example.com");
    } else if (val === "Direct Deposit") {
      setDetails("Chase Bank •••• 5678");
    } else if (val === "Stripe Payout") {
      setDetails("acct_1NJN2kG92kL");
    }
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }
    if (amount < 20) {
      setErrorMsg("Minimum withdrawal amount is $20.");
      return;
    }
    if (amount > balance) {
      setErrorMsg(`Insufficient funds! Your available balance is $${balance}.`);
      return;
    }

    onWithdraw(amount, `${method} (${details})`);
    setSuccessMsg(`Requested withdrawal of $${amount} to ${method}! Standard processing takes 1-2 days.`);
    setWithdrawAmount("");
  };

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Withdrawals</h1>
        <p>Transfer your earnings directly to your preferred payment processor.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {/* Left Form Column */}
        <div>
          <div className="sd-widget" style={{ padding: 24, marginBottom: 0 }}>
            <h2 style={{ fontSize: 16, marginBottom: 4 }}>Available Cash</h2>
            <div style={{ fontSize: 36, fontWeight: 900, color: "var(--primary)", margin: "8px 0 16px" }}>${balance}</div>

            {errorMsg && (
              <div style={{ background: "#FFEBEE", color: "#F44336", padding: 12, borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                 {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ background: "#E8F5E9", color: "#4CAF50", padding: 12, borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                 {successMsg}
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="sd-form">
              <div className="sd-form-group" style={{ marginBottom: 14 }}>
                <label className="sd-label">Select Payout Method</label>
                <select className="sd-input" style={{ width: "100%" }} value={method} onChange={handleMethodChange}>
                  <option value="PayPal">PayPal Instant Transfer</option>
                  <option value="Direct Deposit">US Direct Bank Deposit (ACH)</option>
                  <option value="Stripe Payout">Stripe Direct Connect</option>
                </select>
              </div>

              <div className="sd-form-group" style={{ marginBottom: 14 }}>
                <label className="sd-label">Recipient Account / Handle</label>
                <input
                  type="text"
                  className="sd-input"
                  disabled
                  value={details}
                  style={{ background: "#f0f0f0", color: "#666" }}
                />
              </div>

              <div className="sd-form-group" style={{ marginBottom: 20 }}>
                <label className="sd-label">Withdrawal Amount ($)</label>
                <input
                  type="number"
                  className="sd-input"
                  placeholder="e.g. 100"
                  min="20"
                  max={balance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                 Request Payout
              </button>
            </form>
          </div>
        </div>

        {/* Right History Column */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="sd-widget" style={{ padding: 24, flex: 1, marginBottom: 0 }}>
            <h2 style={{ fontSize: 16, marginBottom: 16 }}>Request History</h2>
            <div className="sd-list">
              {withdrawalHistory.map((w) => (
                <div className="sd-list-item" key={w.id} style={{ padding: "12px 0" }}>
                  <div className="sd-list-item-body">
                    <div className="sd-list-title" style={{ fontSize: 14 }}>{w.method}</div>
                    <div className="sd-list-meta">
                      <span>ID: {w.id}</span>
                      <span>Requested: {w.date}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>-${w.amount}</div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: w.status === "completed" ? "#E8F5E9" : "#FFF8E1",
                        color: w.status === "completed" ? "#4CAF50" : "#FFB300",
                      }}
                    >
                      {w.status === "completed" ? "Cleared" : "Processing"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. NOTIFICATIONS
function NotificationsSection({ notifications, onMarkAllRead, onMarkSingleRead }) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> Notifications</h1>
        <p>{unreadCount > 0 ? `You have ${unreadCount} new alerts that require your attention.` : "You're all caught up!"}</p>
      </div>

      {unreadCount > 0 && (
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={onMarkAllRead}>
           Mark all as read
        </button>
      )}

      <div className="sd-notif-list">
        {notifications.map((n) => (
          <div
            className={`sd-notif-item ${!n.read ? "sd-notif-unread" : ""}`}
            key={n.id}
            onClick={() => onMarkSingleRead(n.id)}
            style={{ cursor: "pointer" }}
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

// 8. PROFILE
function ProfileSection({ user, profile, setProfile }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...profile });
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleToggleSubject = (sub) => {
    if (form.subjects.includes(sub)) {
      setForm({ ...form, subjects: form.subjects.filter((s) => s !== sub) });
    } else {
      setForm({ ...form, subjects: [...form.subjects, sub] });
    }
  };

  const handleSave = () => {
    setProfile({ ...form });
    setEditing(false);
  };

  return (
    <div className="sd-section">
      <div className="sd-page-header">
        <h1> My Profile</h1>
        <p>Edit your public tutor bio, rate structures, and subject expertise fields.</p>
      </div>

      <div className="sd-profile-layout">
        {/* Avatar Sidebar */}
        <div className="sd-profile-avatar-card">
          <div className="sd-profile-avatar" style={{ background: "linear-gradient(135deg, #FF6584, #FF9F43)", color: "white", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", zIndex: 1 }}>{(profile.name || "M").charAt(0).toUpperCase()}</span>
            <img
              src={`https://unavatar.io/${profile.email}`}
              alt={profile.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="sd-profile-name">{profile.name}</div>
          <div className="sd-profile-role"> Verified Tutor {profile.isVerified && ""}</div>
          <div className="sd-profile-stats-mini" style={{ margin: "16px 0" }}>
            <div><span>4.8</span><span>Rating</span></div>
            <div><span>89</span><span>Reviews</span></div>
            <div><span>31</span><span>Helped Free</span></div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: "100%", justifyContent: "center" }} onClick={() => {
            if (editing) handleSave();
            else setEditing(true);
          }}>
            {editing ? " Save Changes" : " Edit Profile"}
          </button>
        </div>

        {/* Form Details */}
        <div className="sd-profile-details">
          <div className="sd-widget" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>Personal & Professional Info</h2>
            <div className="sd-form">
              <div className="sd-form-row">
                <div className="sd-form-group">
                  <label className="sd-label">Full Name</label>
                  {editing ? (
                    <input className="sd-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">{profile.name}</div>
                  )}
                </div>
                <div className="sd-form-group">
                  <label className="sd-label">Email Address</label>
                  {editing ? (
                    <input className="sd-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">{profile.email}</div>
                  )}
                </div>
              </div>

              <div className="sd-form-group" style={{ marginTop: 14 }}>
                <label className="sd-label">Response Time Indicator</label>
                {editing ? (
                  <input className="sd-input" value={form.responseTime} onChange={(e) => setForm({ ...form, responseTime: e.target.value })} />
                ) : (
                  <div className="sd-profile-field">{profile.responseTime}</div>
                )}
              </div>

              <div className="sd-form-row" style={{ marginTop: 14 }}>
                <div className="sd-form-group">
                  <label className="sd-label">Minimum Billing Rate ($/hr)</label>
                  {editing ? (
                    <input type="number" className="sd-input" value={form.rateMin} onChange={(e) => setForm({ ...form, rateMin: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">${profile.rateMin}/hr</div>
                  )}
                </div>
                <div className="sd-form-group">
                  <label className="sd-label">Maximum Billing Rate ($/hr)</label>
                  {editing ? (
                    <input type="number" className="sd-input" value={form.rateMax} onChange={(e) => setForm({ ...form, rateMax: e.target.value })} />
                  ) : (
                    <div className="sd-profile-field">${profile.rateMax}/hr</div>
                  )}
                </div>
              </div>

              <div className="sd-form-group" style={{ marginTop: 14 }}>
                <label className="sd-label">Professional Biography</label>
                {editing ? (
                  <textarea rows={4} className="sd-input sd-textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                ) : (
                  <div className="sd-profile-field" style={{ whiteSpace: "pre-wrap" }}>{profile.bio}</div>
                )}
              </div>
            </div>
          </div>

          {/* Subject Specialty Checkboxes */}
          <div className="sd-widget" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Specialty Subjects Selection</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>Select the fields you match with to receive matching notifications and filters.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {subjects.map((sub) => {
                const checked = form.subjects.includes(sub.label);
                return (
                  <label
                    key={sub.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      padding: "8px 12px",
                      background: "var(--bg-main)",
                      borderRadius: "var(--radius-sm)",
                      cursor: editing ? "pointer" : "default",
                      opacity: editing ? 1 : 0.8,
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={!editing}
                      checked={checked}
                      onChange={() => handleToggleSubject(sub.label)}
                    />
                    <span>{sub.icon} {sub.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Verification Credentials */}
          <div className="sd-widget" style={{ padding: 24, marginBottom: 0 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12 }}>Verify Tutor Credentials</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>Upload official diplomas, teaching licenses, or ID cards to maintain your "Verified Tutor" badge.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  border: "2px dashed var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  textAlign: "center",
                  flex: 1,
                  background: "var(--bg-main)",
                  cursor: "pointer",
                }}
                onClick={() => setFileUploaded(true)}
              >
                <span>{fileUploaded ? " credentials_verification.pdf uploaded successfully" : " Click to upload document (PDF, PNG)"}</span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 99,
                    background: profile.isVerified ? "var(--success-light)" : "var(--urgent-bg)",
                    color: profile.isVerified ? "var(--success)" : "var(--urgent-color)",
                  }}
                >
                  {profile.isVerified ? "Approved Status" : "Pending Document"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//  MAIN EXPORTED COMPONENT 
export default function TutorDashboard({ user }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States
  const [bids, setBids] = useState(() => {
    try {
      const saved = localStorage.getItem("jonne_tutor_bids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [ledger, setLedger] = useState(initialLedger);
  const [completedList, setCompletedList] = useState([]);
  const [balance, setBalance] = useState(320);

  // Helper to persist bids
  const updateBids = (newBids) => {
    setBids(newBids);
    try {
      localStorage.setItem("jonne_tutor_bids", JSON.stringify(newBids));
    } catch (e) {
      console.error(e);
    }
  };

  const [allQuestions, setAllQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      const { data, error } = await supabase.from("questions").select("*").order('created_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map(q => ({
          ...q,
          isPaid: q.payment !== null && q.payment > 0,
          pricePerHour: q.payment || 0,
          status: 'open',
          responses: 0,
        }));
        setAllQuestions(mapped);
      }
      setLoadingQuestions(false);
    };
    fetchQuestions();
  }, []);

  const [profile, setProfile] = useState({
    name: user?.name || (user?.email ? user.email.split('@')[0] : "marcus"),
    email: user?.email || "marcus@example.com",
    bio: "Full-stack developer by day, coding tutor by passion. I've been coding since I was 14 and I genuinely love helping people break through that 'I don't get it' wall. Specialise in Python, JavaScript, and web dev.",
    subjects: user?.subjects || ["Coding", "Mathematics", "Computer Science"],
    rateMin: 20,
    rateMax: 35,
    responseTime: "< 2 hours",
    isVerified: true,
  });

  // Action: Add Bid from Browse Page
  const handleAddBid = (newBidData) => {
    const newBidObj = {
      id: Date.now(),
      questionId: newBidData.questionId,
      questionTitle: newBidData.questionTitle,
      bidPrice: newBidData.bidPrice,
      message: newBidData.message,
      status: "pending",
      submittedAt: new Date().toISOString().split("T")[0],
      chatOpen: false,
    };
    const updatedBids = [newBidObj, ...bids];
    updateBids(updatedBids);

    // Send a notification alert
    const newNotif = {
      id: Date.now(),
      title: "New Bid Placed",
      body: `You submitted a bid of ${newBidData.bidPrice > 0 ? `$${newBidData.bidPrice}/hr` : "FREE"} on "${newBidData.questionTitle}".`,
      time: "Just now",
      read: false,
      icon: "",
      color: "#2196F3",
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Action: React to a student accepting a bid (called from localStorage event)
  const handleBidAcceptedByStudent = useCallback((acceptedEvent) => {
    setBids((prevBids) => {
      // Try to match by questionId since bid IDs differ between dashboards
      const updated = prevBids.map((b) => {
        if (b.questionId === acceptedEvent.questionId && b.status === "pending") {
          return { ...b, status: "accepted", chatOpen: true };
        }
        return b;
      });

      // Only fire a notification if something actually changed
      const changed = updated.some((b, i) => b.status !== prevBids[i].status);
      if (changed) {
        try {
          localStorage.setItem("jonne_tutor_bids", JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        const notif = {
          id: Date.now(),
          title: "🎉 Bid Accepted!",
          body: `A student accepted your bid on "${acceptedEvent.questionTitle}". Chat is now open!`,
          time: "Just now",
          read: false,
          icon: "",
          color: "#4CAF50",
        };
        setNotifications((prev) => [notif, ...prev]);
      }
      return updated;
    });
  }, []);

  // Listen for accepted bid events from StudentDashboard (via localStorage)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "jonne_accepted_bids" && e.newValue) {
        try {
          const accepted = JSON.parse(e.newValue);
          if (accepted.length > 0) {
            handleBidAcceptedByStudent(accepted[accepted.length - 1]);
          }
        } catch (err) {
          console.warn("Error parsing accepted bids", err);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [handleBidAcceptedByStudent]);

  // Action: Withdraw / Cancel Bid
  const handleCancelBid = (bidId) => {
    const updated = bids.filter((b) => b.id !== bidId);
    updateBids(updated);
  };

  // Action: Edit Bid
  const handleEditBid = (bidId, newPrice, newMsg) => {
    const updated = bids.map((b) =>
      b.id === bidId ? { ...b, bidPrice: newPrice, message: newMsg } : b
    );
    updateBids(updated);
  };

  // Action: Solve Question (Complete Answering Session)
  const handleSolveQuestion = (question) => {
    // 1. Move to completed list
    const solvedDate = new Date().toISOString().split("T")[0];
    setCompletedList([{ ...question, solvedDate }, ...completedList]);

    // 2. Add to Ledger if it was paid
    let amountEarned = 0;
    if (question.isPaid) {
      amountEarned = question.pricePerHour * 2; // Assume a flat 2-hour duration for simulation
      const newLedgerItem = {
        id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
        student: question.studentName,
        subject: question.subject,
        date: solvedDate,
        amount: amountEarned,
        status: "Completed",
      };
      setLedger([newLedgerItem, ...ledger]);
      setBalance((b) => b + amountEarned);
    }

    // 3. Send Notification
    const newNotif = {
      id: Date.now(),
      title: "Session Completed",
      body: `You marked the session "${question.title}" as completed. ${amountEarned > 0 ? `$${amountEarned} added to balance.` : "Volunteered successfully!"}`,
      time: "Just now",
      read: false,
      icon: "",
      color: "#4CAF50",
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Action: Withdraw cash
  const handleWithdrawCash = (amount, paymentDetails) => {
    setBalance((b) => b - amount);
    const newWthObj = {
      id: `WTH-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split("T")[0],
      amount: amount,
      method: paymentDetails,
      status: "pending", // Simulator starts as pending
    };
    setWithdrawals([newWthObj, ...withdrawals]);

    // Notify
    const newNotif = {
      id: Date.now(),
      title: "Withdrawal Requested",
      body: `Your request of $${amount} to ${paymentDetails} has been placed.`,
      time: "Just now",
      read: false,
      icon: "",
      color: "#FF9800",
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Action: Mark single notification as read
  const handleMarkSingleRead = (notifId) => {
    setNotifications(
      notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  // Action: Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const renderSection = () => {
    switch (active) {
      case "dashboard":
        return (
          <DashboardHome
            user={user}
            bids={bids}
            setBids={setBids}
            notifications={notifications}
            setNotifications={setNotifications}
            setActive={setActive}
            completedCount={completedList.length + 71}
            allQuestions={allQuestions}
          />
        );
      case "browse":
        return (
          <BrowseQuestionsSection
            bids={bids}
            onAddBid={handleAddBid}
            tutorSubjects={profile.subjects}
            allQuestions={allQuestions}
            loading={loadingQuestions}
          />
        );
      case "bids":
        return (
          <SubmitBidsSection
            bids={bids}
            onCancelBid={handleCancelBid}
            onEditBid={handleEditBid}
          />
        );
      case "answers":
        return (
          <MyAnswersSection
            onSolveQuestion={handleSolveQuestion}
            completedList={completedList}
            allQuestions={allQuestions}
          />
        );
      case "earnings":
        return (
          <EarningsSection
            balance={balance}
            ledger={ledger}
          />
        );
      case "withdrawals":
        return (
          <WithdrawalsSection
            balance={balance}
            onWithdraw={handleWithdrawCash}
            withdrawalHistory={withdrawals}
          />
        );
      case "notifications":
        return (
          <NotificationsSection
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onMarkSingleRead={handleMarkSingleRead}
          />
        );
      case "profile":
        return (
          <ProfileSection
            user={user}
            profile={profile}
            setProfile={setProfile}
          />
        );
      default:
        return (
          <DashboardHome
            user={user}
            bids={bids}
            setBids={setBids}
            notifications={notifications}
            setNotifications={setNotifications}
            setActive={setActive}
            completedCount={completedList.length + 71}
            allQuestions={allQuestions}
          />
        );
    }
  };

  const pendingBidsCount = bids.filter((b) => b.status === "pending").length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const NAV_ITEMS = getNavItems(pendingBidsCount, unreadNotifsCount);

  return (
    <div className="sd-root">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sd-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sd-sidebar ${sidebarOpen ? "sd-sidebar-open" : ""}`}>
        <div className="sd-sidebar-user">
          <div className="sd-sidebar-avatar" style={{ background: "linear-gradient(135deg, #FF6584, #FF9F43)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", zIndex: 1 }}>{(profile.name || "M").charAt(0).toUpperCase()}</span>
            <img
              src={`https://unavatar.io/${profile.email}`}
              alt={profile.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: "absolute", zIndex: 2, top: 0, left: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="sd-sidebar-name">{profile.name}</div>
            <div className="sd-sidebar-role"> Tutor Dashboard</div>
          </div>
        </div>
        <nav className="sd-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sd-nav-item ${active === item.id ? "sd-nav-item-active" : ""}`}
              onClick={() => {
                setActive(item.id);
                setSidebarOpen(false);
              }}
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
