import { useState, useCallback, useEffect, useRef } from "react";
import Layout from "../components/layout.jsx";
import ArticleGrid from "../components/ArticleGrid.jsx";
import Search from "../components/Search.jsx";
import { getArticles, trackView } from "../../lib/api.js";
import ArticleModal from "../components/ArticleModal.jsx";
import Background from "../images/Background.png";
import StartupAnimation from "../components/startup.jsx";

function Homepage() {
  const [showStartup, setShowStartup] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  const [category, setCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Track if we're loading more (vs initial load)
  const isLoadingMore = useRef(false);

  // Handle search results from SearchBar
  const handleSearchResults = (results, searching) => {
    setSearchResults(results);
    setIsSearching(searching);
  };

  // Load articles function
  const loadArticles = useCallback(
    async (reset = false) => {
      // Prevent duplicate requests
      if (loading) return;

      try {
        setLoading(true);

        const currentCursor = reset ? null : cursor;
        const sortBy = activeTab === "popular" ? "popular" : "recent";

        const res = await getArticles({
          category,
          sortBy,
          limit: 20,
          cursor: currentCursor,
        });

        if (reset) {
          // Fresh load - replace articles
          setArticles(res.articles);
        } else {
          // Load more - append articles
          setArticles((prev) => [...prev, ...res.articles]);
        }

        setCursor(res.nextCursor);
        setHasMore(!!res.nextCursor);
      } catch (e) {
        console.error("Failed to load articles", e);
      } finally {
        setLoading(false);
        isLoadingMore.current = false;
      }
    },
    [category, activeTab, cursor, loading]
  );

  // Reset and load when filters change
  useEffect(() => {
    setArticles([]);
    setCursor(null);
    setHasMore(true);
    setIsSearching(false); // Clear search on filter change
    setSearchResults([]);
    loadArticles(true);
  }, [category, activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab, category]);

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    trackView(article.id).catch(() => {});
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && !isLoadingMore.current) {
      isLoadingMore.current = true;
      loadArticles(false);
    }
  };

  // Determine which articles to display
  const displayedArticles = isSearching ? searchResults : articles;

  return (
    <div className="bg-black">
      <Layout
        onCategoryChange={handleCategoryChange}
        currentCategory={category}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {/* Search Bar */}
        <div className="mb-6">
          <Search
            articles={articles}
            onSearchResults={handleSearchResults}
            placeholder="Search articles by title..."
          />

          {/* Search Status */}
          {isSearching && (
            <div className="mt-3 text-center text-sm">
              {searchResults.length > 0 ? (
                <span className="text-gray-400">
                  Found{" "}
                  <span className="text-[#88EE00] font-semibold">
                    {searchResults.length}
                  </span>{" "}
                  article{searchResults.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-red-400">No articles found</span>
              )}
            </div>
          )}
        </div>

        {/* Article Grid - shows search results when searching, all articles otherwise */}
        <ArticleGrid
          articles={displayedArticles}
          onSelect={handleSelectArticle}
          isLoading={loading && !isSearching} // Don't show skeleton when searching
        />

        {/* Load More Button - only show when NOT searching */}
        {!isSearching && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="bg-[#ff6a00] text-black px-8 py-3 font-black text-xl hover:bg-[#88EE00] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "LOAD MORE"}
            </button>
          </div>
        )}

        {!isSearching && !hasMore && articles.length > 0 && (
          <div className="mt-8 text-center text-gray-500">
            No more articles to load
          </div>
        )}

        {selectedArticle && (
          <ArticleModal
            article={selectedArticle}
            onClose={() => setSelectedArticle(null)}
          />
        )}
      </Layout>
    </div>
  );
}

export default Homepage;
