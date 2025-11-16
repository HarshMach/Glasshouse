export default function ArticleGrid({ articles, onSelect }) {
  if (!articles || articles.length === 0) {
    return (
      <div className="mt-10 text-center text-sm text-slate-400">
        No articles yet. Once the backend fetches and processes news, they will appear here.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <button
          key={article.id}
          onClick={() => onSelect(article)}
          className="glass-card flex flex-col overflow-hidden text-left transition hover:border-glass-accent/50 hover:shadow-glass-accent/40"
        >
          {article.stockImage?.thumbnail || article.imageUrl ? (
            <div className="h-40 w-full overflow-hidden">
              <img
                src={article.stockImage?.thumbnail || article.imageUrl}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ) : null}

          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-wide">
                {article.category || 'General'}
              </span>
              <span>
                {article.source || (article.sources && article.sources[0]) || 'Unknown source'}
              </span>
            </div>

            <h3 className="line-clamp-2 text-sm font-semibold text-slate-50">
              {article.title}
            </h3>

            <p className="line-clamp-3 text-xs text-slate-400">
              {article.summary}
            </p>

            <div className="mt-auto flex items-center justify-between pt-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>❤ {article.likes ?? 0}</span>
                <span>💬 {article.commentCount ?? 0}</span>
                <span>👁 {article.views ?? 0}</span>
              </div>
              <span>
                {article.pubDate
                  ? new Date(article.pubDate).toLocaleDateString()
                  : ''}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
