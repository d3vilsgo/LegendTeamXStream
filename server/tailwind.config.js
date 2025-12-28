/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./client/index.html", "./client/src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        borderColor: {
          border: "#dddddd",
        },
      },
    },
    plugins: [
      require("tailwindcss-animate"),
      require("@tailwindcss/typography")
    ],
  };
  