import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../api/constraints';
import { Eye, EyeOff, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';



export default function CreateUserForm({ onClose }) {
    const [formData, setFormData] = useState({
        employeeName: '',
        email: '',
        password: '',
        jobTitle: 'User',
        reportsTo: '',
        role: 'User',
        image: 'https://example.com/images/john.jpg',
    });
    const [errors, setErrors] = useState({});
    const [userOptions, setUserOptions] = useState([]);
    const [isUserOptionsLoaded, setIsUserOptionsLoaded] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
      const navigate = useNavigate();
    

const token = localStorage.getItem("token")
    const fetchUsers = async () => {
        if (isUserOptionsLoaded) return;
        setIsUserLoading(true);
      //  console.log('Fetching users from:', ENDPOINTS.GET_USERS);
  //      console.log('Using token:', token);
        try {
            const response = await fetch(ENDPOINTS.GET_USERS, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
           // console.log('Response status:', response);

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = `Failed to fetch users: ${response.status}`;
                }
                console.error('Fetch error:', response.status, errorText);
                throw new Error(
                    `Failed to fetch users: ${response.status} - ${errorText}`
                );
            }
            const data = await response.json();
           // console.log('Successfully fetched users:', data);
            setUserOptions(data);
            setIsUserOptionsLoaded(true);
        } catch (error) {
            console.error('Error fetching users:', error);
            setErrors((prevErrors) => ({
                ...prevErrors,
                fetchUsers:
                    error.message ||
                    'Failed to load users. Please check your network or try again later.',
            }));
        } finally {
            setIsUserLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validate = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.employeeName.trim()) {
            newErrors.employeeName = 'Employee Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email.trim())) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }

        if (!formData.jobTitle.trim()) {
            newErrors.jobTitle = 'Job Title is required';
        }

        if (!formData.reportsTo.trim()) {
            newErrors.reportsTo = 'Reports To is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        setSubmissionMessage('');
        setErrors({});

        const payload = {
            cFull_name: formData.employeeName,
            cUser_name: formData.employeeName,
            cEmail: formData.email,
            cPassword: formData.password,
            iCompany_id: 5,
            irole_id: 1,
            cjob_title: formData.jobTitle,
            reports_to: parseInt(formData.reportsTo),
            cProfile_pic: formData.image,
        };

       // console.log('Submitting data:', payload);
       // console.log('API URL:', ENDPOINTS.USER_CREATION);
       // console.log('Using token:', token);

        try {
            const response = await fetch(ENDPOINTS.USER_CREATION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

          //  console.log('Create User Response:', response);

            if (!response.ok) {
                let errorText = 'Failed to create user';
                try {
                    const errorData = await response.json();
                    console.log('Error Data:', errorData);
                    if (errorData.details &&
                        errorData.details.toLowerCase().includes('unique constraint failed on the fields: (`cemail`)')
                    ) {
                        setErrors({ email: 'This email address already exists.' });
                        return;
                    }
                    errorText = errorData.message || errorText;
                } catch (err) {
                    console.error('Error parsing error response:', err);
                    try {
                        const text = await response.text();
                        if (text.toLowerCase().includes('unique constraint failed on the fields: (`cemail`)')) {
                            setErrors({ email: 'This email address already exists.' });
                            return;
                        }
                        errorText = text || errorText;
                    } catch (textErr) {
                        console.error('Error reading text error:', textErr);
                    }
                }
                throw new Error(`${errorText} (Status: ${response.status})`);
            }

            const responseData = await response.json();
           // console.log('User created successfully:', responseData.details);
            setSubmissionMessage('User created successfully!');
            setFormData({
                employeeName: '',
                email: '',
                password: '',
                jobTitle: 'User',
                reportsTo: '',
                role: 'User',
                image: 'https://example.com/images/john.jpg',
            });
            navigate('/leads');
            
        } catch (error) {
            console.error('Error creating user:', error);
            setErrors({ submit: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
     <>

  <form
    onSubmit={handleSubmit}
    className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 transition-all duration-300 relative"
  >
    {/* Close Button */}
    <button
      type="button"
      onClick={onClose}
      className="absolute top-6 right-6 text-gray-500 hover:text-black transition"
      aria-label="Close form"
    >
      <X size={22} />
    </button>

    {/* Title */}
    <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-gray-800">
      🚀 Create a New Profile
    </h2>

    {/* Error & Success Messages */}
    {errors.fetchUsers && (
      <div className="bg-red-100 border border-red-300 text-red-700 px-5 py-3 rounded-lg mb-4">
        <strong>Error:</strong> <span>{errors.fetchUsers}</span>
      </div>
    )}

    {submissionMessage && (
      <div className="bg-green-100 border border-green-300 text-green-900 px-5 py-3 rounded-lg mb-4">
        <strong>Success:</strong> <span>{submissionMessage}</span>
      </div>
    )}

    {errors.submit && (
      <div className="bg-red-100 border border-red-300 text-red-700 px-5 py-3 rounded-lg mb-4">
        <strong>Error:</strong> <span>{errors.submit}</span>
      </div>
    )}

    {/* Form Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="space-y-6">
        <div>
          <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Name *</label>
          <input
            type="text"
            id="employeeName"
            name="employeeName"
            value={formData.employeeName}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 bg-white focus:ring-2 focus:ring-black/20 transition"
          />
          {errors.employeeName && (
            <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail ID *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@apple.com"
            required
            className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 bg-white focus:ring-2 focus:ring-black/20 transition"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-xl p-3 pr-10 text-sm bg-white focus:ring-2 focus:ring-black/20 transition"
            />
            <span
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </span>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title *</label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle}
            readOnly
            className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          {errors.jobTitle && (
            <p className="text-red-500 text-xs mt-1">{errors.jobTitle}</p>
          )}
        </div>

        <div>
          <label htmlFor="reportsTo" className="block text-sm font-medium text-gray-700">Reports To *</label>
          <select
            id="reportsTo"
            name="reportsTo"
            value={formData.reportsTo}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-800 focus:ring-2 focus:ring-black/20 transition"
          >
            <option value="">-- Select a Manager --</option>
            {isUserLoading && <option disabled>Loading managers...</option>}
            {userOptions.map((user) => (
              <option key={user.iUser_id} value={user.iUser_id}>
                {user.cFull_name}
              </option>
            ))}
          </select>
          {errors.reportsTo && (
            <p className="text-red-500 text-xs mt-1">{errors.reportsTo}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            readOnly
            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>
    </div>

    {/* Submit Button */}
    <div className="flex justify-center mt-10">
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-8 py-3 bg-black text-white font-semibold rounded-xl shadow-md hover:bg-gray-900 transition-all"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  </form>
</>

    );
}