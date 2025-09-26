import React, { useState, useEffect } from "react";
import { PlusCircle , Edit, Trash2, List, User, Building2} from "lucide-react";

import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { ENDPOINTS } from "../../api/constraints";

function LabelMaster() {
  const [formData, setFormData] = useState({
    leadFormTitle: "",
    section1Label: "",
    section2Label: "",
    section3Label: "",
  });
  const [existingLabels, setExistingLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("companyId");
    const storedUserId = localStorage.getItem("userId");
    if (storedCompanyId) setCompanyId(parseInt(storedCompanyId));
    if (storedUserId) setUserId(parseInt(storedUserId));
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(ENDPOINTS.MASTER_LABEL_GET, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.Message) {
        setExistingLabels([response.data.Message]);
      }
    } catch (error) {
      console.error("Error fetching labels:", error);
      toast.error("Failed to load label data");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.leadFormTitle) {
      toast.error("Form title is required");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      if (selectedLabel) {
        const payload = {
          formLabelMastersId: selectedLabel.iformLabelMasterId,
          ...formData,
        };
        await axios.put(ENDPOINTS.MASTER_LABEL_GET, payload, { headers });
        toast.success("Label updated successfully");
      } else {
        await axios.post(ENDPOINTS.MASTER_LABEL_GET, formData, { headers });
        toast.success("Label created successfully");
      }

      await fetchLabels();
      resetForm();
    } catch (error) {
      console.error("Error saving label:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save label";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (labelId) => {
    if (!window.confirm("Are you sure you want to delete this label?")) return;

    setIsDeleting(true);
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      await axios.delete(`${ENDPOINTS.MASTER_LABEL_GET}/${labelId}`, {
        headers,
      });
      toast.success("Label deleted successfully");
      await fetchLabels();
    } catch (error) {
      console.error("Error deleting label:", error);
      toast.error("Failed to delete label");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leadFormTitle: "",
      section1Label: "",
      section2Label: "",
      section3Label: "",
    });
    setSelectedLabel(null);
  };

  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen">
      <p className="font-bold text-3xl text-blue-900 text-center mb-10">
        Label Master
      </p>

      <div className="grid md:grid-cols-2 gap-8">
    
       {/* Left Panel - Existing Labels */}
<div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
    <PlusCircle size={23} className="text-blue-600" />
    Existing Labels
  </h3>

  <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
    {existingLabels.length > 0 ? (
      existingLabels.map((label) => (
        <div
          key={label.iformLabelMasterId}
          className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md group ${
            selectedLabel?.iformLabelMasterId === label.iformLabelMasterId
              ? "bg-gradient-to-r from-blue-10 to-blue-50 border-blue-400"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-lg text-gray-800">
              {label.leadFormTitle}
            </h4>

            {/* Actions */}
            <div className="flex space-x-2 opacity-80 group-hover:opacity-100 transition">
              <button
                onClick={() => {
                  setSelectedLabel(label);
                  setFormData({
                    leadFormTitle: label.leadFormTitle,
                    section1Label: label.section1Label,
                    section2Label: label.section2Label,
                    section3Label: label.section3Label,
                  });
                }}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-200"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              {/* <button
                onClick={() => handleDelete(label.iformLabelMasterId)}
                disabled={isDeleting}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={16} />
              </button> */}
            </div>
          </div>

          {/* Details */}
          <div className="text-md text-gray-700 pl-1 italic space-y-2">
            <div className="flex items-center gap-2">
              <List size={14} className="text-gray-500" />
              {label.section1Label}
            </div>
            <div className="flex items-center gap-2">
              <List size={14} className="text-gray-500" />
              {label.section2Label}
            </div>
            <div className="flex items-center gap-2">
              <List size={14} className="text-gray-500" />
              {label.section3Label}
            </div>
          </div>

          {/* Footer */}
          <div className="text-md text-gray-900 mt-4 border-t pt-2 flex justify-between">
            <div className="flex items-center gap-1">
              <User size={12} className="text-gray-800 " />
              {label.createdBy?.cFull_name || "Unknown"}
            </div>
            <div className="flex items-center gap-1">
              <Building2 size={12} className="text-gray-800" />
              {label.company?.cCompany_name || "Unknown"}
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-gray-500 text-center py-8 italic">
        No labels created yet
      </div>
    )}
  </div>
</div>


        {/* Right Panel - Form */}
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-6">
            {selectedLabel ? "Edit Label Set" : "Add New Label Set"}
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      field === "leadFormTitle"
                        ? "e.g. Lead Registration Form"
                        : field === "section1Label"
                        ? "e.g. Basic Information"
                        : field === "section2Label"
                        ? "e.g. Contact Details"
                        : "e.g. Additional Information"
                    }
                    required
                  />
                </div>
              )
            )}

            <div className="flex justify-end gap-3 pt-4">
              {(selectedLabel || formData.leadFormTitle) && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
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
                  ? "Saving..."
                  : selectedLabel
                  ? "Update Label"
                  : "Save Label"}
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
