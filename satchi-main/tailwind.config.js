export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#FFAB00",       // Main neon blue
        vibrant: "#FF805A",      // Lighter neon edge
        darkBg: "#18122B",       // True dark background
        surface: "#22223B",      // Dark surface for cards
        deepBlue: "#2A2346",     // Darker blue tint
        glowBlue: "#FF5E85",     // Subtle secondary neon
        textLight: "#FFF6E0",    // Light futuristic text
        borderSoft: "#4A4E69",   // Card / section border
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
      animation: {
        "gradient-x": "gradientX 12s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 12px #00D1FF" },
          "50%": { boxShadow: "0 0 20px #00D1FF" },
        },
      },
      boxShadow: {
        glow: "0 0 25px rgba(0, 209, 255, 0.3)",
        softBlue: "0 0 20px rgba(0, 209, 255, 0.15)",
        card: "0 10px 40px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        'hero-stars': "url('/images/bg-stars.svg')",
      },
      fontFamily: {
        custom: ['MyCustomFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
