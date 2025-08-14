import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ENDPOINTS } from '../../api/constraints';

// Reusable InputField Component with Password Toggle
const InputField = ({ name, label, value, onChange, error, type = 'text', required = false, readOnly = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`w-full px-4 py-2 border rounded-lg ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder={readOnly ? '' : `Enter ${label.toLowerCase()}`}
          required={required}
        />
        {isPassword && (
          <span
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};


const DCRMSettingsForm = ({ userId, userProfile, onClose, onSuccess }) => {
  // Initialize formData with safe access to nested properties
  const [formData, setFormData] = useState({
    user_name: userProfile?.cUser_name || '',
    user_email: userProfile?.cEmail || '',
    password_hash: generateRandomPassword(),
    phone_number: userProfile?.phone || '',
    company_name: userProfile?.company?.cCompany_name || '', // Safely access nested property
    gender: 'Male',
    user_role: 'manager',
    DCRM_enabled: userProfile?.DCRM_enabled || false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper function to generate a secure random password
  function generateRandomPassword() {
    return Math.random().toString(36).slice(-8) + 'A1!'; // Ensures complexity
  }

  // Auto-fill form when userProfile data changes
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        user_name: userProfile.cUser_name || '',
        user_email: userProfile.cEmail || '',
        company_name: userProfile.company?.cCompany_name || prev.company_name, // Safely access nested property
        DCRM_enabled: userProfile.DCRM_enabled || false,
      }));
    }
  }, [userProfile]);

  const validateField = (name, value) => {
    switch (name) {
      case 'user_name':
        return value.trim().length >= 2 ? '' : 'Minimum 2 characters required';
      case 'user_email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email format';
      case 'password_hash':
        return value.length >= 8 ? '' : 'Minimum 8 characters required';
      case 'phone_number':
        return value ? /^\d{10}$/.test(value) ? '' : 'Must be exactly 10 digits' : '';
      case 'company_name': // Correct field name for validation
        return value.trim().length >= 2 ? '' : 'Minimum 2 characters required';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));
    setApiError('');
    setSuccessMessage('');

    if (errors[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError('');
    setSuccessMessage('');

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      if (field !== 'gender' && field !== 'user_role' && field !== 'DCRM_enabled') {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        user_name: formData.user_name.trim(),
        user_email: formData.user_email.trim(),
        password_hash: formData.password_hash,
        phone_number: formData.phone_number,
        company_name: formData.company_name.trim(), // Use formData.company_name directly
        gender: formData.gender,
        user_role: formData.user_role,
        DCRM_enabled: formData.DCRM_enabled,
      };

      const response = await fetch(ENDPOINTS.DCRM_SETTINGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message && typeof data.message === 'string' && data.message.includes('already exists')) {
          throw new Error('A DCRM user with this email already exists. Please disable the existing user first.');
        } else {
          throw new Error(data.message || 'Failed to create DCRM user');
        }
      }

      if (data.message && data.message.status === 200) {
        setSuccessMessage(data.message.message || 'DCRM user created successfully!');
        // Call the onSuccess callback to update the parent component's state
        onSuccess(data.message.user);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('DCRM User Creation Error:', error);
      setApiError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 font-inter">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors rounded-full p-1 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Create DCRM User</h2>
          <p className="text-gray-600 text-sm">Review and confirm user details</p>
        </div>

        {apiError && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-md px-4 py-2 text-sm mb-4 flex items-center">
            <FaTimesCircle className="mr-2" />
            {apiError}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-700 rounded-md px-4 py-2 text-sm mb-4 flex items-center">
            <FaCheckCircle className="mr-2" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <InputField
              name="user_name"
              label="Username"
              value={formData.user_name}
              onChange={handleChange}
              error={errors.user_name}
              required
            />
            <InputField
              name="user_email"
              label="Email"
              type="email"
              value={formData.user_email}
              onChange={handleChange}
              error={errors.user_email}
              required
              readOnly
            />
            <InputField
              name="password_hash"
              label="Password"
              type="password"
              value={formData.password_hash}
              onChange={handleChange}
              error={errors.password_hash}
              required
            />
            <InputField
              name="phone_number"
              label="Phone Number"
              value={formData.phone_number}
              onChange={handleChange}
              error={errors.phone_number}
            />
            <InputField
              name="company_name"
              label="Company Name"
              value={formData.company_name}
              onChange={handleChange}
              error={errors.company_name}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                <select
                  name="user_role"
                  value={formData.user_role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            </div>

            {/* DCRM Toggle Switch */}
            {/* <div className="flex items-center justify-between">
              <label htmlFor="DCRM_enabled" className="text-sm font-medium text-gray-700">DCRM Enabled</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="DCRM_enabled"
                  name="DCRM_enabled"
                  checked={formData.DCRM_enabled}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div> */}

          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg text-white font-medium flex justify-center items-center transition-colors ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5 0 0 5 0 12h4zm2 5a8 8 0 01-2-5H0c0 3 1 6 3 8l3-3z" />
                </svg>
                Creating...
              </>
            ) : (
              'Create DCRM User'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DCRMSettingsForm;
