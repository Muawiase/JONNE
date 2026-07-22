import { useParams, Link } from "react-router-dom";
import { mockTutors } from "../mockData";
import GuestModal from "../components/GuestModal";
import { useState } from "react";

function Stars({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "var(--accent-warm)" : "#ddd", fontSize: 18 }}>
          
        </span>
      ))}
    </span>
  );
}

export default function TutorProfilePage({ user, onGuestAction }) {
  const { id } = useParams();
  const tutor = mockTutors.find((t) => t.id === Number(id));
  const [showModal, setShowModal] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  if (!tutor) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 64 }}></div>
        <h2 style={{ marginTop: 16 }}>Tutor not found</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: 24 }}>Back to Browse</Link>
      </div>
    );
  }

  const handleMessage = () => {
    if (!user) { setShowModal(true); return; }
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 3000);
  };

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

      <div className="container profile-layout">
        {/*  SIDEBAR PROFILE CARD  */}
        <div>
          <div className="card profile-card">
            <div
              className="profile-avatar"
              style={{ background: tutor.avatarColor + "22" }}
            >
              {tutor.avatar}
            </div>
            <h1 className="profile-name">{tutor.name}</h1>
            <div className="profile-badges">
              {tutor.isVerifiedTutor ? (
                <span className="badge badge-verified"> Verified Tutor</span>
              ) : (
                <span className="badge badge-peer"> Peer Student Helper</span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              <Stars rating={tutor.rating} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>{tutor.rating.toFixed(1)}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 14 }}>({tutor.reviewCount} reviews)</span>
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-val">{tutor.reviewCount}</div>
                <div className="profile-stat-lbl">Reviews</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-val" style={{ color: "var(--free-color)" }}>{tutor.helpedFree}</div>
                <div className="profile-stat-lbl">Helped Free</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-val" style={{ color: "var(--accent-warm)" }}>
                  {tutor.rating.toFixed(1)}
                </div>
                <div className="profile-stat-lbl">Avg. Rating</div>
              </div>
            </div>

            <p className="profile-rate">
               ${tutor.rateMin}–${tutor.rateMax}/hr &nbsp;·&nbsp;  Replies {tutor.responseTime}
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>SUBJECTS</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {tutor.subjects.map((s) => (
                  <span className="badge badge-subject" key={s}>{s}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>TEACHES</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{tutor.level}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>LANGUAGES</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{tutor.languages.join(", ")}</div>
            </div>

            {messageSent ? (
              <div
                style={{
                  background: "var(--success-light)",
                  border: "1.5px solid var(--free-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px",
                  textAlign: "center",
                  color: "var(--free-color)",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                 Message sent! {tutor.name.split(" ")[0]} will reply soon.
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleMessage}
              >
                 Ask {tutor.name.split(" ")[0]} Directly
              </button>
            )}
          </div>

          {/* FREE IMPACT */}
          <div
            className="card"
            style={{
              marginTop: 20,
              background: "linear-gradient(135deg, var(--free-color), #38BDF8)",
              color: "white",
              padding: "24px",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}></div>
            <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>
              {tutor.helpedFree} students
            </div>
            <div style={{ opacity: 0.9, fontSize: 14 }}>
              helped for free by {tutor.name.split(" ")[0]}
            </div>
          </div>
        </div>

        {/*  MAIN CONTENT  */}
        <div>
          {/* BIO */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-inner">
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}> About {tutor.name.split(" ")[0]}</h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: 15 }}>{tutor.bio}</p>
            </div>
          </div>

          {/* EXPERTISE */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-inner">
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}> Expertise</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                {tutor.subjects.map((s) => (
                  <div
                    key={s}
                    style={{
                      background: "var(--primary-light)",
                      border: "1.5px solid var(--primary)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: 600,
                      color: "var(--primary)",
                      fontSize: 14,
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REVIEWS */}
          <div className="card">
            <div className="card-inner">
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                 Reviews ({tutor.reviewCount})
              </h2>
              {tutor.reviews.map((r, i) => (
                <div className="review-card" key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div className="review-author">{r.author}</div>
                    <span style={{ color: "var(--accent-warm)", fontSize: 14 }}>
                      {"".repeat(r.rating)}
                    </span>
                  </div>
                  <p className="review-text">"{r.text}"</p>
                </div>
              ))}
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "var(--text-muted)",
                  fontSize: 14,
                  fontStyle: "italic",
                }}
              >
                + {tutor.reviewCount - tutor.reviews.length} more reviews
              </div>
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-inner">
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}> Availability</h2>
              <div className="tutor-availability-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const available = [0, 2, 3, 5, 6].includes(i);
                  return (
                    <div
                      key={day}
                      style={{
                        textAlign: "center",
                        padding: "10px 4px",
                        borderRadius: "var(--radius-sm)",
                        background: available ? "var(--success-light)" : "var(--bg-main)",
                        color: available ? "var(--free-color)" : "var(--text-muted)",
                        fontSize: 13,
                        fontWeight: 600,
                        border: `1.5px solid ${available ? "var(--free-color)" : "var(--border)"}`,
                      }}
                    >
                      {day}
                      <div style={{ fontSize: 10, marginTop: 4, fontWeight: 400 }}>
                        {available ? " Free" : "Busy"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
