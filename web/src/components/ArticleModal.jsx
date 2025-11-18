import { useEffect, useState } from "react";
import { FiShare } from "react-icons/fi";
import {
  getComments,
  addComment,
  toggleLike,
  trackShare,
  reportContent,
} from "../../lib/api.js";

function getLocalUserId() {
  if (typeof window === "undefined") return "anonymous";
  const key = "glasshouse_user_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2);
    window.localStorage.setItem(key, id);
  }
  return id;
}

export default function ArticleModal({ article, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [username, setUsername] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(article.likes ?? 0);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!article) return;
    setLikes(article.likes ?? 0);
    setLiked(false);
    loadComments();
  }, [article?.id]);

  async function loadComments() {
    try {
      setLoadingComments(true);
      const res = await getComments(article.id, 50);
      setComments(res.comments || []);
    } catch (e) {
      console.error("Failed to load comments", e);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const userId = getLocalUserId();
      const name = username.trim() || "Anonymous";
      await addComment({
        articleId: article.id,
        userId,
        username: name,
        text: commentText.trim(),
      });
      setCommentText("");
      setUsername(name);
      await loadComments();
    } catch (e) {
      console.error("Failed to add comment", e);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleToggleLike() {
    try {
      setLiking(true);
      const userId = getLocalUserId();
      const res = await toggleLike(article.id, userId);
      setLiked(res.liked);
      setLikes(res.likes);
    } catch (e) {
      console.error("Failed to toggle like", e);
    } finally {
      setLiking(false);
    }
  }

  async function handleShare() {
    try {
      await trackShare(article.id);
      const shareData = {
        title: article.title,
        text: article.summary,
        url: article.links?.[0]?.url || article.link || window.location.href,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard");
      }
    } catch (e) {
      console.error("Failed to share", e);
    }
  }

  async function handleReport(e) {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      setReporting(true);
      const userId = getLocalUserId();
      await reportContent({
        contentType: "article",
        contentId: article.id,
        reason: reportReason.trim(),
        reportedBy: userId,
      });
      setReportReason("");
      setShowReportModal(false);
      alert("Thank you for your report.");
    } catch (e) {
      console.error("Failed to report", e);
    } finally {
      setReporting(false);
    }
  }

  if (!article) return null;

  const fullArticleUrl = article.links?.[0]?.url || article.link;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2 sm:p-4">
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-black border border-white/10 overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 px-3 py-1 text-xl text-slate-200 hover:bg-black/60 z-10"
        >
          X
        </button>

        <div className="flex flex-col lg:flex-row h-full text-white overflow-hidden">
          {/* Main Content Section */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto scrollbar-hide">
            <div className="text-xs text-slate-400 flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <span className="rounded-full border border-black-700 px-2 py-0.5 uppercase tracking-wide">
                {article.category || "General"}
              </span>
              <span>
                {article.source ||
                  (article.sources && article.sources[0]) ||
                  "Unknown source"}
              </span>
              {article.pubDate && (
                <span>{new Date(article.pubDate).toLocaleString()}</span>
              )}
            </div>

            {/* Content Grid - Stack on mobile, side-by-side on tablet+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1">
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                  {article.title}
                </h1>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-300 whitespace-pre-line">
                  {article.summary}
                </p>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-lime-400 pt-4 md:pt-0 md:pl-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold leading-snug">
                  Why this <br className="hidden md:inline" /> concerns you?
                </h2>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-300 whitespace-pre-line">
                  {article.dailyLifeImpact ||
                    article.daily_life_impact ||
                    article.summary}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 text-white border-t border-gray-700 pt-3 sm:pt-4 mt-4 text-xs sm:text-sm">
              <div className="flex gap-4 sm:gap-6 items-center">
                {fullArticleUrl && (
                  <a
                    href={fullArticleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-white hover:text-lime-400"
                  >
                    View Original Source
                  </a>
                )}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1 text-white hover:text-[#B8FF4D]"
                >
                  Report
                </button>
              </div>

              <div className="text-xs text-slate-400 flex gap-3">
                <span>👁 {article.views ?? 0}</span>
                <span>↗ {article.shares ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Comments Section - Full width on mobile, sidebar on desktop */}
          <div className="w-full lg:w-1/3 bg-[#101010] border-t lg:border-t-0 lg:border-l border-black flex flex-col max-h-[50vh] lg:max-h-none">
            <h3 className="text-base sm:text-lg font-semibold text-white p-3 sm:p-4 border-b border-black">
              Comments
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4 scrollbar-hide">
              {loadingComments ? (
                <p className="text-xs text-slate-400">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No comments yet. Be the first to respond.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="border-b py-2 text-xs sm:text-sm">
                    <span className="text-lime-400 font-semibold">
                      {c.username}
                    </span>
                    <p className="text-white mt-1 whitespace-pre-line">
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-start items-center p-3 sm:p-4 text-white text-xs sm:text-sm">
              <div className="flex gap-4 sm:gap-6 items-center">
                <button
                  disabled={liking}
                  onClick={handleToggleLike}
                  className="flex items-center gap-1 text-white hover:text-red-500"
                >
                  {liked ? "❤️" : "🤍"} <span>{likes}</span>
                </button>
                <div className="flex items-center gap-1">
                  💬 <span>{comments.length}</span>
                </div>
                <button onClick={handleShare} className="hover:text-blue-400">
                  <FiShare className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleAddComment}
              className="p-3 sm:p-4 bg-[#181818]"
            >
              <input
                type="text"
                placeholder="Add a comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-slate-500 border-none focus:outline-none"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Report Modal - Responsive */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-black border border-white/20 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              Report Summary Issue
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-3 sm:mb-4">
              Why do you think this summary is wrong?
            </p>
            <form onSubmit={handleReport}>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please describe the issue with the summary..."
                className="w-full h-20 sm:h-24 bg-transparent text-white text-xs sm:text-sm placeholder-slate-500 border border-white/20 rounded p-2 sm:p-3 focus:outline-none focus:border-lime-400 resize-none"
                required
              />
              <div className="flex gap-3 mt-3 sm:mt-4">
                <button
                  type="submit"
                  disabled={reporting || !reportReason.trim()}
                  className="flex-1 bg-lime-400 text-black font-semibold py-2 rounded text-xs sm:text-sm hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reporting ? "Submitting..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  className="flex-1 bg-transparent text-white border border-white/20 py-2 rounded text-xs sm:text-sm hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
