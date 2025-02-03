/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./dashboard/templates/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neon: "#00FFFF",
        darkbg: "#0a0f1c",
        darkcard: "#1a2238",
      },
    },
  },
  plugins: [],
};