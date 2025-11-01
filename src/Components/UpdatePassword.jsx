import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../api/constraints";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    const email = localStorage.getItem("reset_email");

    if (!email) {
      setError("Email not found. Please restart the reset process.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.UPDATE_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.Message || "Password updated successfully");
        localStorage.removeItem("reset_email"); // clear email from storage
        navigate("/success");
      } else {
        setError(data.Message || "Failed to update password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4 bg-white">
      <div className="flex flex-col sm:flex-col md:flex-row rounded-[35px] overflow-hidden w-full max-w-[90%] sm:max-w-[600px] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-white">
        {/* Left Image Section */}
        <div className="w-full sm:w-full md:w-2/3 lg:w-3/5 h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] flex justify-center items-center p-4 rounded-[35px] bg-[radial-gradient(circle,#2563eb,#164CA1,_#164CA1)]">
          <img
            src="/images/login/forgot_pw.svg"
            alt="Password Update Illustration"
            className="h-[180px] sm:h-[220px] md:h-[260px] lg:h-[300px] object-contain"
          />
        </div>

        {/* Right Form Section */}
        <div className="flex flex-col justify-center items-center px-4 sm:px-6 md:px-10 py-6 w-full text-black">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-center">
            Update Password
          </h2>

          <label htmlFor="newPassword" className="text-sm sm:text-base mb-2 text-center md:text-left w-full max-w-md">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-md px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
          />

          <label htmlFor="confirmPassword" className="text-sm sm:text-base mb-2 text-center md:text-left w-full max-w-md">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-md px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
          />

          {error && (
            <p className="text-red-500 text-xs mb-2 max-w-md w-full text-left">{error}</p>
          )}

          <button
            onClick={handleUpdatePassword}
            className="w-auto bg-black text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-800 transition text-sm sm:text-base disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;