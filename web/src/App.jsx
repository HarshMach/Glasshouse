import { useCallback, useEffect, useState } from 'react';
import ArticleGrid from './components/ArticleGrid.jsx';
import ArticleModal from './components/ArticleModal.jsx';
import { getArticles, searchArticles, trackView } from '../lib/api.js';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'politics', label: 'Politics' },
  { id: 'world', label: 'World' },
  { id: 'business', label: 'Business' },
  { id: 'tech', label: 'Tech' },
  { id: 'science', label: 'Science' },
  { id: 'health', label: 'Health' },
  { id: 'sports', label: 'Sports' },
  { id: 'entertainment', label: 'Entertainment' },
];

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getArticles({ category, limit: 50 });
      setArticles(res.articles || []);
    } catch (e) {
      console.error('Failed to load articles', e);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      loadArticles();
      return;
    }
    try {
      setSearching(true);
      const res = await searchArticles(trimmed, 50);
      setArticles(res.articles || []);
    } catch (e) {
      console.error('Failed to search articles', e);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectArticle(article) {
    setSelectedArticle(article);
    trackView(article.id).catch(() => {});
  }

  function closeModal() {
    setSelectedArticle(null);
  }

  return (
    <main className="glass-container py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            The GlassHouse
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            AI-powered news that actually tells you how it affects your daily life.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2 md:w-auto">
          <input
            type="text"
            placeholder="Search topics, categories, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-glass-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-glass-accent/90 px-4 py-2 text-sm font-medium text-black hover:bg-glass-accent"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </header>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCategory(c.id);
              setQuery('');
            }}
            className={`rounded-full border px-3 py-1 transition ${
              category === c.id
                ? 'border-glass-accent bg-glass-accent/10 text-glass-accent'
                : 'border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 text-center text-sm text-slate-400">
          Loading articles...
        </div>
      ) : (
        <ArticleGrid articles={articles} onSelect={handleSelectArticle} />
      )}

      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={closeModal} />
      )}
    </main>
  );
}
