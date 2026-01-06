import React, { createContext, useContext, useState } from "react";
const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ message: "", type: "", visible: false });

  const showToast = (type, message) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ ...toast, visible: false }), 3000);
  };

  const getToastStyles = () => {
    const base = "fixed bottom-5 right-5 px-4 py-3 rounded-lg text-white shadow-lg transition-all duration-300 z-50";
    switch (toast.type) {
      case "success":
        return `${base} bg-green-600`;
      case "error":
        return `${base} bg-red-600`;
      case "info":
        return `${base} bg-blue-600`;
      case "warning":
        return `${base} bg-yellow-600 text-black`;
      default:
        return `${base} bg-gray-800`;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <div className={getToastStyles()}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
