import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./styles/global.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

window.addEventListener("DOMContentLoaded", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    preloader.style.transition = "opacity 0.4s ease";
    setTimeout(() => preloader.remove(), 400);
  }
});
