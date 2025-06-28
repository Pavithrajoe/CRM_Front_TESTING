import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../api/constraints'; // This import needs to be handled by the user's project structure
import { Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateUserForm({ onClose }) { // Remove the invalid default from here
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
    image: 'https://placehold.co/100x100/aabbcc/ffffff?text=User', // Placeholder image
  });

  const [errors, setErrors] = useState({});
  const [userOptions, setUserOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleClose = onClose || (() => navigate(-1));

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCompanyId(payload.company_id);
      } catch (error) {
        console.error('Invalid token', error);
        // Optionally, handle token invalidation (e.g., redirect to login)
      }
    }
  }, [token]);

  // Fetch users and roles
  useEffect(() => {
    // Only fetch if token and companyId are available (or if companyId is not strictly needed for these fetches)
    if (token) {
      fetchUsers();
      fetchRoles();
    }
  }, [token]); // Add token to dependency array for these fetches

  const fetchUsers = async () => {
    try {
      const res = await fetch(ENDPOINTS.GET_USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setUserOptions(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      // Handle error gracefully, e.g., show a message to the user
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(ENDPOINTS.ROLE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setRoleOptions(data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
      // Handle error gracefully
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' })); // Clear error for the field being changed
  };

  const validate = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Name is required';
    } else if (!nameRegex.test(formData.employeeName.trim())) {
      newErrors.employeeName = 'Only alphabets and spaces allowed';
    } else if (formData.employeeName.trim().length > 20) {
      newErrors.employeeName = 'Maximum 20 characters allowed';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.trim().length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.reportsTo) newErrors.reportsTo = 'Reports To is required';
    if (!formData.role) newErrors.role = 'Role is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      console.log('Validation failed', errors);
      return; // Stop submission if validation fails
    }

    setIsSubmitting(true);
    setSuccessMsg(''); // Clear previous success message

    try {
      const roleId = roleOptions.find((r) => r.cRole_name === formData.role)?.irole_id;
      if (!roleId) {
        throw new Error('Selected role ID not found. Please select a valid role.');
      }

      const payload = {
        cFull_name: formData.employeeName,
        cUser_name: formData.employeeName, // Assuming user name is full name for now
        cEmail: formData.email,
        cPassword: formData.password,
        iCompany_id: companyId,
        irole_id: roleId,
        cjob_title: formData.jobTitle,
        reports_to: parseInt(formData.reportsTo, 10), // Ensure reportsTo is an integer
        cProfile_pic: formData.image,
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
        console.error('API Error Response:', errorData); // Log full error response
        if (errorData.message?.includes('unique constraint') || errorData.error?.includes('unique constraint')) {
          setErrors({ email: 'Email already exists' });
          return;
        }
        throw new Error(errorData.message || errorData.error || 'Failed to create user');
      }

      setSuccessMsg('User created successfully!');
      // Reset form fields after successful submission
      setFormData({
        employeeName: '',
        email: '',
        password: '',
        jobTitle: 'User',
        reportsTo: '',
        role: '',
        image: 'https://placehold.co/100x100/aabbcc/ffffff?text=User',
      });
      setErrors({}); // Clear all errors

      // Navigate after a short delay for success message to be seen
      setTimeout(() => {
        handleClose(); // Use the corrected handleClose function
        // navigate('/leads'); // Uncomment if you want to navigate to leads after closing
      }, 1000);
    } catch (err) {
      console.error('Submission error:', err);
      // Set a general error message if it's not a validation error
      if (!Object.keys(errors).length) {
        setErrors({ general: err.message || 'An unexpected error occurred.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center font-inter">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-2xl rounded-3xl p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
          aria-label="Close form"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">🚀 Create User</h2>

        {successMsg && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4 text-center">
            {successMsg}
          </div>
        )}
        {errors.general && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg mb-4 text-center">
                {errors.general}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="employeeName" className="block mb-1 text-sm font-medium text-gray-700">Employee Name *</label>
              <input
                type="text"
                id="employeeName"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                placeholder="Enter Name"
                className={`w-full border ${
                  errors.employeeName ? 'border-red-500' : 'border-gray-300'
                } rounded-xl p-2.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                aria-invalid={errors.employeeName ? "true" : "false"}
                aria-describedby="employeeNameError"
              />
              {errors.employeeName && (
                <p id="employeeNameError" className="text-red-500 text-xs mt-1">{errors.employeeName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email"
                className={`w-full border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-xl p-2.5 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby="emailError"
              />
              {errors.email && (
                <p id="emailError" className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter Password"
                  className={`w-full border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-xl p-2.5 pr-10 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby="passwordError"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p id="passwordError" className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="jobTitle" className="block mb-1 text-sm font-medium text-gray-700">Job Title *</label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                readOnly
                className="w-full border border-gray-300 rounded-xl p-2.5 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="reportsTo" className="block mb-1 text-sm font-medium text-gray-700">Reports To *</label>
              <select
                id="reportsTo"
                name="reportsTo"
                value={formData.reportsTo}
                onChange={handleChange}
                className={`w-full border ${
                  errors.reportsTo ? 'border-red-500' : 'border-gray-300'
                } rounded-xl p-2.5 bg-white appearance-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                aria-invalid={errors.reportsTo ? "true" : "false"}
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
              {errors.reportsTo && (
                <p id="reportsToError" className="text-red-500 text-xs mt-1">{errors.reportsTo}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block mb-1 text-sm font-medium text-gray-700">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full border ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                } rounded-xl p-2.5 bg-white appearance-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                aria-invalid={errors.role ? "true" : "false"}
                aria-describedby="roleError"
              >
                <option value="">-- Select Role --</option>
                {roleOptions
                  .filter(
                    (r) => r.cRole_name.toLowerCase() !== 'reseller'
                  )
                  .map((role) => (
                    <option key={role.irole_id} value={role.cRole_name}>
                      {role.cRole_name}
                    </option>
                  ))}
              </select>
              {errors.role && (
                <p id="roleError" className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition duration-200 ease-in-out
              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
