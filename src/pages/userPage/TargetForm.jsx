import React, { useState, useEffect } from 'react';
import { X } from "lucide-react";
export default function SalesForm({ onClose }) {
    // Define ENDPOINTS directly within the component
    const ENDPOINTS = {
        USER_POST: "http://192.168.1.75:3000/api/user-target", // Endpoint for submitting sales data
        USER_GET: "http://192.168.1.75:3000/api/users", // Endpoint to fetch users (assuming it exists and returns all or relevant users)
    };

    const [formData, setFormData] = useState({
        salesValue: '',
        formDate: '',
        toDate: '',
        assignedTo: '',
        assignedBy: '',
        createdBy: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [companyUsers, setCompanyUsers] = useState([]); // New state for company users
    const [fetchingUsers, setFetchingUsers] = useState(true); // Loading state for users
    const [usersError, setUsersError] = useState(null); // Error state for users fetch

    const token = localStorage.getItem("token");

    // Helper function to decode token and get company_id
    const getCompanyId = () => {
        if (!token) return null;
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(atob(base64));
            return payload.company_id || payload.iCompany_id;
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

    // Fetch company users when the component mounts
    useEffect(() => {
        const fetchCompanyUsers = async () => {
            setFetchingUsers(true);
            setUsersError(null);
            const companyId = getCompanyId();

            if (!companyId) {
                setUsersError("Company ID not found in token. Cannot load user options.");
                setFetchingUsers(false);
                return;
            }

            try {
                const response = await fetch(ENDPOINTS.USER_GET, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();
                // Filter users by the company ID
                const filteredCompanyUsers = data.filter(user => user.iCompany_id === companyId);
                setCompanyUsers(filteredCompanyUsers);

                // If only one user is available, pre-select them for 'assignedBy' and 'createdBy'
                if (filteredCompanyUsers.length === 1) {
                    setFormData(prev => ({
                        ...prev,
                        assignedBy: filteredCompanyUsers[0].iUser_id.toString(),
                        createdBy: filteredCompanyUsers[0].iUser_id.toString()
                    }));
                } else if (token) {
                    // Attempt to pre-fill 'createdBy' and 'assignedBy' with the current user's ID
                    // if they are in the companyUsers list.
                    const currentUserPayload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
                    const currentUserId = currentUserPayload.user_id || currentUserPayload.iUser_id;
                    if (currentUserId && filteredCompanyUsers.some(user => user.iUser_id === currentUserId)) {
                        setFormData(prev => ({
                            ...prev,
                            assignedBy: currentUserId.toString(),
                            createdBy: currentUserId.toString()
                        }));
                    }
                }

            } catch (error) {
                console.error("Error fetching company users:", error);
                setUsersError(`Error loading user options: ${error.message}`);
            } finally {
                setFetchingUsers(false);
            }
        };

        fetchCompanyUsers();
    }, [token, ENDPOINTS.USER_GET]); // Re-run if token or endpoint changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.salesValue) {
            newErrors.salesValue = 'Sales Value is required';
        } else if (isNaN(formData.salesValue) || parseFloat(formData.salesValue) <= 0) {
            newErrors.salesValue = 'Sales Value must be a positive number';
        }

        if (!formData.formDate) {
            newErrors.formDate = 'From Date is required';
        }
        if (!formData.toDate) {
            newErrors.toDate = 'To Date is required';
        } else if (formData.formDate && new Date(formData.toDate) < new Date(formData.formDate)) {
            newErrors.toDate = 'To Date cannot be before From Date';
        }

        if (!formData.assignedTo) {
            newErrors.assignedTo = 'Assigned To is required';
        } else if (isNaN(formData.assignedTo) || parseInt(formData.assignedTo) <= 0) {
            newErrors.assignedTo = 'Assigned To must be a positive number (User ID)';
        }

        if (!formData.assignedBy) {
            newErrors.assignedBy = 'Assigned By is required';
        } else if (isNaN(formData.assignedBy) || parseInt(formData.assignedBy) <= 0) {
            newErrors.assignedBy = 'Assigned By must be a positive number (User ID)';
        }

        if (!formData.createdBy) {
            newErrors.createdBy = 'Created By is required';
        } else if (isNaN(formData.createdBy) || parseInt(formData.createdBy) <= 0) {
            newErrors.createdBy = 'Created By must be a positive number (User ID)';
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

        const requestBody = {
            salesValue: parseFloat(formData.salesValue),
            fromDate: formData.formDate ? `${formData.formDate.replace('T', ' ')}:00` : '',
            toDate: formData.toDate ? `${formData.toDate.replace('T', ' ')}:00` : '',
            assignedTo: parseInt(formData.assignedTo),
            assignedBy: parseInt(formData.assignedBy),
            createdBy: parseInt(formData.createdBy),
        };

        // console.log('Sending sales data to API:', ENDPOINTS.USER_POST, requestBody);
        // console.log('Using token:', token);

        try {
            const response = await fetch(ENDPOINTS.USER_POST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include the authorization token
                },
                body: JSON.stringify(requestBody), // Use the directly constructed object
            });

            // console.log('API Response Status:', response.status);

            if (!response.ok) {
                let errorText = 'Failed to submit sales data.';
                let errorData = {};
                try {
                    errorData = await response.json();
                    console.error('Parsed error response JSON:', errorData);
                    errorText = errorData.message || errorData.detail || JSON.stringify(errorData) || errorText;
                } catch (jsonError) {
                    console.error('Failed to parse error response as JSON (falling back to text):', jsonError);
                    errorText = await response.text() || errorText;
                    console.error('Raw error response text:', errorText);
                }
                throw new Error(`${errorText} (Status: ${response.status})`);
            }

            const responseData = await response.json();
            // console.log('Sales data submitted successfully:', responseData);

            setSubmissionMessage(responseData.result?.Message || 'Sales data submitted successfully!');
            
            setFormData({
                salesValue: '',
                formDate: '',
                toDate: '',
                assignedTo: '',
                assignedBy: '',
                createdBy: '',
            });

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            console.error('Error submitting sales data:', error);
            setErrors({ submit: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative inset-0 flex justify-center items-center pt-10 overflow-y-auto z-5">
            <form onSubmit={handleSubmit} className="form-container w-full max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-4 md:p-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-black"
                    aria-label="Close form"
                >
                    <X size={20} />
                </button>
                <h2 className="text-lg md:text-xl font-semibold text-center mb-6">
                    Set a Target: Conquer Goals

                </h2>

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

                {fetchingUsers ? (
                    <div className="text-center py-4">Loading user options...</div>
                ) : usersError ? (
                    <div className="text-center text-red-500 py-4">Error: {usersError}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Sales Value *</label>
                            <input
                                type="number"
                                name="salesValue"
                                value={formData.salesValue}
                                onChange={handleChange}
                                placeholder="e.g., 1000000"
                                className="w-full border border-gray-300 rounded-xl p-2"
                            />
                            {errors.salesValue && (
                                <p className="text-red-500 text-sm mt-1">{errors.salesValue}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">From Date *</label>
                            <input
                                type="datetime-local"
                                name="formDate"
                                value={formData.formDate}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl p-2"
                            />
                            {errors.formDate && (
                                <p className="text-red-500 text-sm mt-1">{errors.formDate}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">To Date *</label>
                            <input
                                type="datetime-local"
                                name="toDate"
                                value={formData.toDate}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl p-2"
                            />
                            {errors.toDate && (
                                <p className="text-red-500 text-sm mt-1">{errors.toDate}</p>
                            )}
                        </div>

                        {/* Assigned To (User ID) - Dropdown */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Assigned To*</label>
                            <select
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl p-2 bg-white"
                                disabled={fetchingUsers || companyUsers.length === 0}
                            >
                                <option value="">Select User</option>
                                {companyUsers.map((user) => (
                                    <option key={user.iUser_id} value={user.iUser_id}>
                                        {user.cFull_name} 
                                    </option>
                                ))}
                            </select>
                            {errors.assignedTo && (
                                <p className="text-red-500 text-sm mt-1">{errors.assignedTo}</p>
                            )}
                        </div>

                        {/* Assigned By (User ID) - Dropdown */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Assigned By *</label>
                            <select
                                name="assignedBy"
                                value={formData.assignedBy}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl p-2 bg-white"
                                disabled={fetchingUsers || companyUsers.length === 0}
                            >
                                <option value="">Select User</option>
                                {companyUsers.map((user) => (
                                    <option key={user.iUser_id} value={user.iUser_id}>
                                        {user.cFull_name} 
                                    </option>
                                ))}
                            </select>
                            {errors.assignedBy && (
                                <p className="text-red-500 text-sm mt-1">{errors.assignedBy}</p>
                            )}
                        </div>

                        {/* Created By (User ID) - Dropdown */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Created By *</label>
                            <select
                                name="createdBy"
                                value={formData.createdBy}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl p-2 bg-white"
                                disabled={fetchingUsers || companyUsers.length === 0}
                            >
                                <option value="">Select User</option>
                                {companyUsers.map((user) => (
                                    <option key={user.iUser_id} value={user.iUser_id}>
                                        {user.cFull_name}
                                    </option>
                                ))}
                            </select>
                            {errors.createdBy && (
                                <p className="text-red-500 text-sm mt-1">{errors.createdBy}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-center mt-8">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                        disabled={isSubmitting || fetchingUsers || companyUsers.length === 0}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Sales Data'}
                    </button>
                </div>
            </form>
             
        </div>
    );
}