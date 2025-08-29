import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
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

  // Fetch user data from localStorage on component mount
  useEffect(() => {
    const storedCompanyId = localStorage.getItem('iCompany_id');
    const storedUserId = localStorage.getItem('iUser_id');
    const storedToken = localStorage.getItem('token');

    if (storedCompanyId && storedUserId && storedToken) {
      setCompanyId(parseInt(storedCompanyId));
      setUserId(parseInt(storedUserId));
      setToken(storedToken);
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
    const response = await axios.get(`${ENDPOINTS.TAX}/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data && response.data.data) {
        setTaxRates(response.data.data.filter(tax => tax.bActive));
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      toast.error('Failed to load tax data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'fTax_rate' ? parseFloat(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.cTax_name || formData.fTax_rate === '' || isNaN(formData.fTax_rate)) {
      toast.error('Tax name and a valid rate are required.');
      return;
    }

    setIsSaving(true);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      if (selectedTax) {
        // Update an existing tax rate (PUT request)
        const payload = {
          iTax_id: selectedTax.iTax_id,
          cTax_name: formData.cTax_name,
          fTax_rate: formData.fTax_rate,
          iUpdated_by: userId,
        };
        await axios.put(ENDPOINTS.TAX(taxId)),
        toast.success('Tax rate updated successfully.');
      } else {
        // Create a new tax rate (POST request)
        const payload = {
          cTax_name: formData.cTax_name,
          fTax_rate: formData.fTax_rate,
          iCreated_by: userId,
        };
        await axios.post(ENDPOINTS.TAX, payload, { headers });
        toast.success('Tax rate created successfully.');
      }
      await fetchTaxRates();
      resetForm();
    } catch (error) {
      console.error('Error saving tax rate:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save tax rate.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (taxId) => {
    if (!window.confirm('Are you sure you want to inactivate this tax rate?')) return;

    setIsDeleting(true);
    try {
      await axios.delete(ENDPOINTS.TAX(taxId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Tax rate inactivated successfully.');
      await fetchTaxRates();
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      toast.error('Failed to inactivate tax rate.');
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
  };

  if (!companyId || !token) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Authentication data is missing. Please log in.
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex items-start justify-center">
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6">
        {/* Left Panel: Tax List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 w-full md:w-1/2">
          <h2 className="font-bold text-2xl text-blue-900 text-center mb-6">
            Tax Rates
          </h2>
          {loading ? (
            <div className="text-center text-gray-500">Loading tax rates...</div>
          ) : (
            <ul className="space-y-4 max-h-[600px] overflow-y-auto">
              {taxRates.length > 0 ? (
                taxRates.map((tax) => (
                  <li
                    key={tax.iTax_id}
                    className={`py-3 px-4 rounded-lg flex justify-between items-center transition-all duration-200 ease-in-out ${
                      selectedTax?.iTax_id === tax.iTax_id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">{tax.cTax_name}</h4>
                      <p className="text-sm text-gray-600">
                        Rate: {tax.fTax_rate}%
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTax(tax);
                          setFormData({
                            cTax_name: tax.cTax_name,
                            fTax_rate: tax.fTax_rate,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-gray-200 transition"
                        title="Edit Tax Rate"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(tax.iTax_id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-gray-200 transition disabled:opacity-50"
                        title="Delete Tax Rate"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-center py-4 list-none">
                  No active tax rates found.
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Right Panel: Add/Edit Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 w-full md:w-1/2">
          <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
            {selectedTax ? 'Edit Tax Rate' : 'Add New Tax Rate'}
          </h2>

          <div className="space-y-5">
            <div>
              <label htmlFor="cTax_name" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Name
              </label>
              <input
                type="text"
                id="cTax_name"
                name="cTax_name"
                value={formData.cTax_name}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., HST, GST"
                required
              />
            </div>

            <div>
              <label htmlFor="fTax_rate" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                id="fTax_rate"
                name="fTax_rate"
                value={formData.fTax_rate}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., 13.0"
                step="0.01"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {(selectedTax || formData.cTax_name || formData.fTax_rate !== '') && (
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.cTax_name || formData.fTax_rate === '' || isNaN(formData.fTax_rate)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : selectedTax ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tax;