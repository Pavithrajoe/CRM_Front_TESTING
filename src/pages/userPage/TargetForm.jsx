import React, { useState, useEffect } from 'react';
import { X } from "lucide-react";

export default function SalesForm({ onClose }) {
  const ENDPOINTS = {
    USER_POST: "http://192.168.1.75:3000/api/user-target",
    USER_GET: "http://192.168.1.75:3000/api/users",
  };

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const token = localStorage.getItem("token");

  const currentUserId = (() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.user_id || payload.iUser_id || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  })();

  const [formData, setFormData] = useState({
    salesValue: '',
    formDate: getCurrentDateTimeLocal(),
    toDate: '',
    assignedTo: '',
    assignedBy: currentUserId?.toString() || '',
    createdBy: currentUserId?.toString() || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [companyUsers, setCompanyUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const getCompanyId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.company_id || payload.iCompany_id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchCompanyUsers = async () => {
      setFetchingUsers(true);
      const companyId = getCompanyId();
      if (!companyId) {
        setUsersError("Company ID not found in token.");
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
        const data = await response.json();
        const filtered = data.filter(user => user.iCompany_id === companyId);
        setCompanyUsers(filtered);

        // Find and set current user
        const currentUser = filtered.find(user => user.iUser_id === currentUserId);
        if (currentUser) {
          setCurrentUser(currentUser);
          setFormData(prev => ({ 
            ...prev, 
            assignedBy: currentUser.iUser_id.toString(),
            createdBy: currentUser.iUser_id.toString()
          }));
        }

        // If only one user, auto-assign to them
        if (filtered.length === 1) {
          const id = filtered[0].iUser_id.toString();
          setFormData(prev => ({ ...prev, assignedTo: id }));
        }
      } catch (err) {
        setUsersError("Failed to load users.");
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchCompanyUsers();
  }, []);
  const fetchUsers = useCallback(async () => {
      setLoading(true);
      setError(null);
      const companyId = getCompanyId();
      if (!companyId) {
        console.warn("No company ID found in token. Cannot fetch users.");
        setError("Authentication error: No company ID found.");
        setLoading(false);
        return;
      }
  
      try {
        const response = await fetch(ENDPOINTS.USER_GET, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
  
        const data = await response.json();
        console.log("Fetched users:", data);
        const companyUsers = data.filter((user) => user.iCompany_id === companyId);
        setUsers(companyUsers); // Set all company users
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    }, []);
  
    useEffect(() => {
      fetchUsers();
    }, [fetchUsers]);
  
    // Effect to filter users based on search term and active/inactive tab
    // Removed broken/incomplete useEffect and related code

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const newErrors = {};
    const now = new Date();

    if (!formData.salesValue) {
      newErrors.salesValue = 'Sales Value is required';
    } else {
      const val = parseFloat(formData.salesValue);
      if (isNaN(val)) { // <-- Corrected line: added missing ')'
        newErrors.salesValue = 'Must be a valid number';
      } else if (val <= 0) {
        newErrors.salesValue = 'Must be a positive number';
      } else if (val > 99999999) {
        newErrors.salesValue = 'Cannot exceed 99,999,999';
      }
    }

    if (!formData.formDate) newErrors.formDate = 'From Date is required';
    if (!formData.toDate) newErrors.toDate = 'To Date is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Assigned To is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const formatDate = (dt) => `${dt.replace('T', ' ')}:00`;

    const body = {
      salesValue: parseFloat(formData.salesValue),
      fromDate: formatDate(formData.formDate),
      toDate: formatDate(formData.toDate),
      assignedTo: parseInt(formData.assignedTo),
      assignedBy: parseInt(formData.assignedBy),
      createdBy: parseInt(formData.createdBy),
    };

    try {
      const res = await fetch(ENDPOINTS.USER_POST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmissionMessage('Sales target submitted successfully!');
      setFormData({
        salesValue: '',
        formDate: getCurrentDateTimeLocal(),
        toDate: '',
        assignedTo: '',
        assignedBy: currentUserId?.toString() || '',
        createdBy: currentUserId?.toString() || '',
      });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50 z-50">
      <form onSubmit={handleSubmit} className="relative bg-white p-6 rounded-xl max-w-2xl w-full">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X /></button>
        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Set Sales Target</h2>

        {submissionMessage && <div className="bg-green-100 p-3 rounded text-green-700 mb-4">{submissionMessage}</div>}
        {errors.submit && <div className="bg-red-100 p-3 rounded text-red-700 mb-4">{errors.submit}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1">Sales Value *</label>
            <input
              type="number"
              name="salesValue"
              value={formData.salesValue}
              onChange={handleChange}
              max="99999999"
              min="1"
              step="0.01"
              className="w-full border p-2 rounded"
            />
            {errors.salesValue && <p className="text-red-500 text-sm mt-1">{errors.salesValue}</p>}
          </div>

          <div>
            <label className="block mb-1">From Date *</label>
            <input
              type="datetime-local"
              name="formDate"
              value={formData.formDate}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {errors.formDate && <p className="text-red-500 text-sm mt-1">{errors.formDate}</p>}
          </div>

          <div>
            <label className="block mb-1">To Date *</label>
            <input
              type="datetime-local"
              name="toDate"
              value={formData.toDate}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            {errors.toDate && <p className="text-red-500 text-sm mt-1">{errors.toDate}</p>}
          </div>

          <div>
            <label className="block mb-1">Assigned To *</label>
            <select
              name="assignedTo"
              value={user.cFull_name}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Select User</option>
              {companyUsers.map(user => (
          <div>
            <label className="block mb-1">Assigned To *</label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Select User</option>
              {companyUsers.map(user => (
                <option key={user.iUser_id} value={user.iUser_id}>{user.cFull_name}</option>
              ))}
            </select>
            {errors.assignedTo && <p className="text-red-500 text-sm mt-1">{errors.assignedTo}</p>}
          </div>
            <div className="bg-gray-100 p-2 rounded">
              {currentUser?.cFull_name || 'Current User'}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Set Target'}
          </button>
        </div>
      </form>
    </div>
  );
}