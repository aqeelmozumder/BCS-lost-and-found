/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brentwood-red": "#c8272c",
        "brentwood-black": "#000000",
        "brentwood-gray": "#666666",
        "brentwood-light-gray": "#f8f8f8",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
