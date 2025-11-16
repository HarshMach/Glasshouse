import { useCallback, useEffect, useState } from "react";
import vector from "./images/vector.png";
import Menu from "./components/menu";
import ArticleGrid from "./components/ArticleGrid";
import { getArticles, searchArticles, trackView } from "../lib/api.js";
import ArticleModal from "./components/ArticleModal";
import "./index.css";

function App() {
  const [activeTab, setActiveTab] = useState("recent");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent"); // 'recent' or 'popular'
  const [timeframe, setTimeframe] = useState("today"); // 'today', 'week', 'all'
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getArticles({ category, sortBy, limit: 100 });

      // Filter out sports articles and apply timeframe filter
      let filteredArticles = (res.articles || []).filter(
        (article) => article.category?.toLowerCase() !== "sports"
      );
      const now = new Date();

      if (timeframe === "today") {
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        filteredArticles = filteredArticles.filter((article) => {
          const pubDate = new Date(article.pubDate);
          return pubDate >= startOfToday;
        });
      } else if (timeframe === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredArticles = filteredArticles.filter((article) => {
          const pubDate = new Date(article.pubDate);
          return pubDate >= weekAgo;
        });
      }
      // 'all' shows everything

      setArticles(filteredArticles);
    } catch (e) {
      console.error("Failed to load articles", e);
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
      console.log("Searching for:", trimmed);
      const res = await searchArticles(trimmed, 100);
      console.log("Search results:", res.articles?.length || 0, "articles");
      // Filter out sports articles from search results
      const filteredResults = (res.articles || []).filter(
        (article) => article.category?.toLowerCase() !== "sports"
      );
      setArticles(filteredResults);
    } catch (e) {
      console.error("Failed to search articles", e);
      setArticles([]);
    } finally {
      setSearching(false);
    }
  }

  function handleClearSearch() {
    setQuery("");
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
    <div className="flex min-h-screen scrollbar-hide">
      {/* Sidebar Column - Sticky */}
      <aside className="sticky top-0 h-screen w-24 bg-[#99FF00] flex items-center justify-center">
        <div className="flex flex-col items-center justify-between h-full py-4 space-y-2 text-black font-bold">
          <span className="text-5xl lg:text-6xl xl:text-6xl">G</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">L</span>
          <img
            src={vector}
            alt="vector"
            className="h-10 lg:h-12 xl:h-14 w-auto"
          />
          <span className="text-5xl lg:text-6xl xl:text-6xl">S</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">S</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">H</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">O</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">U</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">S</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">E</span>
        </div>
      </aside>

      {/* Main Content Column */}
      <main className="flex-1 bg-black">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-40 bg-black px-8 py-6 flex items-center justify-between">
          {/* Popular / Recent Tabs */}
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("popular")}
              className={`text-2xl font-semibold transition-colors ${
                activeTab === "popular"
                  ? "text-[#FF6B35]"
                  : "text-white hover:text-gray-300"
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`text-2xl font-semibold transition-colors ${
                activeTab === "recent"
                  ? "text-[#FF6B35]"
                  : "text-white hover:text-gray-300"
              }`}
            >
              Recent
            </button>
          </div>

          {/* Menu Component */}
          <Menu />
        </nav>

        {/* Content Area */}
        <div className="px-8 py-6 bg-black min-h-screen">
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
          {/* Add some height to test scrollable behavior */}
          <div className="h-[150vh]"></div>

          <p className="text-white text-center mt-10">
            Scroll down to see more content...
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
