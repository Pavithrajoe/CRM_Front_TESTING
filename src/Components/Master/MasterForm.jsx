import  { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

export default function MasterForm({
  master,
  editingItem,
  onSaveSuccess,
  onCancelEdit,
  companyId,
  userId,
  postEndpoint,
  putEndpoint,
  parentContext
}) {
  const {
    idKey,
    payloadKey,
    modalKey,
    additionalFields = [],
    idLocation,
  } = master;

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
  const [parentIndustryName, setParentIndustryName] = useState('');

  const additionalFieldsString = JSON.stringify(additionalFields);

  useEffect(() => {
    if (editingItem) {
      const newFormData = {
        [payloadKey]: editingItem[modalKey] || '',
      };
      additionalFields.forEach(field => {
        newFormData[field] = editingItem[field] !== undefined ? editingItem[field] : '';
      });

      setFormData(newFormData);
      setFormError(null);
      setFormLoading(false);

      // Set parent industry name when editing a sub-industry
      if (master.title === 'Sub Industry' && editingItem.iindustry_id) {
        // If parentContext is provided, use its name
        if (parentContext?.name) {
          setParentIndustryName(parentContext.name);
        } 
        else if (editingItem.parentIndustryName) {
          setParentIndustryName(editingItem.parentIndustryName);
        }
      }
    } else {
      const resetState = {
        [payloadKey]: '',
      };
      additionalFields.forEach(field => {
        resetState[field] = '';
      });
      setFormData(resetState);
      setFormError(null);
      setFormLoading(false);
      setParentIndustryName(''); 
    }
  }, [editingItem, payloadKey, modalKey, additionalFieldsString, master.title, parentContext]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    if (!formData[payloadKey].trim()) {
      setFormError(`Please enter a ${master.title.toLowerCase()} name.`);
      setFormLoading(false);
      return;
    }

    const parsedCompanyId = companyId ? parseInt(companyId, 10) : null;
    const parsedUserId = userId ? parseInt(userId, 10) : null;

    if (parsedCompanyId === null || isNaN(parsedCompanyId)) {
      setFormError("Company ID is missing or invalid. Please log in again.");
      setFormLoading(false);
      return;
    }
    if (parsedUserId === null || isNaN(parsedUserId)) {
      setFormError("User ID is missing or invalid. Please log in again.");
      setFormLoading(false);
      return;
    }

    try {
      let response;
      let requestUrl;
      let finalPayload = {};

      if (editingItem) {
        const itemId = editingItem[idKey];
        if (!itemId) {
          setFormError(`Item ID (${idKey}) is missing for update.`);
          setFormLoading(false);
          return;
        }

        finalPayload = { ...masterPutPayload };
        finalPayload[payloadKey] = formData[payloadKey];

        additionalFields.forEach(field => {
          finalPayload[field] = formData[field];
        });

        if (idLocation === 'body') {
          finalPayload[idKey === 'ilead_lost_reason_id' ? 'lostReasonId' : idKey] = itemId;
        }

        requestUrl = typeof putEndpoint === 'function' ? putEndpoint(itemId) : `${putEndpoint}/${itemId}`;
      } else {
        finalPayload = { ...masterPostPayload };
        finalPayload[payloadKey] = formData[payloadKey];

        additionalFields.forEach(field => {
          finalPayload[field] = formData[field];
        });

        requestUrl = postEndpoint;
      }

      if (master.title === 'Sub Industry') {
        if (parentContext?.id) {
          finalPayload['iindustry_id'] = parentContext.id;
        } else if (editingItem?.iindustry_id) {
          finalPayload['iindustry_id'] = editingItem.iindustry_id;
        }
      }

      if (editingItem) {
        response = await axios.put(requestUrl, finalPayload);
      } else {
        response = await axios.post(requestUrl, finalPayload);
      }

      onSaveSuccess();
    } catch (err) {
      console.error("Error saving item:", err);
      setFormError("Failed to save item: " + (err.response?.data?.message || err.message || "Unknown error."));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-blue-200 rounded-md bg-white shadow-sm">
      {formError && <p className="text-red-500 text-sm text-center mb-4">{formError}</p>}

      {/* Display parent industry name when editing a sub-industry */}
      {master.title === 'Sub Industry' && editingItem && parentIndustryName && (
        <div className="mb-4 p-2 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Parent Industry:</span> {parentIndustryName}
          </p>
        </div>
      )}

      {/* Main input field */}
      <div className="mb-4">
        <label htmlFor={payloadKey} className="block text-sm font-medium text-gray-700">
          {master.title} Name
          {master.title === 'Sub Industry' && parentContext && !editingItem && (
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

      {/* Additional fields */}
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