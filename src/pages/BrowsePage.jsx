import { useState, useEffect } from "react";
import { mockTutors, subjects } from "../mockData";
import { supabase } from "../supabase";
import { QuestionCard, TutorCard } from "../components/Cards";
import GuestModal from "../components/GuestModal";

const LEVELS = ["All Levels", "High School", "University", "Adult Learner"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-high", label: "Highest price" },
  { value: "price-low", label: "Lowest price" },
  { value: "most-urgent", label: "Most urgent" },
  { value: "most-responses", label: "Most responses" },
];

export default function BrowsePage({ user, onGuestAction, forceGuestModal }) {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [level, setLevel] = useState("All Levels");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [tab, setTab] = useState("questions"); // 'questions' | 'tutors'
  const [showModal, setShowModal] = useState(!!forceGuestModal);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (forceGuestModal && !user) setShowModal(true);
  }, [forceGuestModal, user]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("questions").select("*").order('created_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map(q => ({
          ...q,
          isPaid: q.payment !== null && q.payment > 0,
          pricePerHour: q.payment || 0,
          status: 'open',
          responses: 0,
          postedAt: q.created_at,
          urgency: 'medium',
        }));
        setQuestions(mapped);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const urgencyWeight = { high: 3, medium: 2, low: 1 };

  const filtered = questions
    .filter((q) => {
      const matchSearch =
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase()) ||
        q.subject.toLowerCase().includes(search.toLowerCase());
      const matchSubject = subject === "All" || q.subject === subject;
      const matchLevel = level === "All Levels" || q.level === level;
      const matchFree = !freeOnly || !q.isPaid;
      return matchSearch && matchSubject && matchLevel && matchFree;
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.postedAt) - new Date(a.postedAt);
      if (sort === "price-high") return (b.pricePerHour || 0) - (a.pricePerHour || 0);
      if (sort === "price-low") return (a.pricePerHour || 0) - (b.pricePerHour || 0);
      if (sort === "most-urgent")
        return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      if (sort === "most-responses") return b.responses - a.responses;
      return 0;
    });

  const handleGuestAction = () => {
    if (!user) {
      setShowModal(true);
      onGuestAction?.();
    }
  };

  return (
    <div className="page">
      {showModal && (
        <GuestModal onClose={() => setShowModal(false)} />
      )}

      {/*  HERO  */}
      <div className="browse-hero">
        <div className="container">
          <h1>
            {user?.role === "tutor" ? "Find Questions to Answer" : "Browse Questions"}
          </h1>
          <p>
            {user
              ? user.role === "tutor"
                ? "Offer your expertise — pick a paid question or help someone for free."
                : "Browse all open questions or search for a specific topic."
              : "You're browsing as a guest. Sign up to post questions or offer help!"}
          </p>

          {/* SEARCH */}
          <div style={{ marginTop: 24, maxWidth: 560 }}>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by subject, keyword, topic…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {["questions", "tutors"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 99,
                  border: "2px solid rgba(255,255,255,0.4)",
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "var(--primary)" : "white",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {t === "questions" ? "Questions" : "Tutors & Helpers"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "questions" ? (
        <div className="container browse-layout">
          {/*  FILTERS  */}
          <aside className="filters-panel">
            <div className="filters-title">Filters</div>

            <div className="filter-group">
              <div className="filter-label">Subject</div>
              <select
                className="filter-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="All">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <div className="filter-label">Level</div>
              <select
                className="filter-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <div className="filter-label">Free Only</div>
              <label className="filter-toggle">
                <div
                  className={`toggle-switch ${freeOnly ? "on" : ""}`}
                  onClick={() => setFreeOnly((p) => !p)}
                >
                  <div className="toggle-thumb" />
                </div>
                <span style={{ fontSize: 14, color: freeOnly ? "var(--free-color)" : "var(--text-secondary)", fontWeight: 600 }}>
                  {freeOnly ? "Free questions only" : "Show all"}
                </span>
              </label>
            </div>

            <div className="filter-group">
              <div className="filter-label">Price Range</div>
              <select className="filter-select">
                <option>Any price</option>
                <option>$0 (Free only)</option>
                <option>$1–$15/hr</option>
                <option>$15–$25/hr</option>
                <option>$25+/hr</option>
              </select>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={() => {
                setSearch("");
                setSubject("All");
                setLevel("All Levels");
                setFreeOnly(false);
                setSort("newest");
              }}
            >
              Reset Filters
            </button>
          </aside>

          {/*  RESULTS  */}
          <div>
            <div className="results-header">
              <span className="results-count">
                Showing <strong>{filtered.length}</strong> question{filtered.length !== 1 ? "s" : ""}
                {freeOnly ? " (free only)" : ""}
                {subject !== "All" ? ` in ${subject}` : ""}
              </span>
              <select
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="card no-results">
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading questions...
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="card no-results">
                <div className="no-results-icon" style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--text-muted)", fontStyle: "normal" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No questions found</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                  Try adjusting your filters or search term.
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch(""); setSubject("All"); setLevel("All Levels"); setFreeOnly(false);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filtered.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    user={user}
                    onGuestAction={handleGuestAction}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /*  TUTORS TAB  */
        <div className="container" style={{ padding: "40px 24px" }}>
          <div className="questions-grid">
            {mockTutors.map((t) => (
              <TutorCard
                key={t.id}
                tutor={t}
                user={user}
                onGuestAction={handleGuestAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
