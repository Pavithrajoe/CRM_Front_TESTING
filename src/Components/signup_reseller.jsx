import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    industry: '',
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

    if (!form.industry || form.industry === '') {
      newErrors.industry = 'Please select a business type';
    }

    if (!form.planType || form.planType === '') {
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
      const requestBody = {
        cEmail: form.email,
        cPassword: form.password,
        plan_id: parseInt(form.planType),
      };

      console.log('Request Body:', requestBody);

      try {
        const response = await fetch('http://192.168.0.107:3000/api/reseller', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Registration successful:', data);
          navigate('/leads');
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
      alert('Validation failed. Please check your inputs.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('http://192.168.0.107:3000/api/pricing-plans');
        const data = await response.json();
        const activePlans = data.filter(plan => plan.bactive);
        setPlans(activePlans);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    };

    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center py-4 justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row w-full max-w-[1200px] md:h-[600px] mb-5 mt-[-10px] rounded-xl overflow-hidden">
        {/* Left Section */}
        <div className="relative w-full md:w-1/2 bg-[radial-gradient(circle,_#2563eb,_#164CA1,_#164CA1)] mb-6 md:mb-0 mt-6 md:mt-10 rounded-2xl flex items-center justify-center p-2 overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md z-10 rounded-2xl"></div>
          <img
            src="/images/signup/signup.png"
            alt="Illustration"
            className="relative z-10 max-w-[240px] md:max-w-[300px] h-[350px]"
          />
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 md:mt-[30px] py-4 bg-white md:ms-10 p-6 md:p-10">
          <h2 className="text-xl font-medium text-center text-gray-900">
            Hey<span className="animate-waving-hand">👋</span>, Hi there!
          </h2>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center mb-6">Create your account to get started.</h1>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 mt-10 w-full gap-4">
            <div>
              <label className="text-sm text-gray-700">First Name</label>
              <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Name" className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700">Last Name</label>
              <input name="lastName" type="text" value={form.lastName} onChange={handleChange} placeholder="Last Name" className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400" />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700">E-mail ID</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="E-mail ID" className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700">Phone Number</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400" />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div className="relative">
              <label className="text-sm text-gray-700">Password</label>
              <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Password" className="border-2 mt-2 rounded-md w-full px-4 py-1 pr-10 focus:ring-2 focus:ring-blue-400" />
              <button type="button" onClick={togglePassword} className="absolute right-3 top-[43px] text-sm text-black">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700">Confirm Password</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password" className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400" />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700">Industry</label>
              <select name="industry" value={form.industry} onChange={handleChange} className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400">
                <option value="">Select Industry</option>
                <option value="retail">Retail</option>
                <option value="service">Service</option>
              </select>
              {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700">Plan Type</label>
              <select name="planType" value={form.planType} onChange={handleChange} className="border-2 mt-2 rounded-md w-full px-4 py-1 focus:ring-2 focus:ring-blue-400">
                <option value="">Select Plan</option>
                {plans.map(plan => (
                  <option key={plan.plan_id} value={plan.plan_id}>{plan.plan_name}</option>
                ))}
              </select>
              {errors.planType && <p className="text-red-500 text-sm mt-1">{errors.planType}</p>}
            </div>

            <div className="col-span-1 md:col-span-2 mt-4 flex justify-center">
              <button type="submit" className="w-[150px] flex items-center justify-center bg-black text-white py-2 font-semibold rounded-md hover:bg-gray-900">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
