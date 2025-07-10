import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../api/constraints";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cEmail: email }),
      });

      if (response.ok) {
        const data = await response.json();
        const extractedOtp = data.data.match(/\d+/)?.[0];

        if (extractedOtp) {
          localStorage.setItem("reset_email", email);
          localStorage.setItem("reset_otp", extractedOtp);
        }

        setSuccessMessage(data.message || "OTP sent successfully");
        navigate("/verify");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel with Illustration */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-full md:w-1/2 flex items-center justify-center p-8">
          <img
            src="/images/login/forgot_pw.png"
            alt="Forgot Password"
            className="w-full max-w-sm"
          />
        </div>

        {/* Right Panel with Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">🔐 Forgot Password</h2>
          <p className="text-gray-500 text-sm mb-6">
            Enter your email and we’ll send you a one-time password (OTP) to reset it.
          </p>

          <label className="text-sm text-gray-600 mb-1">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-3 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          {successMessage && (
            <p className="text-green-600 text-xs mb-2">{successMessage}</p>
          )}

          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            &copy; 2025 Inklidox Technologies V 2.5
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
