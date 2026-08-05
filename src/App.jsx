import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
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
import AddAdministratorPage from "./pages/AddAdministratorPage";
import GuestModal from "./components/GuestModal";
import AuthOverlayLayout from "./components/AuthOverlayLayout";
import { mockUsers } from "./mockData";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import WellnessCenterPage from "./pages/WellnessCenterPage";
import AIStudyAssistantPage from "./pages/AIStudyAssistantPage";
import KnowledgeHubPage from "./pages/KnowledgeHubPage";
import Footer from "./components/Footer";
import { supabase } from "./supabase";

export default function App() {
  const [user, setUser] = useState(null); // null = guest
  const [authLoading, setAuthLoading] = useState(true);
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
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          mergeSupabaseUser(session.user);
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Loads cached profile overrides from localStorage if available
  function getStoredProfile(userId) {
    if (!userId) return {};
    try {
      const stored = localStorage.getItem(`jonne_user_profile_${userId}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  // Builds a user object that includes the real Supabase UUID (.id) plus
  // the role/name from metadata and a mock-compatible shape for the UI.
  function mergeSupabaseUser(supabaseUser) {
    const meta = supabaseUser.user_metadata || {};
    const role = meta.role || "student";
    const email = supabaseUser.email || "";
    const name = meta.full_name || meta.name || email.split("@")[0];
    const localProfile = getStoredProfile(supabaseUser.id);

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
      avatar_url: meta.avatar_url || meta.avatar || localProfile.avatar_url || baseUser.avatar_url || "",
      bio: meta.bio || localProfile.bio || baseUser.bio || "",
      school: meta.school || localProfile.school || baseUser.school || "",
      grade: meta.grade || localProfile.grade || baseUser.grade || "",
      phone: meta.phone || localProfile.phone || "",
      responseTime: meta.responseTime || localProfile.responseTime || baseUser.responseTime || "Under 1 hour",
      rateMin: meta.rateMin !== undefined ? meta.rateMin : (localProfile.rateMin !== undefined ? localProfile.rateMin : (baseUser.rateMin || 15)),
      rateMax: meta.rateMax !== undefined ? meta.rateMax : (localProfile.rateMax !== undefined ? localProfile.rateMax : (baseUser.rateMax || 45)),
      subjects: meta.subjects || localProfile.subjects || baseUser.subjects || ["Mathematics", "Physics"],
      ...localProfile,
    });
  }

  const updateProfile = async (updatedFields) => {
    if (!user) return;
    const nextUser = { ...user, ...updatedFields };
    setUser(nextUser);

    // Save in localStorage
    try {
      const storageKey = `jonne_user_profile_${user.id || 'guest'}`;
      const existing = getStoredProfile(user.id || 'guest');
      localStorage.setItem(storageKey, JSON.stringify({ ...existing, ...updatedFields }));
    } catch (e) {
      console.warn("Could not save profile to localStorage", e);
    }

    // Save in Supabase User Metadata if session exists
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await supabase.auth.updateUser({
          data: {
            ...updatedFields,
            full_name: updatedFields.name || updatedFields.full_name || user.name,
            avatar_url: updatedFields.avatar_url || updatedFields.photo || user.avatar_url,
          }
        });
      }
    } catch (e) {
      console.warn("Could not update Supabase user metadata", e);
    }
  };

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

  const location = useLocation();
  const isAuthOverlay = location.pathname === "/login" || location.pathname === "/signup";


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

  if (authLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-main)" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "appSpin 0.8s linear infinite" }} />
        <p style={{ marginTop: 16, color: "var(--text-muted)", fontWeight: 500, fontSize: "14px" }}>Loading session...</p>
        <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <ScrollToTop />
      <Navbar user={user} onLogout={logout} />
      {showGuestModal && (
        <GuestModal onClose={() => setShowGuestModal(false)} />
      )}
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={
          <AuthOverlayLayout user={user} title="Log in">
            <LoginPage onLogin={login} user={user} modal />
          </AuthOverlayLayout>
        } />
        <Route path="/signup" element={
          <AuthOverlayLayout user={user} title="Sign up">
            <SignupPage onLogin={login} user={user} modal />
          </AuthOverlayLayout>
        } />
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
          element={user?.role === "student" ? <StudentDashboard user={user} onUpdateProfile={updateProfile} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard/tutor"
          element={user?.role === "tutor" ? <TutorDashboard user={user} onUpdateProfile={updateProfile} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard/admin"
          element={user?.role === "admin" ? <AdminDashboard user={user} onUpdateProfile={updateProfile} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/add-administrator"
          element={<AddAdministratorPage user={user} />}
        />
        <Route
          path="/dashboard/admin/add-administrator"
          element={<AddAdministratorPage user={user} />}
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/wellness" element={<WellnessCenterPage />} />
        <Route
          path="/ai-assistant"
          element={
            user ? (
              <AIStudyAssistantPage user={user} />
            ) : (
              <>
                <AIStudyAssistantPage user={user} />
                <GuestModal onClose={() => setShowGuestModal(false)} />
              </>
            )
          }
        />
        <Route
          path="/knowledge-hub"
          element={<KnowledgeHubPage user={user} onGuestAction={() => setShowGuestModal(true)} />}
        />
        <Route path="/knowledge" element={<Navigate to="/knowledge-hub" replace />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!isAuthOverlay && <Footer />}
    </div>
  );
}
