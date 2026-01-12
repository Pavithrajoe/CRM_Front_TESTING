import React, { useState } from 'react';
import { X } from "lucide-react";
import { ENDPOINTS } from '../../api/constraints';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { format } from 'date-fns';

// Props: cuserid (user id), enmail (user email), defaultFromDate, defaultToDate, onClose
export default function SalesForm({ userId, userEmail
, defaultFromDate, defaultToDate, onClose }) {
  const token = localStorage.getItem("token");
  const decodeToken = (t) => {
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload;
    } catch (error) {
      return null;
    }
  };
  const tokenPayload = decodeToken(token);
  const currentUserId = tokenPayload?.user_id || tokenPayload?.iUser_id || '';

  const [formData, setFormData] = useState({
    salesValue: '',
    fromDate: defaultFromDate ? new Date(defaultFromDate) : new Date(),
    toDate: defaultToDate ? new Date(defaultToDate) : null,
    assignedTo: userId ? userId.toString() : '',
    assignedBy: currentUserId?.toString() || '',
    createdBy: currentUserId?.toString() || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');

  // Input change for text fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Date picker change
  const handleDateChange = (name, newValue) => {
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.salesValue) newErrors.salesValue = 'Sales Value is required';
    else {
      const val = parseFloat(formData.salesValue);
      if (isNaN(val)) newErrors.salesValue = 'Must be a valid number';
      else if (val <= 0) newErrors.salesValue = 'Must be a positive number';
      else if (val > 99999999) newErrors.salesValue = 'Cannot exceed 99,999,999';
    }
    if (!formData.fromDate) newErrors.fromDate = 'From Date is required';
    if (!formData.toDate) newErrors.toDate = 'To Date is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Assigned To is required';
    if (formData.fromDate && formData.toDate &&
        new Date(formData.fromDate) >= new Date(formData.toDate)) {
      newErrors.toDate = 'To Date must be after From Date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const formatDate = (date) => date ? format(date, 'yyyy-MM-dd HH:mm:ss') : '';
    const body = {
      salesValue: parseFloat(formData.salesValue),
      fromDate: formatDate(formData.fromDate),
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Submission failed');
      setSubmissionMessage('Sales target submitted successfully!');
      setFormData(prev => ({
        ...prev,
        salesValue: '',
        fromDate: new Date(),
        toDate: null,
      }));
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50 z-50" onClick={onClose}>
        <form 
          onSubmit={handleSubmit} 
          className="relative bg-white p-6 rounded-xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X /></button>
          <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Set Sales Target</h2>

          {submissionMessage && <div className="bg-green-100 p-3 rounded text-green-700 mb-4">{submissionMessage}</div>}
          {errors.submit && <div className="bg-red-100 p-3 rounded text-red-700 mb-4">{errors.submit}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1">From Date <span className='text-red-600'>*</span></label>
              <DateTimePicker
                value={formData.fromDate}
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  seconds: renderTimeViewClock,
                }}
                onChange={(newValue) => handleDateChange("fromDate", newValue)}
                format="dd/MM/yyyy HH:mm:ss"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    className: 'w-full',
                    inputProps: { className: 'w-full border p-2 rounded' }
                  },
                }}
              />
              {errors.fromDate && <p className="text-red-500 text-sm mt-1">{errors.fromDate}</p>}
            </div>

            <div>
              <label className="block mb-1">To Date <span className='text-red-600'>*</span></label>
              <DateTimePicker
                value={formData.toDate}
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  seconds: renderTimeViewClock,
                }}
                onChange={(newValue) => handleDateChange("toDate", newValue)}
                minDateTime={formData.fromDate}
                format="dd/MM/yyyy HH:mm:ss"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    className: 'w-full',
                    inputProps: { className: 'w-full border p-2 rounded' }
                  },
                }}
              />
              {errors.toDate && <p className="text-red-500 text-sm mt-1">{errors.toDate}</p>}
            </div>

            <div>
              <label className="block mb-1">Sales Value <span className='text-red-600'>*</span></label>
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
              <label className="block mb-1">Assigned To <span className='text-red-600'>*</span></label>
            <div className="w-full border p-2 rounded bg-gray-100">
              {userEmail}
            </div>
            <input type="hidden" name="assignedTo" value={formData.assignedTo} />

              {errors.assignedTo && <p className="text-red-500 text-sm mt-1">{errors.assignedTo}</p>}
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
    </LocalizationProvider>
  );
}
