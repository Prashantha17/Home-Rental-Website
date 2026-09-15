// src/utils/usePwaInstall.js
import { useState, useEffect } from "react";

let globalDeferredPrompt = null;
const listeners = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    listeners.forEach((listener) => listener(true));
  });

  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    listeners.forEach((listener) => listener(false));
  });
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(Boolean(globalDeferredPrompt));
  const isIos = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = typeof window !== "undefined" && (
    (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
    Boolean(window.navigator?.standalone)
  );

  useEffect(() => {
    const handler = (state) => setCanInstall(state);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const promptInstall = async () => {
    if (isIos) {
      alert("To install Namma Mane on iPhone / iPad:\n1. Tap the Share button (⎋) at the bottom of Safari.\n2. Tap 'Add to Home Screen' (➕).");
      return;
    }

    if (!globalDeferredPrompt) {
      alert("To install Namma Mane, tap your browser's menu (⋮) and select 'Install app' or 'Add to Home screen'.");
      return;
    }

    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    if (outcome === "accepted") {
      globalDeferredPrompt = null;
      setCanInstall(false);
    }
  };

  return {
    canInstall: canInstall && !isStandalone,
    isStandalone,
    isIos,
    promptInstall
  };
}
