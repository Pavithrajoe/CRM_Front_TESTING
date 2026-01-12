import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";
import LeadDetailView from "../../context/leaddetailsview";

const AccountSettings = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const companyId = user?.iCompany_id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const [generalSettings, setGeneralSettings] = useState({
    whatsapp_active: false,
    mail_active: false,
    website_active: false,
    phone_active: false,
    ip_address: "",
    quotation_prefix: "",
    sub_src_active: false,
    bactive: false,
  });

  const [errors, setErrors] = useState({});
  const [leadFormType, setLeadFormType] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [hasGeneralSettings, setHasGeneralSettings] = useState(false);

  const businessTypeFetched = useRef(false);
  const companyFetched = useRef(false);
  const settingsFetched = useRef(false);

  // Fetch business types
  useEffect(() => {
    if (!token || businessTypeFetched.current) return;
    businessTypeFetched.current = true;

    axios.get(`${ENDPOINTS.BUSINESS_TYPE}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const list = res.data?.data?.data || [];
        setBusinessTypes(list.filter((bt) => bt.bactive));
      })
      .catch(console.error);
  }, [token]);

  // Fetch company profile
  useEffect(() => {
    if (!token || !companyId || companyFetched.current) return;
    companyFetched.current = true;

    setLoading(true);
    axios.get(`${ENDPOINTS.COMPANY}/${companyId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
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
          setLeadFormType((prev) => prev ?? (Number(data.ibusiness_type) || (businessTypes[0]?.id || 1)));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, companyId, businessTypes]);

  // Fetch general settings
  useEffect(() => {
    if (!token || settingsFetched.current) return;
    settingsFetched.current = true;

    setLoading(true);
    axios.get(`${ENDPOINTS.GET_SETTINGS}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data.result;
        const hasExistingSettings = !!data && Object.keys(data).length > 0;
        setHasGeneralSettings(hasExistingSettings);

        if (hasExistingSettings) {
          setGeneralSettings({
            whatsapp_active: !!data.whatsapp_active,
            mail_active: !!data.mail_active,
            website_active: !!data.website_active,
            phone_active: !!data.phone_active,
            ip_address: data.ip_address || "",
            quotation_prefix: data.quotation_prefix || "",
            sub_src_active: !!data.sub_src_active,
            bactive: !!data.bactive,
          });
        }
      })
      .catch(() => setError("Failed to load general settings"))
      .finally(() => setLoading(false));
  }, [token]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === "companyName" && value.length > 50) newErrors.companyName = "Max 50 chars";
    else if (name === "email") {
      if (value.length > 50) newErrors.email = "Max 50 chars";
      else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = "Invalid format";
      else delete newErrors.email;
    } else if (name === "phone") {
      if (!/^\d{10}$/.test(value)) newErrors.phone = "10 digits required";
      else delete newErrors.phone;
    } else delete newErrors[name];

    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (key) => {
    setGeneralSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const handleSaveProfileChanges = useCallback(async () => {
    if (Object.keys(errors).length > 0) {
      alert("Please fix validation errors");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${ENDPOINTS.COMPANY}/${companyId}`, buildProfilePayload(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated successfully!");
      
      const userString = localStorage.getItem("user");
      if (userString) {
        const userObj = JSON.parse(userString);
        userObj.ibusiness_type = leadFormType;
        localStorage.setItem("user", JSON.stringify(userObj));
        window.dispatchEvent(new CustomEvent("leadFormTypeChanged", { detail: leadFormType }));
      }
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }, [profile, leadFormType, token, companyId, errors]);

  const handleSaveGeneralSettings = useCallback(async () => {
    setLoading(true);
    try {
      const method = hasGeneralSettings ? "put" : "post";
      await axios[method](ENDPOINTS.GENERAL_SETTING, generalSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("General settings saved!");
      setHasGeneralSettings(true);
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }, [generalSettings, token, hasGeneralSettings]);

  return (
    <>
      <div className="relative w-full bg-[#f9f9f9] rounded-3xl shadow-md p-4 sm:p-6 lg:p-8 mt-4 border border-gray-200 overflow-y-auto max-h-[85vh]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 rounded-3xl">
            <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-6">
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-gray-900">Profile Settings</h1>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            ["Company Name*", "companyName", "text", 50],
            ["Email", "email", "email", 50],
            ["Phone*", "phone", "tel", 15],
            ["GST No", "gst", "text", 15],
            ["Website", "website", "url", 50],
            ["Address 1", "address1", "text", 100],
            ["Address 2", "address2", "text", 100],
            ["Address 3", "address3", "text", 100],
          ].map(([label, name, type, maxLength]) => (
            <div key={name} className="flex flex-col w-full">
              <label className="text-sm text-gray-900 mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={profile[name]}
                onChange={handleInputChange}
                maxLength={maxLength}
                className={`px-3 py-2 rounded-xl border ${errors[name] ? "border-red-500" : "border-gray-300"} bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition`}
                disabled={loading}
              />
              {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
            </div>
          ))}
        </div>

        {/* Action Button for Profile (Placed here since section below is hidden) */}
        <div className="flex justify-end mb-8 border-b pb-6">
          {isProfileLoaded ? (
            <button
              onClick={handleSaveProfileChanges}
              disabled={loading || Object.keys(errors).length > 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium shadow-sm"
            >
              Save Profile Changes
            </button>
          ) : (
            <p className="text-gray-500 italic text-sm">Loading profile details...</p>
          )}
        </div>

        {/* General Settings Section */}
        <div className="space-y-4">
          <h2 className="text-[18px] font-medium text-gray-900">Company Additional Settings</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: "whatsapp_active", label: "WhatsApp Access" },
              { id: "mail_active", label: "Email Access" },
              { id: "website_active", label: "Website Access" },
              { id: "phone_active", label: "Phone Access" },
              { id: "sub_src_active", label: "Sub Source Access" },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <input
                  type="checkbox"
                  id={id}
                  checked={generalSettings[id]}
                  onChange={() => handleToggleChange(id)}
                  className="h-4 w-4 text-blue-600"
                  disabled={loading}
                />
                <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
                  {label}
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center mt-6 gap-3">
            <label htmlFor="quotation_prefix" className="text-sm font-medium text-gray-700">
              Set your company prefix
            </label>
            <input
              type="text"
              id="quotation_prefix"
              value={generalSettings.quotation_prefix}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, quotation_prefix: e.target.value }))}
              className="border border-gray-300 rounded-lg p-2 w-full sm:w-48 focus:ring-2 focus:ring-blue-400 outline-none"
              disabled={loading}
              placeholder="e.g. QT-"
            />
          </div>

          <div className="pt-2">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium shadow-sm"
              onClick={handleSaveGeneralSettings}
              disabled={loading}
            >
              Save General Settings
            </button>
          </div>
        </div>
      </div>

      {false && <LeadDetailView settingsData={generalSettings} />}
    </>
  );
};

export default AccountSettings;
