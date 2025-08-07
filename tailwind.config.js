/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'blink-glow': 'blinkGlow 1.5s infinite',
      },
      keyframes: {
        blinkGlow: {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6',
          },
          '50%': {
            opacity: 0.7,
            boxShadow: '0 0 15px #2563eb, 0 0 30px #2563eb',
          },
        },
      },
    },
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        '.transform-style-preserve-3d': {
          'transform-style': 'preserve-3d',
        },
      });
    },
  ],
};
