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

      await response.json();
      showSnackbar(`SMTP settings ${isUpdate ? 'updated' : 'created'} successfully!`, 'success');
      await loadData(); 
    } catch (error) {
      console.error(`Failed to ${isUpdate ? 'update' : 'create'} SMTP settings:`, error);
      showSnackbar('Failed to save SMTP settings. See console for error.', 'error');
    }
  };

  return (
    <>
      <form 
        onSubmit={handleSubmit} 
        className="
           mx-auto mt-10 bg-white/60 backdrop-blur-lg border h-[40vh] border-gray-200 shadow-xl rounded-3xl p-8 space-y-6
        "
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 " >
          {[
            { label: 'Host', name: 'host', type: 'text', placeholder: 'Host name' },
            { label: 'Port', name: 'port', type: 'text', placeholder: 'Port number' },
            { label: 'Server', name: 'server', type: 'text', placeholder: 'Server name' },
            { label: 'Name', name: 'name', type: 'text', placeholder: 'Your name' },
            { label: 'E-mail', name: 'email', type: 'email', placeholder: 'Email address' },
            { label: 'Password', name: 'password', type: 'password', placeholder: 'Password' },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                maxLength={MAX_LENGTH}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-black focus:border-black transition"
              />
              {errors[name] && (
                <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Toggle + Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10">
          <label className="inline-flex items-center cursor-pointer mt-10">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-all duration-300 relative">
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full peer-checked:translate-x-full border transition-transform duration-300"></div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">Active / Inactive</span>
          </label>

          <button
            type="submit"
            disabled={Object.keys(errors).some(key => errors[key])}
            className="w-full sm:w-auto px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:opacity-50 mt-10"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white text-sm ${
          snackbar.type === 'error'
            ? 'bg-red-500'
            : snackbar.type === 'success'
            ? 'bg-green-500'
            : 'bg-blue-900'
        }`}>
          {snackbar.message}
        </div>
      )}
    </>
  );
}
