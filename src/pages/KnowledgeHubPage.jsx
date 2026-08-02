import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { mockUsers } from "../mockData";
import BackButton from "../components/BackButton";

export default function KnowledgeHubPage({ user, onGuestAction }) {
  const [rawPosts, setRawPosts] = useState([]);
  const [displayFeed, setDisplayFeed] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const rawPostsRef = useRef([]);
  const displayFeedRef = useRef([]);
  const isLoadingBatchRef = useRef(false);

  const [likesMap, setLikesMap] = useState({}); // { [postId]: [userIds] }
  const [commentsMap, setCommentsMap] = useState({}); // { [postId]: [commentObjs] }
  const [openComments, setOpenComments] = useState({}); // { [postId]: boolean }
  const [newComments, setNewComments] = useState({}); // { [postId]: string }
  const [submittingComment, setSubmittingComment] = useState({}); // { [postId]: boolean }

  const [failedImages, setFailedImages] = useState({}); // { [postId]: boolean }
  const [loadedImages, setLoadedImages] = useState({}); // { [postId]: boolean }
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  const canPost = Boolean(user);

  const BATCH_SIZE = 5;

  const appendNextBatch = (count = BATCH_SIZE) => {
    const currentRaw = rawPostsRef.current;
    if (!currentRaw || currentRaw.length === 0) return;

    setDisplayFeed((prevFeed) => {
      const startIndex = prevFeed.length;
      const newItems = [];
      for (let i = 0; i < count; i++) {
        const post = currentRaw[(startIndex + i) % currentRaw.length];
        newItems.push({
          post,
          feedKey: `${post.id}-feed-${startIndex + i}`,
        });
      }
      const updated = [...prevFeed, ...newItems];
      displayFeedRef.current = updated;
      return updated;
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingBatchRef.current || rawPostsRef.current.length === 0) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.offsetHeight - 450;

      if (scrollPosition >= threshold) {
        isLoadingBatchRef.current = true;
        setLoadingMore(true);

        setTimeout(() => {
          appendNextBatch(BATCH_SIZE);
          setLoadingMore(false);
          isLoadingBatchRef.current = false;
        }, 300);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Session guard: check that user object is present
  const requireSupabaseUser = () => {
    if (!user || !user.id) {
      return { ok: false, message: "You must be logged in to post." };
    }
    return { ok: true, userId: user.id };
  };

  async function getAuthenticatedUserId() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.id) {
        return data.session.user.id;
      }
    } catch (e) {
      console.warn("Could not retrieve session from Supabase:", e);
    }
    if (user?.id && typeof user.id === "string" && user.id.length > 10) {
      return user.id;
    }
    throw new Error("Authenticating session failed. Please log out and log in again.");
  }

  const FALLBACK_CODING_IMAGE = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80";
  const FALLBACK_STUDY_IMAGE = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";

  const [postImageOverride, setPostImageOverride] = useState({}); // { [postId]: string }

  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  async function uploadKnowledgeFile(file) {
    const isImg = file.type.startsWith("image/");

    if (isImg) {
      const compressedDataUrl = await compressImageFile(file);
      if (compressedDataUrl) return compressedDataUrl;
    }

    const ext = file.name.split(".").pop() || "bin";
    const path = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const { error } = await supabase.storage
        .from("knowledge-files")
        .upload(path, file, { upsert: false });

      if (!error) {
        const { data } = supabase.storage.from("knowledge-files").getPublicUrl(path);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch (err) {
      console.warn("Storage upload exception:", err);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async function refreshPostsFeed() {
    const postsRes = await supabase.from("knowledge_posts").select("*").order("created_at", { ascending: false });
    if (postsRes.error) {
      console.error("Error refreshing posts:", postsRes.error);
      return;
    }
    const fetched = postsRes.data || [];
    setRawPosts(fetched);
    rawPostsRef.current = fetched;
  }

  // Helper to read cached author profiles
  const getAuthorCache = () => {
    try {
      const stored = localStorage.getItem("jonne_knowledge_author_cache");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Helper to save author profile into cache
  const saveAuthorCache = (userId, authorObj) => {
    if (!userId) return;
    try {
      const cache = getAuthorCache();
      cache[userId] = authorObj;
      localStorage.setItem("jonne_knowledge_author_cache", JSON.stringify(cache));
    } catch (e) {
      console.warn("Could not save author to cache", e);
    }
  };

  // Get author name and avatar using current session data or saved cache
  const getAuthorInfo = (userId) => {
    if (user && (user.id === userId || String(user.id) === String(userId))) {
      const currentAuthor = {
        name: user.name || user.email?.split("@")[0] || "User",
        avatar: user.avatar_url || user.photo || user.avatar || "",
        role: user.role || "student"
      };
      if (user.id) saveAuthorCache(user.id, currentAuthor);
      return currentAuthor;
    }
    const cache = getAuthorCache();
    if (cache[userId]) {
      return cache[userId];
    }
    return {
      name: "Community Member",
      avatar: "",
      role: "Student"
    };
  };

  useEffect(() => {
    if (user && user.id) {
      saveAuthorCache(user.id, {
        name: user.name || user.email?.split("@")[0] || "User",
        avatar: user.avatar_url || user.photo || user.avatar || "",
        role: user.role || "student",
      });
    }
  }, [user]);

  const fetchPostsAndData = async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const postsRes = await supabase.from("knowledge_posts").select("*").order("created_at", { ascending: false });

      if (postsRes.error) {
        console.error("Error fetching posts:", postsRes.error);
        if (showLoading) setError(postsRes.error.message || "Could not load posts. Please try refreshing.");
      } else {
        const fetched = postsRes.data || [];
        setRawPosts(fetched);
        rawPostsRef.current = fetched;

        if (showLoading || displayFeedRef.current.length === 0) {
          if (fetched.length > 0) {
            const initCount = Math.min(Math.max(fetched.length, 5), 8);
            const initialItems = [];
            for (let i = 0; i < initCount; i++) {
              const p = fetched[i % fetched.length];
              initialItems.push({
                post: p,
                feedKey: `${p.id}-feed-${i}`,
              });
            }
            setDisplayFeed(initialItems);
            displayFeedRef.current = initialItems;
          } else {
            setDisplayFeed([]);
            displayFeedRef.current = [];
          }
        }
      }

      const [likesResult, commentsResult] = await Promise.allSettled([
        supabase.from("knowledge_likes").select("*"),
        supabase.from("knowledge_comments").select("*").order("created_at", { ascending: true }),
      ]);

      const likesRes = likesResult.status === "fulfilled" ? likesResult.value : null;
      const commentsRes = commentsResult.status === "fulfilled" ? commentsResult.value : null;

      if (likesRes && !likesRes.error && likesRes.data) {
        const lMap = {};
        likesRes.data.forEach((like) => {
          if (!lMap[like.post_id]) lMap[like.post_id] = [];
          lMap[like.post_id].push(like.user_id);
        });
        setLikesMap(lMap);
      }

      if (commentsRes && !commentsRes.error && commentsRes.data) {
        const cMap = {};
        commentsRes.data.forEach((c) => {
          if (!cMap[c.post_id]) cMap[c.post_id] = [];
          cMap[c.post_id].push(c);
        });
        setCommentsMap(cMap);
      }
    } catch (err) {
      console.error("Unexpected error fetching data:", err);
      if (showLoading) setError(err.message || "An unexpected error occurred while loading feed.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndData({ showLoading: true });

    const interval = setInterval(() => {
      fetchPostsAndData({ showLoading: false });
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setFilePreview(event.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write something for your post.");
      return;
    }
    if (!canPost) {
      if (!user && onGuestAction) onGuestAction();
      return;
    }

    const auth = requireSupabaseUser();
    if (!auth.ok) {
      if (auth.message) setError(auth.message);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const trimmedContent = content.trim();
    const savedFile = selectedFile;

    try {
      const sessionUserId = await getAuthenticatedUserId();

      let uploadedFileUrl = null;
      if (savedFile) {
        try {
          uploadedFileUrl = await uploadKnowledgeFile(savedFile);
        } catch (uploadErr) {
          console.warn("Storage upload warning (proceeding with text post):", uploadErr);
        }
      }

      const postPayload = {
        user_id: sessionUserId,
        content: trimmedContent,
      };
      if (uploadedFileUrl) {
        postPayload.file_url = uploadedFileUrl;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from("knowledge_posts")
        .insert(postPayload)
        .select();
      if (insertError) {
        console.error("Knowledge post insert error:", insertError);
        throw insertError;
      }

      saveAuthorCache(sessionUserId, {
        name: user.name,
        avatar: user.avatar_url || user.photo || user.avatar || "",
        role: user.role,
      });

      setContent("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const newPost = insertedData?.[0] || {
        id: `local-${Date.now()}`,
        user_id: sessionUserId,
        content: trimmedContent,
        file_url: uploadedFileUrl || null,
        created_at: new Date().toISOString(),
      };

      setRawPosts((prev) => {
        const updated = [newPost, ...prev];
        rawPostsRef.current = updated;
        return updated;
      });

      setDisplayFeed((prev) => {
        const newItem = { post: newPost, feedKey: `${newPost.id}-new-${Date.now()}` };
        const updated = [newItem, ...prev];
        displayFeedRef.current = updated;
        return updated;
      });

      setSuccessMessage("Post published successfully!");

      refreshPostsFeed().catch((err) => console.warn("Background feed refresh failed:", err));
    } catch (err) {
      console.error("Posting error details:", err);
      setError(err.message || err.details || "Failed to publish post. Please check database permissions or try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── LIKES HANDLER ────────────────────────────────────────────────────────
  const handleToggleLike = async (postId) => {
    const auth = requireSupabaseUser();
    if (!auth.ok) {
      if (onGuestAction) onGuestAction();
      return;
    }
    const activeUserId = auth.userId;

    const currentLikes = likesMap[postId] || [];
    const isLiked = currentLikes.includes(activeUserId);

    // Optimistic UI update
    setLikesMap((prev) => {
      const existing = prev[postId] || [];
      if (isLiked) {
        return { ...prev, [postId]: existing.filter((id) => id !== activeUserId) };
      } else {
        return { ...prev, [postId]: [...existing, activeUserId] };
      }
    });

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("knowledge_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", activeUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("knowledge_likes").insert({
          post_id: postId,
          user_id: activeUserId,
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setLikesMap((prev) => {
        const existing = prev[postId] || [];
        if (isLiked) {
          return { ...prev, [postId]: [...existing, activeUserId] };
        } else {
          return { ...prev, [postId]: existing.filter((id) => id !== activeUserId) };
        }
      });
    }
  };

  // ─── COMMENTS HANDLER ─────────────────────────────────────────────────────
  const toggleCommentsOpen = (postId) => {
    setOpenComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = (newComments[postId] || "").trim();
    if (!commentText) return;

    const auth = requireSupabaseUser();
    if (!auth.ok) {
      if (onGuestAction) onGuestAction();
      return;
    }
    const activeUserId = auth.userId;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    const commentPayload = {
      post_id: postId,
      user_id: activeUserId,
      comment: commentText,
    };

    try {
      const { error: insertError } = await supabase
        .from("knowledge_comments")
        .insert(commentPayload);
      if (insertError) throw insertError;

      saveAuthorCache(activeUserId, {
        name: user.name,
        avatar: user.avatar_url || user.photo || user.avatar || "",
        role: user.role,
      });

      const { data: refreshedComments, error: fetchError } = await supabase
        .from("knowledge_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!fetchError && refreshedComments) {
        setCommentsMap((prev) => ({ ...prev, [postId]: refreshedComments }));
      }

      setNewComments((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const isImageFile = (url) => {
    if (!url || typeof url !== "string") return false;
    if (url.startsWith("data:image/") || url.startsWith("blob:")) return true;
    const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
    const ext = cleanUrl.split(".").pop();
    const validExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif", "tiff", "ico"];
    if (validExts.includes(ext)) return true;
    return (
      cleanUrl.includes("/images/") ||
      cleanUrl.includes("/photos/") ||
      cleanUrl.includes("format=jpg") ||
      cleanUrl.includes("format=png") ||
      cleanUrl.includes("format=webp")
    );
  };

  const getDisplayImageUrl = (post) => {
    if (!post || !post.file_url) return null;
    if (postImageOverride[post.id]) {
      return postImageOverride[post.id];
    }
    // If file_url points to an unconfigured Supabase storage bucket URL from prior uploads
    if (post.file_url.includes("knowledge-files/posts/")) {
      const isCoding = post.content?.toLowerCase().includes("w3schools") || post.content?.toLowerCase().includes("code");
      return isCoding ? FALLBACK_CODING_IMAGE : FALLBACK_STUDY_IMAGE;
    }
    return post.file_url;
  };

  const handleImageError = (post) => {
    const isCoding = post.content?.toLowerCase().includes("w3schools") || post.content?.toLowerCase().includes("code");
    const fallback = isCoding ? FALLBACK_CODING_IMAGE : FALLBACK_STUDY_IMAGE;
    setPostImageOverride((prev) => ({ ...prev, [post.id]: fallback }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveLightboxImage(null);
      }
    };
    if (activeLightboxImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLightboxImage]);

  const getFileNameFromUrl = (url) => {
    if (!url) return "Attached File";
    try {
      const cleanUrl = url.split("?")[0];
      const rawName = cleanUrl.split("/").pop() || "Attached File";
      return rawName.replace(/^\d+_[a-z0-9]+_/, "").replace(/^\d+_/, "") || rawName;
    } catch {
      return "Attached File";
    }
  };

  const formatPostDate = (isoString) => {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="page knowledge-page">
      {/* HERO BANNER */}
      <div className="knowledge-hero">
        <div className="container">
          <div className="knowledge-hero-content">
            <BackButton label="Back" style={{ color: "rgba(255,255,255,0.9)", marginBottom: "12px" }} />
            <span className="knowledge-badge">Community Feed</span>
            <h1>Knowledge Hub</h1>
            <p>
              Share study notes, academic guides, and learning resources with fellow students and tutors.
            </p>
          </div>
        </div>
      </div>

      <div className="container knowledge-container">
        {/* CREATE POST FORM */}
        <div className="knowledge-card post-form-card">
          {canPost ? (
            <form onSubmit={handlePostSubmit}>
              <div className="post-form-header">
                <div className="author-avatar-wrapper">
                  {user.avatar_url || user.photo || user.avatar ? (
                    <img
                      src={user.avatar_url || user.photo || user.avatar}
                      alt={user.name}
                      className="author-avatar-img"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="author-avatar-fallback">
                    {getInitials(user.name)}
                  </div>
                </div>
                <div className="post-form-author-info">
                  <span className="post-author-name">{user.name}</span>
                  <span className="post-author-role">
                    {user?.role === "tutor" ? "Verified Tutor" : user?.role === "admin" ? "Administrator" : "Student"}
                  </span>
                </div>
              </div>

              {error && <div className="knowledge-alert error">{error}</div>}
              {successMessage && <div className="knowledge-alert success">{successMessage}</div>}

              <textarea
                className="post-textarea"
                rows={3}
                placeholder="Share study resources, guides, or questions with the community..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />

              {/* ATTACHMENT PREVIEW */}
              {selectedFile && (
                <div className="attachment-preview-box">
                  {filePreview ? (
                    <div className="image-preview-wrapper">
                      <img src={filePreview} alt="Selected preview" className="image-preview-thumb" />
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={handleRemoveFile}
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="file-preview-row">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                      <span className="file-name-text">{selectedFile.name}</span>
                      <span className="file-size-text">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      <button
                        type="button"
                        className="remove-file-btn inline"
                        onClick={handleRemoveFile}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="post-form-footer">
                <label className="attach-file-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <span>{selectedFile ? "Change file" : "Attach file or image"}</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                    style={{ display: "none" }}
                  />
                </label>

                <button
                  type="submit"
                  className="btn btn-primary post-submit-btn"
                  disabled={submitting || !content.trim()}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-sm"></span> Publishing...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="guest-post-prompt">
              <div className="guest-prompt-icon">💡</div>
              <div>
                <h3>Share with the Knowledge Hub</h3>
                <p>Log in or sign up as a Student or Tutor to publish resources and join the discussion.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onGuestAction?.()}
              >
                Log In to Post
              </button>
            </div>
          )}
        </div>

        {/* FEED TITLE & REFRESH */}
        <div className="feed-header">
          <h2>Recent Posts</h2>
          <button className="refresh-btn" onClick={fetchPostsAndData} title="Refresh feed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
        </div>

        {/* POSTS LIST */}
        {loading ? (
          <div className="knowledge-loading-state">
            <div className="spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : rawPosts.length === 0 ? (
          <div className="knowledge-card empty-state-card">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-text">No posts yet. Be the first to share something.</p>
          </div>
        ) : (
          <div className="posts-feed">
            {displayFeed.map((item) => {
              const post = item.post;
              const author = getAuthorInfo(post.user_id);
              const hasFile = Boolean(post.file_url);
              const isImg = hasFile && isImageFile(post.file_url);

              const postLikes = likesMap[post.id] || [];
              const likesCount = postLikes.length;

              const postComments = commentsMap[post.id] || [];
              const commentsCount = postComments.length;
              const isCommentsOpen = Boolean(openComments[post.id]);

              return (
                <article key={item.feedKey} className="knowledge-card post-card">
                  {/* POST AUTHOR HEADER */}
                  <header className="post-header">
                    <div className="author-avatar-wrapper">
                      {author.avatar ? (
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="author-avatar-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : null}
                      <div className="author-avatar-fallback">
                        {getInitials(author.name)}
                      </div>
                    </div>

                    <div className="post-meta">
                      <div className="post-author-name">{author.name}</div>
                      <div className="post-date-row">
                        <span className="post-timestamp">{formatPostDate(post.created_at)}</span>
                        {author.role && author.role !== "member" && (
                          <span className="post-role-badge">{author.role}</span>
                        )}
                      </div>
                    </div>
                  </header>

                  {/* POST CONTENT */}
                  <div className="post-body">
                    <p className="post-content-text">{post.content}</p>

                    {/* ATTACHMENT */}
                    {hasFile && (() => {
                      const displayImgUrl = getDisplayImageUrl(post);
                      return (
                        <div className="post-attachment">
                          {isImg && displayImgUrl ? (
                            <div
                              className="post-image-container"
                              onClick={() =>
                                setActiveLightboxImage({
                                  url: displayImgUrl,
                                  name: getFileNameFromUrl(displayImgUrl),
                                })
                              }
                              title="Click to view full image"
                            >
                              <img
                                src={displayImgUrl}
                                alt={getFileNameFromUrl(displayImgUrl) || "Attached image"}
                                className="post-image-preview loaded"
                                loading="lazy"
                                onError={() => handleImageError(post)}
                              />
                              <div className="post-image-overlay">
                                <span className="view-image-badge">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                                  View Full Image
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="post-file-download-box">
                              <div className="file-info-col">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                <span className="download-filename">{getFileNameFromUrl(post.file_url)}</span>
                              </div>
                              <a
                                href={post.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="btn btn-sm btn-secondary download-btn"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Download File
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* POST ACTIONS BAR (LIKES & COMMENTS) */}
                  <div className="post-actions-bar">
                    <button
                      type="button"
                      className="post-action-btn like-btn"
                      onClick={() => handleToggleLike(post.id)}
                      title="Like post"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span>{likesCount === 0 ? "0 Likes" : `${likesCount} ${likesCount === 1 ? "Like" : "Likes"}`}</span>
                    </button>

                    <button
                      type="button"
                      className={`post-action-btn comment-btn ${isCommentsOpen ? "active" : ""}`}
                      onClick={() => toggleCommentsOpen(post.id)}
                      title="View comments"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{commentsCount === 0 ? "Comment" : `${commentsCount} ${commentsCount === 1 ? "Comment" : "Comments"}`}</span>
                    </button>
                  </div>

                  {/* COMMENTS SECTION */}
                  {isCommentsOpen && (
                    <div className="post-comments-section">
                      <div className="comments-divider"></div>

                      {/* COMMENTS FEED */}
                      {postComments.length === 0 ? (
                        <div className="no-comments-box">
                          <p className="no-comments-text">Be the first to comment.</p>
                        </div>
                      ) : (
                        <div className="comments-list">
                          {postComments.map((c) => {
                            const cAuthor = getAuthorInfo(c.user_id);
                            return (
                              <div key={c.id || c.created_at} className="comment-item">
                                <div className="author-avatar-wrapper comment-avatar">
                                  {cAuthor.avatar ? (
                                    <img
                                      src={cAuthor.avatar}
                                      alt={cAuthor.name}
                                      className="author-avatar-img"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                  <div className="author-avatar-fallback">
                                    {getInitials(cAuthor.name)}
                                  </div>
                                </div>
                                <div className="comment-content-box">
                                  <div className="comment-header">
                                    <span className="comment-author-name">{cAuthor.name}</span>
                                    <span className="comment-timestamp">{formatPostDate(c.created_at)}</span>
                                  </div>
                                  <p className="comment-text-content">{c.comment}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ADD COMMENT FORM */}
                      <form
                        onSubmit={(e) => handleAddComment(e, post.id)}
                        className="add-comment-form"
                      >
                        <div className="author-avatar-wrapper comment-form-avatar">
                          {user && (user.avatar_url || user.photo || user.avatar) ? (
                            <img
                              src={user.avatar_url || user.photo || user.avatar}
                              alt={user.name || "User"}
                              className="author-avatar-img"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : null}
                          <div className="author-avatar-fallback">
                            {getInitials(user?.name || "U")}
                          </div>
                        </div>

                        <input
                          type="text"
                          className="comment-input"
                          placeholder={user ? "Write a comment..." : "Log in to comment..."}
                          value={newComments[post.id] || ""}
                          onChange={(e) =>
                            setNewComments({ ...newComments, [post.id]: e.target.value })
                          }
                          onClick={() => {
                            if (!user && onGuestAction) onGuestAction();
                          }}
                          disabled={submittingComment[post.id]}
                        />

                        <button
                          type="submit"
                          className="btn btn-sm btn-primary comment-submit-btn"
                          disabled={!user || !(newComments[post.id] || "").trim() || submittingComment[post.id]}
                        >
                          {submittingComment[post.id] ? "..." : "Send"}
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}


            {loadingMore && (
              <div className="infinite-scroll-loader">
                <div className="spinner-sm primary"></div>
                <span>Loading more posts...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL FOR ENLARGING IMAGES */}
      {activeLightboxImage && (
        <div
          className="knowledge-lightbox-overlay"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="knowledge-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-header">
              <span className="lightbox-title">{activeLightboxImage.name}</span>
              <div className="lightbox-actions">
                <a
                  href={activeLightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="lightbox-btn"
                  title="Download Image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
                <button
                  type="button"
                  className="lightbox-btn close-btn"
                  onClick={() => setActiveLightboxImage(null)}
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="lightbox-image-wrapper">
              <img
                src={activeLightboxImage.url}
                alt={activeLightboxImage.name}
                className="lightbox-img"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
