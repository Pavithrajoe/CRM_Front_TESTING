// src/components/LoginPage.jsx
import React from 'react';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex w-full max-w-5xl shadow-lg rounded-lg overflow-hidden">
        {/* Left Side Image */}
        <div className="w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-8">
          <img
            src="/your-image-path.png" // Replace with actual image path
            alt="Illustration"
            className="max-w-full h-auto"
          />
        </div>

        {/* Right Side Login Form */}
        <div className="w-1/2 bg-white p-10">
          <h2 className="text-lg font-medium text-gray-600">Hey There!</h2>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Sign into your account</h1>

          <form>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail address / mobile number</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              placeholder="69545 32587"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
              placeholder="Enter your password"
            />

            <div className="text-right mb-4">
              <a href="#" className="text-sm text-blue-500 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900"
            >
              Login
            </button>
          </form>

          <p className="text-sm mt-4 text-center">
            Don’t have an account to Login?{' '}
            <a href="#" className="text-blue-600 font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
