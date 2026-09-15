// src/components/InstallAppBanner.jsx
import React, { useState } from "react";
import { usePwaInstall } from "../utils/usePwaInstall";

const InstallAppBanner = () => {
  const { canInstall, isStandalone, isIos, promptInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running standalone, or dismissed, or cannot install and not iOS, hide banner
  if (isStandalone || isDismissed || (!canInstall && !isIos)) {
    return null;
  }

  const handleInstall = () => {
    if (isIos) {
      setShowIosGuide(true);
    } else {
      promptInstall();
    }
  };

  return (
    <>
      {/* Floating Bottom App Installation Bar */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-[#002045]/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🏠
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              <span>Namma Mane App</span>
              <span className="text-[10px] bg-[#ad3035] text-white px-2 py-0.5 rounded-full font-semibold uppercase">
                Free
              </span>
            </h4>
            <p className="text-xs text-gray-300 line-clamp-1">
              Install app for faster browsing & instant alerts
            </p>
            <a
              href="https://github.com/Prashantha17/Home-Rental-Website/releases/latest/download/NammaMane.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-200 hover:text-white underline flex items-center gap-1 mt-0.5"
            >
              <span>Download Android APK</span>
              <span className="material-symbols-outlined text-[11px]">open_in_new</span>
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="bg-white text-[#002045] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm font-bold">download</span>
            Install
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            className="w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors text-base"
          >
            ✕
          </button>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-[#002045] shadow-2xl relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#002045] text-white flex items-center justify-center text-3xl mx-auto shadow-md mb-2">
                🏠
              </div>
              <h3 className="font-bold text-lg">Install Namma Mane on iPhone</h3>
              <p className="text-xs text-gray-500 mt-1">
                Install as a full-screen app in 2 quick steps:
              </p>
            </div>

            <div className="space-y-4 text-xs font-medium text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#002045] text-white flex items-center justify-center text-xs shrink-0 font-bold">
                  1
                </span>
                <p>
                  Tap the <strong className="text-[#002045]">Share button</strong> (square with arrow up ⎋) at the bottom of Safari.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#002045] text-white flex items-center justify-center text-xs shrink-0 font-bold">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-[#002045]">"Add to Home Screen" ➕</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-5 bg-[#002045] text-white font-bold py-3 rounded-xl hover:bg-[#1a365d] transition-colors text-xs"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppBanner;
