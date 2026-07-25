import { useState, useEffect, useRef } from "react";

const categories = [
  {
    id: "stress",
    title: "Stress Management",
    desc: "Identify stress triggers, build positive coping mechanisms, and prioritize downtime to prevent burnout.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5z" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
    points: [
      "Keep a daily stress journal to identify patterns and specific triggers in your study routine.",
      "Incorporate brief 5-minute movement or walking breaks every hour during intense study sessions.",
      "Establish a firm boundary between academic work and personal rest by scheduling offline hours."
    ]
  },
  {
    id: "anxiety",
    title: "Anxiety Support",
    desc: "Soften nervous system responses, ground yourself in the present, and reframe intimidating challenges.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
    points: [
      "Practice the 5-4-3-2-1 sensory grounding technique when feeling overwhelmed or panicked.",
      "Reduce caffeine and sugar intake, which can mimic or exacerbate physiological symptoms of anxiety.",
      "Break down intimidating assignments into tiny, manageable steps to regain a sense of agency."
    ]
  },
  {
    id: "balance",
    title: "Study-Life Balance",
    desc: "Protect your personal time, schedule routine breaks, and nurture social relationships outside study.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-6l-3.5 7L9 5l-3.5 7H2" />
      </svg>
    ),
    points: [
      "Designate specific physical areas for studying and separate areas for relaxation/sleep.",
      "Maintain a weekly calendar that schedules social dinners, exercise, and hobbies first, then fit study around them.",
      "Practice saying 'no' to extra commitments when your academic schedule is already packed."
    ]
  },
  {
    id: "time",
    title: "Time Management",
    desc: "Master prioritization, set realistic daily objectives, and build routines to conquer procrastination.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    points: [
      "Use the Eisenhower Matrix to categorize tasks into Urgent/Important quadrants.",
      "Implement the Pomodoro Technique: study distraction-free for 25 minutes, then rest for 5.",
      "Set realistic daily 'Top 3' goals instead of an overwhelming, endless to-do list."
    ]
  },
  {
    id: "motivation",
    title: "Motivation & Focus",
    desc: "Reconnect with academic goals, design rewarding milestones, and build consistent momentum.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    points: [
      "Write down your ultimate educational or career goals and keep them visible at your study desk.",
      "Celebrate small wins: treat yourself to a favorite snack or episode after completing a difficult chapter.",
      "Find a study buddy or join a quiet virtual co-working space to enhance mutual accountability."
    ]
  },
  {
    id: "selfcare",
    title: "Self-Care Practices",
    desc: "Cultivate self-compassion, design refreshing evening rituals, and attend to physical and emotional needs.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    points: [
      "Practice positive self-talk, especially when a test score or project feedback isn't what you hoped.",
      "Incorporate screen-free wellness rituals: reading a physical book, taking a bath, or drinking warm herbal tea.",
      "Check in with your body throughout the day: loosen your jaw, drop your shoulders, and relax your forehead."
    ]
  },
  {
    id: "mindfulness",
    title: "Mindfulness & Presence",
    desc: "Anchor yourself in the now, practice breathing, and develop non-judgmental self-observation.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    ),
    points: [
      "Dedicate 3 to 5 minutes each morning to sit in silence, focusing solely on the rising and falling of your breath.",
      "Engage in mindful eating: put away devices and pay close attention to the flavor, aroma, and texture of your food.",
      "Try progressive muscle relaxation, tensing and then releasing muscle groups from your toes to your face."
    ]
  },
  {
    id: "sleep",
    title: "Sleep & Healthy Habits",
    desc: "Establish consistent circadian rhythms, optimize your sleep space, and fuel yourself with clean energy.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
    points: [
      "Turn off all electronic displays (phones, tablets, laptops) at least 45 minutes before sleep.",
      "Maintain a regular wake-up and bedtime schedule, even on weekends, to stabilize your internal clock.",
      "Aim for 20-30 minutes of natural daylight exposure early in the day to regulate melatonin production."
    ]
  }
];

const quickTips = [
  {
    num: "1",
    title: "Take regular study breaks",
    desc: "Step away from your screen every 45-60 minutes to stretch, rest your eyes, and clear your head."
  },
  {
    num: "2",
    title: "Stay hydrated & eat well",
    desc: "Keep a water bottle at your desk. Proper hydration and balanced meals keep brain fatigue at bay."
  },
  {
    num: "3",
    title: "Protect your sleep hours",
    desc: "Avoid late-night cram sessions. Sleep is crucial for memory retention, critical thinking, and mood stability."
  },
  {
    num: "4",
    title: "Move your body daily",
    desc: "Walk, jog, stretch, or dance. Even a short session of light exercise lowers cortisol and releases endorphins."
  },
  {
    num: "5",
    title: "Reach out when struggling",
    desc: "Talk to classmates, friends, or a counselor. Acknowledging you need help is a powerful sign of strength."
  }
];

