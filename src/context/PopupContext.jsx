// src/context/PopupContext.js
import React, { createContext, useContext, useState } from "react";


const PopupContext = createContext();
export const usePopup = () => useContext(PopupContext);

export const PopupProvider = ({ children }) => {
  const [popup, setPopup] = useState({ visible: false, title: "", message: "", type: "" });

  const showPopup = (title, message, type = "info") => {
    setPopup({ visible: true, title, message, type });
  };

  const closePopup = () => {
    setPopup({ ...popup, visible: false });
  };

  const getStyles = () => {
    switch (popup.type) {
      case "success":
        return "bg-green-100 text-green-700";
      case "error":
        return "bg-red-100 text-red-700";
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      case "info":
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <PopupContext.Provider value={{ showPopup, closePopup }}>
      {children}
      {popup.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`w-full max-w-md mx-auto p-6 rounded-lg shadow-lg bg-white ${getStyles()}`}>
            <h2 className="text-xl font-bold mb-2">{popup.title}</h2>
            <p className="mb-4">{popup.message}</p>
            <button
              onClick={closePopup}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
};
