/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        loto: {
          primary: "#9333ea", // Lotofácil purple
          dark: "#0b0f19",
          card: "#121827",
          border: "#1f293d",
          accent: "#10b981",
          gold: "#f59e0b",
        }
      }
    },
  },
  plugins: [],
};
