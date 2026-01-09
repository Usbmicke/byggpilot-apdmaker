/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Night Theme
        'dark-bg': '#0B0F15', // Main background (Deepest)
        'card-bg': '#151922', // Surface background (Slightly lighter)
        'card-border': 'rgba(255, 255, 255, 0.08)',
        'text-main': '#F8FAFC', // White-ish
        'text-muted': '#94A3B8', // Cool Grey
        // Brand Gradient Colors (Platinum/Steel Luxury)
        'brand-start': '#52525b', // Zinc 600
        'brand-end': '#a1a1aa',   // Zinc 400
        'brand-glow': 'rgba(255, 255, 255, 0.25)', // White Glow
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #52525b 0%, #a1a1aa 100%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(21, 25, 34, 0.7) 0%, rgba(21, 25, 34, 0.4) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon': '0 0 10px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 0.05)',
      },
      fill: theme => ({
        ...theme('colors')
      }),
      stroke: theme => ({
        ...theme('colors')
      })
    },
  },
  plugins: [],
}
