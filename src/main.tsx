import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const APP_RENDER_FIX_VERSION = "tablet-render-fix-2026-06-11";

async function clearOldAppCacheOnce() {
  if (!("localStorage" in window)) return;
  if (window.localStorage.getItem("app-render-fix-version") === APP_RENDER_FIX_VERSION) return;

  window.localStorage.setItem("app-render-fix-version", APP_RENDER_FIX_VERSION);

  if ("caches" in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.update()));
  }

  window.location.reload();
}

void clearOldAppCacheOnce();

createRoot(document.getElementById("root")!).render(<App />);
