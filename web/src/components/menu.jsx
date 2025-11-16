import React, { useState, useEffect } from "react";

const menuItems = [
  { label: "WORLD", href: "" },
  { label: "POLITICS", href: "" },
  { label: "TECH", href: "" },
  { label: "SCIENCE", href: "" },
  { label: "BUSINESS", href: "" },
];

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
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
            isOpen ? "-rotate-45 -translate-y-[5px]" : ""
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
          Main Navigation Menu
        </h2>

        <div className="navigation-container flex flex-col h-full">
          {/* Main Navigation Section */}
          <nav
            className="main-navigation-section flex-1 flex flex-col justify-center items-center text-center px-8 py-16"
            role="navigation"
            aria-label="Main navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="navigation-menu space-y-4 w-full" role="list">
              {menuItems.map((item, index) => (
                <li
                  key={item.label}
                  className="navigation-item w-full"
                  role="listitem"
                >
                  <a
                    href={item.href}
                    className="navigation-link block w-full bg-black text-[#FF6A00] font-extrabold uppercase text-6xl py-4 px-4 leading-tight focus:outline-none text-center"
                    style={{ textDecoration: "none" }}
                    onClick={toggleMenu}
                    aria-describedby={`nav-item-${item.label}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer Section */}
          <footer className="navigation-footer pb-4 flex justify-center space-x-4 text-black text-sm">
            <a href="#" style={{ textDecoration: "none" }}>
              ABOUT
            </a>
            <span>|</span>
            <a href="#" style={{ textDecoration: "none" }}>
              LEGAL
            </a>
            <span>|</span>
            <a href="#" style={{ textDecoration: "none" }}>
              JOBS
            </a>
            <span>|</span>
            <a href="#" style={{ textDecoration: "none" }}>
              GOT A TIP?
            </a>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Menu;
