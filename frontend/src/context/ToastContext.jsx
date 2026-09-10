// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, "success", duration),
    error: (msg, duration) => addToast(msg, "error", duration),
    info: (msg, duration) => addToast(msg, "info", duration),
    warning: (msg, duration) => addToast(msg, "warning", duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const typeStyles = {
            success: "bg-[#002045] text-white border-l-4 border-[#22c55e] shadow-xl",
            error: "bg-[#ad3035] text-white border-l-4 border-white shadow-xl",
            warning: "bg-[#f59e0b] text-white border-l-4 border-white shadow-xl",
            info: "bg-[#002045] text-white border-l-4 border-[#adc7f7] shadow-xl",
          };

          const icons = {
            success: "check_circle",
            error: "error",
            warning: "warning",
            info: "info",
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 backdrop-blur-md ${
                typeStyles[t.type] || typeStyles.info
              }`}
            >
              <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5">
                {icons[t.type] || "info"}
              </span>
              <div className="flex-grow text-sm font-medium leading-snug">
                {t.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
                aria-label="Dismiss notification"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
