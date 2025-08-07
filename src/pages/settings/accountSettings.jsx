import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ENDPOINTS } from '../../api/constraints';

const ToggleSwitch = ({ label, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between border-b py-4">
    <div className="flex items-center">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-all duration-300"></div>
        <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full border peer-checked:translate-x-full peer-checked:border-black transition-transform duration-300"></div>
      </label>
      <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
    </div>
    {description && <p className="text-sm text-gray-500 ml-4">{description}</p>}
  </div>
);

const AccountSettings = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const companyId = user?.iCompany_id;

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    companyName: "",
    email: "",
    phone: "",
    gst: "",
    website: "",
    address1: "",
    address2: "",
    address3: "",
    cityId: "",
  });

  const [errors, setErrors] = useState({});
  const [toggles, setToggles] = useState({
    email: false,
    contacts: false,
    whatsapp: false,
  });

  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  // Load profile data
  useEffect(() => {
    if (!token || !companyId) return;

    setLoading(true);
    axios
      .get(`${ENDPOINTS.BASE_URL_IS}/company/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        if (data && data.cCompany_name) {
          setIsProfileLoaded(true);
          setProfile({
            companyName: data.cCompany_name || "",
            email: data.cemail_address || "",
            phone: data.iPhone_no ? String(data.iPhone_no) : "",
            gst: data.cGst_no || "",
            website: data.cWebsite || "",
            address1: data.caddress1 || "",
            address2: data.caddress2 || "",
            address3: data.caddress3 || "",
            cityId: data.city?.cCity_name || "",
          });
          setToggles({
            email: data.enableEmail || false,
            contacts: data.enableContacts || false,
            whatsapp: data.enableWhatsapp || false,
          });
        }
      })
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));
  }, [token, companyId]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    if (name === 'companyName' && value.length > 50) {
      newErrors.companyName = 'Maximum 50 characters allowed';
    } 
    else if (name === 'email') {
      if (value.length > 50) newErrors.email = 'Maximum 50 characters allowed';
      else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Invalid email format';
      }
    }
    else if (name === 'phone') {
      if (!/^\d{10}$/.test(value)) newErrors.phone = 'Must be 10 digits';
    }
   else if (name === 'gst' && value && !/^[A-Za-z0-9]{15}$/.test(value)) {
  newErrors.gst = 'Must be exactly 15 alphanumeric characters';
}
    else if (name === 'website' && value.length > 50) {
      newErrors.website = 'Maximum 50 characters allowed';
    }
    else if (['address1', 'address2', 'address3'].includes(name) && value.length > 50) {
      newErrors[name] = 'Maximum 50 characters allowed';
    }
    else if (name === 'cityId' && isNaN(value)) {
      newErrors.cityId = 'Must be a number';
    }
    else {
      delete newErrors[name];
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const buildPayload = () => ({
    cCompany_name: profile.companyName.trim(),
    cLogo_link: "https://xcodefix.com/logo.png",
    iUser_no: Number(user?.iUser_no) || 2,
    iPhone_no: profile.phone,
    cWebsite: profile.website.trim(),
    caddress1: profile.address1.trim(),
    caddress2: profile.address2.trim(),
    caddress3: profile.address3.trim(),
    cGst_no: profile.gst ? profile.gst.trim() : null,
    cemail_address: profile.email.trim() || null,
    enableEmail: toggles.email,
    enableContacts: toggles.contacts,
    enableWhatsapp: toggles.whatsapp
  });

  const handleSaveChanges = useCallback(async () => {
    if (Object.keys(errors).length > 0) {
      alert("Please fix validation errors before saving");
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${ENDPOINTS.BASE_URL_IS}/company/${companyId}`,
        buildPayload(),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile, toggles, token, companyId, errors]);

  const handleCreateProfile = useCallback(async () => {
    if (Object.keys(errors).length > 0) {
      alert("Please fix validation errors before creating");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${ENDPOINTS.BASE_URL_IS}/company`,
        buildPayload(),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Profile created successfully!");
      setIsProfileLoaded(true);
      setShowCreatePanel(false);
    } catch (err) {
      alert("Failed to create profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile, toggles, token, errors]);

  return (
    <div className="relative w-full bg-[#f9f9f9] rounded-3xl shadow-md p-6 mt-4 border border-gray-200">
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 rounded-3xl">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-[22px] font-semibold text-gray-900">Profile Settings</h1>
        {/* {!isProfileLoaded && (
          <button
            onClick={() => setShowCreatePanel(true)}
            className="ml-auto px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition"
          >
            + Create Profile
          </button>
        )} */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          ["Company Name*", "companyName", "text", 50],
          ["Email", "email", "email", 50],
          ["Phone*", "phone", "tel", 10],
          ["GST No", "gst", "text", 15],
          ["Website", "website", "url", 50],
          ["Address 1", "address1", "text", 50],
          ["Address 2", "address2", "text", 50],
          ["Address 3", "address3", "text", 50],
        ].map(([label, name, type, maxLength]) => (
          <div key={name} className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">{label}</label>
            <input
              type={type}
              name={name}
              value={profile[name] || ""}
              onChange={handleInputChange}
              maxLength={maxLength}
              className={`px-3 py-2 rounded-xl border ${
                errors[name] ? 'border-red-500' : 'border-gray-300'
              } bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
              disabled={loading}
            />
            {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
          </div>
        ))}

        {/* <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">City ID</label>
          <input
            type="number"
            name="cityId"
            value={profile.cityId}
            onChange={handleInputChange}
            className={`px-3 py-2 rounded-xl border ${
              errors.cityId ? 'border-red-500' : 'border-gray-300'
            } bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
            disabled={loading}
            min={1}
          />
          {errors.cityId && <p className="text-red-500 text-xs mt-1">{errors.cityId}</p>}
        </div> */}
      </div>

      <div className="border-t pt-4 mb-6 space-y-3">
        {["email", "contacts", "whatsapp"].map((key) => (
          <div key={key} className="flex justify-between items-center">
            <div>
              <p className="text-gray-800 font-medium capitalize">{key} Notifications</p>
              <p className="text-xs text-gray-500">Enable {key} notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={toggles[key]}
                onChange={() => handleToggleChange(key)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:bg-blue-500 transition-all duration-300"></div>
              <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white border border-gray-300 rounded-full peer-checked:translate-x-full peer-checked:border-blue-600 transition-transform duration-300"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        {isProfileLoaded ? (
          <button
            onClick={handleSaveChanges}
            disabled={loading || Object.keys(errors).length > 0}
            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition disabled:opacity-50"
          >
            Save Changes
          </button>
        ) :
         (
          <p className="text-gray-600">Ask ur admin to update </p>
         
        ) 

        }
      </div>

      <AnimatePresence>
        {showCreatePanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50"
          >
            <motion.div className="bg-white rounded-2xl p-6 w-96 shadow-xl border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Create New Profile</h2>
              <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-auto mb-4">
                {[
                  ["Company Name*", "companyName", "text", 50],
                  ["Email", "email", "email", 50],
                  ["Phone*", "phone", "tel", 10],
                  ["GST No", "gst", "text", 15],
                  ["Website", "website", "url", 50],
                  ["Address 1", "address1", "text", 50],
                  ["Address 2", "address2", "text", 50],
                  ["Address 3", "address3", "text", 50],
                  ["City ID", "cityId", "number"],
                ].map(([label, name, type, maxLength]) => (
                  <div key={name} className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={profile[name] || ""}
                      onChange={handleInputChange}
                      maxLength={maxLength}
                      className={`px-3 py-2 rounded-xl border ${
                        errors[name] ? 'border-red-500' : 'border-gray-300'
                      } bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
                      disabled={loading}
                    />
                    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowCreatePanel(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100"
                >
                  Cancel
                </button>
                {/* <button
                  onClick={handleCreateProfile}
                  disabled={loading || Object.keys(errors).length > 0}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Profile
                </button> */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountSettings;