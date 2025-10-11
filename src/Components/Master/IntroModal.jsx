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

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop (not the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContinueClick = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4" 
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-800">
          {masterTitle} Management
        </h2>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-6 text-center">
            <p className="text-gray-700 mb-4 text-lg">
              {getInstructions()}
            </p>
            <p className="text-gray-600">
              {masterTitle === "Label Master"
                ? "Customize labels to match your company's terminology."
                : "Add new items or modify existing ones as your business evolves."}
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleContinueClick}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium"
            >
              Continue to {masterTitle}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};