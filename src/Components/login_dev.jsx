import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from '../api/constraints';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(prev => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!email.trim()) {
      setLoginError('Please enter your email!');
      setLoading(false);
      return;
    }

    if (!emailRegex.test(email) && !phoneRegex.test(email)) {
      setLoginError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setLoginError('Please enter your password.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setLoginError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.jwtToken) {
        localStorage.setItem('token', data.jwtToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('profileImage', data.user.cProfile_pic || '');
        navigate('/leads');
      } else {
        setLoginError(data.message || 'Login failed, please enter correct details');
      }

    } catch (error) {
      console.error("Login error:", error);
      setLoginError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const LoginFailedAlert = ({ message }) => (
    <div className="flex items-center gap-3 bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-md mt-5 animate-shake">
      <FaTimesCircle className="text-xl text-red-600" />
      <span className="font-semibold text-sm">{message}</span>
    </div>
  );

  return (
    <div className="h-screen w-full flex items-center justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row w-full max-w-[1200px] md:h-[630px] rounded-xl overflow-y-hidden">
        
        {/* Left Side Image */}
        <div className="relative w-full md:w-1/2 bg-[radial-gradient(circle,_#2563eb,_#164CA1,_#164CA1)] mt-6 md:mt-10 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
          <div className="absolute inset-0 bg-white/15 backdrop-blur-xl z-10 rounded-2xl"></div>
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
            <label className="block text-sm font-medium pt-4 pb-2 text-gray-700">E-mail address</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 grey-900 rounded-md focus:outline-none focus:ring-2 focus:ring-grey-600 mb-4"
              placeholder="Enter your email"
            />

            <label className="block text-sm font-medium pt-4 pb-2 text-gray-700">Password</label>
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
              <a href="#" className="text-sm text-black hover:underline">Forgot password?</a>
            </div>

            <div className="flex flex-col justify-center items-center">
              <button
                type="submit"
                disabled={loading}
                className={`w-[150px] flex justify-center items-center bg-black text-white py-2 font-semibold rounded-md hover:bg-gray-900 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  'Login'
                )}
              </button>

              {loginError && <LoginFailedAlert message={loginError} />}
            </div>
          </form>
        </div>
        
      </div>

      {/* Animations */}
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

          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            50% { transform: translateX(4px); }
            75% { transform: translateX(-4px); }
            100% { transform: translateX(0); }
          }

          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}
      </style>
      
<footer className="absolute bottom-4 w-full text-center text-sm text-gray-500">
  © {new Date().getFullYear()}<a href='https://www.inklidox.com'> Inklidox Technologies · V0.1 </a>(Beta)
</footer>
    </div>
  );
};

export default LoginPage;
