import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const LeadForm = ({ onClose, onSuccess }) => {
  const token = localStorage.getItem("token");
  const [userId, setUserId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Form state
  const [form, setForm] = useState({
     iLeadpoten_id: "",
      ileadstatus_id: "",
      cindustry_id: "",
      csubindustry_id: "",
      lead_source_id: "",
      ino_employee: 0,
      iproject_value: 0,
      clead_name: "",
      cemail: "",
      corganization: "",
      cwebsite: "",
      icity: "",
      iphone_no: "",
      phone_country_code: "+91",
      cgender: 1,
      clogo: "logo.png",
      clead_address1: "",
      cwhatsapp: "",
      whatsapp_country_code: "+91",
      clead_address2: "",
      clead_address3: "",
      // cstate: "",
      // cdistrict: "",
      // cpincode: "",
      // ccountry: "",
      clead_owner: userId,
      clead_source: "",
      cresponded_by: userId,
      modified_by: userId,
      iservice_id: "",
      isubservice_id: "" 
  });

  const [errors, setErrors] = useState({});
  const [sameAsPhone, setSameAsPhone] = useState(false);

  // Dropdown data
  const [potentialOptions, setPotentialOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [subIndustryOptions, setSubIndustryOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [subServiceOptions, setSubServiceOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [countryCodes, setCountryCodes] = useState([{ name: "India", code: "+91" }]);

  // Search states
  const [searchPotential, setSearchPotential] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchIndustry, setSearchIndustry] = useState("");
  const [searchSubIndustry, setSearchSubIndustry] = useState("");
  const [searchSource, setSearchSource] = useState("");
  const [searchService, setSearchService] = useState("");
  const [searchSubService, setSearchSubService] = useState("");
  const [searchCity, setSearchCity] = useState("");

  // Dropdown visibility
  const [showPotentialDropdown, setShowPotentialDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showSubIndustryDropdown, setShowSubIndustryDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showSubServiceDropdown, setShowSubServiceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showPhoneCodeDropdown, setShowPhoneCodeDropdown] = useState(false);
  const [showWhatsappCodeDropdown, setShowWhatsappCodeDropdown] = useState(false);

  // Refs
  const formRef = useRef(null);
  const dropdownRefs = {
    potential: useRef(null),
    status: useRef(null),
    industry: useRef(null),
    subIndustry: useRef(null),
    source: useRef(null),
    service: useRef(null),
    subService: useRef(null),
    city: useRef(null),
    phoneCode: useRef(null),
    whatsappCode: useRef(null)
  };

  // Extract user info from token
  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        setUserId(payload.user_id);
        setCompanyId(payload.company_id);
      } catch (error) {
        console.error("Token decode error:", error);
      }
    }
  }, [token]);

  // Fetch all dropdown data
  useEffect(() => {
    if (!token || !companyId) return;

    const fetchData = async () => {
      try {
        const apiEndpoint = import.meta.env.VITE_API_URL;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const endpoints = [
          `${apiEndpoint}/lead-potential/company-potential`,
          `${apiEndpoint}/lead-status/company-lead`,
          `${apiEndpoint}/lead-industry/company-industry`,
          `${apiEndpoint}/lead-source/company-src`,
          `${apiEndpoint}/lead-service`,
          `${apiEndpoint}/city`,
          `${apiEndpoint}/sub-service`
        ];

        const responses = await Promise.all(
          endpoints.map(url => fetch(url, { headers }).then(res => res.json()))
        );

        setPotentialOptions(responses[0]?.data || []);
        setStatusOptions(responses[1]?.response || []);
        setIndustryOptions(responses[2]?.response?.industry || []);
        setSubIndustryOptions(responses[2]?.response?.subindustries || []);
        setSourceOptions(responses[3]?.data || []);
        setServiceOptions(responses[4]?.data || []);
        setCityOptions(responses[5]?.cities || []);
        setSubServiceOptions(responses[6]?.data || []);

      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchData();
  }, [token, companyId]);

  // Fetch city details when city is selected
  useEffect(() => {
    const fetchCityDetails = async () => {
      if (!form.icity) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/city/${form.icity}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setForm(prev => ({
            ...prev,
            cstate: data.state || "",
            cdistrict: data.district || "",
            ccountry: data.country || "",
            cpincode: data.cpincode || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching city details:", error);
      }
    };

    fetchCityDetails();
  }, [form.icity, token]);

  // Filter sub-services when service changes
  useEffect(() => {
    if (form.iservice_id) {
      setSearchSubService("");
      setForm(prev => ({ ...prev, isubservice_id: "" }));
    }
  }, [form.iservice_id]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "iphone_no" && sameAsPhone ? { 
        cwhatsapp: value,
        whatsapp_country_code: prev.phone_country_code 
      } : {}),
      ...(name === "cindustry_id" ? { isubindustry: "" } : {}),
      ...(name === "iservice_id" ? { isubservice_id: "" } : {}),
    }));

    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  // Validate field
  const validateField = (name, value) => {
    const requiredFields = [
      "clead_name", "corganization", "clead_address1", 
      "iphone_no", "iLeadpoten_id", "ileadstatus_id",
      "cindustry_id", "lead_source_id", "iservice_id", "icity"
    ];

    if (requiredFields.includes(name) && !value) {
      return "This field is required";
    }

    switch (name) {
      case "clead_name":
        if (!/^[A-Za-z\s]+$/.test(value)) return "Only letters and spaces allowed";
        if (value.length > 100) return "Max 100 characters";
        break;
      case "corganization":
        if (value.length > 100) return "Max 100 characters";
        break;
      case "clead_address1":
        if (value.length > 200) return "Max 200 characters";
        break;
      case "iphone_no":
      case "cwhatsapp":
        if (!/^\d{10}$/.test(value)) return "Must be 10 digits";
        break;
      case "cemail":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
        break;
      case "cpincode":
        if (value && !/^\d{6}$/.test(value)) return "Must be 6 digits";
        break;
      case "isubindustry":
        if (!value) return "Please select a sub-industry";
        break;
      case "ino_employee":
        if (value && (isNaN(value) || value < 0)) return "Invalid number";
        break;
      case "iproject_value":
        if (value && (isNaN(value) || value < 0)) return "Invalid amount";
        break;
      case "cwebsite":
        if (value && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/?)?$/.test(value)) {
          return "Enter a valid website (e.g., example.com or www.example.co)";
        }
        break;
    }

    return "";
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach(field => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  try {
    const payload = {
      clead_name: form.clead_name,
      corganization: form.corganization,
      cwebsite: form.cwebsite,
      iLeadpoten_id: Number(form.iLeadpoten_id),
      ileadstatus_id: Number(form.ileadstatus_id),
      cindustry_id: Number(form.cindustry_id),
      isubindustry: form.isubindustry ? Number(form.isubindustry) : null,
      lead_source_id: Number(form.lead_source_id),
      iservice_id: form.iservice_id ? Number(form.iservice_id) : null,
      isubservice_id: form.isubservice_id ? Number(form.isubservice_id) : null,
      ino_employee: Number(form.ino_employee) || 0,
      iproject_value: Number(form.iproject_value) || 0,
      cemail: form.cemail,
      iphone_no: `${form.phone_country_code}${form.iphone_no}`,
      whatsapp_number: sameAsPhone 
        ? `${form.phone_country_code}${form.iphone_no}`
        : `${form.whatsapp_country_code}${form.cwhatsapp}`,
      clead_address1: form.clead_address1,
      clead_address2: form.clead_address2,
      clead_address3: form.clead_address3,
      icity: Number(form.icity),
      bactive: true,
      clead_owner: userId,
      cresponded_by: userId,
      modified_by: userId,
      icompany_id: companyId,
      dmodified_dt: new Date().toISOString(),
      cgender: 1,
      cimage: "noimg.png",
      clogo: "logo.png",
      iuser_tags: userId
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      setPopupMessage("Lead created successfully!");
      setShowPopup(true);
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } else {
      throw new Error(data.message || data.details || "Failed to create lead");
    }
  } catch (error) {
    setPopupMessage(error.message);
    setShowPopup(true);
  } finally {
    setLoading(false);
  }
};

  // Close popup
  const closePopup = () => setShowPopup(false);

  // Toggle same phone and whatsapp
  const toggleSamePhoneWhatsapp = () => {
    setSameAsPhone(!sameAsPhone);
    if (!sameAsPhone) {
      setForm(prev => ({
        ...prev,
        cwhatsapp: prev.iphone_no,
        whatsapp_country_code: prev.phone_country_code
      }));
    }
  };

  // Handle dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.values(dropdownRefs).forEach(ref => {
        if (ref.current && !ref.current.contains(event.target)) {
          switch (ref) {
            case dropdownRefs.potential:
              setShowPotentialDropdown(false);
              break;
            case dropdownRefs.status:
              setShowStatusDropdown(false);
              break;
            case dropdownRefs.industry:
              setShowIndustryDropdown(false);
              break;
            case dropdownRefs.subIndustry:
              setShowSubIndustryDropdown(false);
              break;
            case dropdownRefs.source:
              setShowSourceDropdown(false);
              break;
            case dropdownRefs.service:
              setShowServiceDropdown(false);
              break;
            case dropdownRefs.subService:
              setShowSubServiceDropdown(false);
              break;
            case dropdownRefs.city:
              setShowCityDropdown(false);
              break;
            case dropdownRefs.phoneCode:
              setShowPhoneCodeDropdown(false);
              break;
            case dropdownRefs.whatsappCode:
              setShowWhatsappCodeDropdown(false);
              break;
          }
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter dropdown options based on search
  const filteredOptions = {
    potential: potentialOptions.filter(opt => 
      opt.clead_name?.toLowerCase().includes(searchPotential.toLowerCase())
    ),
    status: statusOptions.filter(opt => 
      opt.clead_name?.toLowerCase().includes(searchStatus.toLowerCase())
    ),
    industry: industryOptions.filter(opt => 
      opt.cindustry_name?.toLowerCase().includes(searchIndustry.toLowerCase())
    ),
    subIndustry: subIndustryOptions.filter(opt => 
      opt.iindustry_parent === Number(form.cindustry_id) &&
      opt.subindustry_name?.toLowerCase().includes(searchSubIndustry.toLowerCase())
    ),
    source: sourceOptions.filter(opt => 
      opt.source_name?.toLowerCase().includes(searchSource.toLowerCase())
    ),
    service: serviceOptions.filter(opt => 
      opt.cservice_name?.toLowerCase().includes(searchService.toLowerCase())
    ),
    subService: subServiceOptions.filter(opt => 
      opt.iservice_parent === Number(form.iservice_id) &&
      opt.subservice_name?.toLowerCase().includes(searchSubService.toLowerCase())
    ),
    city: cityOptions.filter(opt => 
      opt.cCity_name?.toLowerCase().includes(searchCity.toLowerCase())
    ),
    phoneCode: countryCodes.filter(cc => 
      cc.code.includes(form.phone_country_code)
    ),
    whatsappCode: countryCodes.filter(cc => 
      cc.code.includes(form.whatsapp_country_code)
    )
  };

  // Render input field
  const renderInputField = (label, name, type = "text", required = false, readOnly = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
          errors[name] ? "border-red-500" : ""
        }`}
        required={required}
        readOnly={readOnly}
      />
      {errors[name] && <p className="text-red-600 text-sm mt-1">{errors[name]}</p>}
    </div>
  );

  // Render dropdown field
  const renderDropdownField = (
    label,
    name,
    searchValue,
    setSearchValue,
    showDropdown,
    setShowDropdown,
    options,
    keyField,
    displayField,
    ref,
    required = false,
    disabled = false
  ) => (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => !disabled && setShowDropdown(true)}
        placeholder={`Search ${label.toLowerCase()}...`}
        className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
          errors[name] || disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        disabled={disabled}
      />
      {showDropdown && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            options.map(item => (
              <div
                key={item[keyField]}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setForm(prev => ({ ...prev, [name]: item[keyField] }));
                  setSearchValue(item[displayField]);
                  setShowDropdown(false);
                  setErrors(prev => ({ ...prev, [name]: "" }));
                }}
              >
                {item[displayField]}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 italic">
              {name === "isubindustry" && !form.cindustry_id 
                ? "Please select an industry first" 
                : name === "isubservice_id" && !form.iservice_id
                ? "Please select a service first"
                : "No options found"}
            </div>
          )}
        </div>
      )}
      {errors[name] && <p className="text-red-600 text-sm mt-1">{errors[name]}</p>}
    </div>
  );

  // Render phone input field
  const renderPhoneField = (type) => {
    const isPhone = type === "phone";
    const name = isPhone ? "iphone_no" : "cwhatsapp";
    const codeName = isPhone ? "phone_country_code" : "whatsapp_country_code";
    const searchCode = isPhone ? form.phone_country_code : form.whatsapp_country_code;
    const setSearchCode = isPhone ? 
      (value) => setForm(prev => ({ ...prev, [codeName]: value })) : 
      (value) => setForm(prev => ({ ...prev, [codeName]: value }));
    const showDropdown = isPhone ? showPhoneCodeDropdown : showWhatsappCodeDropdown;
    const setShowDropdown = isPhone ? setShowPhoneCodeDropdown : setShowWhatsappCodeDropdown;
    const ref = isPhone ? dropdownRefs.phoneCode : dropdownRefs.whatsappCode;
    const required = isPhone;

    const validatePhoneNumber = (value) => {
      if (!value) return required ? "This field is required" : "";
      if (!/^\d{10}$/.test(value)) return "Must be 10 digits";
      return "";
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isPhone ? "Mobile Number" : "WhatsApp Number"} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex">
          <div className="relative" ref={ref}>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="border px-3 py-2 rounded-l-md focus:ring-2 focus:ring-blue-500 outline-none w-20"
              placeholder="+XX"
            />
            {showDropdown && (
              <div className="absolute z-10 top-full mt-1 bg-white border rounded shadow-md max-h-60 overflow-y-auto w-40">
                {countryCodes.filter(c => c.code.includes(searchCode)).map(cc => (
                  <div
                    key={cc.code}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSearchCode(cc.code);
                      setShowDropdown(false);
                    }}
                  >
                    {cc.code} ({cc.name})
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            name={name}
            value={form[name]}
            onChange={(e) => {
              const error = validatePhoneNumber(e.target.value);
              setErrors(prev => ({ ...prev, [name]: error }));
              handleChange(e);
            }}
            placeholder={`Enter ${isPhone ? "mobile" : "WhatsApp"} number`}
            className={`flex-1 border px-3 py-2 rounded-r-md focus:ring-2 focus:ring-blue-500 outline-none ${
              errors[name] ? "border-red-500" : ""
            }`}
            disabled={!isPhone && sameAsPhone}
          />
        </div>
        {errors[name] && <p className="text-red-600 text-sm mt-1">{errors[name]}</p>}
        {isPhone && (
          <label className="inline-flex items-center mt-2">
            <input
              type="checkbox"
              checked={sameAsPhone}
              onChange={toggleSamePhoneWhatsapp}
              className="mr-2"
            />
            <span className="text-sm">Use same for WhatsApp</span>
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-start pt-10 z-50 overflow-y-auto px-4">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl p-6 space-y-6 mb-10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-800">Create New Lead</h2>

        <div className="space-y-6">
          {/* Lead Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInputField("Lead Name", "clead_name", "text", true)}
              {renderInputField("Organization Name", "corganization", "text", true)}
              {renderInputField("Website", "cwebsite", "url")}

              {renderDropdownField(
                "Lead Potential",
                "iLeadpoten_id",
                searchPotential,
                setSearchPotential,
                showPotentialDropdown,
                setShowPotentialDropdown,
                filteredOptions.potential,
                "ileadpoten_id",
                "clead_name",
                dropdownRefs.potential,
                true
              )}

              {renderDropdownField(
                "Lead Status",
                "ileadstatus_id",
                searchStatus,
                setSearchStatus,
                showStatusDropdown,
                setShowStatusDropdown,
                filteredOptions.status,
                "ilead_status_id",
                "clead_name",
                dropdownRefs.status,
                true
              )}

              {renderDropdownField(
                "Industry",
                "cindustry_id",
                searchIndustry,
                setSearchIndustry,
                showIndustryDropdown,
                setShowIndustryDropdown,
                filteredOptions.industry,
                "iindustry_id",
                "cindustry_name",
                dropdownRefs.industry,
                true
              )}

              {renderDropdownField(
                "Sub-Industry",
                "isubindustry",
                searchSubIndustry,
                setSearchSubIndustry,
                showSubIndustryDropdown,
                setShowSubIndustryDropdown,
                filteredOptions.subIndustry,
                "isubindustry",
                "subindustry_name",
                dropdownRefs.subIndustry,
                false,
                !form.cindustry_id
              )}

              {renderDropdownField(
                "Lead Source",
                "lead_source_id",
                searchSource,
                setSearchSource,
                showSourceDropdown,
                setShowSourceDropdown,
                filteredOptions.source,
                "source_id",
                "source_name",
                dropdownRefs.source,
                true
              )}

              {renderDropdownField(
                "Service",
                "iservice_id",
                searchService,
                setSearchService,
                showServiceDropdown,
                setShowServiceDropdown,
                filteredOptions.service,
                "iservice_id",
                "cservice_name",
                dropdownRefs.service,
                true
              )}

              {renderDropdownField(
                "Sub-Service",
                "isubservice_id",
                searchSubService,
                setSearchSubService,
                showSubServiceDropdown,
                setShowSubServiceDropdown,
                filteredOptions.subService,
                "isubservice_id",
                "subservice_name",
                dropdownRefs.subService,
                false,
                !form.iservice_id
              )}

              {renderInputField("Number of Employees", "ino_employee", "number")}
              {renderInputField("Project Value", "iproject_value", "number")}
            </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInputField("Email", "cemail", "email")}
              {renderPhoneField("phone")}
              {renderPhoneField("whatsapp")}
            </div>
          </div>

          {/* Address Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInputField("Address Line 1", "clead_address1", "text", true)}
              {renderInputField("Address Line 2", "clead_address2")}
              {renderInputField("Address Line 3", "clead_address3")}

              {renderDropdownField(
                "City",
                "icity",
                searchCity,
                setSearchCity,
                showCityDropdown,
                setShowCityDropdown,
                filteredOptions.city,
                "icity_id",
                "cCity_name",
                dropdownRefs.city,
                true
              )}

              {renderInputField("Country", "ccountry", "text", false, true)}
              {renderInputField("State", "cstate", "text", false, true)}
              {renderInputField("District", "cdistrict", "text", false, true)}
              {renderInputField("Pincode", "cpincode")}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-40 bg-blue-600 text-white py-2.5 font-semibold rounded-md hover:bg-blue-700 transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Processing...
              </span>
            ) : (
              "Create Lead"
            )}
          </button>
        </div>
      </form>

      {/* Success/Error Popup */}
      {showPopup && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <span>{popupMessage}</span>
          <button 
            onClick={closePopup}
            className="ml-4 text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadForm;