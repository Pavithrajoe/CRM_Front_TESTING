// IntroModal.js
import React from "react";

export const IntroModal = ({ onClose, masterTitle }) => {
  const getInstructions = () => {
    switch (masterTitle) {
      case "Label Master":
        return "Here you can customize the names of all services and forms.";
      case "Industry":
        return "Add or edit industry categories for your company.";
      case "Lead Source":
        return "Manage the sources from which you acquire leads.";
      default:
        return "Here you can manage your company's master data. Add, edit or delete items as needed.";
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-blue-800">
          {masterTitle} Management
        </h2>
        <div className="mb-6">
          <p className="text-gray-700 mb-4">{getInstructions()}</p>
          <p className="text-gray-700">
            {masterTitle === "Label Master"
              ? "Customize labels to match your company's terminology."
              : "Add new items or modify existing ones as your business evolves."}
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue to {masterTitle}
          </button>
        </div>
      </div>
    </div>
  );
};
