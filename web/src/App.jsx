import { useState } from "react";
import vector from "./images/vector.png";
import Menu from "./components/menu";

function App() {
  const [activeTab, setActiveTab] = useState("recent");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Column - Sticky */}
      <aside className="sticky top-0 h-screen w-24 bg-[#99FF00] flex items-center justify-center">
        <div className="flex flex-col items-center justify-between h-full py-4 space-y-2 text-black font-bold">
          <span className="text-5xl lg:text-6xl xl:text-6xl">G</span>
          <span className="text-5xl lg:text-6xl xl:text-6xl">L</span>
          <img
            src={vector}
            alt="vector"
            className="h-10 lg:h-12 xl:h-14 w-auto"
          />
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
      <main className="flex-1 bg-black">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-40 bg-black px-8 py-6 flex items-center justify-between">
          {/* Popular / Recent Tabs */}
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("popular")}
              className={`text-2xl font-semibold transition-colors ${
                activeTab === "popular"
                  ? "text-[#FF6B35]"
                  : "text-white hover:text-gray-300"
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`text-2xl font-semibold transition-colors ${
                activeTab === "recent"
                  ? "text-[#FF6B35]"
                  : "text-white hover:text-gray-300"
              }`}
            >
              Recent
            </button>
          </div>

          {/* Menu Component */}
          <Menu />
        </nav>

        {/* Content Area */}
        <div className="p-8">
          <p className="text-white text-center mt-20">
            Content goes here - Active tab: {activeTab}
          </p>

          {/* Add some height to test sticky behavior */}
          <div className="h-[200vh]"></div>
        </div>
      </main>
    </div>
  );
}

export default App;
