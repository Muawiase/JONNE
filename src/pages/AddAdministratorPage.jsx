import { useState } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { UserPlus, ShieldAlert, CheckCircle, ArrowLeft, Lock, Mail, User } from "lucide-react";

export default function AddAdministratorPage({ user, onAdminCreated }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Requirement 7 & 8: Access control check
  if (!user || user.role !== "admin") {
    return (
      <div style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center"
      }}>
        <div style={{
          background: "#fee2e2",
          color: "#b91c1c",
          width: 72,
          height: 72,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20
        }}>
          <ShieldAlert size={36} />
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#991b1b", marginBottom: "12px" }}>
          Access Denied.
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "460px", marginBottom: "24px", fontSize: "16px" }}>
          Only authenticated Administrators are authorized to view this page or create new Administrator accounts.
        </p>
        <Link to="/" className="btn btn-primary" style={{ borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <ArrowLeft size={16} />
          Return to Home Page
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Use isolated non-persisting client so current Admin session remains active
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "admin",
            full_name: fullName,
            name: fullName,
          }
        }
      });

      if (authError) {
        setErrorMsg(authError.message);
        setLoading(false);
        return;
      }

      const newUserId = authData?.user?.id;

      // Assign role "admin" in existing user/profile table if present in DB
      if (newUserId) {
        try {
          await supabase.from("users").upsert({
            id: newUserId,
            email: email,
            full_name: fullName,
            name: fullName,
            role: "admin",
            status: "Active",
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Could not insert into users table:", e);
        }

        try {
          await supabase.from("profiles").upsert({
            id: newUserId,
            email: email,
            full_name: fullName,
            role: "admin",
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Could not insert into profiles table:", e);
        }
      }

      if (onAdminCreated) {
        onAdminCreated({
          id: newUserId || Date.now(),
          name: fullName,
          email,
          role: "admin",
          status: "Active",
          joinedAt: new Date().toISOString().split("T")[0],
          avatar: "",
          color: "#2C3E50"
        });
      }

      setSuccessMsg(`Administrator account for ${fullName} (${email}) created successfully!`);
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred during account creation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link to="/dashboard/admin" style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Admin Dashboard
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: "32px", borderRadius: "var(--radius-lg)", background: "white", boxShadow: "var(--shadow-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: "#f3e5f5", color: "#8e24aa", padding: "10px", borderRadius: "12px" }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Add Administrator
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
              Create a new Administrator account with full administrative privileges.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={18} />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={18} />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "18px" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={15} /> Full Name
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Eleanor Vance"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "18px" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={15} /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="admin.eleanor@jonne.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={15} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link to="/dashboard/admin" className="btn btn-outline" style={{ borderRadius: "var(--radius-sm)" }}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "8px", background: "#2C3E50" }}
            >
              <UserPlus size={16} />
              {loading ? "Creating Administrator…" : "Create Administrator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
