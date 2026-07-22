import { Link } from "react-router-dom";

const values = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "Accessibility First",
    desc: "We believe quality learning support shouldn't be a luxury. That's why JONNE supports both free community-based help and budget-friendly paid options."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Community Trust",
    desc: "Every interaction is built on mutual respect and shared success. Ratings, reviews, and badges help maintain a safe, constructive learning environment."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Active Learning",
    desc: "Asking the right questions is the first step to understanding. Our platform encourages dialogue and explanations rather than just giving away copy-paste answers."
  }
];

const team = [
  {
    avatar: "KR",
    name: "KABAJUNGU RITAH",
    role: "SOFTWARE ENGINEER",
    bio: "Full-stack developer who loves creating sleek, fast, and accessible learning interfaces."
  },
  {
    avatar: "DJM",
    name: "DIANA JOY MUSOKI",
    role: "Data scientist",
    bio: "Full-stack developer who loves creating sleek, fast, and accessible learning interfaces."
  },

  {
    avatar: "MM",
    name: "Muawia",
    role: "Lead Engineer",
    bio: "Focuses on micro-animations and intuitive flows to make studying feel less like a chore and more like a community hub."
  }
];

export default function AboutPage() {
  return (
    <div className="animate-up">
      {/*  HERO  */}
      <section className="about-hero">
        <div className="container">
          <h1>About <span>JONNE</span></h1>
          <p>
            We are on a mission to make study help and peer tutoring accessible,
            dynamic, and supportive for students around the world.
          </p>
        </div>
      </section>

      {/*  OUR STORY  */}
      <section className="about-mission">
        <div className="container">
          <div className="about-mission-grid">
            <div className="about-mission-text">
              <h2>A marketplace built on help, not margins.</h2>
              <p>
                JONNE started as a university prototype to solve a simple problem: traditional
                tutoring is too expensive, and free online forums are cluttered or slow.
              </p>
              <p>
                We wanted to build a study workspace where students could post exactly what they are
                stuck on, choose what they can afford (or ask the community for free goodwill help),
                and connect directly in real-time.
              </p>
              <p>
                Whether you're studying algebra, debugging code, writing essays, or preparing
                for exams, JONNE is here to help you get unstuck immediately.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                className="glass-panel"
                style={{
                  padding: "40px",
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                  background: "white",
                  boxShadow: "var(--shadow-lg)",
                  maxWidth: "340px",
                  textAlign: "center"
                }}
              >
                <img
                  src="/logo.png"
                  alt="JONNE logo"
                  style={{ width: "90px", height: "auto", marginBottom: "16px", objectFit: "contain" }}
                />
                <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>The JONNE Brand</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                  Our logo represents connection and collaborative knowledge-sharing across
                  the learning community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  CORE VALUES  */}
      <section className="values-section" style={{ background: "var(--bg-main)" }}>
        <div className="container">
          <h2 className="section-title">Our Core Values</h2>
          <p className="section-sub">The principles that guide how we build and moderate our hive.</p>
          <div className="values-grid">
            {values.map((v, idx) => (
              <div className="card value-card" key={idx}>
                <div className="card-inner">
                  <div className="value-icon">{v.icon}</div>
                  <h3 className="value-title">{v.title}</h3>
                  <p className="value-desc">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  THE TEAM  */}
      <section className="team-section">
        <div className="container">
          <h2 className="section-title">Meet the JONNE Team</h2>
          <p className="section-sub">The creators, educators, and coders behind the JONNE prototype.</p>
          <div className="team-grid">
            {team.map((t, idx) => (
              <div className="team-card" key={idx}>
                <div className="team-avatar" style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)" }}>{t.avatar}</div>
                <h3 className="team-name">{t.name}</h3>
                <div className="team-role">{t.role}</div>
                <p className="team-bio">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  JOIN US CTA  */}
      <section style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", padding: "60px 0", color: "white", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ fontSize: "30px", fontWeight: 800, marginBottom: "12px" }}>Want to make a difference?</h2>
          <p style={{ opacity: 0.9, fontSize: "16px", marginBottom: "24px", maxWidth: "500px", margin: "0 auto 24px" }}>
            Join our tutoring team today and help students worldwide get unstuck, while earning at your own rate.
          </p>
          <Link to="/login" className="btn" style={{ background: "white", color: "var(--primary)", fontWeight: 700 }}>
            Join JONNE Today
          </Link>
        </div>
      </section>
    </div>
  );
}
