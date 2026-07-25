import { Link } from "react-router-dom";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-title" style={{ display: "flex", alignItems: "center" }}>
              <img
                src="/logo.png"
                alt="JONNE"
                style={{
                  height: "36px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  filter: "brightness(0) invert(1)",
                }}
              />
            </Link>
            <p className="footer-brand-desc">
              JONNE connects students and learners with verified tutors and peer
              helpers. Get unstuck, teach others, and study on your own terms.
            </p>
            <div className="footer-socials" style={{ fontSize: "14px" }}>
              <a href="#twitter" aria-label="Twitter">Twitter</a>
              <a href="#github" aria-label="GitHub">GitHub</a>
              <a href="#linkedin" aria-label="LinkedIn">LinkedIn</a>
              <a href="#youtube" aria-label="YouTube">YouTube</a>
            </div>
          </div>

          <div>
            <h3 className="footer-title">Company</h3>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
              <li><Link to="/wellness">Student Wellness</Link></li>
              <li><a href="#careers">Careers</a></li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Community</h3>
            <ul className="footer-links">
              <li><a href="#guidelines">Community Guidelines</a></li>
              <li><a href="#safety">Trust & Safety</a></li>
              <li><a href="#discord">Join Discord</a></li>
              <li><a href="#blog">Resources Blog</a></li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h3 className="footer-title">Stay Updated</h3>
            <p>Get study tips, platform updates, and promo codes directly in your inbox.</p>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">
                {subscribed ? "" : "Join"}
              </button>
            </form>
            {subscribed && (
              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, marginTop: 6, display: "inline-block" }}>
                Thanks for subscribing!
              </span>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 JONNE. Built for learners everywhere.</div>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="#privacy" style={{ color: "inherit" }}>Privacy Policy</a>
            <a href="#terms" style={{ color: "inherit" }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
