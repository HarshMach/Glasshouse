import { SlLike } from "react-icons/sl";
import { FaRegComment } from "react-icons/fa";

const SkeletonCard = () => {
  return (
    <div className="flex flex-col overflow-hidden animate-pulse">

      <div className="relative w-full aspect-square bg-zinc-900">
    
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="h-4 w-20 bg-gray-700/30 rounded"></div>
        </div>

       
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent space-y-2">
          <div className="h-5 bg-gray-600/60 rounded w-full"></div>
          <div className="h-5 bg-gray-600/50 rounded w-3/4"></div>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3">
    
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-4 w-12 bg-gray-700/30 rounded"></div>
            <div className="h-4 w-12 bg-gray-700/30 rounded"></div>
          </div>
          <div className="h-4 w-24 bg-gray-700/30 rounded"></div>
        </div>

      
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-20 bg-gray-700/30 rounded"></div>
          <div className="h-3 w-16 bg-gray-700/30  rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default function ArticleGrid({ articles, onSelect, isLoading }) {

 if (isLoading) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}


  if (!articles || articles.length === 0) {
    return (
      <div className="mt-10 text-center text-sm text-slate-400">
        No articles yet. Once the backend fetches and processes news, they will
        appear here.
      </div>
    );
  }


  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <button
          key={article.id}
          onClick={() => onSelect(article)}
          className="flex flex-col overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] group"
        >

          <div className="relative w-full aspect-square overflow-hidden">
            {article.stockImage?.thumbnail || article.imageUrl ? (
              <>
            
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                <img
                  src={article.stockImage?.thumbnail || article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </>
            ) : (
           
              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}

       
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-white font-semibold text-2xl leading-tight">
                {article.title}
              </h3>
            </div>

          
            <div className="absolute top-0 left-0 right-0 z-20 p-4">
              <h3 className="px-2 py-1 uppercase tracking-wide text-xs text-gray-300">
                {article.category || "General"}
              </h3>
            </div>
          </div>

   
          <div className="flex flex-col gap-2 p-3">
     
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-white">
                <div className="flex items-center gap-1">
                  <SlLike className="w-3 h-3" />
                  <span>{article.likes ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaRegComment className="w-3 h-3" />
                  <span>{article.commentCount ?? 0}</span>
                </div>
              </div>
              <span className="text-xs text-[#B8FF4D] uppercase tracking-wide truncate">
                {article.source ||
                  (article.sources && article.sources[0]) ||
                  "Unknown source"}
              </span>
            </div>

          
            <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
              <span>{article.views ?? 0} views</span>
              <span>{formatDate(article.pubDate)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
