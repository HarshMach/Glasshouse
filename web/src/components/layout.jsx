import React from "react";
import vector from "../images/Vector.png";
import logo from "../images/favicon.png";
import { useState } from "react";
import Menu from "./menu";
import { Link } from "react-router-dom";

const Layout = ({
  children,
  onCategoryChange,
  currentCategory = "all",
  activeTab = "recent",
  onTabChange,
}) => {
  const [bobbingConfig] = useState(() => ({
    Vector: {
      duration: `${3 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
    },
  }));

  return (
    <div className="flex min-h-screen scrollbar-hide">
      {/* Sidebar - Hidden on mobile, visible on md and above */}
      <aside className="hidden md:sticky md:flex top-0 h-screen w-24 bg-[#99FF00] items-center justify-center">
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
              style={{
                animationDuration: bobbingConfig.Vector.duration,
                animationDelay: bobbingConfig.Vector.delay,
              }}
              alt="vector "
              className="h-10 lg:h-12 xl:h-14 w-auto animate-bob"
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

      <main className={`flex-1 `}>
        <nav
          className={`sticky top-0 z-40 px-8 py-6 flex items-center justify-between`}
        >
          {onTabChange && (
            <div className="flex md:space-x-8 lg:space-x-12 space-x-4">
              <button
                onClick={() => onTabChange("popular")}
                className={`  text-lg lg:text-2xl md:text-2xl font-semibold transition-colors ${
                  activeTab === "popular"
                    ? "text-[#FF6B35]"
                    : "text-white hover:text-gray-300"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => onTabChange("recent")}
                className={`text-lg lg:text-2xl md:text-2xl font-semibold transition-colors ${
                  activeTab === "recent"
                    ? "text-[#FF6B35]"
                    : "text-white hover:text-gray-300"
                }`}
              >
                Recent
              </button>
            </div>
          )}

          {/* Mobile Logo - Only visible on mobile, centered */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              {/* Replace with your logo image */}
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            </Link>
          </div>

          <Menu
            onCategoryChange={onCategoryChange}
            currentCategory={currentCategory}
          />
        </nav>

        <div className={`p-8 `}>{children}</div>
      </main>
    </div>
  );
};

export default Layout;
