import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { ENDPOINTS } from '../../api/constraints';

const DCRMSettingsForm = ({ userId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    password_hash: '',
    phone_number: '',
    company_name: '',
    gender: 'Male',
    user_role: 'manager'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdUserId, setCreatedUserId] = useState(null);
  const [showSettingsConfirmation, setShowSettingsConfirmation] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case 'user_name':
        return value.length >= 2 ? '' : 'Minimum 2 characters required';
      case 'user_email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email format';
      case 'password_hash':
        return value.length >= 6 ? '' : 'Minimum 6 characters required';
      case 'phone_number':
        return /^\d{10}$/.test(value) ? '' : 'Must be exactly 10 digits';
      case 'company_name':
        return value.length >= 2 ? '' : 'Minimum 2 characters required';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setApiError('');
    setSuccessMessage('');

    if (errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const showInternalMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setApiError('');
    } else {
      setApiError(message);
      setSuccessMessage('');
    }

    setTimeout(() => {
      setApiError('');
      setSuccessMessage('');
    }, 5000);
  };

  const handleCreateUser = async () => {
    setIsSubmitting(true);
    setApiError('');
    setSuccessMessage('');

    const newErrors = {};
    const requiredFields = ['user_name', 'user_email', 'password_hash', 'phone_number', 'company_name'];
    requiredFields.forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) {
        newErrors[field] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userResponse = await fetch(ENDPOINTS.DCRM_SETTINGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const userData = await userResponse.json();
      console.log('User Creation Response:', userResponse.body);
      console.log('User Creation Response:', userData.message.user.id);

      if (!userResponse.ok) {
        throw new Error(userData.message || 'Failed to create DCRM user');
      }

      const userId =
        userData.message.user.id ||
        userData.data?.user?.id ||
        userData.data?.id ||
        userData.id;

      if (!userId) {
        console.error('Unexpected user response shape:', userData);
        throw new Error('Failed to get created user ID from response');
      }

      setCreatedUserId(userId);
      setShowSettingsConfirmation(true);
      showInternalMessage('DCRM user created successfully! Would you like to configure settings now?', 'success');
    } catch (error) {
      console.error('User Creation Error:', error);
      showInternalMessage(error.message || 'Something went wrong!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSettings = async () => {
    if (!createdUserId) {
      showInternalMessage('No user ID available for settings creation', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const settingsResponse = await fetch(ENDPOINTS.CREATE_USER_SETTINGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: createdUserId,
          sim_preference: 1,
          sales_group_id: 1
        }),
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to create default settings');
      }

      showInternalMessage('User settings configured successfully', 'success');
      onSuccess();
      setShowSettingsConfirmation(false);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Settings Creation Error:', error);
      showInternalMessage(error.message || 'Something went wrong configuring settings!', 'error');
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
          <p className="text-gray-600 text-sm">Fill in the details to create a new user</p>
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

        {!showSettingsConfirmation ? (
          <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-4">
            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-4">
              <InputField
                name="user_name"
                label="Username"
                value={formData.user_name}
                onChange={handleChange}
                error={errors.user_name}
              />
              <InputField
                name="user_email"
                label="Email"
                type="email"
                value={formData.user_email}
                onChange={handleChange}
                error={errors.user_email}
              />
              <InputField
                name="password_hash"
                label="Password"
                type="password"
                value={formData.password_hash}
                onChange={handleChange}
                error={errors.password_hash}
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
              />

              {/* Selects for Gender and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                'Create User'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <h3 className="font-semibold text-green-800 mb-1">User Created Successfully!</h3>
              <p className="text-sm text-green-700">User ID: {createdUserId}</p>
              <p className="text-sm text-green-600">Would you like to configure default settings?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowSettingsConfirmation(false);
                  onClose();
                }}
                disabled={isSubmitting}
                className="border border-gray-300 py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Skip Settings
              </button>
              <button
                onClick={handleCreateSettings}
                disabled={isSubmitting}
                className={`py-2 px-4 text-white rounded-lg ${
                  isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Configuring...' : 'Configure Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable InputField Component
const InputField = ({ name, label, value, onChange, error, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} <span className="text-red-500">*</span>
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 border rounded-lg ${
        error ? 'border-red-500' : 'border-gray-300'
      } focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition`}
      placeholder={`Enter ${label.toLowerCase()}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default DCRMSettingsForm;
