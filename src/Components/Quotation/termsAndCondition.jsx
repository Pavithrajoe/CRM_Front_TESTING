import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, RefreshCw, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Assuming ENDPOINTS are defined correctly elsewhere
import { ENDPOINTS } from '../../api/constraints';

// Custom Spinner Component for a more consistent loading state
const Spinner = ({ message = 'Loading...' }) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-lg font-medium">{message}</p>
    </div>
);

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

    // --- Authentication and Initialization ---
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

    // Fetch terms once companyId and token are available
    useEffect(() => {
        if (companyId && token) {
            fetchTerms();
        }
    }, [companyId, token]);

    // --- API Handlers ---
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
                const sortedTerms = response.data.data
                    .filter(term => term.bActive)
                    .sort((a, b) => a.iOrder - b.iOrder);
                setTerms(sortedTerms);
            } else {
                setTerms([]); // Handle empty data case
            }
        } catch (error) {
            console.error('Error fetching terms:', error);
            const errorMessage = error.response?.data?.message || 'Failed to load terms and conditions.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.cTerm_text || formData.iOrder < 1) {
            toast.error('Term text is required and order must be a positive number.');
            return;
        }

        if (!isFormValid()) return;

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
                // Update Logic
                const payload = {
                    cTerm_text: formData.cTerm_text,
                    iOrder: formData.iOrder,
                    iUpdated_by: userId,
                };
                await axios.put(`${ENDPOINTS.TERMS}/${selectedTerm.iTerm_id}`, payload, { headers });
                toast.success('Term updated successfully. 🚀');
            } else {
                // Create Logic
                const payload = {
                    cTerm_text: formData.cTerm_text,
                    iOrder: formData.iOrder,
                    iCompany_id: companyId,
                    iCreated_by: userId,
                    bActive: true,
                };
                await axios.post(ENDPOINTS.TERMS, payload, { headers });
                toast.success('Term created successfully. ✨');
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
        if (!window.confirm('Are you sure you want to delete this term? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            await axios.delete(`${ENDPOINTS.TERMS}/${termId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            toast.success('Term deleted successfully. 🗑️');
            await fetchTerms();
            resetForm(); // Clear form if the deleted term was selected for edit
        } catch (error) {
            console.error('Error deleting term:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete term.';
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Utility Functions ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'iOrder' ? parseInt(value, 10) : value,
        }));
    };

    const resetForm = () => {
        setFormData({
            cTerm_text: '',
            iOrder: terms.length > 0 ? terms[terms.length - 1].iOrder + 1 : 1, // Suggest next order number
        });
        setSelectedTerm(null);
    };

    const handleEditClick = (term) => {
        setSelectedTerm(term);
        setFormData({
            cTerm_text: term.cTerm_text,
            iOrder: term.iOrder,
        });
    };

    const isFormValid = () => {
        return formData.cTerm_text.trim() !== '' && formData.iOrder >= 1;
    };

    // --- Render Logic for Authentication Check ---
    if (!companyId || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="p-8 bg-white border border-red-200 rounded-xl shadow-lg text-center">
                    <p className="text-xl text-red-600 font-bold mb-2">Access Denied</p>
                    <p className="text-gray-600">Authentication data is missing. Please log in to manage terms.</p>
                </div>
                <ToastContainer position="bottom-right" autoClose={3000} />
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex justify-center items-start">
            <ToastContainer position="bottom-right" autoClose={3000} />
            <div className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Panel: Terms List */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 h-full order-2 lg:order-1">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="font-extrabold text-3xl text-gray-800">
                            Managed Terms
                        </h2>
                        <button
                            onClick={fetchTerms}
                            disabled={loading || isDeleting || isSaving}
                            className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full disabled:opacity-50"
                            title="Refresh Terms"
                        >
                            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loading ? (
                        <Spinner message="Loading terms..." />
                    ) : (
                        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <ul className="space-y-4">
                                {terms.length > 0 ? (
                                    terms.map((term) => (
                                        <li
                                            key={term.iTerm_id}
                                            onClick={() => handleEditClick(term)}
                                            className={`
                                                p-4 rounded-xl flex justify-between items-start 
                                                border-l-4 transition-all duration-300 ease-in-out cursor-pointer shadow-md
                                                ${selectedTerm?.iTerm_id === term.iTerm_id
                                                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-300 transform scale-[1.01]'
                                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-lg'
                                                }
                                            `}
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <span className="inline-block text-xs font-bold px-2 py-0.5 mr-2 rounded-full bg-blue-200 text-blue-800">
                                                    Order: {term.iOrder}
                                                </span>
                                                <p className="text-sm text-gray-700 mt-1 break-words leading-relaxed">
                                                    {term.cTerm_text}
                                                </p>
                                            </div>
                                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 ml-4 self-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(term); }}
                                                    className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                                    title="Edit Term"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(term.iTerm_id); }}
                                                    disabled={isDeleting}
                                                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    title="Delete Term"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500 text-center py-12 border-2 border-dashed border-gray-300 rounded-xl list-none">
                                        <AlertCircle size={30} className="mx-auto text-gray-400 mb-3" />
                                        <p className="text-lg font-medium">No active terms found.</p>
                                        <p className="text-sm mt-1">Use the panel on the right to add a new term.</p>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right Panel: Add/Edit Form */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 md:p-8 lg:sticky lg:top-8 h-fit order-1 lg:order-2">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b">
                        <h2 className={`text-2xl font-bold flex items-center transition-colors duration-300 ${selectedTerm ? 'text-blue-600' : 'text-green-600'}`}>
                            {selectedTerm ? (
                                <>
                                    <Edit size={24} className="mr-2" /> Edit Term
                                </>
                            ) : (
                                <>
                                    <Plus size={24} className="mr-2" /> Add New Term
                                </>
                            )}
                        </h2>
                        {selectedTerm && (
                            <button
                                onClick={resetForm}
                                className="text-gray-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors"
                                title="Clear Form"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Order Input */}
                        <div>
                            <label htmlFor="iOrder" className="block text-sm font-semibold text-gray-700 mb-2">
                                Order Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="iOrder"
                                name="iOrder"
                                value={formData.iOrder}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                                placeholder="e.g., 1, 2, 3..."
                                min="1"
                                required
                            />
                        </div>

                        {/* Term Text Area */}
                        <div>
                            <label htmlFor="cTerm_text" className="block text-sm font-semibold text-gray-700 mb-2">
                                Term Text <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="cTerm_text"
                                name="cTerm_text"
                                value={formData.cTerm_text}
                                onChange={handleChange}
                                className="w-full p-4 border border-gray-300 rounded-lg shadow-inner focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-base"
                                placeholder="Enter the full text for the term and condition here."
                                rows="8"
                                required
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            {selectedTerm && (
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                                >
                                    Cancel Edit
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !isFormValid()}
                                className={`
                                    px-8 py-3 font-semibold text-white rounded-lg transition-colors shadow-lg
                                    disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center
                                    ${selectedTerm
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }
                                `}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </>
                                ) : selectedTerm ? (
                                    'Update Term'
                                ) : (
                                    <>
                                        <Plus size={20} className="mr-2" /> Save New Term
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

export default TermsAndConditions;