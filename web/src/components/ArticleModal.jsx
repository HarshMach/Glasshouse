import { useEffect, useState } from 'react';
import {
  getComments,
  addComment,
  toggleLike,
  trackShare,
  reportContent,
} from '../../lib/api.js';

function getLocalUserId() {
  if (typeof window === 'undefined') return 'anonymous';
  const key = 'glasshouse_user_id';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2);
    window.localStorage.setItem(key, id);
  }
  return id;
}

export default function ArticleModal({ article, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [username, setUsername] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(article.likes ?? 0);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

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
      console.error('Failed to load comments', e);
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
      const name = username.trim() || 'Anonymous';
      await addComment({
        articleId: article.id,
        userId,
        username: name,
        text: commentText.trim(),
      });
      setCommentText('');
      setUsername(name);
      await loadComments();
    } catch (e) {
      console.error('Failed to add comment', e);
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
      console.error('Failed to toggle like', e);
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
        alert('Link copied to clipboard');
      }
    } catch (e) {
      console.error('Failed to share', e);
    }
  }

  async function handleReport(e) {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      setReporting(true);
      const userId = getLocalUserId();
      await reportContent({
        contentType: 'article',
        contentId: article.id,
        reason: reportReason.trim(),
        reportedBy: userId,
      });
      setReportReason('');
      alert('Thank you for your report.');
    } catch (e) {
      console.error('Failed to report', e);
    } finally {
      setReporting(false);
    }
  }

  if (!article) return null;

  const fullArticleUrl = article.links?.[0]?.url || article.link;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="glass-card relative max-h-[90vh] w-full max-w-4xl overflow-hidden border border-white/10">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-slate-200 hover:bg-black/60"
        >
          Close
        </button>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-wide">
                  {article.category || 'General'}
                </span>
                <span>
                  {article.source || (article.sources && article.sources[0]) || 'Unknown source'}
                </span>
                {article.pubDate && (
                  <span>{new Date(article.pubDate).toLocaleString()}</span>
                )}
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-50 sm:text-2xl">
                {article.title}
              </h2>
            </div>
          </div>

          {(article.stockImage?.url || article.imageUrl) && (
            <div className="overflow-hidden rounded-xl">
              <img
                src={article.stockImage?.url || article.imageUrl}
                alt={article.title}
                className="max-h-80 w-full object-cover"
              />
              {article.stockImage?.photographer && (
                <p className="mt-1 text-xs text-slate-500">
                  Photo by {article.stockImage.photographer}
                  {article.stockImage.photographerUrl && (
                    <>
                      {' '}
                      <a
                        href={article.stockImage.photographerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-slate-300"
                      >
                        (source)
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-black/30 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-100">Summary</h3>
              <p className="text-sm text-slate-300 whitespace-pre-line">
                {article.summary}
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-100">Daily Life Impact</h3>
              <p className="text-sm text-slate-300 whitespace-pre-line">
                {article.dailyLifeImpact || 'No clear daily life impact identified.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/30 p-4 text-xs text-slate-300">
            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled={liking}
                onClick={handleToggleLike}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  liked
                    ? 'bg-red-500/80 text-white hover:bg-red-500'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <span>{liked ? '❤' : '♡'}</span>
                <span>{likes}</span>
              </button>

              <button
                onClick={handleShare}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium hover:bg-slate-700"
              >
                Share
              </button>

              {fullArticleUrl && (
                <a
                  href={fullArticleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-glass-accent/80 px-3 py-1 text-xs font-medium text-black hover:bg-glass-accent"
                >
                  View full article
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>👁 {article.views ?? 0}</span>
              <span>💬 {article.commentCount ?? comments.length}</span>
              <span>↗ {article.shares ?? 0}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr,1.2fr]">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-100">Comments</h3>
              <div className="space-y-3 rounded-xl bg-black/30 p-3 max-h-60 overflow-y-auto scrollbar-thin">
                {loadingComments ? (
                  <p className="text-xs text-slate-400">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-500">No comments yet. Be the first to respond.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-black/40 p-2 text-xs">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium text-slate-200">{c.username}</span>
                        {c.createdAt && (
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-slate-100 whitespace-pre-line">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-100">Add a comment</h3>
              <form
                onSubmit={handleAddComment}
                className="space-y-2 rounded-xl bg-black/30 p-3 text-xs"
              >
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-slate-50 placeholder:text-slate-500 focus:border-glass-accent focus:outline-none"
                />
                <textarea
                  placeholder="Share your thoughts (1-500 characters)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-slate-50 placeholder:text-slate-500 focus:border-glass-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="w-full rounded-md bg-glass-accent/90 px-3 py-1 text-xs font-medium text-black hover:bg-glass-accent disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {submittingComment ? 'Posting...' : 'Post comment'}
                </button>
              </form>

              <h3 className="mt-4 mb-2 text-sm font-semibold text-slate-100">Report this article</h3>
              <form
                onSubmit={handleReport}
                className="space-y-2 rounded-xl bg-black/30 p-3 text-xs"
              >
                <textarea
                  placeholder="Why is this article inappropriate or incorrect?"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-slate-50 placeholder:text-slate-500 focus:border-glass-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={reporting || !reportReason.trim()}
                  className="w-full rounded-md bg-red-500/80 px-3 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {reporting ? 'Submitting...' : 'Submit report'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
