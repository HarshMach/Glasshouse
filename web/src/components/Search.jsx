import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";

const SearchBar = ({
  articles = [],
  onSearchResults,
  placeholder = "Search articles...",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const fuse = useRef(null);

  useEffect(() => {
    if (articles.length > 0) {
      fuse.current = new Fuse(articles, {
        keys: [
          { name: "title", weight: 0.7 }, 
          { name: "description", weight: 0.2 }, 
          { name: "summary", weight: 0.1 }, 
        ],
        threshold: 0.4,
        distance: 100, 
        minMatchCharLength: 2,
        ignoreLocation: true,
        includeScore: true, 
      });
    }
  }, [articles]);


  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

  
    if (query.trim().length === 0) {
      onSearchResults([], false);
      return;
    }


    if (query.trim().length >= 2 && fuse.current) {
      const results = fuse.current.search(query);
      const articles = results.map((result) => result.item);
      onSearchResults(articles, true);
    }
  };


  const handleClearSearch = () => {
    setSearchQuery("");
    onSearchResults([], false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-zinc-900 text-[#FF6A00] rounded-lg border border-zinc-800 focus:border-[#88EE00] focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