const resourceItems = [
  {
    title: "Expert Wellness Articles",
    desc: "Read guides written by counselors on managing exam stress, test anxiety, and imposter syndrome.",
    action: "Read Articles",
    tag: "Reading"
  },
  {
    title: "Guided Meditation Tracks",
    desc: "Explore a library of audio meditations ranging from 3 to 20 minutes to relax your mind before study.",
    action: "Listen Now",
    tag: "Audio"
  },
  {
    title: "Cognitive Study Techniques",
    desc: "Learn spatial repetition, active recall, and focus training methods designed to boost grades while lowering anxiety.",
    action: "Learn Techniques",
    tag: "Guide"
  },
  {
    title: "Campus Support Services",
    desc: "Direct contact directories for academic advisors, financial guidance counselors, and local peer support groups.",
    action: "View Directories",
    tag: "Directory"
  }
];

const faqs = [
  {
    q: "Are wellness sessions free for students?",
    a: "Yes, absolutely. All wellness workshops, online materials, and counselor consultations at the Student Wellness Center are completely free of charge and fully supported by student services budgets."
  },
  {
    q: "How do I book an appointment with a counselor?",
    a: "You can easily schedule a consultation by filling out the 'Contact a Counselor' form below. Alternatively, you can drop by our office in the Student Union building or email us directly at wellness@jonne.edu."
  },
  {
    q: "Is my interaction with the Wellness Center confidential?",
    a: "Yes, privacy is of utmost importance. Your consultations, wellness records, and contact histories are strictly confidential. No information is ever shared with your academic professors, registrar, or family members without your explicit written authorization, except in rare instances required by safety regulations."
  },
  {
    q: "What should I expect during my first intake meeting?",
    a: "Your first meeting is a welcoming, 30-minute chat (either in person or via secure video). The counselor will listen to what challenges you are facing (academic load, personal stress, anxiety) and help you design a tailored plan of resources, groups, or one-on-one sessions."
  },
  {
    q: "Do you offer remote or online video counseling?",
    a: "Yes, we support both in-person visits and remote support. When you schedule an appointment with our coordinator, you can choose to meet in a private office or join a secure, encrypted video room from the comfort of your room."
  }
];

