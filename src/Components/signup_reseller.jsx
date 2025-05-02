import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    planType: '',
  });

  const [errors, setErrors] = useState({});

  const togglePassword = () => setShowPassword((prev) => !prev);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      navigate('/dashboard');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full mb-10 flex items-center py-4 justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row w-full max-w-[1200px] md:h-[600px] rounded-xl overflow-hidden">
        {/* Left Image Section */}
        <div className="relative w-full md:w-1/2 bg-[radial-gradient(circle,_#2563eb,_#164CA1,_#164CA1)] mb-6 md:mb-0 mt-6 md:mt-10 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md z-10 rounded-2xl"></div>
          <img
            src="/images/signup/signup.png"
            alt="Illustration"
            className="relative z-10 max-w-[240px] md:max-w-[300px] h-[350px]]"
          />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 md:mt-[30px] py-4 bg-white md:ms-10 p-6 md:p-10">
          <h2 className="text-xl font-medium text-center text-gray-900">
            Hey<span className="animate-waving-hand">👋</span>, Hi there!
          </h2>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center mb-6">Create your account to get started.</h1>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 mt-10 w-[550px] gap-4">
            <div>
              <label className="text-sm text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                placeholder="Name"
                required
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-[320px] px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 ms-10">Last Name</label>
              <input
                name="lastName"
                type="text"
                placeholder="Last Name"
                required
                onChange={handleChange}
                className="border-2 mt-2 rounded-md px-4 w-[180px] ms-10 py-1 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 ms-1">E-mail ID</label>
              <input
                name="email"
                type="email"
                placeholder="E-mail ID"
                required
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-[320px] px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-700 ms-[45px]">Phone Number</label>
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                required
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-[180px] ms-10 px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="relative">
              <label className="text-sm text-gray-700">Password</label>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                onChange={handleChange}
                className="w-full pr-10 border-2 w-[280px] mt-2 rounded-md px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-[43px] text-sm text-black"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-700 ms-1">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                onChange={handleChange}
                className="border-2 mt-2 rounded-md px-4 w-[220px] py-1 focus:ring-2 focus:ring-blue-400"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-700 ms-1">Business Type</label>
              <select
                name="businessType"
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-[330px] px-4 py-1 focus:ring-2 focus:ring-blue-400"
              >
                <option>Business Type</option>
                <option value="retail">Retail</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-700 ms-[54px]">Plan Type</label>
              <select
                name="planType"
                onChange={handleChange}
                className="border-2 mt-2 rounded-md px-4 w-[170px] ms-[50px] py-1 focus:ring-2 focus:ring-blue-400"
              >
                <option>Plan Type</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 mt-4 flex justify-center">
              <button
                type="submit"
                className="w-[150px] flex items-center justify-center bg-black shadow-inner shadow-gray-50 text-white py-2 font-semibold rounded-md hover:bg-gray-900"
              
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 👋 Waving hand keyframes */}
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
            display: inline-block;
            animation: wave 2s infinite;
            transform-origin: 70% 70%;
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;
