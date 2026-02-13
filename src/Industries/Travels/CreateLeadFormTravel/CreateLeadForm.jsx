import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content';
import { X, Search, ChevronDown } from "lucide-react";
import { useUserAccess } from "../../../context/UserAccessContext";
import { ServiceContext } from "../../../context/Master/ServiceContext/ServiceContext";
import { SubServiceContext } from "../../../context/Master/SubServiceContext/SubserviceContext";
import { useBusiness } from "../../../context/BusinessTypeContext";
import { useCountryCodes } from "../../../hooks/useCountryCodes";
import PopupMessage from "../../../context/PopUpMessage/PopupMessage";
import ExistingLeadSearch from "./ExistingLeadSearch";

const apiEndPoint = import.meta.env.VITE_API_URL;

const LeadForm = ({ onClose, onSuccess, initialData }) => {
  const { userModules } = useUserAccess();
  const { services, loading: servicesLoading } = useContext(ServiceContext);
  const { subServices, loading: subServicesLoading } = useContext(SubServiceContext);
  
  // Use the country codes hook
  const { 
    countryCodeOptions, 
    loading: countryCodesLoading,
    filterCountryCodes,
    getCountryCodeByValue,
    splitPhoneNumber,
    validatePhoneNumber,
    defaultCode
  } = useCountryCodes();
  
  
  const canSeeExistingLeads = React.useMemo(() => {
    if (!userModules || !Array.isArray(userModules)) {
      return false;
    }
    
    return userModules.some(
      (module) => module.attribute_name === "Reccuring-Client" && module.bactive === true
    );
  }, [userModules]);

  const MySwal = withReactContent(Swal);
  
  const modalRef = useRef(null);
  const token = localStorage.getItem("token");
  let userId = "";
  let company_id = "";

  if (token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      userId = payload.user_id;
      company_id = payload.company_id;
    } catch (error) {
      console.error("Token decode error:", error);
    }
  } else {
    console.error("Invalid or missing JWT token");
  }

  const [foundLeads, setFoundLeads] = useState([]);
  const [isExistingClientForm, setIsExistingClientForm] = useState(false);
  const [existingClientMobile, setExistingClientMobile] = useState("");
  const [existingClientData, setExistingClientData] = useState(null);

  const [form, setForm] = useState({
    clead_name: "",
    cemail: "",
    iphone_no: "",
    phone_country_code: defaultCode,
    iservice_id: "",
    isubservice_id: "",
    clead_owner: userId,
    modified_by: userId,
    iLeadpoten_id: "",
    ileadstatus_id: "",
    lead_source_id: "",
    corganization: "",
  });

  const [errors, setErrors] = useState({});
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filteredSubService, setFilteredSubService] = useState([]);
  const [searchService, setSearchService] = useState('');
  const [searchSubService, setSearchSubService] = useState("");
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isSubServiceDropdownOpen, setIsSubServiceDropdownOpen] = useState(false);
  const [searchMobileCountryCode, setSearchMobileCountryCode] = useState(form.phone_country_code);
  const [isMobileCountryCodeDropdownOpen, setIsMobileCountryCodeDropdownOpen] = useState(false);
  const [filteredMobileCountryCodes, setFilteredMobileCountryCodes] = useState(countryCodeOptions);
  const [searchMobile, setSearchMobile] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const serviceDropdownRef = useRef(null);
  const subServiceDropdownRef = useRef(null);
  const mobileCountryCodeRef = useRef(null);
  const formRef = useRef(null);
  const saveTriggerRef = useRef(false);

  // Update filtered country codes when search changes
  useEffect(() => {
    if (searchMobileCountryCode) {
      filterCountryCodes(searchMobileCountryCode);
    }
  }, [searchMobileCountryCode, filterCountryCodes]);

  // Update local filtered codes when context filtered codes change
  useEffect(() => {
    setFilteredMobileCountryCodes(countryCodeOptions);
  }, [countryCodeOptions]);

  useEffect(() => {
    if (initialData?.phoneNumber) {
      const { countryCode, nationalNumber } = splitPhoneNumber(initialData.phoneNumber);

      setForm((prev) => ({
        ...prev,
        iphone_no: nationalNumber,
        phone_country_code: countryCode,
      }));

      setSearchMobileCountryCode(countryCode);
    }
  }, [initialData, splitPhoneNumber]);

  useEffect(() => {
    if (existingClientData && services.length > 0 && subServices.length > 0) {
      // Extract phone number parts
      const phoneNum = existingClientData.iphone_no || "";
      const { countryCode, nationalNumber } = splitPhoneNumber(phoneNum);

      setForm(prev => ({
        ...prev,
        clead_name: existingClientData.clead_name || "",
        cemail: existingClientData.cemail || "",
        iphone_no: nationalNumber,
        phone_country_code: countryCode,
        iservice_id: existingClientData.serviceId || "",
        isubservice_id: existingClientData.isubservice_id || "",
        iLeadpoten_id: existingClientData.iLeadpoten_id || "",
        ileadstatus_id: existingClientData.ileadstatus_id || "",
        lead_source_id: existingClientData.lead_source_id || "",
        corganization: existingClientData.corganization || "",
      }));

      const selectedService = services.find(s => s.serviceId === existingClientData.iservice_id);
      if (selectedService) setSearchService(selectedService.serviceName);

      const selectedSubService = subServices.find(ss => ss.isubservice_id === existingClientData.isubservice_id);
      if (selectedSubService) setSearchSubService(selectedSubService.subservice_name);
    }
  }, [existingClientData, services, subServices, splitPhoneNumber]);

  // outside onclose function 
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const resetForm = () => {
    setForm({
      clead_name: "",
      cemail: "",
      iphone_no: "",
      phone_country_code: defaultCode,
      iservice_id: "",
      isubservice_id: "",
      clead_owner: userId,
      modified_by: userId,
      iLeadpoten_id: "",
      ileadstatus_id: "",
      lead_source_id: "",
      corganization: "",
    });
    setErrors({});
    setSearchService("");
    setSearchSubService("");
    setSearchMobileCountryCode(defaultCode);
    setSameAsPhone(false);
  };

  const handleSearchExistingLead = async () => {
    if (!searchMobile && !searchEmail) {
      setPopupMessage("Please enter either mobile number or email to search");
      setIsPopupVisible(true);
      setTimeout(() => setIsPopupVisible(false), 3000);
      return;
    }

    if (searchMobile) {
      const mobileRegex = /^[0-9]{6,15}$/;
      if (!mobileRegex.test(searchMobile)) {
        setPopupMessage("Mobile number must contain only 6 to 15 digits");
        setIsPopupVisible(true);
        setTimeout(() => setIsPopupVisible(false), 3000);
        return;
      }
    }

    if (searchEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(searchEmail)) {
        setPopupMessage("Please enter a valid email address");
        setIsPopupVisible(true);
        setTimeout(() => setIsPopupVisible(false), 3000);
        return;
      }
    }
    
    setLoading(true);
    setFoundLeads([]);

    try {
      let body = {};

      if (searchMobile) {
        body = { 
          phonenumber: searchMobile,
          phone_country_code: searchMobileCountryCode,
        };
      } else if (searchEmail) {
        body = { email: searchEmail };
      }

      const res = await fetch(`${apiEndPoint}/lead/getExistingLeads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const resData = await res.json();

      if (res.ok && Array.isArray(resData.data) && resData.data.length > 0) {
        setFoundLeads(resData.data);
      } else {
        setPopupMessage(resData.Message || "No existing lead found.");
        setIsPopupVisible(true);
        setTimeout(() => setIsPopupVisible(false), 3000);
      }
    } catch (error) {
      console.error("Search error:", error);
      setPopupMessage("Failed to search for leads. Please try again.");
      setIsPopupVisible(true);
      setTimeout(() => setIsPopupVisible(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = async (leadId) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiEndPoint}/lead/${leadId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`Error fetching lead details [${res.status}]:`, text);
        throw new Error(`Server returned ${res.status}`);
      }

      const resData = await res.json();

      if (resData && resData.ilead_id) {
        setExistingClientData(resData);
      } else {
        setPopupMessage("Lead details not found for this ID");
        setIsPopupVisible(true);
      }
    } catch (error) {
      console.error("Fetch lead details error:", error);
      setPopupMessage("Failed to load lead details. Please try again.");
      setIsPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter sub-services based on selected service
  useEffect(() => {
    if (form.iservice_id && subServices.length > 0) {
      const filtered = subServices.filter(
        (sub) =>
          sub.iservice_parent === Number(form.iservice_id) &&
          sub.subservice_name?.toLowerCase().includes(searchSubService.toLowerCase())
      );
      setFilteredSubService(filtered);
    } else {
      setFilteredSubService([]);
    }
  }, [form.iservice_id, searchSubService, subServices]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
        setIsServiceDropdownOpen(false);
      }
      if (subServiceDropdownRef.current && !subServiceDropdownRef.current.contains(event.target)) {
        setIsSubServiceDropdownOpen(false);
      }
      if (mobileCountryCodeRef.current && !mobileCountryCodeRef.current.contains(event.target)) {
        setIsMobileCountryCodeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateField = (name, value) => {
    let error = "";

    if (name === "clead_name") {
      if (!value) {
        error = "Mandatory";
      } else if (value.length > 100) {
        error = "Lead Name cannot exceed 100 characters";
      }
    }

    if (name === "iphone_no") {
      if (!value) {
        error = "Mandatory";
      } else {
        const phoneError = validatePhoneNumber(value, form.phone_country_code);
        if (phoneError) error = phoneError;
      }
    }

    if (name === "cemail") {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (value && !emailRegex.test(value)) {
        error = "Invalid email format";
      } else if (value && value.length > 70) {
        error = "Email cannot exceed 70 characters";
      }
    }

    if (name === "iservice_id" && !value) {
      error = "Mandatory";
    }

    return error;
  };

  const validateForm = () => {
    let newErrors = {};

    if (isExistingClientForm) {
      if (!existingClientData) {
        newErrors.ilead_id = "Please select a lead from the search results.";
      }
      return newErrors;
    }

    // Validate required fields
    ["clead_name", "iphone_no", "iservice_id"].forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });

    // Validate email if provided
    if (form.cemail) {
      const emailError = validateField("cemail", form.cemail);
      if (emailError) newErrors.cemail = emailError;
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'existingClientMobile') {
      setExistingClientMobile(value);
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
      return;
    }

    setForm((prev) => {
      let updated = { ...prev, [name]: value };

      // Reset sub-service when service changes
      if (name === "iservice_id") {
        updated.isubservice_id = "";
        setSearchSubService("");
      }

      return updated;
    });

    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSelectDropdownItem = (
    fieldName,
    itemId,
    itemName,
    setSearchTerm,
    setIsDropdownOpen
  ) => {
    setForm((prev) => ({ ...prev, [fieldName]: Number(itemId) }));
    setSearchTerm(itemName);
    setIsDropdownOpen(false);
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  const handleSelectCountryCode = (codeToSet) => {
    setForm((prev) => ({ ...prev, phone_country_code: codeToSet }));
    setSearchMobileCountryCode(codeToSet);
    setIsMobileCountryCodeDropdownOpen(false);
    setErrors((prev) => ({ ...prev, phone_country_code: undefined }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === "searchMobileCountryCode") {
      const selectedCode = getCountryCodeByValue(value) || getCountryCodeByValue(form.phone_country_code);
      
      if (selectedCode) {
        setSearchMobileCountryCode(selectedCode.code);
        setForm((prev) => ({ ...prev, phone_country_code: selectedCode.code }));
      } else {
        setSearchMobileCountryCode(form.phone_country_code);
      }
      setIsMobileCountryCodeDropdownOpen(false);
    } else if (name === "searchService") {
      const selectedService = services.find(s => s.serviceId === form.iservice_id);
      if (!selectedService || selectedService.serviceName !== value) {
        setSearchService(selectedService ? selectedService.serviceName : "");
        setForm((prev) => ({
          ...prev,
          iservice_id: selectedService ? selectedService.serviceId : "",
          isubservice_id: ""
        }));
        setSearchSubService("");
      }
      setIsServiceDropdownOpen(false);
    } else if (name === "searchSubService") {
      const selectedSubService = subServices.find(
        (sub) => sub.isubservice_id === form.isubservice_id
      );
      if (!selectedSubService || selectedSubService.subservice_name !== value) {
        setSearchSubService(selectedSubService ? selectedSubService.subservice_name : "");
        setForm((prev) => ({
          ...prev,
          isubservice_id: selectedSubService ? selectedSubService.isubservice_id : "",
        }));
      }
      setIsSubServiceDropdownOpen(false);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isExistingClientForm && !existingClientData) {
      setLoading(false);
      return;
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const formData = {
        bactive: true,
        clead_name: form.clead_name,
        cemail: form.cemail || null,
        iphone_no: form.iphone_no,
        phone_country_code: form.phone_country_code,
        iservice_id: Number(form.iservice_id),
        isubservice_id: form.isubservice_id ? Number(form.isubservice_id) : null,
        clead_owner: userId,
        modified_by: userId,
        icompany_id: company_id,
        iLeadpoten_id: 1, // Default value
        ileadstatus_id: 1, // Default value
        lead_source_id: 1, // Default value
        corganization: form.clead_name || "Default Organization",
        cgender: 1,
        clogo: "logo.png",
        cimage: "noimg.png",
        dmodified_dt: new Date().toISOString(),
        iuser_tags: userId,
      };

      if (saveTriggerRef.current) {
        formData.save = true;
        saveTriggerRef.current = false;
      }

      const res = await fetch(`${apiEndPoint}/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (res.ok) {
        MySwal.fire({
          title: 'Success!',
          text: 'Lead created successfully!',
          icon: 'success',
          timer: 1000,
          timerProgressBar: true,
          showConfirmButton: false
        }).then((result) => {
          if (result.dismiss === MySwal.DismissReason.timer || result.isConfirmed) {
            onClose();
            if (onSuccess) {
              onSuccess();
            }
          }
        });
      } else {
        const errorMessage =
          resData.details ||
          resData.message ||
          resData.error ||
          "Failed to create lead.";

        setPopupMessage(errorMessage);
        setIsPopupVisible(true);
        setTimeout(() => {
          setIsPopupVisible(false);
        }, 10000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setPopupMessage("Failed to create lead due to an error.");
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const EmptyDropdownMessage = ({ type }) => {
    const messages = {
      service: servicesLoading 
        ? "Loading services..." 
        : !services || services.length === 0
          ? "No services found. Please create services in the master section."
          : "No matching services found",
      subservice: form.iservice_id
        ? subServicesLoading 
          ? "Loading sub-services..." 
          : filteredSubService.length === 0
            ? searchSubService 
              ? "No matching sub-services found"
              : "No sub-services found for this service. Please create sub-services in the master section."
            : ""
        : "Please select a service first",
      countryCode: countryCodesLoading
        ? "Loading country codes..."
        : filteredMobileCountryCodes.length === 0
          ? "No matching country codes found"
          : "",
      default: "Data not available. Please check your connection or contact support.",
    };

    return (
      <div className="px-4 py-2 text-sm text-gray-500 italic">
        {messages[type] || messages.default}
      </div>
    );
  };

  // Filter services based on search
  const filterService = Array.isArray(services) && services.length > 0
    ? services.filter((item) =>
        item.serviceName?.toLowerCase().includes(searchService.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-md flex justify-center items-start pt-10 z-[9999] overflow-y-auto hide-scrollbar px-8">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative bg-white w-[95%] max-w-[800px] rounded-2xl shadow-3xl p-6 space-y-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <X size={24} />
        </button>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-center">
            CREATE A LEAD
          </h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={!isExistingClientForm}
                onChange={() => {
                  setIsExistingClientForm(false);
                  setExistingClientData(null);
                  setExistingClientMobile("");
                  setFoundLeads([]);
                  resetForm();
                }}
              />
              <span className="ml-2">New Lead</span>
            </label>
            {canSeeExistingLeads && (
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={isExistingClientForm}
                  onChange={() => {
                    setIsExistingClientForm(true);
                    setExistingClientData(null);
                    resetForm();
                  }}
                />
                <span className="ml-2">Existing Lead</span>
              </label>
            )}
          </div>
        </div>

        {/* EXISTING LEAD SEARCH SECTION */}
        {isExistingClientForm && (
        <ExistingLeadSearch
            token={token}
            canSeeExistingLeads={canSeeExistingLeads}
            onLeadSelect={(data) => {
            setExistingClientData(data);
            }}
        />
        )}


        {!isExistingClientForm || existingClientData ? (
          <>
            <h3 className="text-lg font-semibold mt-6">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Name */}
              <div>
                <label className="text-sm font-medium">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clead_name"
                  value={form.clead_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter client name"
                  className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.clead_name && (
                  <p className="text-red-600 text-sm">{errors.clead_name}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex w-full mt-1">
                  <div className="relative" ref={mobileCountryCodeRef}>
                    <div className="flex items-center border rounded-l-md focus-within:ring-2 focus-within:ring-blue-500">
                      <input
                        type="text"
                        name="searchMobileCountryCode"
                        value={searchMobileCountryCode}
                        onChange={(e) => {
                          setSearchMobileCountryCode(e.target.value);
                          filterCountryCodes(e.target.value);
                          setIsMobileCountryCodeDropdownOpen(true);
                        }}
                        onFocus={() => setIsMobileCountryCodeDropdownOpen(true)}
                        placeholder="+XXX"
                        className="px-2 py-2 w-[75px] sm:w-[90px] outline-none text-sm rounded-l-md"
                        disabled={countryCodesLoading}
                      />
                      <ChevronDown 
                        size={16} 
                        className="mr-1 text-gray-500 cursor-pointer"
                        onClick={() => setIsMobileCountryCodeDropdownOpen(!isMobileCountryCodeDropdownOpen)}
                      />
                    </div>
                    {isMobileCountryCodeDropdownOpen && (
                      <div className="absolute z-50 top-full mt-1 bg-white border rounded shadow-xl max-h-60 overflow-y-auto w-[280px] left-0">
                        {!countryCodesLoading && filteredMobileCountryCodes.length > 0 ? (
                          filteredMobileCountryCodes.map((cc) => (
                            <div
                              key={cc.value}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                handleSelectCountryCode(cc.value);
                                filterCountryCodes(cc.value);
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-0 flex items-center gap-2"
                            >
                              {cc.flag && (
                                <img src={cc.flag} alt={cc.name} className="w-5 h-3 object-cover" />
                              )}
                              <span className="font-bold">{cc.value}</span>
                              <span className="text-gray-600 truncate">{cc.name}</span>
                            </div>
                          ))
                        ) : (
                          <EmptyDropdownMessage type="countryCode" />
                        )}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    name="iphone_no"
                    value={form.iphone_no}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter phone number"
                    className="flex-1 min-w-0 border px-3 py-2 rounded-r-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                {errors.iphone_no && (
                  <p className="text-red-600 text-xs mt-1">{errors.iphone_no}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  name="cemail"
                  value={form.cemail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter email address"
                  className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {errors.cemail && (
                  <p className="text-red-600 text-sm">{errors.cemail}</p>
                )}
              </div>

              {/* Service */}
              <div className="flex flex-col relative" ref={serviceDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search service..."
                  className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchService}
                  onChange={(e) => {
                    setSearchService(e.target.value);
                    setIsServiceDropdownOpen(true);
                  }}
                  onFocus={() => setIsServiceDropdownOpen(true)}
                  disabled={servicesLoading}
                />
                {isServiceDropdownOpen && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                    {!servicesLoading && filterService && filterService.length > 0 ? (
                      filterService.map((item) => (
                        <div
                          key={item.serviceId}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            handleSelectDropdownItem(
                              "iservice_id",
                              item.serviceId,
                              item.serviceName,
                              setSearchService,
                              setIsServiceDropdownOpen
                            )
                          }
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {item.serviceName}
                        </div>
                      ))
                    ) : (
                      <EmptyDropdownMessage type="service" />
                    )}
                  </div>
                )}
                {errors.iservice_id && <p className="text-red-600 text-sm">{errors.iservice_id}</p>}
                {!servicesLoading && (!services || services.length === 0) && (
                  <p className="text-gray-500 text-xs mt-1">No services available</p>
                )}
              </div>

              {/* Sub Service - Only enabled when a service is selected */}
              <div className="flex flex-col relative" ref={subServiceDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1"> Sub Service</label>
                <input
                  type="text"
                  placeholder={!form.iservice_id ? "Select a service first" : "Search sub service..."}
                  className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
                    !form.iservice_id ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={searchSubService}
                  onChange={(e) => {
                    setSearchSubService(e.target.value);
                    setIsSubServiceDropdownOpen(true);
                  }}
                  onFocus={() => form.iservice_id && setIsSubServiceDropdownOpen(true)}
                  disabled={!form.iservice_id || subServicesLoading}
                />
                {isSubServiceDropdownOpen && form.iservice_id && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                    {!subServicesLoading && filteredSubService && filteredSubService.length > 0 ? (
                      filteredSubService.map((item) => (
                        <div
                          key={item.isubservice_id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            handleSelectDropdownItem(
                              "isubservice_id",
                              item.isubservice_id,
                              item.subservice_name,
                              setSearchSubService,
                              setIsSubServiceDropdownOpen
                            )
                          }
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {item.subservice_name}
                          {item.cost && <span className="text-gray-500 text-xs ml-2">(₹{item.cost})</span>}
                        </div>
                      ))
                    ) : (
                      <EmptyDropdownMessage type="subservice" />
                    )}
                  </div>
                )}
                {subServicesLoading && form.iservice_id && (
                  <p className="text-gray-500 text-xs mt-1">Loading sub-services...</p>
                )}
              </div>
            </div>
          </>
        ) : null}

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || (isExistingClientForm ? !existingClientData : Object.keys(errors).some((key) => errors[key]))}
            className={`w-[150px] flex justify-center items-center bg-blue-600 text-white py-2 font-semibold rounded-md transition
              ${loading || (isExistingClientForm ? !existingClientData : Object.keys(errors).some((key) => errors[key]))
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-blue-700"
              }`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              "Create Lead"
            )}
          </button>
        </div>

        {isPopupVisible && (
            <PopupMessage
                isVisible={isPopupVisible}
                message={popupMessage}
                onClose={() => setIsPopupVisible(false)}
                onSaveAnyway={() => {
                saveTriggerRef.current = true;
                formRef.current?.requestSubmit();
                }}
            />
         )}
      </form>
    </div>
  );
};

export default LeadForm;

// import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
// import Swal from "sweetalert2";
// import withReactContent from 'sweetalert2-react-content';
// import { X, Search, ChevronDown } from "lucide-react";
// import { useUserAccess } from "../../../context/UserAccessContext";
// import { ServiceContext } from "../../../context/Master/ServiceContext/ServiceContext";
// import { SubServiceContext } from "../../../context/Master/SubServiceContext/SubserviceContext";
// import { useBusiness } from "../../../context/BusinessTypeContext";
// import { useCountryCodes } from "../../../hooks/useCountryCodes";
// import PopupMessage from "../../../context/PopUpMessage/PopupMessage";

// const apiEndPoint = import.meta.env.VITE_API_URL;

// const LeadForm = ({ onClose, onSuccess, initialData }) => {
//   const { userModules } = useUserAccess();
//   const { services, loading: servicesLoading } = useContext(ServiceContext);
//   const { subServices, loading: subServicesLoading } = useContext(SubServiceContext);
  
//   // Use the country codes hook
//   const { 
//     countryCodeOptions, 
//     loading: countryCodesLoading,
//     filterCountryCodes,
//     getCountryCodeByValue,
//     splitPhoneNumber,
//     validatePhoneNumber,
//     defaultCode
//   } = useCountryCodes();
  
  
//   const canSeeExistingLeads = React.useMemo(() => {
//     if (!userModules || !Array.isArray(userModules)) {
//       return false;
//     }
    
//     return userModules.some(
//       (module) => module.attribute_name === "Reccuring-Client" && module.bactive === true
//     );
//   }, [userModules]);

//   const MySwal = withReactContent(Swal);
  
//   const modalRef = useRef(null);
//   const token = localStorage.getItem("token");
//   let userId = "";
//   let company_id = "";

//   if (token) {
//     try {
//       const base64Url = token.split(".")[1];
//       const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//       const payload = JSON.parse(atob(base64));
//       userId = payload.user_id;
//       company_id = payload.company_id;
//     } catch (error) {
//       console.error("Token decode error:", error);
//     }
//   } else {
//     console.error("Invalid or missing JWT token");
//   }

//   const [foundLeads, setFoundLeads] = useState([]);
//   const [isExistingClientForm, setIsExistingClientForm] = useState(false);
//   const [existingClientMobile, setExistingClientMobile] = useState("");
//   const [existingClientData, setExistingClientData] = useState(null);

//   const [form, setForm] = useState({
//     clead_name: "",
//     cemail: "",
//     iphone_no: "",
//     phone_country_code: defaultCode,
//     iservice_id: "",
//     isubservice_id: "",
//     clead_owner: userId,
//     modified_by: userId,
//     iLeadpoten_id: "",
//     ileadstatus_id: "",
//     lead_source_id: "",
//     corganization: "",
//   });

//   const [errors, setErrors] = useState({});
//   const [sameAsPhone, setSameAsPhone] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [filteredSubService, setFilteredSubService] = useState([]);
//   const [searchService, setSearchService] = useState('');
//   const [searchSubService, setSearchSubService] = useState("");
//   const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
//   const [isSubServiceDropdownOpen, setIsSubServiceDropdownOpen] = useState(false);
//   const [searchMobileCountryCode, setSearchMobileCountryCode] = useState(form.phone_country_code);
//   const [isMobileCountryCodeDropdownOpen, setIsMobileCountryCodeDropdownOpen] = useState(false);
//   const [filteredMobileCountryCodes, setFilteredMobileCountryCodes] = useState(countryCodeOptions);
//   const [searchMobile, setSearchMobile] = useState("");
//   const [searchEmail, setSearchEmail] = useState("");
//   const [isPopupVisible, setIsPopupVisible] = useState(false);
//   const [popupMessage, setPopupMessage] = useState("");

//   const serviceDropdownRef = useRef(null);
//   const subServiceDropdownRef = useRef(null);
//   const mobileCountryCodeRef = useRef(null);
//   const formRef = useRef(null);
//   const saveTriggerRef = useRef(false);

//   // Update filtered country codes when search changes
//   useEffect(() => {
//     if (searchMobileCountryCode) {
//       filterCountryCodes(searchMobileCountryCode);
//     }
//   }, [searchMobileCountryCode, filterCountryCodes]);

//   // Update local filtered codes when context filtered codes change
//   useEffect(() => {
//     setFilteredMobileCountryCodes(countryCodeOptions);
//   }, [countryCodeOptions]);

//   useEffect(() => {
//     if (initialData?.phoneNumber) {
//       const { countryCode, nationalNumber } = splitPhoneNumber(initialData.phoneNumber);

//       setForm((prev) => ({
//         ...prev,
//         iphone_no: nationalNumber,
//         phone_country_code: countryCode,
//       }));

//       setSearchMobileCountryCode(countryCode);
//     }
//   }, [initialData, splitPhoneNumber]);

//   useEffect(() => {
//     if (existingClientData && services.length > 0 && subServices.length > 0) {
//       // Extract phone number parts
//       const phoneNum = existingClientData.iphone_no || "";
//       const { countryCode, nationalNumber } = splitPhoneNumber(phoneNum);

//       setForm(prev => ({
//         ...prev,
//         clead_name: existingClientData.clead_name || "",
//         cemail: existingClientData.cemail || "",
//         iphone_no: nationalNumber,
//         phone_country_code: countryCode,
//         iservice_id: existingClientData.serviceId || "",
//         isubservice_id: existingClientData.isubservice_id || "",
//         iLeadpoten_id: existingClientData.iLeadpoten_id || "",
//         ileadstatus_id: existingClientData.ileadstatus_id || "",
//         lead_source_id: existingClientData.lead_source_id || "",
//         corganization: existingClientData.corganization || "",
//       }));

//       const selectedService = services.find(s => s.serviceId === existingClientData.iservice_id);
//       if (selectedService) setSearchService(selectedService.serviceName);

//       const selectedSubService = subServices.find(ss => ss.isubservice_id === existingClientData.isubservice_id);
//       if (selectedSubService) setSearchSubService(selectedSubService.subservice_name);
//     }
//   }, [existingClientData, services, subServices, splitPhoneNumber]);

//   // outside onclose function 
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (modalRef.current && !modalRef.current.contains(event.target)) {
//         onClose();
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [onClose]);

//   const resetForm = () => {
//     setForm({
//       clead_name: "",
//       cemail: "",
//       iphone_no: "",
//       phone_country_code: defaultCode,
//       iservice_id: "",
//       isubservice_id: "",
//       clead_owner: userId,
//       modified_by: userId,
//       iLeadpoten_id: "",
//       ileadstatus_id: "",
//       lead_source_id: "",
//       corganization: "",
//     });
//     setErrors({});
//     setSearchService("");
//     setSearchSubService("");
//     setSearchMobileCountryCode(defaultCode);
//     setSameAsPhone(false);
//   };

//   const handleSearchExistingLead = async () => {
//     if (!searchMobile && !searchEmail) {
//       setPopupMessage("Please enter either mobile number or email to search");
//       setIsPopupVisible(true);
//       setTimeout(() => setIsPopupVisible(false), 3000);
//       return;
//     }

//     if (searchMobile) {
//       const mobileRegex = /^[0-9]{6,15}$/;
//       if (!mobileRegex.test(searchMobile)) {
//         setPopupMessage("Mobile number must contain only 6 to 15 digits");
//         setIsPopupVisible(true);
//         setTimeout(() => setIsPopupVisible(false), 3000);
//         return;
//       }
//     }

//     if (searchEmail) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(searchEmail)) {
//         setPopupMessage("Please enter a valid email address");
//         setIsPopupVisible(true);
//         setTimeout(() => setIsPopupVisible(false), 3000);
//         return;
//       }
//     }
    
//     setLoading(true);
//     setFoundLeads([]);

//     try {
//       let body = {};

//       if (searchMobile) {
//         body = { 
//           phonenumber: searchMobile,
//           phone_country_code: searchMobileCountryCode,
//         };
//       } else if (searchEmail) {
//         body = { email: searchEmail };
//       }

//       const res = await fetch(`${apiEndPoint}/lead/getExistingLeads`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(body),
//       });

//       const resData = await res.json();

//       if (res.ok && Array.isArray(resData.data) && resData.data.length > 0) {
//         setFoundLeads(resData.data);
//       } else {
//         setPopupMessage(resData.Message || "No existing lead found.");
//         setIsPopupVisible(true);
//         setTimeout(() => setIsPopupVisible(false), 3000);
//       }
//     } catch (error) {
//       console.error("Search error:", error);
//       setPopupMessage("Failed to search for leads. Please try again.");
//       setIsPopupVisible(true);
//       setTimeout(() => setIsPopupVisible(false), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectLead = async (leadId) => {
//     setLoading(true);
//     try {
//       const res = await fetch(`${apiEndPoint}/lead/${leadId}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         }
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         console.error(`Error fetching lead details [${res.status}]:`, text);
//         throw new Error(`Server returned ${res.status}`);
//       }

//       const resData = await res.json();

//       if (resData && resData.ilead_id) {
//         setExistingClientData(resData);
//       } else {
//         setPopupMessage("Lead details not found for this ID");
//         setIsPopupVisible(true);
//       }
//     } catch (error) {
//       console.error("Fetch lead details error:", error);
//       setPopupMessage("Failed to load lead details. Please try again.");
//       setIsPopupVisible(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter sub-services based on selected service
//   useEffect(() => {
//     if (form.iservice_id && subServices.length > 0) {
//       const filtered = subServices.filter(
//         (sub) =>
//           sub.iservice_parent === Number(form.iservice_id) &&
//           sub.subservice_name?.toLowerCase().includes(searchSubService.toLowerCase())
//       );
//       setFilteredSubService(filtered);
//     } else {
//       setFilteredSubService([]);
//     }
//   }, [form.iservice_id, searchSubService, subServices]);

//   // Handle click outside dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
//         setIsServiceDropdownOpen(false);
//       }
//       if (subServiceDropdownRef.current && !subServiceDropdownRef.current.contains(event.target)) {
//         setIsSubServiceDropdownOpen(false);
//       }
//       if (mobileCountryCodeRef.current && !mobileCountryCodeRef.current.contains(event.target)) {
//         setIsMobileCountryCodeDropdownOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const validateField = (name, value) => {
//     let error = "";

//     if (name === "clead_name") {
//       if (!value) {
//         error = "Mandatory";
//       } else if (value.length > 100) {
//         error = "Lead Name cannot exceed 100 characters";
//       }
//     }

//     if (name === "iphone_no") {
//       if (!value) {
//         error = "Mandatory";
//       } else {
//         const phoneError = validatePhoneNumber(value, form.phone_country_code);
//         if (phoneError) error = phoneError;
//       }
//     }

//     if (name === "cemail") {
//       const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
//       if (value && !emailRegex.test(value)) {
//         error = "Invalid email format";
//       } else if (value && value.length > 70) {
//         error = "Email cannot exceed 70 characters";
//       }
//     }

//     if (name === "iservice_id" && !value) {
//       error = "Mandatory";
//     }

//     return error;
//   };

//   const validateForm = () => {
//     let newErrors = {};

//     if (isExistingClientForm) {
//       if (!existingClientData) {
//         newErrors.ilead_id = "Please select a lead from the search results.";
//       }
//       return newErrors;
//     }

//     // Validate required fields
//     ["clead_name", "iphone_no", "iservice_id"].forEach((field) => {
//       const error = validateField(field, form[field]);
//       if (error) newErrors[field] = error;
//     });

//     // Validate email if provided
//     if (form.cemail) {
//       const emailError = validateField("cemail", form.cemail);
//       if (emailError) newErrors.cemail = emailError;
//     }

//     return newErrors;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === 'existingClientMobile') {
//       setExistingClientMobile(value);
//       const error = validateField(name, value);
//       setErrors((prev) => ({ ...prev, [name]: error }));
//       return;
//     }

//     setForm((prev) => {
//       let updated = { ...prev, [name]: value };

//       // Reset sub-service when service changes
//       if (name === "iservice_id") {
//         updated.isubservice_id = "";
//         setSearchSubService("");
//       }

//       return updated;
//     });

//     const error = validateField(name, value);
//     setErrors((prev) => ({ ...prev, [name]: error }));
//   };

//   const handleSelectDropdownItem = (
//     fieldName,
//     itemId,
//     itemName,
//     setSearchTerm,
//     setIsDropdownOpen
//   ) => {
//     setForm((prev) => ({ ...prev, [fieldName]: Number(itemId) }));
//     setSearchTerm(itemName);
//     setIsDropdownOpen(false);
//     setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
//   };

//   const handleSelectCountryCode = (codeToSet) => {
//     setForm((prev) => ({ ...prev, phone_country_code: codeToSet }));
//     setSearchMobileCountryCode(codeToSet);
//     setIsMobileCountryCodeDropdownOpen(false);
//     setErrors((prev) => ({ ...prev, phone_country_code: undefined }));
//   };

//   const handleBlur = (e) => {
//     const { name, value } = e.target;

//     if (name === "searchMobileCountryCode") {
//       const selectedCode = getCountryCodeByValue(value) || getCountryCodeByValue(form.phone_country_code);
      
//       if (selectedCode) {
//         setSearchMobileCountryCode(selectedCode.code);
//         setForm((prev) => ({ ...prev, phone_country_code: selectedCode.code }));
//       } else {
//         setSearchMobileCountryCode(form.phone_country_code);
//       }
//       setIsMobileCountryCodeDropdownOpen(false);
//     } else if (name === "searchService") {
//       const selectedService = services.find(s => s.serviceId === form.iservice_id);
//       if (!selectedService || selectedService.serviceName !== value) {
//         setSearchService(selectedService ? selectedService.serviceName : "");
//         setForm((prev) => ({
//           ...prev,
//           iservice_id: selectedService ? selectedService.serviceId : "",
//           isubservice_id: ""
//         }));
//         setSearchSubService("");
//       }
//       setIsServiceDropdownOpen(false);
//     } else if (name === "searchSubService") {
//       const selectedSubService = subServices.find(
//         (sub) => sub.isubservice_id === form.isubservice_id
//       );
//       if (!selectedSubService || selectedSubService.subservice_name !== value) {
//         setSearchSubService(selectedSubService ? selectedSubService.subservice_name : "");
//         setForm((prev) => ({
//           ...prev,
//           isubservice_id: selectedSubService ? selectedSubService.isubservice_id : "",
//         }));
//       }
//       setIsSubServiceDropdownOpen(false);
//     }

//     setErrors((prev) => ({
//       ...prev,
//       [name]: validateField(name, value),
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     if (isExistingClientForm && !existingClientData) {
//       setLoading(false);
//       return;
//     }

//     const validationErrors = validateForm();
//     setErrors(validationErrors);

//     if (Object.keys(validationErrors).length > 0) {
//       setLoading(false);
//       return;
//     }

//     try {
//       const formData = {
//         bactive: true,
//         clead_name: form.clead_name,
//         cemail: form.cemail || null,
//         iphone_no: form.iphone_no,
//         phone_country_code: form.phone_country_code,
//         iservice_id: Number(form.iservice_id),
//         isubservice_id: form.isubservice_id ? Number(form.isubservice_id) : null,
//         clead_owner: userId,
//         modified_by: userId,
//         icompany_id: company_id,
//         iLeadpoten_id: 1, // Default value
//         ileadstatus_id: 1, // Default value
//         lead_source_id: 1, // Default value
//         corganization: form.clead_name || "Default Organization",
//         cgender: 1,
//         clogo: "logo.png",
//         cimage: "noimg.png",
//         dmodified_dt: new Date().toISOString(),
//         iuser_tags: userId,
//       };

//       if (saveTriggerRef.current) {
//         formData.save = true;
//         saveTriggerRef.current = false;
//       }

//       const res = await fetch(`${apiEndPoint}/lead`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(formData),
//       });

//       const resData = await res.json();

//       if (res.ok) {
//         MySwal.fire({
//           title: 'Success!',
//           text: 'Lead created successfully!',
//           icon: 'success',
//           timer: 1000,
//           timerProgressBar: true,
//           showConfirmButton: false
//         }).then((result) => {
//           if (result.dismiss === MySwal.DismissReason.timer || result.isConfirmed) {
//             onClose();
//             if (onSuccess) {
//               onSuccess();
//             }
//           }
//         });
//       } else {
//         const errorMessage =
//           resData.details ||
//           resData.message ||
//           resData.error ||
//           "Failed to create lead.";

//         setPopupMessage(errorMessage);
//         setIsPopupVisible(true);
//         setTimeout(() => {
//           setIsPopupVisible(false);
//         }, 10000);
//       }
//     } catch (error) {
//       console.error("Submit error:", error);
//       setPopupMessage("Failed to create lead due to an error.");
//       setIsPopupVisible(true);
//       setTimeout(() => {
//         setIsPopupVisible(false);
//       }, 1000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const EmptyDropdownMessage = ({ type }) => {
//     const messages = {
//       service: servicesLoading 
//         ? "Loading services..." 
//         : !services || services.length === 0
//           ? "No services found. Please create services in the master section."
//           : "No matching services found",
//       subservice: form.iservice_id
//         ? subServicesLoading 
//           ? "Loading sub-services..." 
//           : filteredSubService.length === 0
//             ? searchSubService 
//               ? "No matching sub-services found"
//               : "No sub-services found for this service. Please create sub-services in the master section."
//             : ""
//         : "Please select a service first",
//       countryCode: countryCodesLoading
//         ? "Loading country codes..."
//         : filteredMobileCountryCodes.length === 0
//           ? "No matching country codes found"
//           : "",
//       default: "Data not available. Please check your connection or contact support.",
//     };

//     return (
//       <div className="px-4 py-2 text-sm text-gray-500 italic">
//         {messages[type] || messages.default}
//       </div>
//     );
//   };

//   // Filter services based on search
//   const filterService = Array.isArray(services) && services.length > 0
//     ? services.filter((item) =>
//         item.serviceName?.toLowerCase().includes(searchService.toLowerCase())
//       )
//     : [];

//   return (
//     <div className="fixed inset-0 bg-transparent backdrop-blur-md flex justify-center items-start pt-10 z-[9999] overflow-y-auto hide-scrollbar px-8">
//       <form
//         ref={formRef}
//         onSubmit={handleSubmit}
//         className="relative bg-white w-[95%] max-w-[800px] rounded-2xl shadow-3xl p-6 space-y-6"
//       >
//         <button
//           type="button"
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
//         >
//           <X size={24} />
//         </button>

//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-center">
//             CREATE A LEAD
//           </h2>
//           <div className="flex items-center space-x-4">
//             <label className="flex items-center text-gray-700">
//               <input
//                 type="checkbox"
//                 className="form-checkbox"
//                 checked={!isExistingClientForm}
//                 onChange={() => {
//                   setIsExistingClientForm(false);
//                   setExistingClientData(null);
//                   setExistingClientMobile("");
//                   setFoundLeads([]);
//                   resetForm();
//                 }}
//               />
//               <span className="ml-2">New Lead</span>
//             </label>
//             {canSeeExistingLeads && (
//               <label className="flex items-center text-gray-700">
//                 <input
//                   type="checkbox"
//                   className="form-checkbox"
//                   checked={isExistingClientForm}
//                   onChange={() => {
//                     setIsExistingClientForm(true);
//                     setExistingClientData(null);
//                     resetForm();
//                   }}
//                 />
//                 <span className="ml-2">Existing Lead</span>
//               </label>
//             )}
//           </div>
//         </div>

//         {/* EXISTING LEAD SEARCH SECTION */}
//         {isExistingClientForm && (
//           <div className="space-y-6 mb-6">
//             <h3 className="text-lg font-semibold mt-6">Search Existing Lead</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//               {/* Mobile Search */}
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Mobile Number</label>
//                 <div className="flex items-center flex-wrap gap-2">
//                   <div className="relative flex-shrink-0" ref={mobileCountryCodeRef}>
//                     <div className="flex items-center border rounded-l-md focus-within:ring-2 focus-within:ring-blue-500">
//                       <input
//                         type="text"
//                         name="searchMobileCountryCode"
//                         value={searchMobileCountryCode}
//                         onChange={(e) => {
//                           setSearchMobileCountryCode(e.target.value);
//                           filterCountryCodes(e.target.value);
//                           setIsMobileCountryCodeDropdownOpen(true);
//                         }}
//                         onFocus={() => setIsMobileCountryCodeDropdownOpen(true)}
//                         placeholder="+XXX"
//                         className="px-2 py-2 w-24 md:w-28 outline-none text-sm rounded-l-md"
//                         disabled={countryCodesLoading}
//                       />
//                       <ChevronDown 
//                         size={16} 
//                         className="mr-1 text-gray-500 cursor-pointer"
//                         onClick={() => setIsMobileCountryCodeDropdownOpen(!isMobileCountryCodeDropdownOpen)}
//                       />
//                     </div>
//                     {isMobileCountryCodeDropdownOpen && (
//                       <div className="absolute z-50 top-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[280px] w-max">
//                         {!countryCodesLoading && filteredMobileCountryCodes.length > 0 ? (
//                           filteredMobileCountryCodes.map((cc) => (
//                             <div
//                               key={cc.value}
//                               onMouseDown={(e) => e.preventDefault()}
//                               onClick={() => {
//                                 handleSelectCountryCode(cc.value);
//                                 filterCountryCodes(cc.value);
//                               }}
//                               className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
//                             >
//                               {cc.flag && (
//                                 <img src={cc.flag} alt={cc.name} className="w-5 h-3 object-cover" />
//                               )}
//                               <span className="font-medium">{cc.value}</span>
//                               <span className="text-gray-600 truncate">{cc.name}</span>
//                             </div>
//                           ))
//                         ) : (
//                           <EmptyDropdownMessage type="countryCode" />
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   <input
//                     type="text"
//                     name="searchMobile"
//                     value={searchMobile}
//                     onChange={(e) => {
//                       setSearchMobile(e.target.value);
//                       if (e.target.value) setSearchEmail("");
//                     }}
//                     placeholder="Enter mobile number"
//                     className="flex-1 border px-3 py-2 rounded-r-md focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px] text-sm"
//                   />
//                 </div>
//               </div>

//               {/* Email Search */}
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Email Address</label>
//                 <input
//                   type="text"
//                   name="searchEmail"
//                   value={searchEmail}
//                   onChange={(e) => {
//                     setSearchEmail(e.target.value);
//                     if (e.target.value) setSearchMobile("");
//                   }}
//                   placeholder="Enter email address"
//                   className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
//                 />
//               </div>

//               {/* Search Button */}
//               <div className="col-span-1 md:col-span-2">
//                 <button
//                   type="button"
//                   onClick={handleSearchExistingLead}
//                   disabled={loading}
//                   className={`w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium ${loading ? "opacity-50 cursor-not-allowed" : ""
//                     }`}
//                 >
//                   {loading ? "Searching..." : "Search"}
//                 </button>
//               </div>
//             </div>

//             {loading && (
//               <div className="flex items-center gap-2 text-blue-600 text-sm">
//                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//                 Searching for leads...
//               </div>
//             )}

//             {foundLeads.length > 0 && (
//               <div className="w-full">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Lead Name <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="ilead_id"
//                   value={form.ilead_id || ''}
//                   onChange={(e) => handleSelectLead(e.target.value)}
//                   className="w-full md:w-3/4 lg:w-1/2 border px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
//                 >
//                   <option value="">Select an existing lead...</option>
//                   {foundLeads.map((lead) => (
//                     <option key={lead.ilead_id} value={lead.ilead_id}>
//                       {lead.clead_name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
//           </div>
//         )}

//         {!isExistingClientForm || existingClientData ? (
//           <>
//             <h3 className="text-lg font-semibold mt-6">Lead Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Client Name */}
//               <div>
//                 <label className="text-sm font-medium">
//                   Client Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="clead_name"
//                   value={form.clead_name}
//                   onChange={handleChange}
//                   onBlur={handleBlur}
//                   placeholder="Enter client name"
//                   className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//                 />
//                 {errors.clead_name && (
//                   <p className="text-red-600 text-sm">{errors.clead_name}</p>
//                 )}
//               </div>

//               {/* Phone Number */}
//               <div>
//                 <label className="text-sm font-medium">
//                   Phone Number <span className="text-red-500">*</span>
//                 </label>
//                 <div className="flex w-full mt-1">
//                   <div className="relative" ref={mobileCountryCodeRef}>
//                     <div className="flex items-center border rounded-l-md focus-within:ring-2 focus-within:ring-blue-500">
//                       <input
//                         type="text"
//                         name="searchMobileCountryCode"
//                         value={searchMobileCountryCode}
//                         onChange={(e) => {
//                           setSearchMobileCountryCode(e.target.value);
//                           filterCountryCodes(e.target.value);
//                           setIsMobileCountryCodeDropdownOpen(true);
//                         }}
//                         onFocus={() => setIsMobileCountryCodeDropdownOpen(true)}
//                         placeholder="+XXX"
//                         className="px-2 py-2 w-[75px] sm:w-[90px] outline-none text-sm rounded-l-md"
//                         disabled={countryCodesLoading}
//                       />
//                       <ChevronDown 
//                         size={16} 
//                         className="mr-1 text-gray-500 cursor-pointer"
//                         onClick={() => setIsMobileCountryCodeDropdownOpen(!isMobileCountryCodeDropdownOpen)}
//                       />
//                     </div>
//                     {isMobileCountryCodeDropdownOpen && (
//                       <div className="absolute z-50 top-full mt-1 bg-white border rounded shadow-xl max-h-60 overflow-y-auto w-[280px] left-0">
//                         {!countryCodesLoading && filteredMobileCountryCodes.length > 0 ? (
//                           filteredMobileCountryCodes.map((cc) => (
//                             <div
//                               key={cc.value}
//                               onMouseDown={(e) => e.preventDefault()}
//                               onClick={() => {
//                                 handleSelectCountryCode(cc.value);
//                                 filterCountryCodes(cc.value);
//                               }}
//                               className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-0 flex items-center gap-2"
//                             >
//                               {cc.flag && (
//                                 <img src={cc.flag} alt={cc.name} className="w-5 h-3 object-cover" />
//                               )}
//                               <span className="font-bold">{cc.value}</span>
//                               <span className="text-gray-600 truncate">{cc.name}</span>
//                             </div>
//                           ))
//                         ) : (
//                           <EmptyDropdownMessage type="countryCode" />
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   <input
//                     type="text"
//                     name="iphone_no"
//                     value={form.iphone_no}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     placeholder="Enter phone number"
//                     className="flex-1 min-w-0 border px-3 py-2 rounded-r-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
//                   />
//                 </div>
//                 {errors.iphone_no && (
//                   <p className="text-red-600 text-xs mt-1">{errors.iphone_no}</p>
//                 )}
//               </div>

//               {/* Email */}
//               <div>
//                 <label className="text-sm font-medium">
//                   Email Address
//                 </label>
//                 <input
//                   type="email"
//                   name="cemail"
//                   value={form.cemail}
//                   onChange={handleChange}
//                   onBlur={handleBlur}
//                   placeholder="Enter email address"
//                   className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//                 />
//                 {errors.cemail && (
//                   <p className="text-red-600 text-sm">{errors.cemail}</p>
//                 )}
//               </div>

//               {/* Service */}
//               <div className="flex flex-col relative" ref={serviceDropdownRef}>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Service <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Search service..."
//                   className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//                   value={searchService}
//                   onChange={(e) => {
//                     setSearchService(e.target.value);
//                     setIsServiceDropdownOpen(true);
//                   }}
//                   onFocus={() => setIsServiceDropdownOpen(true)}
//                   disabled={servicesLoading}
//                 />
//                 {isServiceDropdownOpen && (
//                   <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
//                     {!servicesLoading && filterService && filterService.length > 0 ? (
//                       filterService.map((item) => (
//                         <div
//                           key={item.serviceId}
//                           onMouseDown={(e) => e.preventDefault()}
//                           onClick={() =>
//                             handleSelectDropdownItem(
//                               "iservice_id",
//                               item.serviceId,
//                               item.serviceName,
//                               setSearchService,
//                               setIsServiceDropdownOpen
//                             )
//                           }
//                           className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
//                         >
//                           {item.serviceName}
//                         </div>
//                       ))
//                     ) : (
//                       <EmptyDropdownMessage type="service" />
//                     )}
//                   </div>
//                 )}
//                 {errors.iservice_id && <p className="text-red-600 text-sm">{errors.iservice_id}</p>}
//                 {!servicesLoading && (!services || services.length === 0) && (
//                   <p className="text-gray-500 text-xs mt-1">No services available</p>
//                 )}
//               </div>

//               {/* Sub Service - Only enabled when a service is selected */}
//               <div className="flex flex-col relative" ref={subServiceDropdownRef}>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Sub Service
//                 </label>
//                 <input
//                   type="text"
//                   placeholder={!form.iservice_id ? "Select a service first" : "Search sub service..."}
//                   className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
//                     !form.iservice_id ? "bg-gray-100 cursor-not-allowed" : ""
//                   }`}
//                   value={searchSubService}
//                   onChange={(e) => {
//                     setSearchSubService(e.target.value);
//                     setIsSubServiceDropdownOpen(true);
//                   }}
//                   onFocus={() => form.iservice_id && setIsSubServiceDropdownOpen(true)}
//                   disabled={!form.iservice_id || subServicesLoading}
//                 />
//                 {isSubServiceDropdownOpen && form.iservice_id && (
//                   <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
//                     {!subServicesLoading && filteredSubService && filteredSubService.length > 0 ? (
//                       filteredSubService.map((item) => (
//                         <div
//                           key={item.isubservice_id}
//                           onMouseDown={(e) => e.preventDefault()}
//                           onClick={() =>
//                             handleSelectDropdownItem(
//                               "isubservice_id",
//                               item.isubservice_id,
//                               item.subservice_name,
//                               setSearchSubService,
//                               setIsSubServiceDropdownOpen
//                             )
//                           }
//                           className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
//                         >
//                           {item.subservice_name}
//                           {item.cost && <span className="text-gray-500 text-xs ml-2">(₹{item.cost})</span>}
//                         </div>
//                       ))
//                     ) : (
//                       <EmptyDropdownMessage type="subservice" />
//                     )}
//                   </div>
//                 )}
//                 {subServicesLoading && form.iservice_id && (
//                   <p className="text-gray-500 text-xs mt-1">Loading sub-services...</p>
//                 )}
//               </div>
//             </div>
//           </>
//         ) : null}

//         <div className="flex justify-end gap-4 pt-4">
//           <button
//             type="submit"
//             disabled={loading || (isExistingClientForm ? !existingClientData : Object.keys(errors).some((key) => errors[key]))}
//             className={`w-[150px] flex justify-center items-center bg-blue-600 text-white py-2 font-semibold rounded-md transition
//               ${loading || (isExistingClientForm ? !existingClientData : Object.keys(errors).some((key) => errors[key]))
//                 ? "opacity-70 cursor-not-allowed"
//                 : "hover:bg-blue-700"
//               }`}
//           >
//             {loading ? (
//               <svg
//                 className="animate-spin h-5 w-5 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 />
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//               </svg>
//             ) : (
//               "Create Lead"
//             )}
//           </button>
//         </div>

//         {isPopupVisible && (
//             <PopupMessage
//                 isVisible={isPopupVisible}
//                 message={popupMessage}
//                 onClose={() => setIsPopupVisible(false)}
//                 onSaveAnyway={() => {
//                 saveTriggerRef.current = true;
//                 formRef.current?.requestSubmit();
//                 }}
//             />
//          )}
//       </form>
//     </div>
//   );
// };

// export default LeadForm;