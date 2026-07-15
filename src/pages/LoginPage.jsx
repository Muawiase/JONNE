import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";

export default function LoginPage({ onLogin, user }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    setSubmitted(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setSubmitted(false);
    } else {
      const userRole = data.user.user_metadata?.role || "student";
      const userFullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || "";
      // Pass the real Supabase user so App.jsx can store the correct UUID
      onLogin(userRole, email, userFullName, data.user);
      if (userRole === "admin") {
        navigate("/dashboard/admin");
      } else {
        navigate(userRole === "tutor" ? "/dashboard/tutor" : "/dashboard/student");
      }
    }
  };

  return (
    <div className="login-page" style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--bg-main) 0%, rgba(108,99,255,0.05) 100%)" }}>
      {/* Background blobs for depth */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,107,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      
      <div className="login-card glass-panel" style={{ zIndex: 1, border: "1px solid rgba(255,255,255,0.6)", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.85)" }}>
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
            Welcome back! Ready to learn?
          </p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
            disabled={submitted}
          >
            {submitted ? "Logging you in…" : "Log In →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Sign Up
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

      </div>
    </div>
  );
}
