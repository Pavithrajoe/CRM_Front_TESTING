import React, { useState, useEffect } from "react";
import { PlusCircle, Edit, List, User, Building2 } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { ENDPOINTS } from "../../api/constraints";

const MAX_LENGTH = 150;

// decode the JWT payload
const decodeJwtPayload = (token) => {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding token payload:", e);
        return null;
    }
};

function LabelMaster() {
    const [formData, setFormData] = useState({
        leadFormTitle: "",
        section1Label: "",
        section2Label: "",
        section3Label: "",
    });
    const [existingLabel, setExistingLabel] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tokenInfo, setTokenInfo] = useState({ companyId: null, userId: null });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const payload = decodeJwtPayload(token);
            if (payload) {
                setTokenInfo({
                    companyId: payload.company_id,
                    userId: payload.user_id,
                });
                // console.log(`[DEBUG: INIT] Decoded Token IDs - Company ID: ${payload.company_id}, User ID: ${payload.user_id}`);
            }
        }
        
        fetchLabel();
    }, []);

    const resetForm = (labelToLoad = null) => {
        if (labelToLoad) {
            setFormData({
                leadFormTitle: labelToLoad.leadFormTitle || "",
                section1Label: labelToLoad.section1Label || "",
                section2Label: labelToLoad.section2Label || "",
                section3Label: labelToLoad.section3Label || "",
            });
        } else {
            setFormData({
                leadFormTitle: "",
                section1Label: "",
                section2Label: "",
                section3Label: "",
            });
        }
    };

    const fetchLabel = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(ENDPOINTS.MASTER_LABEL_GET, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.data && response.data.Message && typeof response.data.Message === 'object') {
                const label = response.data.Message;
                setExistingLabel(label);
                resetForm(label);
            } else {
                setExistingLabel(null);
                resetForm();
            }
        } catch (error) {
            const status = error.response?.status;
            if (status === 404 || status === 204) {
                setExistingLabel(null);
                resetForm();
            } else {
                console.error("[FETCH ERROR] Failed to load label data:", error);
                toast.error("Failed to load label data");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        const controlledValue = value.slice(0, MAX_LENGTH);

        setFormData((prev) => ({
            ...prev,
            [name]: controlledValue,
        }));
    };

    const handleSave = async () => {
        if (!formData.leadFormTitle || !formData.section1Label || !formData.section2Label || !formData.section3Label) {
            toast.error("All fields are required");
            return;
        }

        if (formData.leadFormTitle.length > MAX_LENGTH ||
            formData.section1Label.length > MAX_LENGTH ||
            formData.section2Label.length > MAX_LENGTH ||
            formData.section3Label.length > MAX_LENGTH)
        {
            toast.error(`Internal error: Data exceeds maximum length of ${MAX_LENGTH} characters.`);
            return;
        }

        setIsSaving(true);
        const token = localStorage.getItem("token");
        
        const payloadInfo = decodeJwtPayload(token);
        
        let currentCompanyId = null;
        let currentUserId = null;

        if (payloadInfo) {
            currentCompanyId = payloadInfo.company_id;
            currentUserId = payloadInfo.user_id;
        }
        
        if (!existingLabel && (!currentCompanyId || !currentUserId)) {
            console.error(`[SAVE ERROR] Decoded Token Check - Company ID: ${currentCompanyId}, User ID: ${currentUserId}. Token is missing or invalid.`);
            toast.error("Authentication data is missing. Please log in again.");
            setIsSaving(false);
            return;
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        try {
            if (existingLabel) {
                const putPayload = {
                    formLabelMastersId: existingLabel.iformLabelMasterId,
                    ...formData,
                    icompany_id: currentCompanyId,
                    iCreated_by: currentUserId,
                };

                const response = await axios.put(ENDPOINTS.MASTER_LABEL_GET, putPayload, { headers });
                toast.success(response.data?.Message || "Label updated successfully");
            } else {
                const postPayload = {
                    ...formData,
                    icompany_id: currentCompanyId,
                    iCreated_by: currentUserId,
                };
                
                const response = await axios.post(ENDPOINTS.MASTER_LABEL_GET, postPayload, { headers });
                toast.success(response.data?.Message || "Label created successfully");
            }

            await fetchLabel();
        } catch (error) {
            console.error("[SAVE ERROR] API Request Failed:", error);
            console.error("[SAVE ERROR] Full Error Object:", JSON.stringify(error, null, 2));
            
            const serverMessage = error.response?.data?.Message || "An unexpected database error occurred. Ensure all fields are filled correctly.";
            toast.error(serverMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const isEditMode = !!existingLabel;

    if (isLoading) {
        return (
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 py-8 w-full bg-gray-50 min-h-screen">
                <p className="text-blue-600 font-semibold">Loading label status...</p>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 py-8 w-full bg-gray-50 min-h-screen">
            <p className="font-bold text-2xl sm:text-3xl md:text-4xl text-blue-900 text-center mb-10">
                Label Master
            </p>

            {/* Updated Responsive Grid Layout */}
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Current Label Set - Always First on All Screens */}
                {isEditMode && existingLabel && (
                    <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200 order-first">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
                            <List size={23} className="text-blue-600" />
                            Current Label Set
                        </h3>

                        <div 
                            key={existingLabel.iformLabelMasterId}
                            className="rounded-xl border p-5 shadow-lg bg-gradient-to-r from-blue-10 to-blue-50 border-blue-400"
                        >
                            <h4 className="font-bold text-lg text-gray-800 mb-3">
                                {existingLabel.leadFormTitle}
                            </h4>

                            <div className="text-md text-gray-700 space-y-2">
                                <div className="flex items-center gap-2">
                                    <List size={14} className="text-gray-500" />
                                    {existingLabel.section1Label}
                                </div>
                                <div className="flex items-center gap-2">
                                    <List size={14} className="text-gray-500" />
                                    {existingLabel.section2Label}
                                </div>
                                <div className="flex items-center gap-2">
                                    <List size={14} className="text-gray-500" />
                                    {existingLabel.section3Label}
                                </div>
                            </div>

                            <div className="text-sm text-gray-900 mt-4 border-t pt-2 flex justify-between">
                                <div className="flex items-center gap-1">
                                    <User size={12} className="text-gray-800 " />
                                    {existingLabel.createdBy?.cFull_name || "Unknown"}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Building2 size={12} className="text-gray-800" />
                                    {existingLabel.company?.cCompany_name || "Unknown"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create or Edit Form - Always Second */}
                <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-200">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-900">
                        {isEditMode ? (
                            <>
                                <Edit size={20} className="text-blue-600" /> Edit Label Set
                            </>
                        ) : (
                            <>
                                <PlusCircle size={20} className="text-blue-600" /> Create Initial Label Set
                            </>
                        )}
                    </h3>

                    <div className="space-y-5">
                        {["leadFormTitle", "section1Label", "section2Label", "section3Label"].map(
                            (field, idx) => (
                                <div key={idx}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {field === "leadFormTitle"
                                            ? "Form Title"
                                            : `Section ${idx} Label`}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name={field}
                                        value={formData[field]}
                                        onChange={handleChange}
                                        className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={
                                            field === "leadFormTitle"
                                                ? `e.g. Lead Registration Form (Max ${MAX_LENGTH} chars)`
                                                : field === "section1Label"
                                                ? `e.g. Basic Information (Max ${MAX_LENGTH} chars)`
                                                : field === "section2Label"
                                                ? `e.g. Contact Details (Max ${MAX_LENGTH} chars)`
                                                : `e.g. Additional Information (Max ${MAX_LENGTH} chars)`
                                        }
                                        maxLength={MAX_LENGTH}
                                        required
                                    />
                                </div>
                            )
                        )}

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                            <button
                                onClick={() => resetForm(existingLabel)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                {isEditMode ? "Revert Changes" : "Clear Form"}
                            </button>
                            
                            <button
                                onClick={handleSave}
                                disabled={
                                    isSaving ||
                                    !formData.leadFormTitle ||
                                    !formData.section1Label ||
                                    !formData.section2Label ||
                                    !formData.section3Label
                                }
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md"
                            >
                                {isSaving
                                    ? isEditMode ? "Updating..." : "Creating..."
                                    : isEditMode ? "Update Label" : "Save Label"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default LabelMaster;