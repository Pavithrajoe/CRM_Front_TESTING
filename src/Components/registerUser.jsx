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
        console.log('Fetching users from:', ENDPOINTS.GET_USERS);
        console.log('Using token:', token);
        try {
            const response = await fetch(ENDPOINTS.GET_USERS, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log('Response status:', response);

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
            console.log('Successfully fetched users:', data);
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

        console.log('Submitting data:', payload);
        console.log('API URL:', ENDPOINTS.USER_CREATION);
        console.log('Using token:', token);

        try {
            const response = await fetch(ENDPOINTS.USER_CREATION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            console.log('Create User Response:', response);

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
            console.log('User created successfully:', responseData.details);
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
        <div className="relative inset-0 flex justify-center items-center  pt-10 overflow-y-auto z-5">
            <form onSubmit={handleSubmit} className="form-container w-full max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-4 md:p-6" > {/* Close Button */} <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black" aria-label="Close form" > <X size={20} /> </button>
                <h2 className="text-lg md:text-xl font-semibold text-center mb-6">
                    🚀 Let's Create a New Profile
                </h2>

                {errors.fetchUsers && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{errors.fetchUsers}</span>
                    </div>
                )}

                {submissionMessage && (
                    <div className="bg-green-100 border border-green-800 text-green-900 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Success: </strong>
                        <span className="block sm:inline">{submissionMessage}</span>
                    </div>
                )}

                {errors.submit && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{errors.submit}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT SIDE */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Employee Name *</label>
                            <input
                                name="employeeName"
                                value={formData.employeeName}
                                onChange={handleChange}
                                placeholder="Enter Employee name"
                                className="w-full border border-gray-300 rounded-xl p-2"
                            />
                            {errors.employeeName && (
                                <p className="text-red-500 text-sm">{errors.employeeName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">E-mail ID *</label>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter the E-mail address"
                                className="w-full border border-gray-300 rounded-xl p-2"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter Password"
                                    className="w-full border border-gray-300 rounded-xl p-2 text-sm pr-10"
                                />
                                <span
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </span>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs md:text-sm">{errors.password}</p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Job Title *</label>
                            <input
                                name="jobTitle"
                                value={formData.jobTitle}
                                readOnly
                                className="w-full border border-gray-300 rounded-xl p-2 bg-gray-100"
                            />
                            {errors.jobTitle && (
                                <p className="text-red-500 text-sm">{errors.jobTitle}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Reports To *</label>
                            <select
                                name="reportsTo"
                                value={formData.reportsTo}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl p-2"
                                required
                            >
                                <option value="">-- Select a Manager --</option>
                                {isUserLoading && (
                                    <option disabled>Loading managers...</option>
                                )}
                                {userOptions.map((user) => (
                                    <option key={user.iUser_id} value={user.iUser_id}>
                                        {user.cFull_name}
                                    </option>
                                ))}
                            </select>
                            {errors.reportsTo && (
                                <p className="text-red-500 text-sm">{errors.reportsTo}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Role</label>
                            <input
                                name="role"
                                value={formData.role}
                                readOnly
                                className="w-full border border-gray-200 rounded-xl p-2 bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-8">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
}