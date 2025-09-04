import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../api/constraints';
import { Eye, EyeOff, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateUserForm({ onClose }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [companyId, setCompanyId] = useState(null);

  const [formData, setFormData] = useState({
    employeeName: '',
    email: '',
    password: '',
    jobTitle: 'User',
    reportsTo: '',
    role: '',
    businessPhone: '',
    personalPhone: '',
    image: 'https://placehold.co/100x100/aabbcc/ffffff?text=User',
  });

  const [errors, setErrors] = useState({});
  const [userOptions, setUserOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleClose = onClose || (() => navigate(-1));

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Adjust to exact key from your token payload:
        setCompanyId(payload.company_id || payload.iCompany_id || null);
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchRoles();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(ENDPOINTS.GET_USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setUserOptions(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setErrors({ general: 'Failed to load user list. Please try again.' });
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(ENDPOINTS.ROLE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRoleOptions(data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
      setErrors({ general: 'Failed to load roles. Please try again.' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-15]{15}$/;
    const newErrors = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Name is required';
    } else if (!nameRegex.test(formData.employeeName.trim())) {
      newErrors.employeeName = 'Only alphabets and spaces allowed';
    } else if (formData.employeeName.trim().length > 30) {
      newErrors.employeeName = 'Maximum 20 characters allowed';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    } else if (formData.email.trim().length > 50) {
      newErrors.email = 'Email cannot exceed 50 characters';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.trim().length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.reportsTo) newErrors.reportsTo = 'Reports To is required';
    if (!formData.role) newErrors.role = 'Role is required';

    if (formData.businessPhone && !phoneRegex.test(formData.businessPhone)) {
      newErrors.businessPhone = 'Please enter a valid phone number';
    }

    if (formData.personalPhone && !phoneRegex.test(formData.personalPhone)) {
      newErrors.personalPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const roleId = roleOptions.find((r) => r.cRole_name === formData.role)?.irole_id;
      if (!roleId) {
        throw new Error('Selected role ID not found. Please select a valid role.');
      }

      const payload = {
        cFull_name: formData.employeeName,
        cUser_name: formData.employeeName.toLowerCase().replace(/\s+/g, ''),
        cEmail: formData.email,
        cPassword: formData.password,
        iCompany_id: companyId,
        irole_id: roleId,
        cjob_title: formData.jobTitle,
        reports_to: parseInt(formData.reportsTo, 10),
        cProfile_pic: formData.image,
        i_bPhone_no: formData.businessPhone || null,
        iphone_no: formData.personalPhone || null,
      };

      const res = await fetch(ENDPOINTS.USER_CREATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.message?.includes('unique constraint') || errorData.error?.includes('unique constraint')) {
          setErrors({ email: 'Email already exists' });
          return;
        }
        throw new Error(errorData.message || errorData.error || 'Failed to create user');
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err);
      setErrors({ general: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center font-inter">
        <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl rounded-3xl p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close form"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Create User</h2>

          {errors.general && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg mb-4 text-center">{errors.general}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              {/* Employee Name */}
              <div>
                <label htmlFor="employeeName" className="block mb-1 text-sm font-medium text-gray-700">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="employeeName"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  placeholder="Enter Name"
                  className={`w-full border ${errors.employeeName ? 'border-red-500' : 'border-gray-300'} rounded-xl p-2.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                  aria-invalid={errors.employeeName ? 'true' : 'false'}
                  aria-describedby="employeeNameError"
                />
                {errors.employeeName && <p id="employeeNameError" className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email"
                  className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl p-2.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby="emailError"
                />
                {errors.email && <p id="emailError" className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter Password"
                    className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl p-2.5 pr-10 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby="passwordError"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p id="passwordError" className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Business Phone */}
              <div>
                <label htmlFor="businessPhone" className="block mb-1 text-sm font-medium text-gray-700">
                  Business Phone
                </label>
                <input
                  type="tel"
                  id="businessPhone"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  placeholder="Enter Business Phone"
                  className={`w-full border ${errors.businessPhone ? 'border-red-500' : 'border-gray-300'} rounded-xl p-2.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                  aria-invalid={errors.businessPhone ? 'true' : 'false'}
                  aria-describedby="businessPhoneError"
                />
                {errors.businessPhone && <p id="businessPhoneError" className="text-red-500 text-xs mt-1">{errors.businessPhone}</p>}
              </div>
            </div>

            <div className="space-y-4">
              {/* Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block mb-1 text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Enter Job Title"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
              </div>

              {/* Reports To */}
              <div>
                <label htmlFor="reportsTo" className="block mb-1 text-sm font-medium text-gray-700">
                  Reports To <span className="text-red-500">*</span>
                </label>
                <select
                  id="reportsTo"
                  name="reportsTo"
                  value={formData.reportsTo}
                  onChange={handleChange}
                  className={`w-full border ${errors.reportsTo ? 'border-red-500' : 'border-gray-300'} rounded-xl p-2.5 bg-white appearance-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                  aria-invalid={errors.reportsTo ? 'true' : 'false'}
                  aria-describedby="reportsToError"
                >
                  <option value="">-- Select Manager --</option>
                  {userOptions
                    .filter((u) => u.bactive === true || u.bactive === 'true')
                    .map((user) => (
                      <option key={user.iUser_id} value={user.iUser_id}>
                        {user.cFull_name}
                      </option>
                    ))}
                </select>
                {errors.reportsTo && <p id="reportsToError" className="text-red-500 text-xs mt-1">{errors.reportsTo}</p>}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block mb-1 text-sm font-medium text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full border ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-xl p-2.5 bg-white appearance-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                  aria-invalid={errors.role ? 'true' : 'false'}
                  aria-describedby="roleError"
                >
                  <option value="">-- Select Role --</option>
                  {roleOptions
                    .filter((r) => r.cRole_name.toLowerCase() !== 'reseller')
                    .map((role) => (
                      <option key={role.irole_id} value={role.cRole_name}>
                        {role.cRole_name}
                      </option>
                    ))}
                </select>
                {errors.role && <p id="roleError" className="text-red-500 text-xs mt-1">{errors.role}</p>}
              </div>

              {/* Personal Phone */}
              <div>
                <label htmlFor="personalPhone" className="block mb-1 text-sm font-medium text-gray-700">
                  Personal Phone
                </label>
                <input
                  type="tel"
                  id="personalPhone"
                  name="personalPhone"
                  value={formData.personalPhone}
                  onChange={handleChange}
                  placeholder="Enter Personal Phone"
                  className={`w-full border ${errors.personalPhone ? 'border-red-500' : 'border-gray-300'} rounded-xl p-2.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                  aria-invalid={errors.personalPhone ? 'true' : 'false'}
                  aria-describedby="personalPhoneError"
                />
                {errors.personalPhone && <p id="personalPhoneError" className="text-red-500 text-xs mt-1">{errors.personalPhone}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition duration-200 ease-in-out ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">User created successfully</p>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}
    </>
  );
}
