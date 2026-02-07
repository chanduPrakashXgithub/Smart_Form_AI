export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-slate-300': {
          '&::-webkit-scrollbar-thumb': {
            'background-color': 'rgb(203 213 225)',
            'border-radius': '0.5rem',
          },
        },
        '.scrollbar-track-transparent': {
          '&::-webkit-scrollbar-track': {
            'background-color': 'transparent',
          },
        },
        '&::-webkit-scrollbar': {
          'width': '8px',
          'height': '8px',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
