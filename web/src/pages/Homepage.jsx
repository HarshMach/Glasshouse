import { useState, useCallback, useEffect } from "react";
import Layout from "../components/layout.jsx";
import ArticleGrid from "../components/ArticleGrid.jsx";
import { getArticles, searchArticles, trackView } from '../../lib/api.js';

function HomePage() {
  const [activeTab, setActiveTab] = useState("recent");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
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

  function handleSelectArticle(article) {
    setSelectedArticle(article);
    trackView(article.id).catch(() => {});
  }

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  return (
    <Layout 
      onCategoryChange={handleCategoryChange}
      currentCategory={category}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {loading ? (
        <div className="mt-10 text-center text-sm text-slate-400">
          Loading articles...
        </div>
      ) : (
        <ArticleGrid articles={articles} onSelect={handleSelectArticle} />
      )}
      
      {/* Add some height to test sticky behavior */}
      <div className="h-[200vh]"></div>
    </Layout>
  );
}

export default HomePage;