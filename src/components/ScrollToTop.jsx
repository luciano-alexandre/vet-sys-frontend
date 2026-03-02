// ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();

  useEffect(() => {
    // espera o DOM renderizar após a navegação
    requestAnimationFrame(() => {
      const el = document.querySelector("main.content"); // seu container de scroll
      if (el && (el.scrollHeight > el.clientHeight || el.scrollTop > 0)) {
        el.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    });
  }, [pathname, search, hash, key]);

  return null;
}