import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig'; // Ensure correct path to your axios instance

export default function MasterForm({
  master,
  editingItem,
  onSaveSuccess,
  onCancelEdit,
  companyId, // Direct prop from MasterModal
  userId,    // Direct prop from MasterModal
  postEndpoint, // Direct prop from MasterModal (renamed from 'post' to 'postEndpoint')
  putEndpoint,  // Direct prop from MasterModal (renamed from 'put' to 'putEndpoint')
  parentContext // For Sub Industry specifically
}) {
  const {
    idKey,
    payloadKey,
    modalKey,
    additionalFields = [],
    idLocation,
    // Removed unused: modifierIdPayloadKey, updatedDtPayloadKey
  } = master;

  // IMPORTANT: Use the dynamically injected payloads from the master object.
  // These are guaranteed to have companyId, userId, and timestamps.
  const masterPostPayload = master.postPayload;
  const masterPutPayload = master.putPayload;

  const [formData, setFormData] = useState(() => {
    const initialState = {
      [payloadKey]: '',
    };
    additionalFields.forEach(field => {
      initialState[field] = '';
    });
    return initialState;
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Extract JSON stringify outside of useEffect dependency array as suggested by ESLint
  // This is technically not strictly necessary for correctness, but cleans up ESLint warning.
  const additionalFieldsString = JSON.stringify(additionalFields);

  useEffect(() => {
    console.log("[MasterForm] useEffect triggered. editingItem:", editingItem);
    if (editingItem) {
      const newFormData = {
        [payloadKey]: editingItem[modalKey] || '',
      };
      // Use the actual additionalFields array directly here
      additionalFields.forEach(field => {
        newFormData[field] = editingItem[field] !== undefined ? editingItem[field] : '';
      });

      setFormData(newFormData);
      setFormError(null);
      setFormLoading(false);
      console.log("[MasterForm] Form set to EDIT mode. formData:", newFormData, "formLoading: false");
    } else {
      const resetState = {
        [payloadKey]: '',
      };
      // Use the actual additionalFields array directly here
      additionalFields.forEach(field => {
        resetState[field] = '';
      });
      setFormData(resetState);
      setFormError(null);
      setFormLoading(false);
      console.log("[MasterForm] Form set to ADD mode. formData:", resetState, "formLoading: false");
    }
  }, [editingItem, payloadKey, modalKey, additionalFieldsString]); // Use the stringified version here

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`[MasterForm] handleChange - Name: ${name}, Value: ${value}`);
    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]: value,
      };
      console.log("[MasterForm] formData updated:", updatedData);
      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[MasterForm] handleSubmit called. Setting formLoading to true.");
    setFormLoading(true);
    setFormError(null);

    if (!formData[payloadKey].trim()) {
      setFormError(`Please enter a ${master.title.toLowerCase()} name.`);
      console.log("[MasterForm] Validation failed. Setting formLoading to false.");
      setFormLoading(false);
      return;
    }

    const parsedCompanyId = companyId ? parseInt(companyId, 10) : null;
    const parsedUserId = userId ? parseInt(userId, 10) : null;

    console.log("[MasterForm] Raw companyId from prop:", companyId, "Parsed:", parsedCompanyId);
    console.log("[MasterForm] Raw userId from prop:", userId, "Parsed:", parsedUserId);

    if (parsedCompanyId === null || isNaN(parsedCompanyId)) {
      setFormError("Company ID is missing or invalid. Please log in again.");
      console.log("[MasterForm] Company ID validation failed. Setting formLoading to false.");
      setFormLoading(false);
      return;
    }
    if (parsedUserId === null || isNaN(parsedUserId)) {
      setFormError("User ID is missing or invalid. Please log in again.");
      console.log("[MasterForm] User ID validation failed. Setting formLoading to false.");
      setFormLoading(false);
      return;
    }

    try {
      let response;
      let requestUrl;
      let finalPayload = {};

      if (editingItem) {
        // --- Logic for PUT request (UPDATE) ---
        const itemId = editingItem[idKey];
        if (!itemId) {
          setFormError(`Item ID (${idKey}) is missing for update.`);
          console.log("[MasterForm] Item ID missing for update. Setting formLoading to false.");
          setFormLoading(false);
          return;
        }

        // Start with the base payload from master (dynamically injected in CompanyMaster)
        finalPayload = { ...masterPutPayload };
        finalPayload[payloadKey] = formData[payloadKey]; // Add main form data

        // Add additional fields from formData
        additionalFields.forEach(field => {
          finalPayload[field] = formData[field];
        });

        // Add the ID to the payload if idLocation is 'body'
        if (idLocation === 'body') {
          // Adjust for specific idKey if necessary, like 'lostReasonId' for 'ilead_lost_reason_id'
          finalPayload[idKey === 'ilead_lost_reason_id' ? 'lostReasonId' : idKey] = itemId;
        }

        // Determine PUT URL
        requestUrl = typeof putEndpoint === 'function' ? putEndpoint(itemId) : `${putEndpoint}/${itemId}`;


      } else {
        // --- Logic for POST request (ADD NEW) ---
        // Start with the base payload from master (dynamically injected in CompanyMaster)
        finalPayload = { ...masterPostPayload };
        finalPayload[payloadKey] = formData[payloadKey]; // Add main form data

        // Add additional fields from formData
        additionalFields.forEach(field => {
          finalPayload[field] = formData[field];
        });

        requestUrl = postEndpoint;
      }

      // --- Special handling for Sub Industry parent ID ---
      if (master.title === 'Sub Industry') {
        if (parentContext?.id) {
          finalPayload['iindustry_id'] = parentContext.id;
          console.log(`[MasterForm] Adding iindustry_id from parentContext for POST: ${parentContext.id}`);
        } else if (editingItem?.iindustry_id) {
          finalPayload['iindustry_id'] = editingItem.iindustry_id;
          console.log(`[MasterForm] Retaining iindustry_id from editingItem for PUT: ${editingItem.iindustry_id}`);
        } else {
          console.warn("[MasterForm] Sub Industry operation without a parent industry ID.");
        }
      }

      console.log("[MasterForm] Final Payload being sent:", finalPayload);
      console.log(`[MasterForm] Request URL: ${requestUrl}`);

      if (editingItem) {
        console.log("[MasterForm] Submitting PUT request.");
        response = await axios.put(requestUrl, finalPayload);
        alert(`${master.title} updated successfully!`);
      } else {
        console.log("[MasterForm] Submitting POST request.");
        response = await axios.post(requestUrl, finalPayload);
        alert(`${master.title} added successfully!`);
      }

      console.log('[MasterForm] API Response:', response.data);
      onSaveSuccess();
    } catch (err) {
      console.error("[MasterForm] Error saving item:", err);
      if (err.response) {
        console.error("[MasterForm] API Error Response:", err.response.data);
      }
      setFormError("Failed to save item: " + (err.response?.data?.message || err.message || "Unknown error."));
    } finally {
      console.log("[MasterForm] Form submission complete. Setting formLoading to false.");
      setFormLoading(false);
    }
  };

  console.log("[MasterForm] Current formLoading state (render):", formLoading);

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-blue-200 rounded-md bg-white shadow-sm">
      {formError && <p className="text-red-500 text-sm text-center mb-4">{formError}</p>}

      {/* Main input field */}
      <div className="mb-4">
        <label htmlFor={payloadKey} className="block text-sm font-medium text-gray-700">
          {master.title} Name
          {master.title === 'Sub Industry' && parentContext && (
            <span className="text-sm text-gray-500 ml-2"> (for {parentContext.name})</span>
          )}
        </label>
        <input
          type="text"
          id={payloadKey}
          name={payloadKey}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={formData[payloadKey]}
          onChange={handleChange}
          placeholder={`Enter ${master.title.toLowerCase()} name`}
          required
          disabled={formLoading}
        />
      </div>

      {/* Render additional fields dynamically */}
      {additionalFields.map((field) => (
        <div key={field} className="mb-4">
          <label htmlFor={field} className="block text-sm font-medium text-gray-700">
            {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </label>
          <input
            type="text"
            id={field}
            name={field}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData[field]}
            onChange={handleChange}
            placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
            disabled={formLoading}
          />
        </div>
      ))}

      <div className="flex justify-end space-x-2">
        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            disabled={formLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={formLoading}
        >
          {formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
        </button>
      </div>
    </form>
  );
}