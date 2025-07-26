export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#FFAB00",       
        vibrant: "#FF805A",      
        darkBg: "#18122B",       
        surface: "#22223B",      
        deepBlue: "#2A2346",     
        glowBlue: "#FF5E85",     
        textLight: "#FFF6E0",   
        borderSoft: "#4A4E69", 
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
          "0%, 100%": { boxShadow: "0 0 12px #FFAB00" },
          "50%": { boxShadow: "0 0 20px #FFAB00" },
        },
      },
      boxShadow: {
        glow: "0 0 25px rgba(0, 209, 255, 0.3)",
        softBlue: "0 0 20px rgba(0, 209, 255, 0.15)",
        card: "0 10px 40px rgba(0, 0, 0, 0.5)",
      },
      fontFamily: {
        custom: ['MyCustomFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
