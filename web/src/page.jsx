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
  { id: 'entertainment', label: 'Entertainment' },
];

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'popular'
  const [timeframe, setTimeframe] = useState('today'); // 'today', 'week', 'all'
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getArticles({ category, sortBy, limit: 100 });
      
      // Filter out sports articles and apply timeframe filter
      let filteredArticles = (res.articles || []).filter(article => 
        article.category?.toLowerCase() !== 'sports'
      );
      const now = new Date();
      
      if (timeframe === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredArticles = filteredArticles.filter(article => {
          const pubDate = new Date(article.pubDate);
          return pubDate >= startOfToday;
        });
      } else if (timeframe === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredArticles = filteredArticles.filter(article => {
          const pubDate = new Date(article.pubDate);
          return pubDate >= weekAgo;
        });
      }
      // 'all' shows everything
      
      setArticles(filteredArticles);
    } catch (e) {
      console.error('Failed to load articles', e);
    } finally {
      setLoading(false);
    }
  }, [category, sortBy, timeframe]);

  useEffect(() => {
    // Only load articles if not in search mode
    if (!isSearchMode) {
      loadArticles();
    }
  }, [loadArticles, isSearchMode]);

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setIsSearchMode(false);
      return;
    }
    try {
      setSearching(true);
      setIsSearchMode(true);
      console.log('Searching for:', trimmed);
      const res = await searchArticles(trimmed, 100);
      console.log('Search results:', res.articles?.length || 0, 'articles');
      // Filter out sports articles from search results
      const filteredResults = (res.articles || []).filter(article => 
        article.category?.toLowerCase() !== 'sports'
      );
      setArticles(filteredResults);
    } catch (e) {
      console.error('Failed to search articles', e);
      setArticles([]);
    } finally {
      setSearching(false);
    }
  }

  function handleClearSearch() {
    setQuery('');
    setIsSearchMode(false);
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
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search topics, categories, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-black/40 px-3 py-2 pr-8 text-sm text-slate-50 placeholder:text-slate-500 focus:border-glass-accent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-glass-accent/90 px-4 py-2 text-sm font-medium text-black hover:bg-glass-accent"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        {/* Timeframe filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Show:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeframe('today')}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                timeframe === 'today'
                  ? 'border-glass-accent bg-glass-accent/10 text-glass-accent'
                  : 'border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                timeframe === 'week'
                  ? 'border-glass-accent bg-glass-accent/10 text-glass-accent'
                  : 'border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                timeframe === 'all'
                  ? 'border-glass-accent bg-glass-accent/10 text-glass-accent'
                  : 'border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Sort filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                sortBy === 'recent'
                  ? 'border-glass-accent bg-glass-accent/10 text-glass-accent'
                  : 'border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                sortBy === 'popular'
                  ? 'border-glass-accent bg-glass-accent/10 text-glass-accent'
                  : 'border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500'
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Category:</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  category === c.id
                    ? 'border-glass-accent bg-glass-accent/10 text-glass-accent'
                    : 'border-slate-700 bg-black/30 text-slate-300 hover:border-slate-500'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
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
