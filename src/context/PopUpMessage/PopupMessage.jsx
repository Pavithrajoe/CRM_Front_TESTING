import React from 'react';

const PopupMessage = ({ 
  isVisible, 
  message, 
  onClose, 
  onSaveAnyway,
  position = 'center' 
}) => {
  if (!isVisible) return null;

  const popupStyle = {
    position: "fixed",
    top: position === 'center' ? "140%" : "85%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#f9f9f9ff",
    padding: "16px 24px",
    borderRadius: "10px",
    boxShadow: "3px 4px 10px rgba(0, 81, 255, 0.86)",
    zIndex: 10000,
    minWidth: "300px",
    textAlign: "center",
  };

  const buttonStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  // Check if this is a "already exists" message that needs action buttons
  const isAlreadyExists = message.includes("already exists");

  // Determine if message should be at top based on content
  const isTopPosition = 
    message.includes("Please enter either mobile number or email") ||
    message.includes("There is no leads found for") ||
    message.includes("Mobile number must contain only 6 to 15 digits") ||
    message.includes("Please enter a valid email address") ||
    message.includes("Lead details not found") ||
    message.includes("Failed to load lead details");

  const finalPopupStyle = {
    ...popupStyle,
    top: isTopPosition ? "85%" : "140%",
  };

  return (
    <div style={finalPopupStyle}>
      <span>{message}</span>
      {isAlreadyExists ? (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onClose}
            style={{
              ...buttonStyle,
              backgroundColor: "#8d8b8bff",
              borderRadius: "5px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSaveAnyway();
              onClose();
            }}
            style={{
              ...buttonStyle,
              backgroundColor: "#34b352ff",
              borderRadius: "10px",
            }}
          >
            Save Anyway
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PopupMessage;