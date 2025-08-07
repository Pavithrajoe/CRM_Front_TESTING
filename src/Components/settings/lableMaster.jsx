import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from "lucide-react";
import axios from 'axios';
import { toast } from 'react-toastify';
import { ENDPOINTS } from '../../api/constraints';

function LabelMaster() {
  const [formData, setFormData] = useState({
    leadFormTitle: '',
    section1Label: '',
    section2Label: '',
    section3Label: ''
  });
  const [existingLabels, setExistingLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('companyId');
    const storedUserId = localStorage.getItem('userId');
    if (storedCompanyId) setCompanyId(parseInt(storedCompanyId));
    if (storedUserId) setUserId(parseInt(storedUserId));
    
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(ENDPOINTS.MASTER_LABEL_GET, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.Message) {
        setExistingLabels([response.data.Message]);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
      toast.error('Failed to load label data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.leadFormTitle) {
      toast.error('Form title is required');
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      if (selectedLabel) {
        const payload = {
          formLabelMastersId: selectedLabel.iformLabelMasterId,
          leadFormTitle: formData.leadFormTitle,
          section1Label: formData.section1Label,
          section2Label: formData.section2Label,
          section3Label: formData.section3Label
        };

        await axios.put(ENDPOINTS.MASTER_LABEL_GET, payload, { headers });
        toast.success('Label updated successfully');
      } else {
        const payload = {
          leadFormTitle: formData.leadFormTitle,
          section1Label: formData.section1Label,
          section2Label: formData.section2Label,
          section3Label: formData.section3Label
        };

        await axios.post(ENDPOINTS.MASTER_LABEL_GET, payload, { headers });
        toast.success('Label created successfully');
      }

      await fetchLabels();
      resetForm();
    } catch (error) {
      console.error('Error saving label:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save label';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (labelId) => {
    if (!window.confirm('Are you sure you want to delete this label?')) return;

    setIsDeleting(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      await axios.delete(`${ENDPOINTS.MASTER_LABEL_GET}/${labelId}`, { headers });
      toast.success('Label deleted successfully');
      await fetchLabels();
    } catch (error) {
      console.error('Error deleting label:', error);
      toast.error('Failed to delete label');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leadFormTitle: '',
      section1Label: '',
      section2Label: '',
      section3Label: ''
    });
    setSelectedLabel(null);
  };

  return (
    <div className="items-center p-6 justify-center w-full">
      <p className="font-bold text-2xl text-blue-900 underline text-center mb-6">
        Label Master
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Panel - Existing Labels */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 w-full md:w-1/2">
  <h3 className="text-xl font-semibold mb-4">Existing Labels</h3>
  
  <ul className="space-y-3 max-h-[600px] overflow-y-auto list-disc pl-5">
    {existingLabels.length > 0 ? (
      existingLabels.map(label => (
        <li 
          key={label.iformLabelMasterId}
          className={`py-2 border-b border-gray-100 last:border-b-0 ${
            selectedLabel?.iformLabelMasterId === label.iformLabelMasterId 
              ? 'bg-blue-50 -ml-2 pl-2 rounded' 
              : ''
          }`}
        >
          <div className="flex justify-between space-y-3 items-start">
            <div>
              <h4 className="font-medium text-xl">{label.leadFormTitle}</h4>
              <div className="text-sm space-y-3 mt-2 text-gray-700 ml-3">
                <div>• {label.section1Label}</div>
                <div>• {label.section2Label}</div>
                <div>• {label.section3Label}</div>
              </div>
              <div className="text-xs text-gray-700 mt-4 justify-between space-y-2 ml-3">
               <div> Created by: {label.createdBy?.cFull_name || 'Unknown'}</div>
               <div>Company: {label.company?.cCompany_name || 'Unknown'}</div> 
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedLabel(label);
                  setFormData({
                    leadFormTitle: label.leadFormTitle,
                    section1Label: label.section1Label,
                    section2Label: label.section2Label,
                    section3Label: label.section3Label
                  });
                }}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              {/* <button
                onClick={() => handleDelete(label.iformLabelMasterId)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={18} />
              </button> */}
            </div>
          </div>
        </li>
      ))
    ) : (
      <li className="text-gray-500 text-center py-4 list-none">
        No labels created yet
      </li>
    )}
  </ul>
</div>

        {/* Right Panel - Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 w-full md:w-1/2">
          <h3 className="text-lg font-semibold mb-4">
            {selectedLabel ? 'Edit Label Set' : 'Add New Label Set'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Title: <span clssName="text-red-600 font-bold text-xl">*</span>
              </label>
              <input
                type="text"
                name="leadFormTitle"
                value={formData.leadFormTitle}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g. Lead Registration Form"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section 1 Label: <span clssName="text-red-600 font-bold text-xl">*</span>
              </label>
              <input
                type="text"
                name="section1Label"
                value={formData.section1Label}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g. Basic Information"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section 2 Label: <span clssName="text-red-600 font-bold text-xl">*</span>
              </label>
              <input
                type="text"
                name="section2Label"
                value={formData.section2Label}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g. Contact Details"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section 3 Label: <span clssName="text-red-600 font-bold text-xl">*</span>
              </label>
              <input
                type="text"
                name="section3Label"
                value={formData.section3Label}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g. Additional Information"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {(selectedLabel || formData.leadFormTitle) && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || 
                  !formData.leadFormTitle || 
                  !formData.section1Label || 
                  !formData.section2Label || 
                  !formData.section3Label
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : selectedLabel ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabelMaster;