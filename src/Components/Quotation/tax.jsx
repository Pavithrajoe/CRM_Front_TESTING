import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, AlertCircle, Search, RefreshCw } from 'lucide-react'; 
import axios from 'axios';
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import { ENDPOINTS } from '../../api/constraints';

// Custom Spinner Component for better loading state
const Spinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);


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

    // --- Data Fetching and Authentication Logic ---
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
            // Only set loading false if auth data is explicitly missing
            if (storedUserData === null || storedToken === null) {
                setLoading(false);
            }
            // The return statement below will handle the UI if companyId/token are null
        }
    }, []);

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
            } else {
                setTaxRates([]);
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

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        let newValue = value;
        if (name === 'cTax_name') {
            // No automatic capitalization on every change to allow free typing
            newValue = value;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'fTax_rate' ? (newValue === '' ? '' : newValue) : newValue,
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        // Normalizing the tax name before validation and saving
        const normalizedTaxName = formData.cTax_name.trim().split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Ensure formData has the normalized name for saving, but validation uses the original.
        setFormData(prev => ({ ...prev, cTax_name: normalizedTaxName }));

        if (!formData.cTax_name.trim()) {
            newErrors.cTax_name = 'Tax name is required';
        } else if (taxRates.some(tax =>
            tax.cTax_name.toLowerCase() === formData.cTax_name.trim().toLowerCase() &&
            (!selectedTax || tax.iTax_id !== selectedTax.iTax_id)
        )) {
            newErrors.cTax_name = 'A tax with this name already exists';
        }

        const rate = parseFloat(formData.fTax_rate);
        if (formData.fTax_rate === '' || isNaN(rate)) {
            newErrors.fTax_rate = 'Valid tax rate is required';
        } else if (rate < 0) {
            newErrors.fTax_rate = 'Tax rate cannot be negative';
        } else if (rate > 100) {
            newErrors.fTax_rate = 'Tax rate cannot exceed 100%';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Save, Delete, Reset Logic ---
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        
        // Use normalized tax name from formData
        const nameToSave = formData.cTax_name;
        const rateToSave = parseFloat(formData.fTax_rate);

        try {
            if (selectedTax) {
                const payload = {
                    cTax_name: nameToSave,
                    fTax_rate: rateToSave,
                    iUpdated_by: userId,
                };
                await axios.put(`${ENDPOINTS.TAX}/${selectedTax.iTax_id}`, payload, { headers });

                toast.success(`Tax rate "${nameToSave}" updated successfully.`, { position: "top-right", autoClose: 3000 });
            } else {
                const payload = {
                    cTax_name: nameToSave,
                    fTax_rate: rateToSave,
                    iCreated_by: userId,
                    iCompany_id: companyId,
                    bActive: true,
                };
                await axios.post(ENDPOINTS.TAX, payload, { headers });

                toast.success(`Tax rate "${nameToSave}" created successfully.`, { position: "top-right", autoClose: 3000 });
            }
            await fetchTaxRates();
            resetForm();
        } catch (error) {
            console.error('Error saving tax rate:', error);
            let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save tax rate.';

            toast.error(errorMessage, { position: "top-right", autoClose: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (taxId, taxName) => {
        if (!window.confirm(`Are you sure you want to inactivate the tax rate "${taxName}"? This tax will no longer appear in your active lists.`)) return;

        setIsDeleting(true);
        try {
            // Note: This delete endpoint likely performs a soft-delete (bActive = false)
            await axios.delete(`${ENDPOINTS.TAX}/${taxId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast.success(`Tax rate "${taxName}" inactivated successfully. 🗑️`, { position: "top-right", autoClose: 3000 });
            await fetchTaxRates();

            if (selectedTax && selectedTax.iTax_id === taxId) {
                resetForm();
            }
        } catch (error) {
            console.error('Error deleting tax rate:', error);
            let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to inactivate tax rate.';

            toast.error(errorMessage, { position: "top-right", autoClose: 5000 });
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

    const handleEditClick = (tax) => {
        setSelectedTax(tax);
        setFormData({
            cTax_name: tax.cTax_name,
            fTax_rate: tax.fTax_rate.toString(), // Convert number to string for input value
        });
        setErrors({});
    };

    const filteredTaxRates = taxRates.filter(tax =>
        tax.cTax_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isFormValid = () => {
        const isRateValid = formData.fTax_rate !== '' && !isNaN(parseFloat(formData.fTax_rate));
        return formData.cTax_name.trim() !== '' && isRateValid;
    };
    // --- END Logic ---

    // --- Authentication Check Render ---
    if (!companyId || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="p-8 bg-white border border-red-200 rounded-xl shadow-lg text-center">
                    <p className="text-xl text-red-600 font-bold mb-2">Access Denied</p>
                    <p className="text-gray-600">Authentication data is missing. Please log in to manage tax rates.</p>
                </div>
                 <ToastContainer position="top-right" autoClose={3000} />
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <ToastContainer position="bottom-right" autoClose={3000} />
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Panel: Tax List */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 lg:col-span-2  h-[580px] order-2 lg:order-1"> 
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                        <h2 className="font-extrabold text-3xl text-blue-800">Active Tax Rates</h2>
                        <div className='flex items-center space-x-3 mt-4 sm:mt-0'>
                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search tax by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition w-full"
                                />
                                <Search
                                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                            </div>
                             <button
                                onClick={fetchTaxRates}
                                disabled={loading || isDeleting || isSaving}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full disabled:opacity-50"
                                title="Refresh Tax Rates"
                            >
                                <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                    
                    {loading ? (
                        <Spinner />
                    ) : (
                        <div className="max-h-[70vh] overflow-y-auto pr-3">
                            <ul className="space-y-4">
                                {filteredTaxRates.length > 0 ? (
                                    filteredTaxRates.map((tax) => (
                                        <li
                                            key={tax.iTax_id}
                                            className={`p-4 rounded-xl flex justify-between items-center transition-all duration-300 ease-in-out cursor-pointer shadow-md border-l-4 
                                                ${selectedTax?.iTax_id === tax.iTax_id
                                                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-300'
                                                    : 'bg-white border-gray-200 hover:bg-gray-100'
                                                }`}
                                            onClick={() => handleEditClick(tax)}
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="font-bold text-xl text-gray-900 truncate">
                                                    {tax.cTax_name}
                                                </h4>
                                                <p className="text-base text-gray-600 mt-1">
                                                    Rate: 
                                                    <span className="font-extrabold text-2xl text-green-600 ml-2">
                                                        {parseFloat(tax.fTax_rate).toFixed(2)}%
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex space-x-2 ml-4 self-center">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(tax);
                                                    }}
                                                    className="p-2 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                                                    title="Edit Tax Rate"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(tax.iTax_id, tax.cTax_name);
                                                    }}
                                                    disabled={isDeleting}
                                                    className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                                                    title="Inactivate Tax Rate"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <div className="text-center py-16 text-gray-500 bg-gray-100 rounded-xl border border-dashed border-gray-300">
                                        <AlertCircle size={30} className="mx-auto text-gray-400 mb-3" />
                                        <p className="text-lg font-medium">{searchTerm ? 'No matching tax rates found.' : 'No active tax rates found. Start by adding one!'}</p>
                                    </div>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right Panel: Add/Edit Form */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 w-full lg:col-span-1 sticky top-4 order-1 lg:order-2 h-[580px]"> 
                    <div className="flex justify-between items-center mb-8 border-b pb-4 ">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                             {selectedTax ? (
                                <>
                                    <Edit size={24} className="mr-2 text-orange-500" /> Edit Tax Rate
                                </>
                            ) : (
                                <>
                                    <Plus size={24} className="mr-2 text-green-500" /> Create New Rate
                                </>
                            )}
                        </h2>
                        {selectedTax && (
                            <button
                                onClick={resetForm}
                                className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                title="Cancel editing and create new"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Tax Name Input */}
                        <div>
                            <label htmlFor="cTax_name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Tax Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="cTax_name"
                                name="cTax_name"
                                value={formData.cTax_name}
                                onChange={handleChange}
                                className={`w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-shadow text-lg 
                                    ${errors.cTax_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                                placeholder="e.g., HST, VAT, GST"
                                required
                            />
                            {errors.cTax_name && (
                                <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                                    {errors.cTax_name}
                                </p>
                            )}
                        </div>

                        {/* Tax Rate Input */}
                        <div>
                            <label htmlFor="fTax_rate" className="block text-sm font-semibold text-gray-700 mb-2">
                                Tax Rate (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="fTax_rate"
                                name="fTax_rate"
                                value={formData.fTax_rate}
                                onChange={handleChange}
                                className={`w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-shadow text-lg 
                                    ${errors.fTax_rate ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                                placeholder="e.g., 13.00"
                                step="0.01"
                                min="0"
                                max="100"
                                required
                            />
                            {errors.fTax_rate && (
                                <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                                    {errors.fTax_rate}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t pt-6">
                            <button
                                onClick={resetForm}
                                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !isFormValid()}
                                className={`px-6 py-3 font-semibold text-white rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px] shadow-lg
                                     ${selectedTax
                                        ? 'bg-orange-500 hover:bg-orange-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : selectedTax ? (
                                    <>
                                        <Edit size={20} className="mr-2" />
                                        Update Rate
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} className="mr-2" />
                                        Add Rate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Tax;