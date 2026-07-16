import { Link } from "react-router-dom";

function StarRating({ rating }) {
  return (
    <span className="tutor-rating">
      {"".repeat(Math.floor(rating))}{"".repeat(5 - Math.floor(rating))}
      <span style={{ color: "var(--text-secondary)", fontWeight: 500, marginLeft: 4 }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

export function QuestionCard({ question, onGuestAction, user }) {
  const urgencyLabel = { high: "Urgent", medium: "Soon", low: "Flexible" };
  return (
    <div className="card">
      <div className="card-inner question-card">
        <div className="question-card-header">
          <div className="question-card-badges">
            <span className="badge badge-subject">
              {question.subject}
            </span>
            {question.isPaid ? (
              <span className="badge badge-paid">
                ${question.pricePerHour}/hr
              </span>
            ) : (
              <span className="badge badge-free">FREE</span>
            )}
            <span className="badge badge-level">{question.level}</span>
          </div>
          <span
            className={`urgency-dot urgency-${question.urgency}`}
            title={urgencyLabel[question.urgency]}
            style={{ marginTop: 6 }}
          />
        </div>
        <Link to={`/question/${question.id}`}>
          <h3 className="question-card-title">{question.title}</h3>
        </Link>
        <p className="question-card-excerpt">{question.description}</p>
        <div className="tags-row">
          {(question.tags || []).slice(0, 3).map((t) => (
            <span className="tag" key={t}>#{t}</span>
          ))}
        </div>
        <div className="question-card-footer">
          <div className="question-card-meta">
            <span>by {question.studentName || "Student"}</span>
            <span>{question.responses || 0} {(question.responses || 0) === 1 ? "response" : "responses"}</span>
            <span>Due {new Date(question.deadline || new Date().toISOString()).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </div>
          <Link to={`/question/${question.id}`}>
            <button className="btn btn-sm btn-primary" onClick={() => {
              if (!user) onGuestAction?.();
            }}>
              {user?.role === "tutor" ? "Offer Help →" : "View →"}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function TutorCard({ tutor, onGuestAction, user }) {
  return (
    <div className="card">
      <div className="card-inner tutor-card">
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            className="tutor-avatar-wrap"
            style={{ background: tutor.avatarColor + "22", color: tutor.avatarColor, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {tutor.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="tutor-name">{tutor.name}</span>
              {tutor.isVerifiedTutor ? (
                <span className="badge badge-verified"> Verified</span>
              ) : (
                <span className="badge badge-peer">Peer</span>
              )}
            </div>
            <StarRating rating={tutor.rating} />
            <div className="tutor-rate" style={{ marginTop: 4 }}>
              ${tutor.rateMin}–${tutor.rateMax}/hr &nbsp;·&nbsp; Replies {tutor.responseTime}
            </div>
          </div>
        </div>
        <p className="tutor-bio">{tutor.bio}</p>
        <div className="tutor-subjects">
          {tutor.subjects.map((s) => (
            <span className="badge badge-subject" key={s}>{s}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to={`/tutor/${tutor.id}`}>
            <button className="btn btn-sm btn-secondary">View Profile</button>
          </Link>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => { if (!user) onGuestAction?.(); }}
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
