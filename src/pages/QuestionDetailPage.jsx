import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { mockTutors } from "../mockData";
import { supabase } from "../supabase";
import GuestModal from "../components/GuestModal";





export default function QuestionDetailPage({ user, onGuestAction }) {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidMessage, setBidMessage] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const chatBottomRef = useRef(null);

  const fetchBids = async () => {
    setLoadingBids(true);
    const { data } = await supabase.from('bids').select('*').eq('question_id', id).order('created_at', { ascending: false });
    if (data) {
      setBids(data);
      if (data.some(b => b.accepted)) setAccepted(true);
    }
    setLoadingBids(false);
  };

  const fetchMessages = async () => {
    setChatLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('question_id', id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    setChatLoading(false);
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();
      if (!error && data) {
        setQuestion({
          ...data,
          isPaid: data.payment !== null && data.payment > 0,
          pricePerHour: data.payment || 0,
          status: data.status || 'open',
          responses: 0,
          tags: [],
          grade: data.level,
          studentName: "Student",
          user_id: data.user_id,
          deadline: data.deadline || new Date().toISOString()
        });
      }
      setLoading(false);
    };

    if (id) {
      fetchQuestion();
      fetchBids();
      fetchMessages();

      // Supabase Realtime — listen for new messages on this question
      const channel = supabase
        .channel(`question-chat-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `question_id=eq.${id}`,
          },
          (payload) => {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) {
                return prev;
              }
              const optimisticIdx = prev.findIndex(
                (m) =>
                  m.sender_id === payload.new.sender_id &&
                  m.message === payload.new.message &&
                  typeof m.id === 'string' &&
                  m.id.startsWith('opt-')
              );
              if (optimisticIdx !== -1) {
                const updated = [...prev];
                updated[optimisticIdx] = payload.new;
                return updated;
              }
              return [...prev, payload.new];
            });
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <h2 style={{ marginTop: 16 }}>Loading question...</h2>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--text-muted)", fontStyle: "normal" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h2 style={{ marginTop: 16 }}>Question not found</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: 24 }}>Back to Browse</Link>
      </div>
    );
  }

  const handleAccept = async (bidId) => {
    if (!user) { setShowModal(true); return; }
    const { error } = await supabase.from('bids').update({ accepted: true }).eq('id', bidId);
    if (!error) {
      setAccepted(true);
      fetchBids();
    } else {
      alert("Error accepting bid.");
    }
  };

  const submitBid = async () => {
    if (!user) { setShowModal(true); return; }
    if (!bidMessage.trim()) return;
    setSubmittingBid(true);
    
    const finalPrice = question.isPaid ? parseFloat(bidPrice || 0) : 0;
    const { error } = await supabase.from('bids').insert({
      question_id: id,
      tutor_id: user.id,
      tutor_name: user.name,
      bid_price: finalPrice,
      message: bidMessage
    });
    
    if (!error) {
      setShowBidForm(false);
      setBidMessage("");
      setBidPrice("");
      fetchBids();
    } else {
      alert("Error submitting bid.");
    }
    setSubmittingBid(false);
  };

  const sendChat = async () => {
    if (!user) { setShowModal(true); return; }
    const trimmed = chatMsg.trim();
    if (!trimmed) return;
    
    // Clear input optimistically for a snappy feel
    setChatMsg("");
    
    // Generate temporary ID and message object
    const tempId = `opt-${Date.now()}-${Math.random()}`;
    const optimisticMsg = {
      id: tempId,
      question_id: Number(id),
      sender_id: user.id,
      message: trimmed,
      created_at: new Date().toISOString(),
    };
    
    // Optimistic update
    setChatMessages((prev) => [...prev, optimisticMsg]);
    
    const { error } = await supabase.from('messages').insert({
      question_id: Number(id),
      sender_id: user.id,
      message: trimmed,
    });
    
    if (error) {
      alert('Failed to send message: ' + error.message);
      // Restore text so the user can retry
      setChatMsg(trimmed);
      // Remove the failed optimistic message
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const urgencyColors = { high: "var(--urgent-color)", medium: "var(--accent-warm)", low: "var(--success)" };

  return (
    <div className="page">
      {showModal && <GuestModal onClose={() => setShowModal(false)} />}

      {/*  BACK  */}
      <div style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
        <div className="container">
          <Link to="/browse" style={{ color: "var(--text-secondary)", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to Browse
          </Link>
        </div>
      </div>

      <div className="container detail-layout">
        {/*  MAIN  */}
        <div className="detail-main">
          {/* QUESTION HEADER */}
          <div className="card detail-header">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge badge-subject">{question.subject}</span>
              {question.isPaid ? (
                <span className="badge badge-paid">${question.pricePerHour}/hr</span>
              ) : (
                <span className="badge badge-free">FREE</span>
              )}
              <span className="badge badge-level">{question.level} — {question.grade}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: urgencyColors[question.urgency],
                }}
              >
                <span
                  className={`urgency-dot urgency-${question.urgency}`}
                  style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: urgencyColors[question.urgency] }}
                />
                {question.urgency === "high" ? "Urgent" : question.urgency === "medium" ? "Soon" : "Flexible"}
              </span>
            </div>
            <h1 className="detail-title">{question.title}</h1>
            <div className="detail-meta">
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Posted by <strong>{question.studentName}</strong>
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Due {new Date(question.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {question.responses} responses
              </span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="card detail-description">
            <h3>Full Question</h3>
            <p style={{ marginTop: 14 }}>{question.description}</p>
            <div className="tags-row" style={{ marginTop: 20 }}>
              {question.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}
            </div>
          </div>

          {/* HELPERS / BIDS */}
          <div className="card helpers-section">
            <div className="helpers-title">
              {question.isPaid ? "Tutor Bids" : "Volunteers"} ({bids.length})
              {!user && (
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>
                  — Sign up to accept a helper
                </span>
              )}
            </div>

            {loadingBids ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Loading bids...</div>
            ) : bids.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontStyle: "italic" }}>No offers yet.</div>
            ) : bids.map((bid, i) => {
              const isAccepted = bid.accepted;
              return (
                <div
                  key={bid.id || i}
                  className="helper-card"
                  style={isAccepted ? { borderColor: "var(--success)", background: "var(--success-light)" } : {}}
                >
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {(bid.tutor_name || "Tutor").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="helper-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="helper-name">{bid.tutor_name}</span>
                      <span className="badge badge-peer" style={{ fontSize: 11 }}>Peer</span>
                    </div>
                    <div className="helper-bid">
                      {bid.bid_price === 0 ? (
                        <span style={{ color: "var(--free-color)", fontWeight: 700 }}>Offering free help</span>
                      ) : (
                        <span style={{ color: "var(--primary)", fontWeight: 700 }}>${bid.bid_price}/hr</span>
                      )}
                    </div>
                    <p className="helper-message">"{bid.message}"</p>
                  </div>
                  <div>
                    {isAccepted ? (
                      <span className="badge badge-free" style={{ padding: "8px 14px", background: "var(--success-light)", color: "var(--success)" }}>Accepted</span>
                    ) : (
                      user?.id === question.user_id && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleAccept(bid.id)}
                        >
                          Accept
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}

            {user?.role === "tutor" && !accepted && (
              showBidForm ? (
                <div style={{ marginTop: 20, padding: 24, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "white" }}>
                  <h4 style={{ marginBottom: 16, fontSize: 15 }}>Submit your offer</h4>
                  <textarea
                    style={{ width: "100%", padding: 12, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", minHeight: 80, marginBottom: 12, resize: "vertical" }}
                    placeholder="Message to student..."
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                  />
                  {question.isPaid && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <label style={{ fontSize: 14, fontWeight: 600 }}>Hourly Rate ($)</label>
                      <input
                        type="number"
                        style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", width: 100 }}
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-sm btn-primary" onClick={submitBid} disabled={submittingBid}>
                      {submittingBid ? "Submitting..." : "Submit Bid"}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowBidForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 20,
                    padding: "20px 24px",
                    border: "2px dashed var(--primary)",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "center",
                    cursor: "pointer",
                    color: "var(--primary)",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => setShowBidForm(true)}
                >
                  + Offer to help {question.isPaid ? `at your rate` : "for free"}
                </div>
              )
            )}
          </div>

          {/* CHAT */}
          <div className="card chat-thread">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Discussion Thread
            </h3>

            {chatLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                Loading messages…
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
                No messages yet — be the first to start the discussion!
              </div>
            ) : (
              chatMessages.map((msg, i) => {
                const isMine = user && msg.sender_id === user.id;
                const formattedTime = msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div key={msg.id ?? i}>
                    <div className={`chat-bubble ${isMine ? 'student' : 'tutor'}`}>
                      {msg.message}
                      <div className="chat-meta">{formattedTime}</div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Invisible anchor for auto-scroll */}
            <div ref={chatBottomRef} />

            <div className="chat-input-row">
              <input
                type="text"
                placeholder={user ? "Type a reply…" : "Sign in to join the discussion"}
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                disabled={!user}
              />
              <button onClick={sendChat} disabled={!user}>
                Send →
              </button>
            </div>
            {!user && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary)", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}
                >
                  Sign up
                </button>
                {" "}to post in this thread
              </p>
            )}
          </div>
        </div>

        {/*  SIDEBAR  */}
        <div className="detail-sidebar">
          {/* QUESTION INFO */}
          <div className="card sidebar-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Info</h3>
            {[
              ["Subject", question.subject],
              ["Level", question.grade],
              ["Deadline", new Date(question.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })],
              ["Help Type", question.isPaid ? `Paid — $${question.pricePerHour}/hr` : "Free"],
              ["Responses", question.responses],
              ["Status", question.status.charAt(0).toUpperCase() + question.status.slice(1)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* STUDENT PROFILE */}
          <div className="card sidebar-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Asked by</h3>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, margin: "0 auto 10px" }}>
                {question.studentName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div style={{ fontWeight: 700 }}>{question.studentName}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{question.grade}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>3 questions posted</div>
            </div>
          </div>

          {/* OFFER TO HELP */}
          {!user && (
            <div className="card sidebar-card" style={{ background: "var(--primary)", color: "white" }}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Can you help?</h3>
                <p style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  Sign up to offer your expertise and earn money (or give back for free).
                </p>
                <button
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setShowModal(true)}
                >
                  Sign Up to Help →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
