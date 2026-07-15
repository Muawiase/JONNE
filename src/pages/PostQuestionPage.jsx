import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { educationLevels } from "../mockData";

export default function PostQuestionPage({ user }) {
  const navigate = useNavigate();

  // ─── Subjects from Supabase ──────────────────────────────────────────────────
  const [dbSubjects, setDbSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");
      if (!error) setDbSubjects(data || []);
      setSubjectsLoading(false);
    }
    fetchSubjects();
  }, []);

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    subjectId: "",   // DB id of selected subject
    level: "",
    description: "",
    deadline: "",
    isPaid: false,
    pricePerHour: "",
  });
  const [preview, setPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ─── File upload ─────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const selectedSubject = dbSubjects.find(
    (s) => String(s.id) === String(form.subjectId)
  );

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  // Upload to Supabase Storage bucket "question-files"
  async function uploadFile(file) {
    const ext = file.name.split(".").pop();
    const path = `questions/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("question-files")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("question-files").getPublicUrl(path);
    return data.publicUrl;
  }

  // ─── Final submit → insert into questions table ──────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be logged in to post a question.");
      return;
    }

    // Force user to re-login if they still have the old mock session (where id is a number)
    if (typeof user.id !== "string" || user.id.length < 10) {
      const msg = "Your login session is out of date. Please log out and log back in to post questions.";
      setError(msg);
      alert(msg);
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = null;
      if (selectedFile) {
        setUploading(true);
        try { fileUrl = await uploadFile(selectedFile); } catch (err) {
          console.warn("File upload failed:", err.message);
        }
        setUploading(false);
      }

      const { error: insertError } = await supabase.from("questions").insert({
        user_id: user.id,
        title: form.title,
        subject: selectedSubject ? selectedSubject.name : "", // New schema expects text
        level: form.level,
        description: form.description,
        deadline: form.deadline || null,
        payment: form.isPaid ? Number(form.pricePerHour) : null,
      });

      if (insertError) throw insertError;

      setSubmitted(true);
      setTimeout(() => navigate("/browse"), 1800);
    } catch (err) {
      console.error("Question insert error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      alert("Error saving question: " + err.message); // Ensure user sees it
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}></div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Question posted!</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 8 }}>
            Tutors and helpers have been notified. You'll get responses soon!
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Redirecting to browse…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="browse-hero">
        <div className="container">
          <h1> Post a Question</h1>
          <p>Describe what you need help with — be as specific as possible for better responses.</p>
        </div>
      </div>

      <div className="container" style={{ padding: "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
          <div>
            {!preview ? (
              <form onSubmit={(e) => { e.preventDefault(); setPreview(true); }}>
                <div className="card">
                  <div className="card-inner">
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}> Question Details</h2>

                    {/* Title */}
                    <div className="form-group">
                      <label className="form-label">Question Title *</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g. How do I solve quadratic equations step by step?"
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        required
                      />
                      <p className="form-hint">Be specific — this is the first thing helpers will see.</p>
                    </div>

                    {/* Subject + Level */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Subject / Category *</label>
                        {subjectsLoading ? (
                          <select className="form-input" disabled>
                            <option>Loading subjects…</option>
                          </select>
                        ) : (
                          <select
                            className="form-input"
                            value={form.subjectId}
                            onChange={(e) => set("subjectId", e.target.value)}
                            required
                          >
                            <option value="">Select a subject…</option>
                            {dbSubjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Your Education Level *</label>
                        <select
                          className="form-input"
                          value={form.level}
                          onChange={(e) => set("level", e.target.value)}
                          required
                        >
                          <option value="">Select your level…</option>
                          {educationLevels.map((l) => (
                            <option key={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                      <label className="form-label">Full Description *</label>
                      <textarea
                        className="form-input"
                        placeholder="Explain exactly what you're struggling with. Include what you've already tried, any error messages, or specific parts that confuse you…"
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        style={{ minHeight: 160 }}
                        required
                      />
                      <p className="form-hint">The more detail you give, the better help you'll receive.</p>
                    </div>

                    {/* Real file input */}
                    <div className="form-group">
                      <label className="form-label">Attach Files (optional)</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                      <div
                        className="upload-area"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ cursor: "pointer" }}
                      >
                        {selectedFile ? (
                          <>
                            <div className="upload-area-icon"></div>
                            <p style={{ color: "var(--success)", fontWeight: 600 }}>{selectedFile.name}</p>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Click to change</p>
                          </>
                        ) : (
                          <>
                            <div className="upload-area-icon"></div>
                            <p style={{ fontWeight: 600 }}>Click to attach files</p>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                              PDF, images, Word docs up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Deadline */}
                    <div className="form-group">
                      <label className="form-label">Deadline</label>
                      <input
                        className="form-input"
                        type="date"
                        value={form.deadline}
                        onChange={(e) => set("deadline", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment card */}
                <div className="card" style={{ marginTop: 20 }}>
                  <div className="card-inner">
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}> How would you like help?</h2>
                    <div className="payment-toggle">
                      <button
                        type="button"
                        className={`payment-toggle-btn ${!form.isPaid ? "active-free" : ""}`}
                        onClick={() => set("isPaid", false)}
                      >
                         Free Help
                      </button>
                      <button
                        type="button"
                        className={`payment-toggle-btn ${form.isPaid ? "active-paid" : ""}`}
                        onClick={() => set("isPaid", true)}
                      >
                         I'll Pay per Hour
                      </button>
                    </div>

                    {form.isPaid ? (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Price per Hour (USD) *</label>
                        <input
                          className="form-input"
                          type="number"
                          min="1"
                          max="200"
                          placeholder="e.g. 15"
                          value={form.pricePerHour}
                          onChange={(e) => set("pricePerHour", e.target.value)}
                          required={form.isPaid}
                        />
                        <p className="form-hint">
                           Most high school questions get helpers at $10–$18/hr. University: $15–$30/hr.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: "var(--free-bg)",
                          border: "1.5px solid var(--free-color)",
                          borderRadius: "var(--radius-sm)",
                          padding: "16px 20px",
                          color: "var(--free-color)",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                         You're asking for free help. Generous peer students and tutors who love giving back will be notified!
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button type="submit" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                     Preview Question
                  </button>
                </div>
              </form>
            ) : (
              /* ── PREVIEW ── */
              <div>
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-inner">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 20,
                        color: "var(--primary)",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                       Preview — This is how your question will look to helpers
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                      {selectedSubject && <span className="badge badge-subject">{selectedSubject.name}</span>}
                      {form.isPaid ? (
                        <span className="badge badge-paid"> ${form.pricePerHour}/hr</span>
                      ) : (
                        <span className="badge badge-free"> FREE</span>
                      )}
                      {form.level && <span className="badge badge-level">{form.level}</span>}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
                      {form.title || "(No title yet)"}
                    </h2>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
                      {form.description || "(No description yet)"}
                    </p>
                    {form.deadline && (
                      <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
                         Deadline: {new Date(form.deadline).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                      </div>
                    )}
                    {selectedFile && (
                      <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>
                         {selectedFile.name} attached
                      </div>
                    )}
                  </div>
                </div>

                {/* Error banner */}
                {error && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1.5px solid #ef4444",
                      borderRadius: "var(--radius-sm)",
                      padding: "14px 18px",
                      color: "#ef4444",
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 16,
                    }}
                  >
                     {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setPreview(false)}
                    disabled={submitting}
                  >
                    ← Edit Question
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting
                      ? uploading ? " Uploading file…" : " Posting…"
                      : " Post Question"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/*  SIDEBAR TIPS  */}
          <div style={{ position: "sticky", top: 90 }}>
            <div className="card sidebar-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}> Tips for great responses</h3>
              {[
                ["Be specific", "Instead of 'I don't understand physics', say 'I'm confused about Newton's 3rd law in the context of rockets.'"],
                ["Share what you've tried", "Even if it's wrong — helpers can spot where you went off track."],
                ["Set a realistic deadline", "Give helpers at least 24 hours to respond for non-urgent questions."],
                ["Add files", "Photos of your textbook, homework sheet, or your working really help!"],
              ].map(([title, tip]) => (
                <div key={title} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}> {title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{tip}</div>
                </div>
              ))}
            </div>

            <div className="card sidebar-card" style={{ marginTop: 20, background: "var(--free-bg)", borderColor: "var(--free-color)" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}></div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--free-color)", marginBottom: 8 }}>
                Free help available!
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Over 1,200 peer students and generous tutors actively look for free questions to answer. You don't always need to pay!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