export default function WellnessCenterPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Breathing exercise widget state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathePhase, setBreathePhase] = useState("Ready");
  const [breatheSeconds, setBreatheSeconds] = useState(0);
  const breathingTimer = useRef(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // FAQ state
  const [openFAQIndex, setOpenFAQIndex] = useState(null);

  // Form reference to scroll to
  const contactFormRef = useRef(null);

  const scrollToContact = () => {
    contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFAQToggle = (idx) => {
    setOpenFAQIndex(openFAQIndex === idx ? null : idx);
  };

  // Breathing loop handler (4s In, 4s Hold, 4s Out, 2s Hold)
  useEffect(() => {
    if (breathingActive) {
      setBreathePhase("Breathe In");
      setBreatheSeconds(4);

      let phase = "in"; // in, hold1, out, hold2
      let secondsLeft = 4;

      breathingTimer.current = setInterval(() => {
        secondsLeft -= 1;
        setBreatheSeconds(secondsLeft);

        if (secondsLeft <= 0) {
          if (phase === "in") {
            phase = "hold1";
            secondsLeft = 4;
            setBreathePhase("Hold");
          } else if (phase === "hold1") {
            phase = "out";
            secondsLeft = 4;
            setBreathePhase("Breathe Out");
          } else if (phase === "out") {
            phase = "hold2";
            secondsLeft = 2;
            setBreathePhase("Hold");
          } else {
            phase = "in";
            secondsLeft = 4;
            setBreathePhase("Breathe In");
          }
          setBreatheSeconds(secondsLeft);
        }
      }, 1000);
    } else {
      if (breathingTimer.current) {
        clearInterval(breathingTimer.current);
      }
      setBreathePhase("Ready");
      setBreatheSeconds(0);
    }

    return () => {
      if (breathingTimer.current) {
        clearInterval(breathingTimer.current);
      }
    };
  }, [breathingActive]);

  // Form submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!fullName || !email || !message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSuccess(true);
    }, 1200);
  };

  const handleResetForm = () => {
    setFullName("");
    setEmail("");
    setSubject("General Support");
    setMessage("");
    setFormSuccess(false);
  };

  // Inline styling details for breathing state
  const getBreathingCircleStyle = () => {
    if (!breathingActive) return {};
    
    switch (breathePhase) {
      case "Breathe In":
        return {
          transform: "scale(1.5)",
          backgroundColor: "var(--accent)",
          boxShadow: "0 0 25px rgba(6, 182, 212, 0.4)"
        };
      case "Hold":
        return {
          transform: "scale(1.5)",
          backgroundColor: "var(--success)",
          boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)"
        };
      case "Breathe Out":
        return {
          transform: "scale(1.0)",
          backgroundColor: "var(--primary)",
          boxShadow: "0 0 15px rgba(79, 70, 229, 0.3)"
        };
      case "Hold":
      default:
        return {
          transform: "scale(1.0)",
          backgroundColor: "var(--primary-dark)",
          boxShadow: "0 0 10px rgba(55, 48, 163, 0.2)"
        };
    }
  };

  return (
    <div className="animate-up page" style={{ background: "var(--bg-main)" }}>
      
      {/* 1. HERO SECTION */}
      <section className="wellness-hero">
        <div className="container">
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <span 
              className="badge" 
              style={{ 
                background: "var(--primary-light)", 
                color: "var(--primary)", 
                marginBottom: 16, 
                fontSize: 13, 
                fontWeight: 600,
                border: "1px solid rgba(79, 70, 229, 0.15)"
              }}
            >
              JONNE Academic & Mental Health Hub
            </span>
            <h1>
              Student <span>Wellness Center</span>
            </h1>
            <p>
              Supporting your mental well-being, academic balance, and personal growth. Find peace of mind, construct healthy routines, and access support tools.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button 
                onClick={scrollToContact} 
                className="btn btn-primary btn-lg"
                style={{ borderRadius: "var(--radius-md)", display: "inline-flex", alignItems: "center" }}
              >
                Get Support
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            {/* Calming Illustration (Inline SVG) */}
            <div className="wellness-hero-illustration">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
                {/* Soft background glow */}
                <circle cx="100" cy="100" r="80" fill="url(#wellness-glow)" opacity="0.6"/>
                {/* Balance scales/shapes */}
                <circle cx="60" cy="110" r="28" fill="#EEF2FF" stroke="url(#stroke-grad-1)" strokeWidth="3" opacity="0.9"/>
                <circle cx="140" cy="110" r="28" fill="#ECFDF5" stroke="url(#stroke-grad-2)" strokeWidth="3" opacity="0.9"/>
                
                {/* Connecting arch */}
                <path d="M60 110 Q100 50 140 110" stroke="var(--primary)" strokeWidth="3" strokeDasharray="5 5" fill="none" opacity="0.8"/>
                
                {/* Center growing leaf symbol */}
                <path d="M100 65 C95 80 90 95 100 115 C110 95 105 80 100 65 Z" fill="var(--success)" opacity="0.75"/>
                <path d="M100 78 C92 90 92 100 100 115 C108 100 108 90 100 78 Z" fill="#6EE7B7" opacity="0.85"/>
                
                {/* Floating bubbles representing peace */}
                <circle cx="100" cy="45" r="7" fill="var(--accent)" opacity="0.5" />
                <circle cx="75" cy="65" r="5" fill="var(--primary)" opacity="0.3" />
                <circle cx="125" cy="65" r="6" fill="var(--success)" opacity="0.4" />
                <circle cx="100" cy="115" r="3" fill="var(--text-muted)" opacity="0.5"/>

                <defs>
                  <radialGradient id="wellness-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(100 100) rotate(90) scale(80)">
                    <stop stopColor="#EEF2FF"/>
                    <stop offset="0.5" stopColor="#E0F2FE"/>
                    <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/>
                  </radialGradient>
                  <linearGradient id="stroke-grad-1" x1="60" y1="82" x2="60" y2="138" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary)"/>
                    <stop offset="1" stopColor="var(--accent)"/>
                  </linearGradient>
                  <linearGradient id="stroke-grad-2" x1="140" y1="82" x2="140" y2="138" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--success)"/>
                    <stop offset="1" stopColor="var(--accent)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WELLNESS CATEGORIES */}
      <section className="wellness-section" style={{ background: "white" }}>
        <div className="container">
          <h2 className="wellness-section-title">Explore Wellness Areas</h2>
          <p className="wellness-section-subtitle">
            Click any category to review practical strategies and guidance compiled by counseling coordinators.
          </p>

          <div className="wellness-grid">
            {categories.map((cat) => (
              <div className="wellness-card" key={cat.id}>
                <div className="wellness-card-icon">
                  {cat.icon}
                </div>
                <h3 className="wellness-card-title">{cat.title}</h3>
                <p className="wellness-card-desc">{cat.desc}</p>
                <button 
                  className="wellness-card-btn" 
                  onClick={() => setSelectedCategory(cat)}
                >
                  Learn More
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES CONTEXT MODAL */}
      {selectedCategory && (
        <div className="wellness-modal-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wellness-modal-header">
              <h3 className="wellness-modal-title">
                <span style={{ color: "var(--primary)", display: "flex", alignItems: "center" }}>{selectedCategory.icon}</span>
                <span style={{ marginLeft: 8 }}>{selectedCategory.title}</span>
              </h3>
              <button className="wellness-modal-close" onClick={() => setSelectedCategory(null)}>
                ✕
              </button>
            </div>
            <div className="wellness-modal-body">
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                Here are practical, immediate strategies to support yourself in this area:
              </p>
              <ul className="wellness-modal-points">
                {selectedCategory.points.map((pt, index) => (
                  <li className="wellness-modal-point" key={index}>
                    <span className="wellness-modal-point-bullet">✓</span>
                    <div>{pt}</div>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
                <button 
                  className="btn btn-sm btn-primary" 
                  style={{ borderRadius: "var(--radius-sm)" }}
                  onClick={() => setSelectedCategory(null)}
                >
                  Close Guidelines
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. QUICK WELLNESS TIPS */}
      <section className="wellness-section" style={{ background: "var(--bg-main)" }}>
        <div className="container">
          <h2 className="wellness-section-title">Quick Wellness Tips</h2>
          <p className="wellness-section-subtitle">
            Micro-habits you can build into your day to protect your mental health and study focus.
          </p>

          <div className="wellness-tips-grid">
            {quickTips.map((tip) => (
              <div className="wellness-tip-card" key={tip.num}>
                <div className="wellness-tip-number">{tip.num}</div>
                <div className="wellness-tip-content">
                  <h4>{tip.title}</h4>
                  <p>{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. EMERGENCY SUPPORT BANNER */}
      <section style={{ background: "white", padding: "20px 0" }}>
        <div className="container">
          <div className="emergency-banner-wrap">
            <div className="emergency-banner">
              <div className="emergency-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="emergency-content">
                <h3 className="emergency-title">Experiencing Emotional Distress?</h3>
                <p className="emergency-desc">
                  If you or a fellow student are experiencing an immediate mental health crisis, please reach out for professional help. These lines are free, confidential, and available 24/7.
                </p>
                <div className="emergency-hotlines">
                  <div className="emergency-hotline-item">
                    <span style={{ fontSize: 18 }}>📞</span>
                    <span>National Crisis Line: Call/Text 988</span>
                  </div>
                  <div className="emergency-hotline-item">
                    <span style={{ fontSize: 18 }}>💬</span>
                    <span>Crisis Text Line: Text HOME to 741741</span>
                  </div>
                  <div className="emergency-hotline-item">
                    <span style={{ fontSize: 18 }}>🏫</span>
                    <span>Campus Counseling Office: (555) 019-9823</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. RESOURCES & INTERACTIVE BREATHING SECTION */}
      <section className="wellness-section" style={{ background: "var(--bg-main)" }}>
        <div className="container">
          <h2 className="wellness-section-title">Support Resources</h2>
          <p className="wellness-section-subtitle">
            Explore articles, guides, and practical tools to soothe anxiety and organize workload.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32, alignItems: "start" }} className="about-mission-grid">
            
            {/* Resources Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="wellness-grid">
              {resourceItems.map((res, index) => (
                <div 
                  className="card" 
                  key={index} 
                  style={{ 
                    background: "white", 
                    borderRadius: "var(--radius-md)", 
                    border: "1px solid var(--border)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div className="card-inner" style={{ padding: 24, display: "flex", flexDirection: "column", height: "100%" }}>
                    <span 
                      className="badge" 
                      style={{ 
                        alignSelf: "flex-start", 
                        background: "var(--primary-light)", 
                        color: "var(--primary)",
                        marginBottom: 14,
                        fontSize: 11
                      }}
                    >
                      {res.tag}
                    </span>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>{res.title}</h4>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 20, flexGrow: 1 }}>{res.desc}</p>
                    <button 
                      className="btn btn-sm btn-secondary" 
                      style={{ alignSelf: "flex-start", width: "100%", justifyContent: "center", borderRadius: "var(--radius-sm)" }}
                      onClick={() => alert(`Simulated link: opening "${res.title}" library.`)}
                    >
                      {res.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Breathing Widget */}
            <div className="breathing-widget">
              <span 
                className="badge" 
                style={{ 
                  background: "var(--success-light)", 
                  color: "var(--success)", 
                  marginBottom: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid rgba(16, 185, 129, 0.15)"
                }}
              >
                Interactive Tool
              </span>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Guided 4-7-8 Breathing</h4>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, maxWidth: 280 }}>
                Settle academic pressure and reset. Click Start and follow the circle expansion.
              </p>

              <div className="breathing-circle-outer">
                <div 
                  className="breathing-circle" 
                  style={{
                    transition: "transform 4s ease-in-out, background-color 0.4s",
                    ...getBreathingCircleStyle()
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>{breathePhase}</span>
                    {breathingActive && breatheSeconds > 0 && (
                      <span style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{breatheSeconds}s</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="breathing-instruction">
                {!breathingActive ? (
                  <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Click start to begin exercise</span>
                ) : breathePhase === "Breathe In" ? (
                  "Breathe in slowly through your nose..."
                ) : breathePhase === "Hold" ? (
                  "Hold your breath..."
                ) : breathePhase === "Breathe Out" ? (
                  "Exhale completely through your mouth..."
                ) : (
                  "Get ready..."
                )}
              </div>

              <button
                className={`btn btn-sm ${breathingActive ? "btn-secondary" : "btn-primary"}`}
                style={{ marginTop: 24, padding: "8px 24px", borderRadius: "var(--radius-sm)" }}
                onClick={() => setBreathingActive(!breathingActive)}
              >
                {breathingActive ? "Stop Exercise" : "Start Exercise"}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 6. CONTACT A COUNSELOR */}
      <section className="wellness-section" style={{ background: "white" }} ref={contactFormRef}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="card" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
            
            {formSuccess ? (
              <div className="contact-success" style={{ padding: "60px 40px" }}>
                <div className="contact-success-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>✓</div>
                <h3>Message Sent!</h3>
                <p style={{ margin: "16px 0 32px", fontSize: 15, lineHeight: 1.6 }}>
                  Thank you, <strong>{fullName}</strong>. Your inquiry has been routed to our counseling coordinators. A representative will contact you at <strong>{email}</strong> within 1 business day.
                </p>
                <button className="btn btn-primary" onClick={handleResetForm} style={{ margin: "0 auto", borderRadius: "var(--radius-sm)" }}>
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <div style={{ padding: "40px 32px" }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)", textAlign: "center" }}>
                  Contact a Wellness Counselor
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
                  Have questions about mental health, stress support programs, or scheduling? Fill out the form below for a confidential follow-up.
                </p>

                <form onSubmit={handleFormSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Liam Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                    <span className="form-hint">Please provide your official university or account email address.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Topic / Subject</label>
                    <select 
                      className="form-input" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ cursor: "pointer" }}
                    >
                      <option value="General Support">General Wellness Support</option>
                      <option value="Appointment Booking">Schedule Initial Session</option>
                      <option value="Stress Workshop">Workshops & Group Programs</option>
                      <option value="Peer Support">Peer Helper Matching</option>
                      <option value="Feedback">Resource Feedback</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confidential Message</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Briefly describe what you'd like guidance with. Please do not share highly sensitive medical histories on this form."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: "100%", justifyContent: "center", borderRadius: "var(--radius-sm)" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting Inquiry..." : "Submit Secure Inquiry →"}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="wellness-section" style={{ background: "var(--bg-main)" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 className="wellness-section-title">Frequently Asked Questions</h2>
          <p className="wellness-section-subtitle">
            Answers to common questions about services, costs, session formats, and medical privacy.
          </p>

          <div className="faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFAQIndex === idx;
              return (
                <div className={`faq-item ${isOpen ? "open" : ""}`} key={idx}>
                  <button className="faq-trigger" onClick={() => handleFAQToggle(idx)}>
                    <span>{faq.q}</span>
                    <span className="faq-arrow" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                  </button>
                  <div 
                    className="faq-content"
                    style={{ 
                      maxHeight: isOpen ? "250px" : "0px",
                      transition: "max-height 0.3s ease-out"
                    }}
                  >
                    <div className="faq-answer">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
