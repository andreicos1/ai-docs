/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    backgroundColor: {
      primary: "#0D1821",
      secondary: "#32392D",
      tertiary: "#1e374b",
    },
    textColor: {
      primary: "#FFFFFF",
      secondary: "#B18FCF",
      dark: "#0D1821",
    },
    colors: {
      primary: "#B18FCF",
      tertiary: "#1e374b",
    },
    extend: {
      fontSize: {
        small: "0.875rem", // 14px
        medium: "1rem", // 16px
        large: "1.125rem", // 18px
      },
    },
  },
  variants: {},
  plugins: [],
};
