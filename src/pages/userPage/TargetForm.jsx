import React, { useState, useEffect } from 'react';
import { X } from "lucide-react";

export default function SalesForm({ onClose }) {
    // Define ENDPOINTS directly within the component
    const ENDPOINTS = {
        USER_POST: "http://192.168.1.75:3000/api/user-target", // Endpoint for submitting sales data
        USER_GET: "http://192.168.1.75:3000/api/users", // Endpoint to fetch users
    };

    // Helper to get current datetime in 'YYYY-MM-DDTHH:mm' format for datetime-local input
    const getCurrentDateTimeLocal = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        salesValue: '',
        formDate: getCurrentDateTimeLocal(), // Initialize with current date and time
        toDate: '',
        assignedTo: '',
        assignedBy: '',
        createdBy: '',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [companyUsers, setCompanyUsers] = useState([]);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [usersError, setUsersError] = useState(null);

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
                const filteredCompanyUsers = data.filter(user => user.iCompany_id === companyId);
                setCompanyUsers(filteredCompanyUsers);

                // Pre-select 'assignedBy' and 'createdBy' based on token or single user
                if (filteredCompanyUsers.length === 1) {
                    setFormData(prev => ({
                        ...prev,
                        assignedBy: filteredCompanyUsers[0].iUser_id.toString(),
                        createdBy: filteredCompanyUsers[0].iUser_id.toString()
                    }));
                } else if (token) {
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
    }, [token, ENDPOINTS.USER_GET]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validate = () => {
        const newErrors = {};
        const now = new Date(); // Current date and time for validation

        // Sales Value Validation (up to Crore)
        if (!formData.salesValue) {
            newErrors.salesValue = 'Sales Value is required';
        } else {
            const salesValueNum = parseFloat(formData.salesValue);
            if (isNaN(salesValueNum) || salesValueNum <= 0) {
                newErrors.salesValue = 'Sales Value must be a positive number';
            } else if (salesValueNum > 999999999) { // Up to 99 Crore 99 Lakh 99 Thousand 999
                newErrors.salesValue = 'Sales Value cannot exceed 99 Crore 99 Lakh 99 Thousand 999';
            }
        }

        // From Date Validation
        if (!formData.formDate) {
            newErrors.formDate = 'From Date is required';
        } else {
            const fromDate = new Date(formData.formDate);
            // Allow comparison at the minute level for 'now'
            const currentMinuteNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
            if (fromDate < currentMinuteNow) {
                newErrors.formDate = 'From Date cannot be in the past';
            }
        }

        // To Date Validation
        if (!formData.toDate) {
            newErrors.toDate = 'To Date is required';
        } else {
            const toDate = new Date(formData.toDate);
            const currentMinuteNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
            if (toDate < currentMinuteNow) {
                newErrors.toDate = 'To Date cannot be in the past';
            }
            if (formData.formDate) { // Only compare if fromDate is valid
                const fromDate = new Date(formData.formDate);
                if (toDate < fromDate) {
                    newErrors.toDate = 'To Date cannot be before From Date';
                }
            }
        }

        // User ID Validations (assignedTo, assignedBy, createdBy)
        if (!formData.assignedTo) {
            newErrors.assignedTo = 'Assigned To is required';
        } else if (isNaN(formData.assignedTo) || parseInt(formData.assignedTo) <= 0) {
            newErrors.assignedTo = 'Assigned To must be a valid User';
        }

        if (!formData.assignedBy) {
            newErrors.assignedBy = 'Assigned By is required';
        } else if (isNaN(formData.assignedBy) || parseInt(formData.assignedBy) <= 0) {
            newErrors.assignedBy = 'Assigned By must be a valid User';
        }

        if (!formData.createdBy) {
            newErrors.createdBy = 'Created By is required';
        } else if (isNaN(formData.createdBy) || parseInt(formData.createdBy) <= 0) {
            newErrors.createdBy = 'Created By must be a valid User';
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

        // Format dates for API (YYYY-MM-DD HH:mm:00)
        const formatApiDate = (dateTimeLocalString) => {
            if (!dateTimeLocalString) return '';
            return `${dateTimeLocalString.replace('T', ' ')}:00`;
        };

        const requestBody = {
            salesValue: parseFloat(formData.salesValue),
            fromDate: formatApiDate(formData.formDate),
            toDate: formatApiDate(formData.toDate),
            assignedTo: parseInt(formData.assignedTo),
            assignedBy: parseInt(formData.assignedBy),
            createdBy: parseInt(formData.createdBy),
        };

        try {
            const response = await fetch(ENDPOINTS.USER_POST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                let errorText = 'Failed to submit sales data.';
                try {
                    const errorData = await response.json();
                    errorText = errorData.message || errorData.detail || JSON.stringify(errorData) || errorText;
                } catch (jsonError) {
                    errorText = await response.text() || errorText;
                }
                throw new Error(`${errorText} (Status: ${response.status})`);
            }

            const responseData = await response.json();
            setSubmissionMessage(responseData.result?.Message || 'Sales target submitted successfully!');

            // Clear form data after successful submission
            setFormData({
                salesValue: '',
                formDate: getCurrentDateTimeLocal(), // Reset to current date/time
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
        <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50 overflow-y-auto z-50">
            <form onSubmit={handleSubmit} className="relative bg-white shadow-2xl rounded-xl p-6 md:p-8 w-full max-w-2xl mx-4 my-8 border-t-8 border-blue-600">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                    aria-label="Close form"
                >
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-center text-blue-800 mb-8">
                    Set a Sales Target
                </h2>

                {submissionMessage && (
                    <div className="bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                        <strong className="font-semibold">Success! </strong>
                        <span className="block sm:inline">{submissionMessage}</span>
                    </div>
                )}

                {errors.submit && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <strong className="font-semibold">Error! </strong>
                        <span className="block sm:inline">{errors.submit}</span>
                    </div>
                )}

                {fetchingUsers ? (
                    <div className="text-center py-6 text-blue-600">Loading user options...</div>
                ) : usersError ? (
                    <div className="text-center text-red-600 py-6">Error: {usersError}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Key change here */}
                        {/* Sales Value */}
                        <div>
                            <label htmlFor="salesValue" className="block text-sm font-medium text-gray-700 mb-1">Sales Value <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                id="salesValue"
                                name="salesValue"
                                value={formData.salesValue}
                                onChange={handleChange}
                                placeholder="e.g., 999999999 (up to 99 Crore)"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                max="999999999" // HTML5 max attribute
                                min="1" // HTML5 min attribute
                            />
                            {errors.salesValue && (
                                <p className="text-red-500 text-xs mt-1">{errors.salesValue}</p>
                            )}
                        </div>

                        {/* Created By */}
                        <div>
                            <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700 mb-1">Created By <span className="text-red-500">*</span></label>
                            <select
                                id="createdBy"
                                name="createdBy"
                                value={formData.createdBy}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none"
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
                                <p className="text-red-500 text-xs mt-1">{errors.createdBy}</p>
                            )}
                        </div>

                        {/* From Date */}
                        <div>
                            <label htmlFor="formDate" className="block text-sm font-medium text-gray-700 mb-1">From Date <span className="text-red-500">*</span></label>
                            <input
                                type="datetime-local"
                                id="formDate"
                                name="formDate"
                                value={formData.formDate}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                // min is set by JS validation for datetime-local
                            />
                            {errors.formDate && (
                                <p className="text-red-500 text-xs mt-1">{errors.formDate}</p>
                            )}
                        </div>

                        {/* To Date */}
                        <div>
                            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">To Date <span className="text-red-500">*</span></label>
                            <input
                                type="datetime-local"
                                id="toDate"
                                name="toDate"
                                value={formData.toDate}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                // min is set by JS validation for datetime-local
                            />
                            {errors.toDate && (
                                <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>
                            )}
                        </div>

                        {/* Assigned To */}
                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Assigned To <span className="text-red-500">*</span></label>
                            <select
                                id="assignedTo"
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none"
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
                                <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
                            )}
                        </div>

                        {/* Assigned By */}
                        <div>
                            <label htmlFor="assignedBy" className="block text-sm font-medium text-gray-700 mb-1">Assigned By <span className="text-red-500">*</span></label>
                            <select
                                id="assignedBy"
                                name="assignedBy"
                                value={formData.assignedBy}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none"
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
                                <p className="text-red-500 text-xs mt-1">{errors.assignedBy}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-center mt-8">
                    <button
                        type="submit"
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting || fetchingUsers || companyUsers.length === 0}
                    >
                        {isSubmitting ? 'Setting Target...' : 'Set Target'}
                    </button>
                </div>
            </form>
        </div>
    );
}