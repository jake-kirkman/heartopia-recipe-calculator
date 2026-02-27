/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        peach: '#FFE5D9',
        coral: '#FF9B85',
        sage: '#A8C686',
        mint: '#B8E0D2',
        sky: '#95C8D8',
        bark: '#5D4E37',
        wood: '#8B7355',
      },
      fontFamily: {
        display: ['"Nunito"', 'sans-serif'],
        body: ['"Nunito"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
