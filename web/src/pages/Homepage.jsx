import { useCallback, useEffect, useState } from "react";
import vector from "../images/vector.png";
import Menu from "../components/menu";
import ArticleGrid from "../components/ArticleGrid";
import { getArticles, searchArticles, trackView } from "../../lib/api.js";
import ArticleModal from "../components/ArticleModal";
import "../index.css";
import Layout from "../components/layout.jsx";

function Homepage() {
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

  function handleSelectArticle(article) {
    setSelectedArticle(article);
    trackView(article.id).catch(() => {});
  }

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

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
    <Layout
      onCategoryChange={handleCategoryChange}
      currentCategory={category}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="px-8 py-6 bg-black min-h-screen">
        <ArticleGrid
          articles={articles}
          onSelect={handleSelectArticle}
          isLoading={loading || searching}
        />

        {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={closeModal} />
        )}
        {/* Add some height to test scrollable behavior */}
        <div className="h-[150vh]"></div>

        <p className="text-white text-center mt-10">
          Scroll down to see more content...
        </p>
      </div>
    </Layout>
  );
}

export default Homepage;
