import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";

export default function SignupPage({ onLogin, user, modal = false }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (user) {
    if (user.role === "admin") {
      navigate("/dashboard/admin");
    } else {
      navigate(user.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student");
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSuccess(false);
    setSubmitted(true);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setSubmitted(false);
      return;
    }

    if (role !== "student" && role !== "tutor") {
      setErrorMsg("Public registration only allows Student and Tutor account creation.");
      setSubmitted(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/#/dashboard`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          full_name: fullName,
          name: fullName,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setSubmitted(false);
    } else {
      setIsSuccess(true);
      setSubmitted(false);
    }
  };

  const card = (
    <div className={`login-card glass-panel ${modal ? "login-card-modal" : ""}`} style={modal ? undefined : { zIndex: 1, border: "1px solid rgba(255,255,255,0.6)", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.85)" }}>
        <div className="login-logo">
          <img
            src="/logo.png"
            alt="JONNE"
            style={{
              height: "60px",
              width: "auto",
              objectFit: "contain",
              display: "block",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            {isSuccess ? "Verification Sent" : "Join thousands of learners today."}
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(76, 175, 80, 0.15)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                margin: "0 auto 16px",
              }}
            >
              ✉️
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>
              Check your email to verify
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "24px" }}>
              We've sent a verification link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Please check your inbox and click the link to verify your account and access your dashboard.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                to="/login"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Go to Log In
              </Link>
              <Link
                to="/browse"
                style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}
              >
                Continue as Guest (browse only)
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">I am a…</label>
                <div className="role-selector" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <button
                    type="button"
                    className={`role-btn ${role === "student" ? "active" : ""}`}
                    onClick={() => setRole("student")}
                    style={{ padding: "10px 4px", fontSize: "13px" }}
                  >
                    Student / Learner
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${role === "tutor" ? "active" : ""}`}
                    onClick={() => setRole("tutor")}
                    style={{ padding: "10px 4px", fontSize: "13px" }}
                  >
                    Tutor / Helper
                  </button>
                </div>
                <p className="form-hint">
                  {role === "student"
                    ? "You'll be able to post questions and find help."
                    : "You'll be able to browse questions and offer your expertise."}
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
                disabled={submitted}
              >
                {submitted ? "Creating Account…" : "Create Account →"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
                  Log In
                </Link>
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "20px 0",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -10,
                    transform: "translateX(-50%)",
                    background: "white",
                    padding: "0 12px",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  or
                </span>
              </div>
              <Link
                to="/browse"
                style={{ color: "var(--text-muted)", fontSize: 14, textDecoration: "underline" }}
              >
                Continue as Guest (browse only)
              </Link>
            </div>
          </>
        )}
      </div>
  );

  if (modal) return card;

  return (
    <div className="login-page" style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--bg-main) 0%, rgba(76,175,80,0.06) 100%)" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(56,142,60,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      {card}
    </div>
  );
}

