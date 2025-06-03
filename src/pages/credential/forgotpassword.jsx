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
  // console.log("Response data:", data);

  const otpText = data.data; 
  const extractedOtp = otpText.match(/\d+/)?.[0]; 

  if (extractedOtp) {
    localStorage.setItem("reset_email", email);
    localStorage.setItem("reset_otp", extractedOtp);
    // console.log("Email stored:", email);
    // console.log("OTP stored:", extractedOtp);
  }

  setSuccessMessage(data.message || "OTP sent successfully");
  setLoading(false);
  navigate("/verify");
}

      } catch (err) {
        setError("Network error. Please try again.");
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
            src="/images/login/forgot_pw.png"
            alt="Forgot Password Illustration"
            className="h-[180px] sm:h-[220px] md:h-[260px] lg:h-[300px] object-contain"
          />
        </div>

        {/* Right Form Section */}
        <div className="flex flex-col justify-center items-center px-4 sm:px-6 md:px-10 py-6 w-full text-black">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-center">
            Forgot Password?
          </h2>
          <label
            htmlFor="emailOrPhone"
            className="text-sm sm:text-base mb-2 text-center md:text-left w-full max-w-md"
          >
            E-mail address
          </label>
          <input
            type="text"
            id="emailOrPhone"
            placeholder="Enter your e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-md px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
          />
          {error && (
            <p className="text-red-500 text-xs mb-2 max-w-md w-full text-left">{error}</p>
          )}
          {successMessage && (
            <p className="text-green-600 text-xs mb-2 max-w-md w-full text-left">{successMessage}</p>
          )}
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="w-auto bg-black text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-800 transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;