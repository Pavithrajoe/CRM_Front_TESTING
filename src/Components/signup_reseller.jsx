import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
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

  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(prev => !prev);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!form.name || !nameRegex.test(form.name)) {
      newErrors.name = 'Valid name required';
    }

    if (!form.lastName || !nameRegex.test(form.lastName)) {
      newErrors.lastName = 'Valid last name required';
    }

    if (!emailRegex.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!phoneRegex.test(form.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!form.businessType || form.businessType === 'Business Type') {
      newErrors.businessType = 'Please select a business type';
    }

    if (!form.planType || form.planType === 'Plan Type') {
      newErrors.planType = 'Please select a plan type';
    }

    return newErrors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
  
    console.log('📝 Form data:', form);
  
    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await fetch('http://192.168.0.107:3000/api/reseller', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Registration successful:', data);
          navigate('/dashboard');
        } else {
          const errorText = await response.text();
          console.error('❌ API error:', errorText);
          alert('Registration failed: ' + errorText);
        }
      } catch (error) {
        console.error('❌ Network error:', error);
        alert('Network error. Please try again.');
      }
    } else {
      console.warn('❗ Validation errors:', validationErrors);
      console.table(validationErrors);
      alert('Validation failed. Please check your inputs.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full mb-10 flex items-center py-4 justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row w-full max-w-[1200px] md:h-[600px] rounded-xl overflow-hidden">
        {/* Left Section */}
        <div className="relative w-full md:w-1/2 bg-[radial-gradient(circle,_#2563eb,_#164CA1,_#164CA1)] mb-6 md:mb-0 mt-6 md:mt-10 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md z-10 rounded-2xl"></div>
          <img
            src="/images/signup/signup.png"
            alt="Illustration"
            className="relative z-10 max-w-[240px] md:max-w-[300px] h-[350px]"
          />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 md:mt-[30px] py-4 bg-white md:ms-10 p-6 md:p-10">
          <h2 className="text-xl font-medium text-center text-gray-900">
            Hey<span className="animate-waving-hand">👋</span>, Hi there!
          </h2>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center mb-6">Create your account to get started.</h1>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 mt-10 w-full gap-4">
            {/* First Name */}
            <div>
              <label className="text-sm text-gray-700">First Name</label>
              <input
                name="name"
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm text-gray-700">Last Name</label>
              <input
                name="lastName"
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-700">E-mail ID</label>
              <input
                name="email"
                type="email"
                placeholder="E-mail ID"
                value={form.email}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-700">Phone Number</label>
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="relative">
              <label className="text-sm text-gray-700">Password</label>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 pr-10 focus:ring-2 focus:ring-blue-400"
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

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-gray-700">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Business Type */}
            <div>
              <label className="text-sm text-gray-700">Business Type</label>
              <select
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400"
              >
                <option>Business Type</option>
                <option value="retail">Retail</option>
                <option value="service">Service</option>
              </select>
              {errors.businessType && <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>}
            </div>

            {/* Plan Type */}
            <div>
              <label className="text-sm text-gray-700">Plan Type</label>
              <select
                name="planType"
                value={form.planType}
                onChange={handleChange}
                className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400"
              >
                <option>Plan Type</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
              {errors.planType && <p className="text-red-500 text-sm mt-1">{errors.planType}</p>}
            </div>

            {/* Submit Button */}
            <div className="col-span-1 md:col-span-2 mt-4 flex justify-center">
              <button
                type="submit"
                className="w-[150px] flex items-center justify-center bg-black text-white py-2 font-semibold rounded-md hover:bg-gray-900"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 👋 Waving Hand Animation */}
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
