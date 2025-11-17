/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Satoshi",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },

      colors: {
        glass: {
          bg: "#050816",
          card: "#0b1020",
          accent: "#38bdf8",
        },
      },

      // ✅ MUST GO UNDER "extend", not inside "colors"
      keyframes: {
        bob: {
          "0%": { transform: "translateY(0)" },
          "15%": { transform: "translateY(-12px)" }, // fast pop up
          "30%": { transform: "translateY(-12px)" }, // hold a bit
          "45%": { transform: "translateY(0)" }, // drop down quickly
          "100%": { transform: "translateY(0)" }, // rest
        },
      },
      animation: {
        bob: "bob 1.2s cubic-bezier(0.3, 0.7, 0.4, 1) infinite",
        bobSlow: "bob 5s ease-in-out infinite",
        bobFast: "bob .5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
