// src/components/ImageSecurityGuard.jsx
import React, { useState, useEffect } from "react";

const ImageSecurityGuard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [attemptedSrc, setAttemptedSrc] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    // 1. Intercept context menu (right click) on all images and media containers
    const handleContextMenu = (e) => {
      const target = e.target;
      const isImg = target.tagName === "IMG";
      const isProtected =
        target.closest("[data-protected-image='true']") ||
        target.closest(".property-image-container") ||
        target.closest("img");

      if (isImg || isProtected) {
        e.preventDefault();
        e.stopPropagation();

        const src = isImg ? target.src : "";
        setAttemptedSrc(src);
        setIsOpen(true);
        triggerToast("⚠️ Downloading home images is restricted for owner privacy.");
      }
    };

    // 2. Intercept drag start on images
    const handleDragStart = (e) => {
      if (e.target.tagName === "IMG" || e.target.closest("img")) {
        e.preventDefault();
        triggerToast("⚠️ Dragging photos to save is restricted on Namma Mane.");
      }
    };

    // 3. Intercept save shortcut keys (Ctrl+S / Cmd+S)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        // Prevent default browser "Save Page As"
        e.preventDefault();
        setIsOpen(true);
        triggerToast("🔒 Direct page/asset saving is restricted.");
      }
    };

    // Custom trigger event
    const handleCustomTrigger = (e) => {
      setAttemptedSrc(e.detail?.src || "");
      setIsOpen(true);
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("show-image-security-alert", handleCustomTrigger);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("show-image-security-alert", handleCustomTrigger);
    };
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  return (
    <>
      {/* Floating Instant Security Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#111c2c]/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl border border-red-500/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Security Dialogue Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-[0px_25px_60px_rgba(0,32,69,0.35)] border border-[#c4c6cf]/50 transform transition-all animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Security Gradient Banner */}
            <div className="bg-gradient-to-br from-[#002045] via-[#1a365d] to-[#ad3035] p-6 text-white text-center relative overflow-hidden">
              {/* Background ambient badge */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>

              {/* Security Shield Icon */}
              <div className="relative inline-flex items-center justify-center mb-3">
                <span className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <span className="material-symbols-outlined text-3xl text-[#fe6c6b]">
                    shield_lock
                  </span>
                </span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </div>

              <div className="inline-block bg-white/15 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-[#fe6c6b] mb-1.5 border border-white/20">
                🔒 Protected Property Media
              </div>

              <h2 className="font-headline text-xl md:text-2xl font-bold tracking-tight">
                Image Download Restricted
              </h2>
              <p className="text-xs text-white/80 max-w-sm mx-auto mt-1">
                Protected by Namma Mane Privacy &amp; Anti-Scam Shield
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Attempted Image Thumbnail with Diagonal Watermark */}
              {attemptedSrc && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gray-900 border border-gray-200 shadow-inner flex items-center justify-center">
                  <img
                    src={attemptedSrc}
                    alt="Protected Preview"
                    className="w-full h-full object-cover opacity-40 filter blur-[1px] pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-white text-xs font-black tracking-wider uppercase bg-red-600/80 px-2.5 py-1 rounded border border-red-400 shadow-md">
                      ⚠️ DO NOT COPY OR REDISTRIBUTE
                    </span>
                    <span className="text-[10px] text-gray-300 mt-1 font-medium">
                      🔒 Official Watermarked Listing &bull; Namma Mane Verified
                    </span>
                  </div>
                </div>
              )}

              {/* Security Policy Points */}
              <div className="bg-[#f0f3ff] rounded-2xl p-4 border border-[#adc7f7]/60 space-y-2.5 text-xs text-[#111c2c]">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-base text-[#002045] flex-shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <div>
                    <span className="font-bold text-[#002045] block">
                      Owner Privacy &amp; Asset Protection
                    </span>
                    <p className="text-[#43474e] text-[11px] leading-relaxed">
                      To prevent unauthorized broker reposting, photo scraping, and fraud on third-party portals, downloading raw property images is strictly restricted.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-base text-[#ad3035] flex-shrink-0 mt-0.5">
                    chat
                  </span>
                  <div>
                    <span className="font-bold text-[#002045] block">
                      Need More Photos or a Virtual Tour?
                    </span>
                    <p className="text-[#43474e] text-[11px] leading-relaxed">
                      Connect directly with the verified homeowner via our in-app chat to request additional photos or schedule a physical walkthrough.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 px-5 bg-[#002045] hover:bg-[#1a365d] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer text-center"
                >
                  I Understand
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    const el = document.getElementById("propertyListingsingsContainer") || document.querySelector("#vibeSearchDownside");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="py-3 px-5 bg-white border border-[#c4c6cf] hover:bg-[#f0f3ff] text-[#002045] rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer text-center"
                >
                  Browse Homes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageSecurityGuard;
