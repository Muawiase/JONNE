import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import BrowsePage from "./pages/BrowsePage";
import PostQuestionPage from "./pages/PostQuestionPage";
import QuestionDetailPage from "./pages/QuestionDetailPage";
import TutorProfilePage from "./pages/TutorProfilePage";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import GuestModal from "./components/GuestModal";
import { mockUsers } from "./mockData";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import Footer from "./components/Footer";
import { supabase } from "./supabase";

export default function App() {
  const [user, setUser] = useState(null); // null = guest
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [questions, setQuestions] = useState(null); // managed in Browse

  // ─── Keep user in sync with Supabase auth session ────────────────────────────
  // This runs on mount and whenever the auth state changes (login / logout).
  // It merges the real Supabase user (which has the correct UUID .id) with the
  // role/name information stored in user_metadata.
  useEffect(() => {
    // Fetch the current session immediately on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mergeSupabaseUser(session.user);
      }
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          mergeSupabaseUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Builds a user object that includes the real Supabase UUID (.id) plus
  // the role/name from metadata and a mock-compatible shape for the UI.
  function mergeSupabaseUser(supabaseUser) {
    const meta = supabaseUser.user_metadata || {};
    const role = meta.role || "student";
    const email = supabaseUser.email || "";
    const name = meta.full_name || meta.name || email.split("@")[0];

    // Start from the mock user shape so the rest of the UI keeps working,
    // then overwrite id/email/name/role with real values.
    let baseUser = {};
    if (role === "admin") {
      baseUser = { ...mockUsers.admin };
    } else {
      baseUser = role === "tutor" ? { ...mockUsers.tutor } : { ...mockUsers.student };
    }

    setUser({
      ...baseUser,
      id: supabaseUser.id,   // ← real UUID for Supabase FK / RLS
      email,
      name,
      role,
    });
  }

  const login = (role, email, fullName, supabaseUser) => {
    // If we have the real Supabase user object, use it to get the correct UUID.
    if (supabaseUser) {
      mergeSupabaseUser({ ...supabaseUser, user_metadata: { ...(supabaseUser.user_metadata || {}), role, full_name: fullName } });
      return;
    }
    // Fallback (should not happen in normal flow)
    let baseUser = {};
    if (role === "admin") {
      baseUser = { ...mockUsers.admin };
    } else {
      baseUser = role === "tutor" ? { ...mockUsers.tutor } : { ...mockUsers.student };
    }
    if (email) baseUser.email = email;
    if (fullName) {
      baseUser.name = fullName;
    } else if (email) {
      baseUser.name = email.split("@")[0];
    } else {
      baseUser.name = baseUser.email.split("@")[0];
    }
    setUser(baseUser);
  };

  const logout = () => {
    supabase.auth.signOut(); // onAuthStateChange will set user to null
  };


  const requireAuth = (element) => {
    if (!user) {
      return (
        <>
          {element}
          <GuestModal onClose={() => setShowGuestModal(false)} />
        </>
      );
    }
    return element;
  };

  return (
    <div className="app">
      <Navbar user={user} onLogout={logout} />
      {showGuestModal && (
        <GuestModal onClose={() => setShowGuestModal(false)} />
      )}
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={login} user={user} />} />
        <Route path="/signup" element={<SignupPage onLogin={login} user={user} />} />
        <Route
          path="/browse"
          element={<BrowsePage user={user} onGuestAction={() => setShowGuestModal(true)} />}
        />
        <Route
          path="/post"
          element={
            user ? (
              <PostQuestionPage user={user} />
            ) : (
              <BrowsePage
                user={user}
                onGuestAction={() => setShowGuestModal(true)}
                forceGuestModal
              />
            )
          }
        />
        <Route
          path="/question/:id"
          element={
            <QuestionDetailPage user={user} onGuestAction={() => setShowGuestModal(true)} />
          }
        />
        <Route path="/tutor/:id" element={<TutorProfilePage user={user} onGuestAction={() => setShowGuestModal(true)} />} />
        <Route
          path="/dashboard/student"
          element={user?.role === "student" ? <StudentDashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard/tutor"
          element={user?.role === "tutor" ? <TutorDashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard/admin"
          element={user?.role === "admin" ? <AdminDashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </div>
  );
}
