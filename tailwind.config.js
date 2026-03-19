/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        secondary: '#a855f7',
        'dark-1': '#08080f',
        'dark-2': '#0d0d18',
        'dark-3': '#13131f',
        'purple-brand': '#7c3aed',
      },
    },
  },
  plugins: [],
}

