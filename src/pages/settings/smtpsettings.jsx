import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../api/constraints';

export default function SmtpSettings() {
  const [form, setForm] = useState({
    host: '',
    port: '',
    server: '',
    name: '',
    email: '',
    password: '',
    isActive: false,
  });
  const [errors, setErrors] = useState({});
  const [, setSmtpId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: '' });

  const MAX_LENGTH = 50;

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ ...snackbar, open: false }), 4000);
  };

  const validateField = (name, value) => {
    if (value.length > MAX_LENGTH) {
      return `Maximum length is ${MAX_LENGTH} characters`;
    }
    return '';
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const res = await fetch(`${ENDPOINTS.BASE_URL_IS}/smtp-settings/company-smtp`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          showSnackbar('Please ask your super admin to setup SMTP settings', 'info');
          return;
        }
        throw new Error(`GET request failed with status ${res.status}`);
      }

      const responseData = await res.json();
      const smtp = responseData.data || {};

      if (!smtp.iSMTP_id) {
        showSnackbar('Please ask your super admin to setup SMTP settings', 'info');
        return;
      }

      setSmtpId(smtp.iSMTP_id);
      setForm({
        smtp_id: smtp.iSMTP_id,
        host: smtp.csmtp_host || '',
        port: smtp.ismtp_port?.toString() || '',
        server: smtp.csmtp_server || '',
        name: smtp.csmtp_name || '',
        email: smtp.csmtp_email || '',
        password: smtp.csmtp_password || '',
        isActive: smtp.is_active || true,
      });
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
      showSnackbar('Failed to load SMTP settings from server.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const error = validateField(name, value);
    setErrors({
      ...errors,
      [name]: error
    });

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    Object.keys(form).forEach(key => {
      if (key !== 'isActive' && key !== 'smtp_id') {
        const error = validateField(key, form[key]);
        if (error) newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showSnackbar('Please fix the validation errors before submitting.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const tokenpayload = JSON.parse(atob(base64));
    const companyId = tokenpayload.company_id;

    const payload = {
      smtp_host: form.host,
      smtp_port: Number(form.port),
      smtp_server: form.server,
      smtp_name: form.name,
      smtp_email: form.email,
      smtp_password: form.password,
      active: form.isActive,
    };

    const isUpdate = !!form.smtp_id; 
    const url = `${ENDPOINTS.BASE_URL_IS}/smtp-settings/${companyId}`;
    const method = isUpdate ? 'PUT' : 'POST';

    if (isUpdate) {
      payload.smtp_id = form.smtp_id; 
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      showSnackbar(`SMTP settings ${isUpdate ? 'updated' : 'created'} successfully!`, 'success');
      await loadData(); 
    } catch (error) {
      console.error(`Failed to ${isUpdate ? 'update' : 'create'} SMTP settings:`, error);
      showSnackbar('Failed to save SMTP settings. See console for error.', 'error');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto p-6 bg-white rounded-2xl shadow-xl">
        <div className="grid grid-cols-1 py-10 sm:grid-cols-2 gap-4">
          {/* Host */}
          <div>
            <label className="block text-sm rounded font-medium text-gray-700">Host</label>
            <input
              type="text"
              name="host"
              placeholder="Host name"
              autoComplete="off"
              value={form.host}
              onChange={handleChange}
              maxLength={MAX_LENGTH}
              className="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm focus:ring-black focus:border-black"
            />
            {errors.host && <p className="text-red-500 text-xs mt-1">{errors.host}</p>}
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Port</label>
            <input
              type="text"
              name="port"
              placeholder="Port number"
              autoComplete="off"
              value={form.port}
              onChange={handleChange}
              maxLength={MAX_LENGTH}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:ring-black focus:border-black"
            />
            {errors.port && <p className="text-red-500 text-xs mt-1">{errors.port}</p>}
          </div>

          {/* Server */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Server</label>
            <input
              type="text"
              name="server"
              placeholder="Server name"
              autoComplete="off"
              value={form.server}
              onChange={handleChange}
              maxLength={MAX_LENGTH}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:ring-black focus:border-black"
            />
            {errors.server && <p className="text-red-500 text-xs mt-1">{errors.server}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              maxLength={MAX_LENGTH}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:ring-black focus:border-black"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              maxLength={MAX_LENGTH}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:ring-black focus:border-black"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              maxLength={MAX_LENGTH}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:ring-black focus:border-black"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
        </div>

        {/* Toggle Active */}
        <div className="flex items-center justify-between mt-6">
          <label className="inline-flex relative items-center cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-all duration-300"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full peer-checked:translate-x-full peer-checked:border-black transition-transform duration-300 border"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">Active / Inactive</span>
          </label>

          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            disabled={Object.keys(errors).some(key => errors[key])}
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Snackbar Notification */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 px-6 py-6 rounded-md shadow-xl text-white ${
          snackbar.type === 'error' ? 'bg-red-500' : 
          snackbar.type === 'success' ? 'bg-green-500' : 'bg-blue-900'
        }`}>
          {snackbar.message}
        </div>
      )}
    </>
  );
}