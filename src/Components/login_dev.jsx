import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaTimesCircle } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { ENDPOINTS } from '../api/constraints';
import Sidebar from './common/sidebar';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [data, setData] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTopCard, setShowTopCard] = useState(false);
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  useEffect(() => {
  const handleResize = () => {
    setShowTopCard(window.innerWidth <= 767);
  };

  handleResize(); 

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

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
      // console.log("testing log", data)

      setData(data)

      if (response.ok && data.jwtToken) {
        localStorage.setItem('loginResponse', JSON.stringify(data));
        localStorage.setItem('token', data.jwtToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('profileImage', data.user.cProfile_pic || '');
        // setCount(prevCount => prevCount + 1);
        window.dispatchEvent(new Event("token-set"));
        navigate('/leaddashboard');
        //  console.log("Login rerender count ",count);

      } else {
        setLoginError(data.message || 'Login failed, please enter correct details');
      }
    } catch (error) {
      setLoginError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };
      //  console.log("Login rerender count ",count);
                         
  const LoginFailedAlert = ({ message }) => (
    <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-xl mt-4 shadow-sm animate-shake">
      <FaTimesCircle className="text-lg" />
      <span className="text-sm">{message}</span>
    </div>
  );

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] px-4 relative">
      {/* Top Card - Shown Initially */}
      {showTopCard && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-white border border-blue-300 text-blue-800 px-5 py-4 rounded-xl shadow-md text-sm font-medium z-50">
          <p className="mb-2"> Login from your desktop or laptop for a better experience.</p>
          
        </div>
      )}

      <div className={`w-full max-w-[1100px] bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${showTopCard ? 'blur-sm pointer-events-none select-none' : ''}`}>
        {/* Left Image */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 flex justify-center items-center p-6">
          <img
            src="/images/login/login.svg"
            alt="Illustration"
            className="w-[250px] md:w-[300px] z-10"
          />
        </div>

        {/* Right Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-center text-gray-900">
              <span className="animate-waving-hand inline-block">👋</span> Hey There!
            </h2>
            <div className="text-lg text-gray-500 font-medium">Sign into your account</div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Email </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="example@domain.com"
              />
            </div>

            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute top-2/4 right-3 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgetpassword" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="flex flex-col items-center">
              <button
                type="submit"
                disabled={loading}
                className={`w-36 bg-blue-600 text-white py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-md hover:bg-blue-700 ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  'Login'
                )}
              </button>

              <button
                type="button"
                onClick={() => window.open('/request-demo', '_blank')}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Request a Demo
              </button>

              {loginError && <LoginFailedAlert message={loginError} />}
            </div>
          </form>
        </div>
      </div>

      {/* Animations */}
      <style>{`
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

        @keyframes wave {
          0% { transform: rotate(0.0deg); }
          10% { transform: rotate(14.0deg); }
          20% { transform: rotate(-8.0deg); }
          30% { transform: rotate(14.0deg); }
          40% { transform: rotate(-4.0deg); }
          50% { transform: rotate(10.0deg); }
          60% { transform: rotate(0.0deg); }
          100% { transform: rotate(0.0deg); }
        }

        .animate-waving-hand {
          display: inline-block;
          transform-origin: 70% 70%;
          animation: wave 2s infinite;
        }
      `}</style>

      <footer className="absolute bottom-4 text-center w-full text-gray-400 text-sm">
        © {new Date().getFullYear()} <a href="https://www.inklidox.com" className="hover:underline">Inklidox Technologies</a> · Version 3.1
      </footer>
    </div>
<div style={{ display: 'none', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
  <Sidebar data={data} />
</div>
    </>
  );
};

export default LoginPage;
