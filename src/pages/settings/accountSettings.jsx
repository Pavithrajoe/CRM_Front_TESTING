import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ENDPOINTS } from '../../api/constraints';

const AccountSettings = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const companyId = user?.iCompany_id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile related state
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

  // General settings (checkboxes + prefix)
  const [generalSettings, setGeneralSettings] = useState({
    whatsapp_active: false,
    mail_active: false,
    website_active: false,
    phone_active: false,
    ip_address: '',
    quotation_prefix: '',
    sub_src_active: false,
    bactive: false,
  });

  const [errors, setErrors] = useState({});
  const [leadFormType, setLeadFormType] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [hasGeneralSettings, setHasGeneralSettings] = useState(false); // Track if settings exist

  // Fetch business types
  useEffect(() => {
    if (!token) return;
    axios.get(`${ENDPOINTS.BASE_URL_IS}/business-type`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      const list = res.data?.data?.data || [];
      console.log(list)
      setBusinessTypes(list.filter(bt => bt.bactive));
    }).catch(console.error);
  }, [token]);

  // Fetch company profile
  useEffect(() => {
    if (!token || !companyId) return;
    setLoading(true);
    axios.get(`${ENDPOINTS.BASE_URL_IS}/company/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const data = res.data.result;
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
        setLeadFormType(prev => prev ?? (Number(data.ibusiness_type) || (businessTypes[0]?.id || 1)));
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token, companyId, businessTypes]);

  // Fetch general settings (checkboxes + prefix)
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    axios.get(`${ENDPOINTS.GET_SETTINGS}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      const data = res.data.result;
      const hasExistingSettings = !!data && Object.keys(data).length > 0;
      setHasGeneralSettings(hasExistingSettings);

      if (hasExistingSettings) {
        setGeneralSettings({
          whatsapp_active: !!data.whatsapp_active,
          mail_active: !!data.mail_active,
          website_active: !!data.website_active,
          phone_active: !!data.phone_active,
          ip_address: data.ip_address || '',
          quotation_prefix: data.quotation_prefix || '',
          sub_src_active: !!data.sub_src_active,
          bactive: !!data.bactive,
        });
      }
      setError(null);
    }).catch(() => setError("Failed to load general settings"))
      .finally(() => setLoading(false));
  }, [token]);

  // Validation for profile fields
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === 'companyName' && value.length > 50)
      newErrors.companyName = 'Maximum 50 characters allowed';
    else if (name === 'email') {
      if (value.length > 50) newErrors.email = 'Maximum 50 characters allowed';
      else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        newErrors.email = 'Invalid email format';
      else delete newErrors.email;
    } else if (name === 'phone') {
      if (!/^\d{10}$/.test(value)) newErrors.phone = 'Must be 10 digits';
      else delete newErrors.phone;
    } else if (name === 'gst' && value && !/^[A-Za-z0-9]{15}$/.test(value))
      newErrors.gst = 'Must be exactly 15 alphanumeric characters';
    else if (name === 'website' && value.length > 50)
      newErrors.website = 'Maximum 50 characters allowed';
    else if (['address1', 'address2', 'address3'].includes(name) && value.length > 100)
      newErrors[name] = 'Maximum 100 characters allowed';
    else if (name === 'cityId' && isNaN(value)) newErrors.cityId = 'Must be a number';
    else delete newErrors[name];

    setErrors(newErrors);
    return !newErrors[name];
  };

  // Profile input change
  const handleInputChange = e => {
    const { name, value } = e.target;
    validateField(name, value);
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Toggle checkbox change for general settings — use functional setState and log for debug
  const handleToggleChange = (key) => {
    setGeneralSettings(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      console.log('Checkbox toggled, new state:', newState);
      return newState;
    });
  };

  // Lead form type change
  const handleLeadFormTypeChange = e => {
    setLeadFormType(Number(e.target.value));
  };

  // Build payload for company profile (PUT/POST)
  const buildProfilePayload = () => ({
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
    ibusiness_type: leadFormType,
  });

  // Save company profile (PUT)

  const handleSaveProfileChanges = useCallback(async () => {
  if (Object.keys(errors).length > 0) {
    alert("Please fix validation errors before saving");
    return;
  }
  setLoading(true);
  try {
    await axios.put(`${ENDPOINTS.BASE_URL_IS}/company/${companyId}`, buildProfilePayload(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("Profile updated successfully!");

    // Update localStorage.user with new business type
    const userString = localStorage.getItem("user");
    if (userString) {
      const userObj = JSON.parse(userString);
      userObj.ibusiness_type = leadFormType;
      localStorage.setItem("user", JSON.stringify(userObj));

      window.dispatchEvent(new CustomEvent("leadFormTypeChanged", {
        detail: leadFormType
      }));
    }
  } catch (err) {
    alert("Failed to update profile");
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [profile, leadFormType, token, companyId, errors]);


const handleSaveGeneralSettings = useCallback(async () => {
  setLoading(true);
  try {
    console.log('Saving payload:', generalSettings);
    const method = hasGeneralSettings ? 'put' : 'post';
    await axios[method](ENDPOINTS.GENERAL_SETTING, generalSettings, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Refetch after save to sync frontend state
    const res = await axios.get(ENDPOINTS.GET_SETTINGS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = res.data?.result;
    if (updated) {
      setGeneralSettings({
        whatsapp_active: !!updated.whatsapp_active,
        mail_active: !!updated.mail_active,
        website_active: !!updated.website_active,
        phone_active: !!updated.phone_active,
        ip_address: updated.ip_address || '',
        quotation_prefix: updated.quotation_prefix || '',
        sub_src_active: !!updated.sub_src_active,
        bactive: !!updated.bactive,
      });
      setHasGeneralSettings(true);
    }

    alert("General settings saved successfully!");
  } catch (err) {
    alert("Failed to save general settings");
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [generalSettings, token, hasGeneralSettings]);


  return (
    <>
    <div className="relative w-full bg-[#f9f9f9] rounded-3xl shadow-md p-6 mt-4 border border-gray-200">
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 rounded-3xl">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Profile Section */}
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-[22px] font-semibold text-gray-900">Profile Settings</h1>
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
              value={profile[name]}
              onChange={handleInputChange}
              maxLength={maxLength}
              className={`px-3 py-2 rounded-xl border ${
                errors[name] ? "border-red-500" : "border-gray-300"
              } bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
              disabled={loading}
            />
            {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
          </div>
        ))}
      </div>

      {/* Lead Form Type */}
    <div className="border-t pt-4 mb-6">
  <h2 className="text-[18px] font-medium text-gray-900 mb-4">
    Company Lead Form Type
  </h2>

  {businessTypes.length === 0 ? (
    <p className="text-gray-500 text-sm">Loading business types...</p>
  ) : (
    <div className="flex flex-wrap gap-3">
      {businessTypes.map((bt) => (
        <button
          key={bt.id}
          type="button"
          onClick={() => setLeadFormType(bt.id)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition
            ${
              leadFormType === bt.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          {bt.name}
        </button>
      ))}

      {/* Profile Save Button */}
      <div className="flex justify-end w-full mt-4">
        {isProfileLoaded ? (
          <button
            onClick={handleSaveProfileChanges}
            disabled={loading || Object.keys(errors).length > 0}
            className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            Save Profile Changes
          </button>
        ) : (
          <p className="text-gray-600">Ask your admin to update</p>
        )}
      </div>
    </div>
  )}
</div>


      {/* General Settings Section */}
      <div className="border-t pt-4 mb-6 space-y-3">
        <h2 className="text-[18px] font-medium text-gray-900 mb-2">Company Additional Settings</h2>
        {[
          { id: "whatsapp_active", label: "WhatsApp Access" },
          { id: "mail_active", label: "Email Accesss" },
          { id: "website_active", label: "Website Access" },
          { id: "phone_active", label: "Phone Access" },
          { id: "sub_src_active", label: "Sub Source Access" },
        ].map(({ id, label }) => (
          <div key={id} className="flex items-center">
            <input
              type="checkbox"
              id={id}
              checked={generalSettings[id]}
              onChange={() => handleToggleChange(id)}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor={id} className="font-medium text-gray-700">{label}</label>
          </div>
        ))}
        <div className="flex items-center mt-3">
          <label htmlFor="quotation_prefix" className="font-medium text-gray-700 mr-3">
            Set your company prefix
          </label>
          <input
            type="text"
            id="quotation_prefix"
            name="quotation_prefix"
            value={generalSettings.quotation_prefix}
            onChange={e => setGeneralSettings(prev => ({ ...prev, quotation_prefix: e.target.value }))}
            className="border rounded-lg p-2"
            disabled={loading}
          />
        </div>
        <button
          className="mt-3 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleSaveGeneralSettings}
          disabled={loading}
        >
          Save General Settings
        </button>
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
                  ["City ID", "cityId", "number"]
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    {false && <SettingsPage settingsData={generalSettings } />}
    {false && <LeadDetailView settingsData={generalSettings } />}

    </>
  );
};

export default AccountSettings;