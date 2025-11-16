const API_BASE = "https://us-central1-news-app-b67e2.cloudfunctions.net";

if (!API_BASE) {
  console.warn('NEXT_PUBLIC_API_BASE_URL is not set. Frontend cannot reach backend.');
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getArticles({ category = 'all', limit = 50 } = {}) {
  const url = new URL(`${API_BASE}/getArticles`);
  url.searchParams.set('category', category);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  return handleResponse(res);
}

export async function searchArticles(query, limit = 50) {
  const url = new URL(`${API_BASE}/searchArticles`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  return handleResponse(res);
}

export async function trackView(articleId) {
  const res = await fetch(`${API_BASE}/trackView`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId }),
  });
  return handleResponse(res).catch(() => null);
}

export async function toggleLike(articleId, userId) {
  const res = await fetch(`${API_BASE}/toggleLike`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId, userId }),
  });
  return handleResponse(res);
}

export async function trackShare(articleId) {
  const res = await fetch(`${API_BASE}/trackShare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId }),
  });
  return handleResponse(res).catch(() => null);
}

export async function getComments(articleId, limit = 50) {
  const url = new URL(`${API_BASE}/getComments`);
  url.searchParams.set('articleId', articleId);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  return handleResponse(res);
}

export async function addComment({ articleId, userId, username, text }) {
  const res = await fetch(`${API_BASE}/addComment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId, userId, username, text }),
  });
  return handleResponse(res);
}

export async function reportContent({ contentType, contentId, reason, reportedBy }) {
  const res = await fetch(`${API_BASE}/reportContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType, contentId, reason, reportedBy }),
  });
  return handleResponse(res);
}
