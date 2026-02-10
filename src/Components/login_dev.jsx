import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaTimesCircle } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { ENDPOINTS } from '../api/constraints';
import { GoogleLogin } from "@react-oauth/google";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTopCard, setShowTopCard] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(() => {
    const saved = localStorage.getItem("loginLock");
    if (!saved) return 0;
    const { expiresAt } = JSON.parse(saved);
    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  });

  // Track failed attempts (client‑side only)
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const saved = localStorage.getItem("loginAttempts");
    if (!saved) return 0;
    const { count, timestamp } = JSON.parse(saved);
    const now = Date.now();
    // Reset attempts if older than 5 minutes
    if (now - timestamp > 5 * 60 * 1000) {
      localStorage.removeItem("loginAttempts");
      return 0;
    }
    return count;
  });

  const navigate = useNavigate();

  // Save lock + expiry whenever countdown changes
  useEffect(() => {
    if (isLocked && countdown > 0) {
      const expiresAt = Date.now() + countdown * 1000;
      localStorage.setItem("loginLock", JSON.stringify({ expiresAt }));
    } else {
      localStorage.removeItem("loginLock");
    }
  }, [isLocked, countdown]);

  // Restore lock + attempts from localStorage on mount
  useEffect(() => {
    const savedLock = localStorage.getItem("loginLock");
    if (savedLock) {
      const { expiresAt } = JSON.parse(savedLock);
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
      if (remaining > 0) {
        setIsLocked(true);
        setCountdown(remaining);
      } else {
        localStorage.removeItem("loginLock");
      }
    }

    const savedAttempts = localStorage.getItem("loginAttempts");
    if (savedAttempts) {
      const { count, timestamp } = JSON.parse(savedAttempts);
      const now = Date.now();
      if (now - timestamp > 5 * 60 * 1000) {
        localStorage.removeItem("loginAttempts");
        setLoginAttempts(0);
      } else {
        setLoginAttempts(count);
        if (count >= 5 && !isLocked) {
          setIsLocked(true);
          const elapsed = Math.floor((now - timestamp) / 1000);
          const remaining = Math.max(60 - elapsed, 1);
          setCountdown(remaining);
        }
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isLocked || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, countdown]);

  useEffect(() => {
    const handleResize = () => setShowTopCard(false);
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

      if (response.ok && data.jwtToken) {
        // Reset attempts on success
        localStorage.removeItem("loginAttempts");
        setLoginAttempts(0);

        localStorage.clear();
        localStorage.setItem('loginResponse', JSON.stringify(data));
        localStorage.setItem('token', data.jwtToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('user_attributes', JSON.stringify(data.user_attributes));
        localStorage.setItem('profileImage', data.user.cProfile_pic || '');
        window.dispatchEvent(new Event("token-set"));
        window.location.href = '/leaddashboard';
      } else if (response.status === 429) {
        const seconds = parseInt(data.message?.match(/\d+/)?.[0] || 60);

        setIsLocked(true);
        setCountdown(seconds);
        setLoginError(data.message);
      } else if (response.status === 403 || data.error === "FREE_TRIAL_EXPIRED") {
        setShowTrialModal(true);
      } else {
        // Wrong email/password: increment attempt count
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem(
          "loginAttempts",
          JSON.stringify({ count: newAttempts, timestamp: Date.now() })
        );

        if (newAttempts >= 5) {
          // Lock for 1 minute (60 seconds)
          setIsLocked(true);
          setCountdown(60);
          setLoginError("Too many failed attempts. Try again in 1 minute.");
        } else {
          setLoginError(data.message || data.error || 'Login failed, please enter correct details');
        }
      }
    } catch (error) {
      setLoginError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };
const handleGoogleLogin = async (credentialResponse) => {
  try {
    setLoading(true);
    setLoginError("");

    if (!credentialResponse?.credential) {
      throw new Error("Google authentication failed");
    }

    const response = await fetch(ENDPOINTS.GOOGLE_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: credentialResponse.credential
      })
    });

 
    const text = await response.text();
    console.log("Raw server response:", text);
    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }
    }

   
    if (!response.ok) {
      if (response.status === 403) {
        setShowTrialModal(true);
        return;
      }
      throw new Error(data.message || "Google login failed");
    }

 
    localStorage.clear();
    localStorage.setItem("loginResponse", JSON.stringify(data));
    localStorage.setItem("token", data.jwtToken); 
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem(
      "user_attributes",
      JSON.stringify(data.user_attributes || [])
    );

    window.dispatchEvent(new Event("token-set"));
    window.location.href = "/leaddashboard";

  } catch (err) {
    console.error("Google Login Frontend Error:", err);
    setLoginError(err.message);
  } finally {
    setLoading(false);
  }
};


  const LoginFailedAlert = ({ message }) => (
    <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-xl mt-4 shadow-sm animate-shake">
      <FaTimesCircle className="text-lg" />
      <span className="text-sm">{message}</span>
    </div>
  );

  const TrialExpiredModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-6 w-11/12 max-w-md shadow-lg text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Trial Expired</h2>
        <p className="text-gray-600 mb-6">
          Your 1-month free CRM access has ended. Please contact <strong>Inklidox Technologies</strong>.
        </p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] px-4 relative">
        {showTopCard && (
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-white border border-blue-300 text-blue-800 px-5 py-4 rounded-xl shadow-md text-sm font-medium z-50">
            <p className="mb-2">Login from your desktop or laptop for a better experience.</p>
          </div>
        )}

        <div className={`w-full max-w-[1100px] bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${showTopCard ? 'blur-sm pointer-events-none select-none' : ''}`}>
          {/* Left Image */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 flex justify-center items-center p-6">
            <img src="/images/login/login.svg" alt="Illustration" className="w-[250px] md:w-[300px] z-10" />
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
                <label className="text-gray-600 text-sm font-medium block mb-1">Email</label>
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
                <button type="submit" disabled={loading || isLocked}
                  className={`w-36 bg-blue-600 text-white py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-md
                    ${(loading || isLocked) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : isLocked ? (
                    countdown > 0 ? `Try again in ${countdown}s` : "Locked (wait…)"
                  ) : 'Login'}
                </button>
                <div className="mt-6 flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => setLoginError("Google login failed")}
                    useOneTap
                  />
                </div>

                <div className="mt-4">
                  <button type="button" onClick={() => window.open('/CreateAnAccount', '_blank')} className="text-sm text-blue-600 hover:underline" >
                    Create an Account
                  </button>
                  <span className="mx-2 text-gray-600">||</span>
                  <button type="button" onClick={() => window.open('/request-demo', '_blank')} className="text-sm text-blue-600 hover:underline" >
                    Request a Demo
                  </button>
                </div>

                {loginError && <LoginFailedAlert message={loginError} />}
              </div>
            </form>
          </div>
        </div>

        {/* Show Trial Expired Modal */}
        {showTrialModal && <TrialExpiredModal onClose={() => setShowTrialModal(false)} />}

        <footer className="absolute bottom-4 text-center w-full text-gray-400 text-sm">
          © {new Date().getFullYear()}{' '}
          <a href="https://www.inklidox.com" className="hover:underline">
            Inklidox Technologies
          </a>{' '}
          · Version 4.1
        </footer>
      </div>

      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }

        .animate-shake { animation: shake 0.4s ease-in-out; }

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
    </>
  );
};

export default LoginPage;


// import React, { useState, useEffect } from 'react';
// import { FaEye, FaEyeSlash, FaTimesCircle } from 'react-icons/fa';
// import { useNavigate, Link } from 'react-router-dom';
// import { ENDPOINTS } from '../api/constraints';

// const LoginPage = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loginError, setLoginError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showTopCard, setShowTopCard] = useState(false);
//   const [showTrialModal, setShowTrialModal] = useState(false);
//   const [isLocked, setIsLocked] = useState(false);
//   const [countdown, setCountdown] = useState(() => {
//     const saved = localStorage.getItem("loginLock");
//     if (!saved) return 0;
//     const { expiresAt } = JSON.parse(saved);
//     const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
//     return remaining > 0 ? remaining : 0;
//   });

//   // Track failed attempts (client‑side only)
//   const [loginAttempts, setLoginAttempts] = useState(() => {
//     const saved = localStorage.getItem("loginAttempts");
//     if (!saved) return 0;
//     const { count, timestamp } = JSON.parse(saved);
//     const now = Date.now();
//     // Reset attempts if older than 5 minutes
//     if (now - timestamp > 5 * 60 * 1000) {
//       localStorage.removeItem("loginAttempts");
//       return 0;
//     }
//     return count;
//   });

//   const navigate = useNavigate();

//   // Save lock + expiry whenever countdown changes
//   useEffect(() => {
//     if (isLocked && countdown > 0) {
//       const expiresAt = Date.now() + countdown * 1000;
//       localStorage.setItem("loginLock", JSON.stringify({ expiresAt }));
//     } else {
//       localStorage.removeItem("loginLock");
//     }
//   }, [isLocked, countdown]);

//   // Restore lock + attempts from localStorage on mount
//   useEffect(() => {
//     const savedLock = localStorage.getItem("loginLock");
//     if (savedLock) {
//       const { expiresAt } = JSON.parse(savedLock);
//       const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
//       if (remaining > 0) {
//         setIsLocked(true);
//         setCountdown(remaining);
//       } else {
//         localStorage.removeItem("loginLock");
//       }
//     }

//     const savedAttempts = localStorage.getItem("loginAttempts");
//     if (savedAttempts) {
//       const { count, timestamp } = JSON.parse(savedAttempts);
//       const now = Date.now();
//       if (now - timestamp > 5 * 60 * 1000) {
//         localStorage.removeItem("loginAttempts");
//         setLoginAttempts(0);
//       } else {
//         setLoginAttempts(count);
//         if (count >= 5 && !isLocked) {
//           setIsLocked(true);
//           const elapsed = Math.floor((now - timestamp) / 1000);
//           const remaining = Math.max(60 - elapsed, 1);
//           setCountdown(remaining);
//         }
//       }
//     }
//   }, []);

//   // Countdown timer
//   useEffect(() => {
//     if (!isLocked || countdown <= 0) return;

//     const timer = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           setIsLocked(false);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [isLocked, countdown]);

//   useEffect(() => {
//     const handleResize = () => setShowTopCard(false);
//     handleResize();
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const togglePassword = () => setShowPassword(prev => !prev);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoginError('');
//     setLoading(true);

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const phoneRegex = /^[0-9]{10}$/;

//     if (!email.trim()) {
//       setLoginError('Please enter your email!');
//       setLoading(false);
//       return;
//     }
//     if (!emailRegex.test(email) && !phoneRegex.test(email)) {
//       setLoginError('Please enter a valid email address');
//       setLoading(false);
//       return;
//     }
//     if (!password.trim()) {
//       setLoginError('Please enter your password.');
//       setLoading(false);
//       return;
//     }
//     if (password.length < 6) {
//       setLoginError('Password must be at least 6 characters long.');
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch(ENDPOINTS.LOGIN, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password })
//       });

//       const data = await response.json();

//       if (response.ok && data.jwtToken) {
//         // Reset attempts on success
//         localStorage.removeItem("loginAttempts");
//         setLoginAttempts(0);

//         localStorage.clear();
//         localStorage.setItem('loginResponse', JSON.stringify(data));
//         localStorage.setItem('token', data.jwtToken);
//         localStorage.setItem('user', JSON.stringify(data.user));
//         localStorage.setItem('user_attributes', JSON.stringify(data.user_attributes));
//         localStorage.setItem('profileImage', data.user.cProfile_pic || '');
//         window.dispatchEvent(new Event("token-set"));
//         window.location.href = '/leaddashboard';
//       } else if (response.status === 429) {
//         const seconds = parseInt(data.message?.match(/\d+/)?.[0] || 60);

//         setIsLocked(true);
//         setCountdown(seconds);
//         setLoginError(data.message);
//       } else if (response.status === 403 || data.error === "FREE_TRIAL_EXPIRED") {
//         setShowTrialModal(true);
//       } else {
//         // Wrong email/password: increment attempt count
//         const newAttempts = loginAttempts + 1;
//         setLoginAttempts(newAttempts);
//         localStorage.setItem(
//           "loginAttempts",
//           JSON.stringify({ count: newAttempts, timestamp: Date.now() })
//         );

//         if (newAttempts >= 5) {
//           // Lock for 1 minute (60 seconds)
//           setIsLocked(true);
//           setCountdown(60);
//           setLoginError("Too many failed attempts. Try again in 1 minute.");
//         } else {
//           setLoginError(data.message || data.error || 'Login failed, please enter correct details');
//         }
//       }
//     } catch (error) {
//       setLoginError('Something went wrong. Please try again.');
//     }

//     setLoading(false);
//   };

//   const LoginFailedAlert = ({ message }) => (
//     <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-xl mt-4 shadow-sm animate-shake">
//       <FaTimesCircle className="text-lg" />
//       <span className="text-sm">{message}</span>
//     </div>
//   );

//   const TrialExpiredModal = ({ onClose }) => (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
//       <div className="bg-white rounded-xl p-6 w-11/12 max-w-md shadow-lg text-center">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">Trial Expired</h2>
//         <p className="text-gray-600 mb-6">
//           Your 1-month free CRM access has ended. Please contact <strong>Inklidox Technologies</strong>.
//         </p>
//         <button
//           onClick={onClose}
//           className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
//         >
//           OK
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <>
//       <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] px-4 relative">
//         {showTopCard && (
//           <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-white border border-blue-300 text-blue-800 px-5 py-4 rounded-xl shadow-md text-sm font-medium z-50">
//             <p className="mb-2">Login from your desktop or laptop for a better experience.</p>
//           </div>
//         )}

//         <div className={`w-full max-w-[1100px] bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${showTopCard ? 'blur-sm pointer-events-none select-none' : ''}`}>
//           {/* Left Image */}
//           <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 flex justify-center items-center p-6">
//             <img src="/images/login/login.svg" alt="Illustration" className="w-[250px] md:w-[300px] z-10" />
//           </div>

//           {/* Right Form */}
//           <div className="w-full md:w-1/2 p-8 md:p-12 bg-white">
//             <div className="text-center mb-6">
//               <h2 className="text-xl font-medium text-center text-gray-900">
//                 <span className="animate-waving-hand inline-block">👋</span> Hey There!
//               </h2>
//               <div className="text-lg text-gray-500 font-medium">Sign into your account</div>
//             </div>

//             <form onSubmit={handleLogin} className="space-y-6">
//               <div>
//                 <label className="text-gray-600 text-sm font-medium block mb-1">Email</label>
//                 <input
//                   type="text"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   placeholder="example@domain.com"
//                 />
//               </div>

//               <div>
//                 <label className="text-gray-600 text-sm font-medium block mb-1">Password</label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
//                     placeholder="••••••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={togglePassword}
//                     className="absolute top-2/4 right-3 -translate-y-1/2 text-gray-500"
//                   >
//                     {showPassword ? <FaEye /> : <FaEyeSlash />}
//                   </button>
//                 </div>
//               </div>

//               <div className="text-right">
//                 <Link to="/forgetpassword" className="text-sm text-blue-600 hover:underline">
//                   Forgot password?
//                 </Link>
//               </div>

//               <div className="flex flex-col items-center">
//                 <button
//                   type="submit"
//                   disabled={loading || isLocked}
//                   className={`w-36 bg-blue-600 text-white py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-md
//                     ${(loading || isLocked) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
//                 >
//                   {loading ? (
//                     <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                     </svg>
//                   ) : isLocked ? (
//                     countdown > 0 ? `Try again in ${countdown}s` : "Locked (wait…)"
//                   ) : 'Login'}
//                 </button>

//                 <div className="mt-4">
//                   <button type="button" onClick={() => window.open('/CreateAnAccount', '_blank')} className="text-sm text-blue-600 hover:underline" >
//                     Create an Account
//                   </button>
//                   <span className="mx-2 text-gray-600">||</span>
//                   <button type="button" onClick={() => window.open('/request-demo', '_blank')} className="text-sm text-blue-600 hover:underline" >
//                     Request a Demo
//                   </button>
//                 </div>

//                 {loginError && <LoginFailedAlert message={loginError} />}
//               </div>
//             </form>
//           </div>
//         </div>

//         {/* Show Trial Expired Modal */}
//         {showTrialModal && <TrialExpiredModal onClose={() => setShowTrialModal(false)} />}

//         <footer className="absolute bottom-4 text-center w-full text-gray-400 text-sm">
//           © {new Date().getFullYear()}{' '}
//           <a href="https://www.inklidox.com" className="hover:underline">
//             Inklidox Technologies
//           </a>{' '}
//           · Version 4.1
//         </footer>
//       </div>

//       <style>{`
//         @keyframes shake {
//           0% { transform: translateX(0); }
//           25% { transform: translateX(-4px); }
//           50% { transform: translateX(4px); }
//           75% { transform: translateX(-4px); }
//           100% { transform: translateX(0); }
//         }

//         .animate-shake { animation: shake 0.4s ease-in-out; }

//         @keyframes wave {
//           0% { transform: rotate(0.0deg); }
//           10% { transform: rotate(14.0deg); }
//           20% { transform: rotate(-8.0deg); }
//           30% { transform: rotate(14.0deg); }
//           40% { transform: rotate(-4.0deg); }
//           50% { transform: rotate(10.0deg); }
//           60% { transform: rotate(0.0deg); }
//           100% { transform: rotate(0.0deg); }
//         }

//         .animate-waving-hand {
//           display: inline-block;
//           transform-origin: 70% 70%;
//           animation: wave 2s infinite;
//         }
//       `}</style>
//     </>
//   );
// };

// export default LoginPage;