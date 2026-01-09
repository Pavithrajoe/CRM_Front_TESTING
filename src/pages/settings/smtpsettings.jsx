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
    smtp_id: null,
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: '' });
  // New state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Limits
  const LIMITS = {
    NAME_EMAIL: 75,
    PASSWORD: 17,
    HOST_SERVER: 100,
    PORT: 25
  };

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 4000);
  };

  const validateField = (name, value) => {
    // Mandatory Check
    if (['name', 'email', 'password'].includes(name) && !value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        if (value.length > LIMITS.NAME_EMAIL) return `Max ${LIMITS.NAME_EMAIL} characters`;
        break;

      case 'name':
        if (value.length > LIMITS.NAME_EMAIL) return `Max ${LIMITS.NAME_EMAIL} characters`;
        break;

      case 'password':
        if (value.includes(' ')) return 'Password cannot contain spaces';
        if (value.length !== 17) return 'Password must be exactly 17 characters without spaces';
        break;

      case 'host':
      case 'server':
        if (value.length > LIMITS.HOST_SERVER) return `Max ${LIMITS.HOST_SERVER} characters`;
        break;

      case 'port':
        if (isNaN(value)) return 'Port must be a number';
        if (value.length > LIMITS.PORT) return `Max ${LIMITS.PORT} characters`;
        break;

      default:
        return '';
    }
    return '';
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const res = await fetch(`${ENDPOINTS.SMTP_SETTINGS}/company-smtp`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) {
          showSnackbar('Please ask your super admin to setup SMTP settings', 'info');
          return;
        }
        throw new Error(`GET request failed`);
      }

      const responseData = await res.json();
      const smtp = responseData.data || {};

      setForm({
        smtp_id: smtp.iSMTP_id || null,
        host: smtp.csmtp_host || '',
        port: smtp.ismtp_port?.toString() || '',
        server: smtp.csmtp_server || '',
        name: smtp.csmtp_name || '',
        email: smtp.csmtp_email || '',
        password: smtp.csmtp_password || '',
        isActive: smtp.is_active ?? true,
      });
    } catch (error) {
      showSnackbar('Failed to load SMTP settings.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    const error = validateField(name, val);
    setErrors(prev => ({ ...prev, [name]: error }));

    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //  validation on all fields
    const newErrors = {};
    Object.keys(form).forEach(key => {
      if (key !== 'isActive' && key !== 'smtp_id') {
        const error = validateField(key, form[key]);
        if (error) newErrors[key] = error;
      }
    });

    //  Stop if there are validation errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showSnackbar('Please fix the validation errors before submitting.', 'error');
      return;
    }

    //  Get Auth and ID data
    const token = localStorage.getItem('token');
    if (!token) {
        showSnackbar('Session expired. Please login again.', 'error');
        return;
    }
    
    const isUpdate = !!form.smtp_id; 
    const method = isUpdate ? 'PUT' : 'POST';
    
    // If it's an update, we attach the ID to the URL string
    const url = isUpdate 
      ? `${ENDPOINTS.SMTP_SETTINGS}/${form.smtp_id}` 
      : ENDPOINTS.SMTP_SETTINGS;

    const payload = {
      smtp_host: form.host,
      smtp_port: Number(form.port),
      smtp_server: form.server,
      smtp_name: form.name,
      smtp_email: form.email,
      smtp_password: form.password,
      active: form.isActive,
    };

    if (isUpdate) {
      payload.smtp_id = form.smtp_id;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.message || `HTTP error ${response.status}`;
        throw new Error(errorMsg);
      }

      showSnackbar(`SMTP settings ${isUpdate ? 'updated' : 'created'} successfully!`, 'success');
      
      await loadData(); 

    } catch (error) {
      console.error(`Failed to ${isUpdate ? 'update' : 'create'} SMTP settings:`, error);
      showSnackbar(error.message || 'Failed to save SMTP settings.', 'error');
    }
  };


  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-10 bg-white/60 backdrop-blur-lg border border-gray-200 shadow-xl rounded-3xl p-8 space-y-6"
      >
<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {[
            { label: 'Name', name: 'name', type: 'text', placeholder: 'Enter Name', req: true },
            { label: 'E-mail', name: 'email', type: 'email', placeholder: 'Enter Email', req: true },
            { label: 'Password', name: 'password', type: 'password', placeholder: 'Enter Password', req: true },
            { label: 'Host', name: 'host', type: 'text', placeholder: 'Enter Host name' },
            { label: 'Port', name: 'port', type: 'text', placeholder: 'Enter Port number' },
            { label: 'Server', name: 'server', type: 'text', placeholder: 'Enter Server name' },
          ].map(({ label, name, type, placeholder, req }) => (
            <div key={name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                {label} {req && <span className="text-red-500">*</span>}
              </label>
              
              <div className="relative">
                <input
                  type={name === 'password' ? (showPassword ? 'text' : 'password') : type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  autoComplete={name === 'password' ? "new-password" : "off"}
                  className={`mt-1 w-full rounded-lg border p-2 focus:ring-2 focus:ring-black focus:border-black transition outline-none ${
                    errors[name] ? 'border-red-500' : 'border-gray-300'
                  } ${name === 'password' ? 'pr-10' : ''}`}
                />
                
                {name === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-500 hover:text-black focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {errors[name] && (
                <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[name]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-6">
          <button
            type="submit"
            disabled={Object.values(errors).some(x => x)}
            className="w-full sm:w-auto px-10 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:opacity-50 font-bold"
          >
            Save Changes
          </button>
        </div>
      </form>

      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white text-sm animate-bounce ${
          snackbar.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {snackbar.message}
        </div>
      )}
    </>
  );
}
