import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, AlertCircle, Search, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import { ENDPOINTS } from '../../api/constraints';

// Custom Spinner Component for better loading state
const Spinner = () => (
    <div className="flex justify-center items-center py-12"> {/* Reduced padding */}
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-blue-600"></div> {/* Slightly smaller spinner */}
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
        <div className="min-h-[80vh] bg-gray-50 p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Reduced gap */}
                
                {/* Right Panel: Add/Edit Form (Order 1 on mobile, Order 2 on large screens) */}
                {/* Removed lg:min-h-[400px] to let it shrink */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-5 w-full lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-6"> 
                    <div className="flex justify-between items-center mb-6 border-b pb-3 "> {/* Reduced margin and padding */}
                        <h2 className="text-xl font-bold text-gray-800 flex items-center"> {/* Reduced font size */}
                              {selectedTax ? (
                                <>
                                    <Edit size={20} className="mr-2 text-orange-500" /> Edit Tax Rate
                                </>
                            ) : (
                                <>
                                    <Plus size={20} className="mr-2 text-green-500" /> Create New Rate
                                </>
                            )}
                        </h2>
                        {selectedTax && (
                            <button
                                onClick={resetForm}
                                className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                title="Cancel editing and create new"
                            >
                                <X size={20} /> {/* Reduced icon size */}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4"> {/* Reduced space-y */}
                        {/* Tax Name Input */}
                        <div>
                            <label htmlFor="cTax_name" className="block text-sm font-semibold text-gray-700 mb-1"> {/* Reduced margin */}
                                Tax Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="cTax_name"
                                name="cTax_name"
                                value={formData.cTax_name}
                                onChange={handleChange}
                                className={`w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow text-base 
                                    ${errors.cTax_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`} // Reduced padding and font size
                                placeholder="e.g., HST, VAT, GST"
                                required
                            />
                            {errors.cTax_name && (
                                <p className="mt-1 text-xs text-red-600 flex items-center bg-red-50 p-1 rounded-md"> {/* Reduced padding and font size */}
                                    <AlertCircle size={14} className="mr-1 flex-shrink-0" /> {/* Reduced icon size */}
                                    {errors.cTax_name}
                                </p>
                            )}
                        </div>

                        {/* Tax Rate Input */}
                        <div>
                            <label htmlFor="fTax_rate" className="block text-sm font-semibold text-gray-700 mb-1"> {/* Reduced margin */}
                                Tax Rate (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="fTax_rate"
                                name="fTax_rate"
                                value={formData.fTax_rate}
                                onChange={handleChange}
                                className={`w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow text-base 
                                    ${errors.fTax_rate ? 'border-red-500 ring-red-200' : 'border-gray-300'}`} // Reduced padding and font size
                                placeholder="e.g., 13.00"
                                step="0.01"
                                min="0"
                                max="100"
                                required
                            />
                            {errors.fTax_rate && (
                                <p className="mt-1 text-xs text-red-600 flex items-center bg-red-50 p-1 rounded-md"> {/* Reduced padding and font size */}
                                    <AlertCircle size={14} className="mr-1 flex-shrink-0" /> {/* Reduced icon size */}
                                    {errors.fTax_rate}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2 pt-4 border-t"> {/* Reduced space-x and pt */}
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm" // Reduced padding and font size
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !isFormValid()}
                                className={`px-4 py-2 font-semibold text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] shadow-lg text-sm
                                    ${selectedTax
                                        ? 'bg-orange-500 hover:bg-orange-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                    }`} // Reduced padding, min-width, and font size
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div> {/* Reduced spinner size */}
                                        Saving...
                                    </>
                                ) : selectedTax ? (
                                    <>
                                        <Edit size={16} className="mr-1" /> {/* Reduced icon size */}
                                        Update Rate
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} className="mr-1" /> {/* Reduced icon size */}
                                        Add Rate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Left Panel: Tax List (Order 2 on mobile, Order 1 on large screens) */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-5 lg:col-span-1 order-2 lg:order-1 lg:min-h-[500px]"> 
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b pb-3"> {/* Reduced margin and padding */}
                        <h2 className="font-extrabold text-2xl text-blue-800">Active Tax Rates</h2> {/* Reduced font size */}
                        <div className='flex items-center space-x-2 mt-3 sm:mt-0'> {/* Reduced space-x and margin */}
                            {/* Search Input */}
                            <div className="relative w-full sm:w-46"> {/* Reduced width */}
                                <input
                                    type="text"
                                    placeholder="Search tax ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition w-full text-sm" // Reduced padding and font size
                                />
                                <Search
                                    className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" // Adjusted position and reduced icon size
                                    aria-hidden="true"
                                />
                            </div>
                           <button
                                onClick={fetchTaxRates}
                                disabled={loading || isDeleting || isSaving}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 rounded-full disabled:opacity-50" // Reduced padding
                                title="Refresh Tax Rates"
                            >
                                {/* <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> */}
                                 {/* Reduced icon size */}
                            </button>
                        </div>
                    </div>
                    
                    {loading ? (
                        <Spinner />
                    ) : (
                        // NEW: Reduced max-height to 50vh for all screen sizes
                        <div className="max-h-[50vh] overflow-y-auto pr-2"> {/* Reduced max-height and padding-right */}
                            <ul className="space-y-3"> {/* Reduced space-y */}
                                {filteredTaxRates.length > 0 ? (
                                    filteredTaxRates.map((tax) => (
                                        <li
                                            key={tax.iTax_id}
                                            className={`p-3 rounded-lg flex justify-between items-center transition-all duration-300 ease-in-out cursor-pointer shadow-sm border-l-4 
                                                ${selectedTax?.iTax_id === tax.iTax_id
                                                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-300'
                                                    : 'bg-white border-gray-200 hover:bg-gray-100'
                                                }`} // Reduced padding and shadow
                                            onClick={() => handleEditClick(tax)}
                                        >
                                            <div className="flex-1 min-w-0 pr-3"> {/* Reduced padding-right */}
                                                <h4 className="font-semibold text-lg text-gray-900 truncate"> {/* Reduced font size */}
                                                    {tax.cTax_name}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-0.5"> {/* Reduced font size and margin-top */}
                                                    Rate: 
                                                    <span className="font-extrabold text-xl text-green-600 ml-2"> {/* Reduced font size */}
                                                        {parseFloat(tax.fTax_rate).toFixed(2)}%
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex space-x-1 ml-3 self-center"> {/* Reduced space-x and margin-left */}
                                                {/* Edit Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(tax);
                                                    }}
                                                    className="p-1.5 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors" // Reduced padding
                                                    title="Edit Tax Rate"
                                                >
                                                    <Edit size={16} /> {/* Reduced icon size */}
                                                </button>
                                                {/* Delete Button (Inactivate) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(tax.iTax_id, tax.cTax_name);
                                                    }}
                                                    disabled={isDeleting}
                                                    className="p-1.5 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50" // Reduced padding
                                                    title="Inactivate Tax Rate"
                                                >
                                                    <Trash2 size={16} /> {/* Reduced icon size */}
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500 bg-gray-100 rounded-xl border border-dashed border-gray-300"> {/* Reduced padding */}
                                        <AlertCircle size={24} className="mx-auto text-gray-400 mb-2" /> {/* Reduced icon size */}
                                        <p className="text-base font-medium">{searchTerm ? 'No matching tax rates found.' : 'No active tax rates found. Start by adding one!'}</p> {/* Reduced font size */}
                                    </div>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default Tax;