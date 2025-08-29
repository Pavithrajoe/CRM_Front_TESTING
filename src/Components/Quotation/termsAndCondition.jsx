import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Assuming ENDPOINTS are defined correctly elsewhere
import { ENDPOINTS } from '../../api/constraints';

function TermsAndConditions() {
  const [formData, setFormData] = useState({
    cTerm_text: '',
    iOrder: 1,
  });
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  // Fetch user data from localStorage and parse it
  useEffect(() => {
    const storedUserData = localStorage.getItem('user'); // Use 'user' key as per previous prompt
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

  // Fetch terms once companyId and token are available
  useEffect(() => {
    if (companyId && token) {
      fetchTerms();
    }
  }, [companyId, token]);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ENDPOINTS.TERMS}/company/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data && response.data.data) {
        // Sort terms numerically by their 'iOrder' value
        const sortedTerms = response.data.data
          .filter(term => term.bActive)
          .sort((a, b) => a.iOrder - b.iOrder);
        setTerms(sortedTerms);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load terms and conditions.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'iOrder' ? parseInt(value, 10) : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.cTerm_text || formData.iOrder < 1) {
      toast.error('Term text is required and order must be a positive number.');
      return;
    }

    // Check for duplicate term text before saving a new term
    if (!selectedTerm) {
      const isDuplicate = terms.some(
        (term) => term.cTerm_text.trim().toLowerCase() === formData.cTerm_text.trim().toLowerCase()
      );
      if (isDuplicate) {
        toast.error('A term with this exact text already exists.');
        return;
      }
    }

    setIsSaving(true);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      if (selectedTerm) {
        const payload = {
          cTerm_text: formData.cTerm_text,
          iOrder: formData.iOrder,
          iUpdated_by: userId,
        };
        await axios.put(`${ENDPOINTS.TERMS}/${selectedTerm.iTerm_id}`, payload, { headers });
        toast.success('Term updated successfully.');
      } else {
        const payload = {
          cTerm_text: formData.cTerm_text,
          iOrder: formData.iOrder,
          iCompany_id: companyId,
          iCreated_by: userId,
          bActive:true,
        };
        await axios.post(ENDPOINTS.TERMS, payload, { headers });
        toast.success('Term created successfully.');
      }
      await fetchTerms();
      resetForm();
    } catch (error) {
      console.error('Error saving term:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save term.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (termId) => {
    if (!window.confirm('Are you sure you want to delete this term?')) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${ENDPOINTS.TERMS}/${termId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Term deleted successfully.');
      await fetchTerms();
    } catch (error) {
      console.error('Error deleting term:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete term.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cTerm_text: '',
      iOrder: 1,
    });
    setSelectedTerm(null);
  };

  // Helper function for button state
  const isFormValid = () => {
    return formData.cTerm_text.trim() !== '' && formData.iOrder >= 1;
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
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        {/* Left Panel: Terms List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-6 w-full md:w-1/2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
          <h2 className="font-bold text-3xl text-blue-900 text-center mb-6 border-b-2 pb-2">
            Terms and Conditions
          </h2>
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading terms...</div>
          ) : (
            <ul className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {terms.length > 0 ? (
                terms.map((term) => (
                  <li
                    key={term.iTerm_id}
                    className={`py-4 px-6 rounded-xl flex justify-between items-center transition-all duration-300 ease-in-out cursor-pointer ${
                      selectedTerm?.iTerm_id === term.iTerm_id ? 'bg-blue-100 border-2 border-blue-400 shadow-lg' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedTerm(term);
                      setFormData({
                        cTerm_text: term.cTerm_text,
                        iOrder: term.iOrder,
                      });
                    }}
                  >
                    <div className="w-full">
                      <h4 className="font-semibold text-lg text-gray-800 mb-1">Order: {term.iOrder}</h4>
                      <p className="text-sm text-gray-600 break-words">
                        {term.cTerm_text}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTerm(term);
                          setFormData({
                            cTerm_text: term.cTerm_text,
                            iOrder: term.iOrder,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-200 transition-colors"
                        title="Edit Term"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(term.iTerm_id);
                        }}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                        title="Delete Term"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-center py-4 list-none">
                  No active terms found.
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Right Panel: Add/Edit Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-8 w-full md:w-1/2">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
            {selectedTerm ? 'Edit Term' : 'Add New Term'}
          </h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="iOrder" className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <input
                type="number"
                id="iOrder"
                name="iOrder"
                value={formData.iOrder}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="e.g., 1"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="cTerm_text" className="block text-sm font-medium text-gray-700 mb-2">
                Term Text
              </label>
              <textarea
                id="cTerm_text"
                name="cTerm_text"
                value={formData.cTerm_text}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Enter term text"
                rows="5"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {isFormValid() && (
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !isFormValid()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : selectedTerm ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;