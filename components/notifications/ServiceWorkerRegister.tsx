"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on every page load.
 * This is what makes the site installable as a PWA on Android/Chrome —
 * without an active SW (with a fetch handler) Chrome only offers a
 * plain "add shortcut" instead of "Install app".
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Fire-and-forget: register the SW. We scope it to "/" so it controls
    // the whole app, not just the directory /sw.js lives in.
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("[sw] register failed", err);
    });
  }, []);

  return null;
}
