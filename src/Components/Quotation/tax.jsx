import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from "react-toastify";
import { ToastContainer  } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ENDPOINTS } from '../../api/constraints';

function Tax() {
  const [formData, setFormData] = useState({
    cTax_name: '',
    fTax_rate: '',
  });
  const [taxRates, setTaxRates] = useState([]);
  const [selectedTax, setSelectedTax] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user data from localStorage and parse it
  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUserData && storedToken) {
      try {
        const userData = JSON.parse(storedUserData);
        setCompanyId(userData.iCompany_id);
        setUserId(userData.iUser_id);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        toast.error('User authentication data is corrupted. Please log in again.');
        setLoading(false);
      }
    } else {
      toast.error('Authentication information not found. Please log in.');
      setLoading(false);
    }
  }, []);

  // Fetch tax rates once companyId and token are available
  useEffect(() => {
    if (companyId && token) {
      fetchTaxRates();
    }
  }, [companyId, token]);

  const fetchTaxRates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ENDPOINTS.TAX}/company/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data && response.data.data) {
        const sortedTaxRates = response.data.data
          .filter(tax => tax.bActive)
          .sort((a, b) => a.cTax_name.localeCompare(b.cTax_name));
        setTaxRates(sortedTaxRates);
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load tax data.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Auto-capitalize the first letter of cTax_name
    let newValue = value;
    if (name === 'cTax_name' && newValue.length > 0) {
      newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'fTax_rate' ? (newValue === '' ? '' : parseFloat(newValue)) : newValue,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cTax_name.trim()) {
      newErrors.cTax_name = 'Tax name is required';
    } else if (taxRates.some(tax =>
      tax.cTax_name.toLowerCase() === formData.cTax_name.toLowerCase() &&
      (!selectedTax || tax.iTax_id !== selectedTax.iTax_id)
    )) {
      newErrors.cTax_name = 'A tax with this name already exists';
    }
    
    if (formData.fTax_rate === '' || isNaN(formData.fTax_rate)) {
      newErrors.fTax_rate = 'Valid tax rate is required';
    } else if (formData.fTax_rate < 0) {
      newErrors.fTax_rate = 'Tax rate cannot be negative';
    } else if (formData.fTax_rate > 100) {
      newErrors.fTax_rate = 'Tax rate cannot exceed 100%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      if (selectedTax) {
        const payload = {
          cTax_name: formData.cTax_name,
          fTax_rate: formData.fTax_rate,
          iUpdated_by: userId,
        };
        await axios.put(`${ENDPOINTS.TAX}/${selectedTax.iTax_id}`, payload, { headers });
        
        // Success message for edit
        toast.success(`Tax rate "${formData.cTax_name}" updated successfully.`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const payload = {
          cTax_name: formData.cTax_name,
          fTax_rate: formData.fTax_rate,
          iCreated_by: userId,
          iCompany_id: companyId,
        };
        await axios.post(ENDPOINTS.TAX, payload, { headers });
        
        // Success message for create
        toast.success(`Tax rate "${formData.cTax_name}" created successfully.`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
      await fetchTaxRates();
      resetForm();
    } catch (error) {
      console.error('Error saving tax rate:', error);
      let errorMessage = 'Failed to save tax rate.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (taxId, taxName) => {
    if (!window.confirm(`Are you sure you want to inactivate the tax rate "${taxName}"?`)) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${ENDPOINTS.TAX}/${taxId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Success message for delete
      toast.success(`Tax rate "${taxName}" inactivated successfully.`, {
        position: "top-right",
        autoClose: 3000,
      });
      await fetchTaxRates();
      
      if (selectedTax && selectedTax.iTax_id === taxId) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      let errorMessage = 'Failed to inactivate tax rate.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cTax_name: '',
      fTax_rate: '',
    });
    setSelectedTax(null);
    setErrors({});
  };

  const filteredTaxRates = taxRates.filter(tax =>
    tax.cTax_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFormValid = () => {
    const isRateValid = formData.fTax_rate !== '' && !isNaN(formData.fTax_rate);
    return formData.cTax_name.trim() !== '' && isRateValid;
  };

  if (!companyId || !token) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Authentication data is missing. Please log in.
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
        {/* Left Panel: Tax List */}
        <div className="bg-white border border-gray-200 rounded-xl mt-[-200px] shadow-lg p-6 w-full md:w-1/2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-2xl text-blue-800">Tax Rates</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search taxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center text-gray-500 py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
              <p>Loading tax rates...</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {filteredTaxRates.length > 0 ? (
                filteredTaxRates.map((tax) => (
                  <div
                    key={tax.iTax_id}
                    className={`p-4 rounded-xl flex justify-between items-center transition-all duration-200 ease-in-out cursor-pointer ${
                      selectedTax?.iTax_id === tax.iTax_id
                        ? 'bg-blue-100 border border-blue-300 shadow-md'
                        : 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      setSelectedTax(tax);
                      setFormData({
                        cTax_name: tax.cTax_name,
                        fTax_rate: tax.fTax_rate,
                      });
                      setErrors({});
                    }}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        {tax.cTax_name}
                        {selectedTax?.iTax_id === tax.iTax_id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Editing
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Rate: {tax.fTax_rate}%
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTax(tax);
                          setFormData({
                            cTax_name: tax.cTax_name,
                            fTax_rate: tax.fTax_rate,
                          });
                          setErrors({});
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                        title="Edit Tax Rate"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tax.iTax_id, tax.cTax_name);
                        }}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                        title="Delete Tax Rate"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  {searchTerm ? 'No matching tax rates found.' : 'No active tax rates found.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Add/Edit Form */}
        <div className="bg-white border border-gray-200 rounded-xl mt-[-200px] shadow-lg p-6 w-full md:w-1/2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedTax ? `Edit ${selectedTax.cTax_name}` : 'Add New Tax Rate'}
            </h2>
            {selectedTax && (
              <button
                onClick={resetForm}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"
                title="Cancel editing"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="cTax_name" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Name *
              </label>
              <input
                type="text"
                id="cTax_name"
                name="cTax_name"
                value={formData.cTax_name}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow ${
                  errors.cTax_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., HST, GST, VAT"
                required
              />
              {errors.cTax_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.cTax_name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="fTax_rate" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%) *
              </label>
              <input
                type="number"
                id="fTax_rate"
                name="fTax_rate"
                value={formData.fTax_rate}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow ${
                  errors.fTax_rate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 13.0"
                step="0.01"
                min="0"
                max="100"
                required
              />
              {errors.fTax_rate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.fTax_rate}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !isFormValid()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : selectedTax ? (
                  'Update Tax Rate'
                ) : (
                  <>
                    <Plus size={18} className="mr-1" />
                    Add Tax Rate
                  </>
                )}
              </button>
                  <ToastContainer position="top-right" autoClose={3000} />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tax;