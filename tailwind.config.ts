import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f3ff",
          100: "#ebe9ff",
          200: "#d5d2ff",
          300: "#b3a9ff",
          400: "#8b74ff",
          500: "#6743ff",
          600: "#4b25e7",
          700: "#3a1bbb",
          800: "#311999",
          900: "#291678"
        }
      }
    }
  },
  plugins: []
};

export default config;
