import { useEffect, useState } from "react";
import { ToastContext } from "./ToastContext";

function Toast({ message, type = "success", onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      return;
    }

    const resetTimer = setTimeout(() => {
      setVisible(false);
    }, 0);
    
    const showTimer = setTimeout(() => {
      setVisible(true);
    }, 10);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 3010);

    const closeTimer = setTimeout(() => {
      onClose();
    }, 3310);

    return () => {
      clearTimeout(resetTimer);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transform rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
        type === "error" ? "bg-red-600" : "bg-green-600"
      } ${
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-[120%] opacity-0"
      }`}
    >
      {message}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({
      id: Date.now(),
      message,
      type,
    });
  };

  const handleToastClose = () => {
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={handleToastClose}
        />
      )}
    </ToastContext.Provider>
  );
}