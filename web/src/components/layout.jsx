import React from "react";
import vector from "../images/vector.png";
import Menu from "./menu";
import { Link } from "react-router-dom";
const Layout = ({ 
  children, 
  onCategoryChange, 
  currentCategory = 'all',
  activeTab = "recent",
    onTabChange,
    bgColor = "bg-black" // default background
}) => {
  return (
    <div className="flex min-h-screen scrollbar-hide">
      {/* Sidebar Column - Sticky */}
      <aside className="sticky top-0 h-screen w-24 bg-[#99FF00] flex items-center justify-center">
        <div className="flex flex-col items-center justify-between h-full py-4 space-y-2 text-black font-bold">
          <span className="text-5xl lg:text-6xl xl:text-6xl">G</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">L</span>
          <Link 
            to="/" 
            className="hover:opacity-80 transition-opacity"
            aria-label="Go to homepage"
          >
            <img
              src={vector}
              alt="vector"
              className="h-10 lg:h-12 xl:h-14 w-auto"
            />
          </Link>
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
      <main className={`flex-1 ${bgColor}`}>
        {/* Top Navigation Bar */}
        <nav className={`sticky top-0 z-40 ${bgColor} px-8 py-6 flex items-center justify-between`}>
          {/* Popular / Recent Tabs - Only show if onTabChange is provided */}
          {onTabChange && (
            <div className="flex space-x-8">
              <button
                onClick={() => onTabChange("popular")}
                className={`text-2xl font-semibold transition-colors ${
                  activeTab === "popular"
                    ? "text-[#FF6B35]"
                    : "text-white hover:text-gray-300"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => onTabChange("recent")}
                className={`text-2xl font-semibold transition-colors ${
                  activeTab === "recent"
                    ? "text-[#FF6B35]"
                    : "text-white hover:text-gray-300"
                }`}
              >
                Recent
              </button>
            </div>
          )}

          {/* Menu Component */}
          <Menu 
            onCategoryChange={onCategoryChange} 
            currentCategory={currentCategory} 
          />
        </nav>

        {/* Content Area */}
        <div className={`p-8 ${bgColor}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;