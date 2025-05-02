import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(prev => !prev);

  const handleLogin = (e) => {
    e.preventDefault();

    // Basic validation
    if (!emailOrPhone.trim()) {
      alert('Please enter your email or phone number.');
      return;
    }

    if (!password.trim()) {
      alert('Please enter your password.');
      return;
    }

    // Proceed to dashboard if validation passes
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full mb-10 flex items-center justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row w-full max-w-[1200px] md:h-[600px] rounded-xl overflow-hidden">
        {/* Left Side Image */}
        <div className="relative w-full md:w-1/2 bg-[radial-gradient(circle,_#2563eb,_#164CA1,_#164CA1)] mb-6 md:mb-0 mt-6 md:mt-10 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md z-10 rounded-2xl"></div>
          <img
            src="/images/login/login.png"
            alt="Illustration"
            className="relative z-10 max-w-[250px] md:max-w-[350px] h-auto"
          />
        </div>

        {/* Right Side Login Form */}
        <div className="w-full md:w-1/2 md:mt-[84px] bg-white md:ms-10 p-6 md:p-10">
          <h2 className="text-xl font-medium text-center text-gray-900">
            <span className="animate-waving-hand inline-block">👋</span> Hey There!
          </h2>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign into your account</h1>

          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium pt-4 pb-2 text-gray-700">
              E-mail address / mobile number
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="w-full px-4 py-2 border-2 grey-900 rounded-md focus:outline-none focus:ring-2 focus:ring-grey-600 mb-4"
              placeholder="69545 32587"
            />

            <label className="block text-sm font-medium pt-4 pb-2 text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-grey-800 mb-2 pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-2/4 -translate-y-1/2 text-sm text-black focus:outline-none"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="text-right mb-4">
              <a href="#" className="text-sm text-black hover:underline">
                Forgot password?
              </a>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="w-[150px] flex items-center justify-center bg-black shadow-inner shadow-gray-50 text-white py-2 font-semibold rounded-md hover:bg-gray-900"
              >
                Login
              </button>
            </div>
          </form>

          <p className="text-sm mt-4 text-center">
            Don’t have an account to Login?{' '}
            <a href="#" className="text-blue-600 font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* Waving Hand Animation */}
      <style>
        {`
          @keyframes wave {
            0% { transform: rotate(0deg); }
            10% { transform: rotate(14deg); }
            20% { transform: rotate(-8deg); }
            30% { transform: rotate(14deg); }
            40% { transform: rotate(-4deg); }
            50% { transform: rotate(10deg); }
            60% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }

          .animate-waving-hand {
            animation: wave 2s infinite;
            transform-origin: 70% 70%;
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;
