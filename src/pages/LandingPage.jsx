import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import { QuestionCard } from "../components/Cards";

const howSteps = [
  {
    number: 1,
    title: "Post your question",
    desc: "Describe what you're stuck on — any subject, any level. Add as much detail as you like.",
  },
  {
    number: 2,
    title: "Set your terms",
    desc: "Choose a price per hour you're comfortable with, or mark it free. You decide.",
  },
  {
    number: 3,
    title: "Get matched & learn",
    desc: "Tutors and peer students offer to help. Pick the best fit and start learning.",
  },
];

export default function LandingPage({ user }) {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    freeQuestions: 0,
    paidQuestions: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch real questions from Supabase
      const { data: qData } = await supabase
        .from("questions")
        .select("id, title, description, subject, level, payment, created_at, status")
        .order("created_at", { ascending: false });

      if (qData) {
        const mapped = qData.slice(0, 3).map((q) => ({
          ...q,
          isPaid: q.payment !== null && q.payment > 0,
          pricePerHour: q.payment || 0,
          status: "open",
          responses: 0,
          postedAt: q.created_at,
          urgency: "medium",
        }));
        setFeatured(mapped);

        // Compute real stats from database records
        const total = qData.length;
        const freeCount = qData.filter((q) => !q.payment || q.payment <= 0).length;
        const paidCount = qData.filter((q) => q.payment && q.payment > 0).length;

        // Fetch real messages count
        const { count: msgCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true });

        setStats({
          totalQuestions: total,
          freeQuestions: freeCount,
          paidQuestions: paidCount,
          totalMessages: msgCount || 0,
        });
      }

      // Fetch real subjects from Supabase
      const { data: sData } = await supabase.from("subjects").select("name");
      if (sData && sData.length > 0) {
        setSubjects(sData.map((s) => ({ label: s.name })));
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div>
      {/*  HERO  */}
      <section className="hero">
        <div className="hero-blob" />
        <div className="container hero-grid">
          <div className="hero-content animate-up">
            <div className="hero-eyebrow">
              Study help for everyone — free or paid
            </div>
            <h1>
              Stuck on something?<br />
              Get help from <span>real people.</span>
            </h1>
            <p className="hero-sub">
              JONNE connects students and learners with tutors and fellow students
              who genuinely want to help. Post your question, set your price — or
              ask for free.
            </p>
            <div className="hero-ctas">
              {user ? (
                <>
                  <Link to="/browse" className="btn btn-ghost btn-lg">
                    Browse Questions
                  </Link>
                  <Link to="/post" className="btn btn-lg" style={{ background: "white", color: "var(--primary)", fontWeight: 700 }}>
                    Post a Question
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-lg" style={{ background: "white", color: "var(--primary)", fontWeight: 700 }}>
                    Get Started Free
                  </Link>
                  <Link to="/browse" className="btn btn-ghost btn-lg">
                    Browse as Guest
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-visual desktop-only">
            <div className="hero-understanding-glow" aria-hidden="true" />
            <div className="hero-understanding-wrap">
              <div className="hero-understanding">
                <img
                  src="/images/understanding.jpg"
                  alt="From confusion to clarity — two minds connecting through understanding"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  REAL STATS BAR  */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-bar-inner">
            {[
              { num: stats.totalQuestions.toString(), lbl: "Questions posted" },
              { num: stats.freeQuestions.toString(), lbl: "Free help requests" },
              { num: stats.paidQuestions.toString(), lbl: "Paid tutoring requests" },
              { num: stats.totalMessages.toString(), lbl: "Messages & answers" },
            ].map((s) => (
              <div className="stat-item" key={s.lbl}>
                <div className="stat-item-num">{s.num}</div>
                <div className="stat-item-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*  REAL SUBJECTS FROM DATABASE  */}
      {subjects.length > 0 && (
        <section style={{ padding: "60px 0", background: "var(--bg-main)" }}>
          <div className="container">
            <h2 className="section-title">Every subject. Every level.</h2>
            <p className="section-sub">
              High school, university, adult learning, self-study — everyone's welcome.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                flexWrap: "wrap",
                maxWidth: 700,
                margin: "0 auto",
              }}
            >
              {subjects.map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "white",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "14px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "var(--shadow-sm)",
                    minWidth: 90,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.background = "var(--primary-light)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/*  HOW IT WORKS  */}
      <section className="how-section" style={{ background: "white" }}>
        <div className="container">
          <h2 className="section-title">How JONNE works</h2>
          <p className="section-sub">Three simple steps to get unstuck.</p>
          <div className="steps-grid">
            {howSteps.map((step) => (
              <div className="card step-card" key={step.number}>
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  FREE vs PAID EXPLAINER  */}
      <section style={{ background: "var(--bg-main)", padding: "80px 0" }}>
        <div className="container">
          <h2 className="section-title">Two ways to get help</h2>
          <p className="section-sub">You're always in control of how you receive help.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, maxWidth: 760, margin: "0 auto" }}>
            <div className="card" style={{ borderTop: "4px solid var(--free-color)" }}>
              <div className="card-inner" style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--free-color)", marginBottom: 12, marginTop: 12 }}>Free Help</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                  Mark your question as free and open it to the community. Peer
                  students and generous tutors help out of goodwill — no payment needed.
                </p>
                <span className="badge badge-free" style={{ fontSize: 14, padding: "6px 16px" }}>FREE</span>
              </div>
            </div>
            <div className="card" style={{ borderTop: "4px solid var(--primary)" }}>
              <div className="card-inner" style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)", marginBottom: 12, marginTop: 12 }}>Paid Help</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                  Set an hourly rate you're comfortable paying and get matched with
                  verified tutors who bring professional-level knowledge and experience.
                </p>
                <span className="badge badge-paid" style={{ fontSize: 14, padding: "6px 16px" }}>Paid Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  FEATURED QUESTIONS  */}
      <section className="featured-section">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <h2 className="section-title" style={{ textAlign: "left", marginBottom: 4 }}>
                Trending questions right now
              </h2>
              <p style={{ color: "var(--text-secondary)" }}>
                Jump in and help, or get inspired to post your own.
              </p>
            </div>
            <Link to="/browse" className="btn btn-secondary" style={{ flexShrink: 0 }}>
              See all →
            </Link>
          </div>
          <div className="questions-grid">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
                Loading questions...
              </div>
            ) : featured.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
                No questions found.
              </div>
            ) : featured.map((q) => (
              <QuestionCard key={q.id} question={q} user={null} />
            ))}
          </div>
        </div>
      </section>

      {/*  FINAL CTA  */}
      <section className="landing-cta">
        <div className="container">
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Ready to stop being stuck?</h2>
          <p style={{ opacity: 0.88, fontSize: 18, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            Join learners who've already found their spark with JONNE.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/signup" className="btn btn-lg" style={{ background: "white", color: "var(--primary)", fontWeight: 700 }}>
              Sign Up — It's Free
            </Link>
            <Link to="/browse" className="btn btn-ghost btn-lg">
              Browse Questions First
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

