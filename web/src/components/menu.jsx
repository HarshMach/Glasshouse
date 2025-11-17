import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import donald from "../images/donald.png";
import mark from "../images/mark.png";
import plane from "../images/plane.png";
import musk from "../images/musk.png";
import madamcurie from "../images/madamcurie.png";

const CATEGORIES = [
  { id: "world", label: "WORLD" },
  { id: "politics", label: "POLITICS" },
  { id: "tech", label: "TECH" },
  { id: "science", label: "SCIENCE" },
  { id: "business", label: "BUSINESS" },
];

const Menu = ({ onCategoryChange, currentCategory = "all" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // create randomized animation duration & delay for each image once
  const [bobbingConfig] = useState(() => ({
    donald: {
      duration: `${3 + Math.random() * 3}s`, // 3–6s
      delay: `${Math.random() * 2}s`, // 0–2s
    },
    mark: {
      duration: `${3 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
    },
    plane: {
      duration: `${3 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
    },
    madamcurie: {
      duration: `${3 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
    },
    musk: {
      duration: `${3 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
    },
  }));

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleCategoryClick = (categoryId) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
  };

  const handleReset = () => {
    onCategoryChange("all");
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-6 right-8 z-50 flex flex-col space-y-1.5 p-0 bg-transparent"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <span
          className={`block h-0.5 w-6 bg-[#FF6A00] transition-transform duration-300 ${
            isOpen ? "rotate-45 translate-y-[5px]" : ""
          }`}
        ></span>
        <span
          className={`block h-0.5 w-6 bg-[#FF6A00] transition-transform duration-300 ${
            isOpen ? "-rotate-45 -translate-y-[3px]" : ""
          }`}
        ></span>
        <span
          className={`block h-0.5 w-6 bg-[#FF6A00] transition-opacity duration-0 ${
            isOpen ? "opacity-0" : ""
          }`}
        ></span>
      </button>

      {/* Navigation Overlay */}
      <div
        className={`fixed inset-y-0 right-0 w-1/2 bg-[#B8FF4D] transform transition-transform duration-500 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="navigation-title"
      >
        {/* Hidden title for screen readers */}
        <h2 id="navigation-title" className="sr-only">
          Categories Menu
        </h2>

        <div className="navigation-container relative flex flex-col h-full">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src={donald}
              alt=""
              className={`absolute ${isOpen ? "animate-bob" : ""}`}
              style={{
                top: "26%",
                left: "3%",
                width: "20%",
                zIndex: 1000,
                opacity: 1,
                animationDuration: bobbingConfig.donald.duration,
                animationDelay: bobbingConfig.donald.delay,
              }}
            />
            <img
              src={mark}
              alt=""
              className={`absolute ${isOpen ? "animate-bob" : ""}`}
              style={{
                top: "42%",
                right: "20%",
                width: "17%",
                zIndex: 1000,
                opacity: 1,
                animationDuration: bobbingConfig.mark.duration,
                animationDelay: bobbingConfig.mark.delay,
              }}
            />
            <img
              src={plane}
              alt=""
              className={`absolute ${isOpen ? "animate-bob" : ""}`}
              style={{
                top: "14%",
                right: "1%",
                width: "30%",
                zIndex: 1000,
                rotate: "10deg",
                opacity: 1,
                animationDuration: bobbingConfig.plane.duration,
                animationDelay: bobbingConfig.plane.delay,
              }}
            />
            <img
              src={madamcurie}
              alt=""
              className={`absolute ${isOpen ? "animate-bob" : ""}`}
              style={{
                top: "55%",
                left: "1%",
                width: "20%",
                zIndex: 1000,
                rotate: "0deg",
                opacity: 1,
                animationDuration: bobbingConfig.madamcurie.duration,
                animationDelay: bobbingConfig.madamcurie.delay,
              }}
            />
            <img
              src={musk}
              alt=""
              className={`absolute ${isOpen ? "animate-bob" : ""}`}
              style={{
                top: "75%",
                right: "12%",
                width: "18%",
                zIndex: 1000,
                opacity: 1,
                animationDuration: bobbingConfig.musk.duration,
                animationDelay: bobbingConfig.musk.delay,
              }}
            />
          </div>

          {/* Main Navigation Section */}
          <nav
            className="main-navigation-section flex-1 flex flex-col justify-center items-center text-center px-8 py-16"
            role="navigation"
            aria-label="Categories navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="navigation-menu space-y-4 w-full" role="list">
              {CATEGORIES.map((category) => (
                <li
                  key={category.id}
                  className="navigation-item w-full relative"
                  role="listitem"
                >
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`navigation-link block w-full bg-black text-[#FF6A00] font-extrabold uppercase text-6xl py-4 px-4 leading-tight focus:outline-none text-center transition-colors ${
                      currentCategory === category.id
                        ? "ring-4 ring-[#FF6A00]"
                        : ""
                    }`}
                    style={{ textDecoration: "none" }}
                    aria-describedby={`nav-item-${category.label}`}
                  >
                    {category.label}
                  </button>

                  {currentCategory === category.id && (
                    <button
                      onClick={handleReset}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF6A00] 
             text-[100px] font-extralight hover:text-[#f97517] transition-colors z-30"
                      aria-label="Reset to all categories"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer Section */}
          <footer className="navigation-footer pb-4 flex justify-center space-x-4 text-black text-sm">
            <Link to="/about" style={{ textDecoration: "none" }}>
              ABOUT
            </Link>

            <span>|</span>
            <Link to="/" style={{ textDecoration: "none" }}>
              HOME
            </Link>

            <span>|</span>
            <Link
              to="/got-a-tip"
              style={{ textDecoration: "none" }}
              onClick={() => setIsOpen(false)}
            >
              GOT A TIP?
            </Link>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Menu;
