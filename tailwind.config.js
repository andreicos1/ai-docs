/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    backgroundColor: {
      primary: "#070e13",
      primaryLight: "#122330",
      secondary: "#32392D",
      secondaryDark: "#1A1B19",
      tertiary: "#1e374b",
      white: "#FFFFFF",
    },
    textColor: {
      primary: "#FFFFFF",
      secondary: "#B18FCF",
      dark: "#0D1821",
    },
    colors: {
      primary: "#B18FCF",
      tertiary: "#1e374b",
      white: "#FFFFFF",
    },
    extend: {
      fontSize: {
        small: "0.875rem", // 14px
        medium: "1rem", // 16px
        large: "1.125rem", // 18px
      },
      keyframes: {
        "pulse-custom": {
          "0%, 100%": {
            opacity: 1,
          },
          "50%": {
            opacity: 0,
          },
        },
      },
      animation: {
        "pulse-full": "pulse-custom 1.5s ease infinite",
      },
    },
  },
  variants: {},
  plugins: [],
};
