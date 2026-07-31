import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { mockUsers } from "../mockData";

export default function KnowledgeHubPage({ user, onGuestAction }) {
  const [posts, setPosts] = useState([]);
  const [likesMap, setLikesMap] = useState({}); // { [postId]: [userIds] }
  const [commentsMap, setCommentsMap] = useState({}); // { [postId]: [commentObjs] }
  const [openComments, setOpenComments] = useState({}); // { [postId]: boolean }
  const [newComments, setNewComments] = useState({}); // { [postId]: string }
  const [submittingComment, setSubmittingComment] = useState({}); // { [postId]: boolean }

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  const canPost = user && (user.role === "student" || user.role === "tutor");

  // Same session guard as Post Question — posts require a real Supabase auth UUID.
  const requireSupabaseUser = () => {
    if (!user) {
      return { ok: false, message: "You must be logged in to post." };
    }
    if (typeof user.id !== "string" || user.id.length < 10) {
      alert("Your login session is out of date. Logging you out to refresh your session.");
      supabase.auth.signOut().then(() => window.location.reload());
      return { ok: false };
    }
    return { ok: true, userId: user.id };
  };

  async function getAuthenticatedUserId() {
    // Priority: Use active prop user.id if available
    if (user?.id && typeof user.id === "string" && user.id.length > 10) {
      return user.id;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Supabase auth session error:", error);
      throw error;
    }
    const sessionUserId = data?.session?.user?.id;
    if (!sessionUserId) {
      throw new Error("Please log in again to publish posts.");
    }
    return sessionUserId;
  }

  async function uploadKnowledgeFile(file) {
    const ext = file.name.split(".").pop();
    const path = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("knowledge-files")
      .upload(path, file, { upsert: false });
    if (error) {
      console.error("Supabase storage upload error:", error);
      throw error;
    }
    const { data } = supabase.storage.from("knowledge-files").getPublicUrl(path);
    return data.publicUrl;
  }

  async function refreshPostsFeed() {
    const postsRes = await supabase.from("knowledge_posts").select("*").order("created_at", { ascending: false });
    if (postsRes.error) {
      console.error("Error refreshing posts:", postsRes.error);
      return;
    }
    setPosts(postsRes.data || []);
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
    if (user && user.id === userId) {
      return {
        name: user.name || "You",
        avatar: user.avatar_url || user.photo || user.avatar || "",
        role: user.role || "student"
      };
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

  const fetchPostsAndData = async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const postsRes = await supabase.from("knowledge_posts").select("*").order("created_at", { ascending: false });

      if (postsRes.error) {
        console.error("Error fetching posts:", postsRes.error);
        setError(postsRes.error.message || "Could not load posts. Please try refreshing.");
      } else {
        setPosts(postsRes.data || []);
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
      setError(err.message || "An unexpected error occurred while loading feed.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndData();
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

      setPosts((prev) => [newPost, ...prev]);
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
    if (!url) return false;
    const cleanUrl = url.split("?")[0].split("#")[0];
    const ext = cleanUrl.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext);
  };

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
                    {user.role === "tutor" ? "Verified Tutor" : "Student"}
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
        ) : posts.length === 0 ? (
          <div className="knowledge-card empty-state-card">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-text">No posts yet. Be the first to share something.</p>
          </div>
        ) : (
          <div className="posts-feed">
            {posts.map((post) => {
              const author = getAuthorInfo(post.user_id);
              const hasFile = Boolean(post.file_url);
              const isImg = hasFile && isImageFile(post.file_url);

              const postLikes = likesMap[post.id] || [];
              const likesCount = postLikes.length;

              const postComments = commentsMap[post.id] || [];
              const commentsCount = postComments.length;
              const isCommentsOpen = Boolean(openComments[post.id]);

              return (
                <article key={post.id} className="knowledge-card post-card">
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
                    {hasFile && (
                      <div className="post-attachment">
                        {isImg ? (
                          <div className="post-image-container">
                            <img
                              src={post.file_url}
                              alt="Attached image"
                              className="post-image-preview"
                              loading="lazy"
                            />
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
                    )}
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
          </div>
        )}
      </div>
    </div>
  );
}
