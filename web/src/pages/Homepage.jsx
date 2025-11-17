import { useState, useCallback, useEffect, useRef } from "react";
import Layout from "../components/layout.jsx";
import ArticleGrid from "../components/ArticleGrid.jsx";
import { getArticles, trackView } from '../../lib/api.js';
import ArticleModal from "../components/ArticleModal.jsx";


function Homepage() {
  const [activeTab, setActiveTab] = useState("recent");
  const [category, setCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const [articles, setArticles] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Track if we're loading more (vs initial load)
  const isLoadingMore = useRef(false);

  // Load articles function
  const loadArticles = useCallback(async (reset = false) => {
    // Prevent duplicate requests
    if (loading) return;
    
    try {
      setLoading(true);
      
      const currentCursor = reset ? null : cursor;
      const sortBy = activeTab === 'popular' ? 'popular' : 'recent';
      
      const res = await getArticles({ 
        category, 
        sortBy, 
        limit: 20, 
        cursor: currentCursor 
      });
      
        
      if (reset) {
        // Fresh load - replace articles
        setArticles(res.articles);
      } else {
        // Load more - append articles
        setArticles(prev => [...prev, ...res.articles]);
      }
      
      setCursor(res.nextCursor);
      setHasMore(!!res.nextCursor);
      
    } catch (e) {
      console.error("Failed to load articles", e);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  }, [category, activeTab, cursor, loading]);

  // Reset and load when filters change
  useEffect(() => {
    setArticles([]);
    setCursor(null);
    setHasMore(true);
    loadArticles(true);
  }, [category, activeTab]); // Only depend on filters
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <Layout
      onCategoryChange={handleCategoryChange}
      currentCategory={category}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {articles.length === 0 && loading ? (
        <div className="mt-10 text-center text-sm text-slate-400">
          Loading articles...
        </div>
      ) : (
        <>
          <ArticleGrid articles={articles} onSelect={handleSelectArticle} />
          
          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-[#ff6a00] text-black  px-8 py-3  font-black text-xl hover:bg-[#88EE00] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'LOAD MORE'}
              </button>
            </div>
          )}
          
          {!hasMore && articles.length > 0 && (
            <div className="mt-8 text-center text-gray-500">
              No more articles to load
            </div>
          )}
        </>
      )}

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </Layout>
  );
}

export default Homepage;
