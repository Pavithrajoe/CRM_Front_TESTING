import React, { useEffect, useState, useRef, useCallback } from "react";
import {FiSave, FiX, FiChevronDown, FiCamera,} from "react-icons/fi";
import axios from "axios";
import { ENDPOINTS } from "./../../../../api/constraints";
import { usePopup } from "../../../../context/PopupContext";
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import countries from 'i18n-iso-countries';

const apiEndPoint = import.meta.env.VITE_API_URL;
const apiNoEndPoint = import.meta.env.VITE_NO_API_URL;

const EditProfileForm_Customer  = ({ profile, onClose, onSave, isReadOnly }) => {
      const modalRef = useRef(null);
      const { showPopup } = usePopup(); 
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

  const [form, setForm] = useState({
    iLeadpoten_id: profile?.iLeadpoten_id || "",
    iservice_id: profile?.serviceId || "",
    isubservice_id: profile?.isubservice_id || "",
    ilead_status_id: profile?.ileadstatus_id || 0,
    cindustry_id: profile?.cindustry_id || "",
    csubindustry_id: profile?.isubindustry || "",
    lead_source_id: profile?.lead_source_id || "",
    isub_src_id: profile?.sub_src_lead?.isub_src_id || "",
    ino_employee: profile?.ino_employee || 0,
    iproject_value: profile?.iproject_value || 0,
    clead_name: profile?.clead_name || "",
    cemail: profile?.cemail || "",
    corganization: profile?.corganization || "",
    cwebsite: profile?.cwebsite || "",
    icity: profile?.icity || "",
    iphone_no: profile?.iphone_no ? profile.iphone_no.replace(profile?.phone_country_code || "+91", "") : "",
    phone_country_code: profile?.phone_country_code || "+91",
    cwhatsapp: profile?.whatsapp_number ? profile.whatsapp_number.replace(profile?.whatsapp_country_code || "+91", "") : "",
    whatsapp_country_code: profile?.whatsapp_country_code || "+91",
    cgender: profile?.cgender || 1,
    clogo: profile?.clogo || "logo.png",
    clead_address1: profile?.clead_address1 || "",
    clead_address2: profile?.clead_address2 || "",
    clead_address3: profile?.clead_address3 || "",
    cresponded_by: userId,
    icompany_id: company_id,
    modified_by: userId,
    cpincode: profile?.cpincode?.toString() || "",
    icurrency_id: profile?.icurrency_id || "",
  });

  const [errors, setErrors] = useState({});
  const [Potential, setPotential] = useState([]);
  const [status, setStatus] = useState([]);
  const [leadIndustry, setIndustry] = useState([]);
  const [leadSubIndustry, setSubIndustry] = useState([]);
  const [cities, setCities] = useState([]);
  const [source, setSource] = useState([]);
  const [countryCodes, setCountryCodes] = useState([]);
  const [service, setService] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchPotential, setSearchPotential] = useState("");
  const [searchService, setSearchService] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchIndustry, setSearchIndustry] = useState("");
  const [searchSubIndustry, setSearchSubIndustry] = useState("");
  const [searchSource, setSearchSource] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const [subService, setSubService] = useState([]);
  const [searchSubService, setSearchSubService] = useState("");
  const cityDropdownRef = useRef(null);
  const potentialDropdownRef = useRef(null);
  const serviceDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const industryDropdownRef = useRef(null);
  const subIndustryDropdownRef = useRef(null);
  const sourceDropdownRef = useRef(null);
  const phoneCountryCodeRef = useRef(null);
  const whatsappCountryCodeRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isPotentialDropdownOpen, setIsPotentialDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [isSubIndustryDropdownOpen, setIsSubIndustryDropdownOpen] = useState(false);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isPhoneCountryCodeOpen, setIsPhoneCountryCodeOpen] = useState(false);
  const [isWhatsappCountryCodeOpen, setIsWhatsappCountryCodeOpen] = useState(false);
  const subServiceDropdownRef = useRef(null);
  const [isSubServiceDropdownOpen, setIsSubServiceDropdownOpen] = useState(false);
  // sub source
  const [subSources, setSubSources] = useState([]);
  const [searchSubSource, setSearchSubSource] = useState("");
  const [isSubSourceDropdownOpen, setIsSubSourceDropdownOpen] = useState(false);
  const subSourceDropdownRef = useRef(null); 
  const [selectedSubSourceId, setSelectedSubSourceId] = useState(form.isub_src_id || null);
  // currency
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState({});
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef(null);

  const handleCurrencySelect = (currency) => {
    if (isReadOnly) return;
    setSelectedCurrency(currency);
    setForm(prev => ({ ...prev, icurrency_id: currency.icurrency_id }));
    setIsCurrencyDropdownOpen(false);
  };

  useEffect(() => {
    const fetchCurrencies = async () => {
      if (!token) {
        console.error("Authentication token not found. Cannot fetch currencies.");
        return;
      }

      try {
        const res = await axios.get(`${apiEndPoint}/currency`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.data?.data?.data) {
          const fetchedCurrencies = res.data.data.data;
          setCurrencies(fetchedCurrencies);
          
          const initialCurrency = fetchedCurrencies.find(c => c.icurrency_id === profile?.icurrency_id) || { currency_code: "INR", symbol: "₹" };
          setSelectedCurrency(initialCurrency);
        } else {
          // console.log("API response has no currency data:", res.data);
        }
      } catch (error) {
        console.error("Failed to fetch currencies", error);
      }
    };

    fetchCurrencies();
  }, [token, apiEndPoint, profile]); 

  const allCountries = getCountries().map(countryCode => ({
    countryCode,
    callingCode: '+' + getCountryCallingCode(countryCode),
    countryName: countries.getName(countryCode, "en") 
  }));

  const fetchDropdownData = async (endpoint, setData, dataName, transformFn) => {
    try {
      const response = await fetch(`${apiEndPoint}/${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Can't fetch ${dataName}. Status: ${response.status}`);
        return;
      }

      const rawData = await response.json();
      setData(transformFn(rawData));
    } catch (e) {
      console.error(`Error in fetching ${dataName}:`, e);
    }
  };



  //outside onclose function 
    
    
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

// sub source
  useEffect(() => {
  if (!form.lead_source_id) {
    setSubSources([]);
    setSearchSubSource("");
    return;
  }

  const fetchSubSources = async () => {
    try {
      const res = await fetch(`${apiEndPoint}/subSrc/getAllActiveSubSrc`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch sub-sources:", res.statusText);
        setSubSources([]);
        return;
      }
      
      const allSubSources = (await res.json()).data || [];

      const filtered = allSubSources.filter(
        (sub) => sub.isrc_id === form.lead_source_id
      );
      setSubSources(filtered);

      if (profile?.isub_src_id) {
        const initialSubSource = allSubSources.find(
          (sub) => sub.isub_src_id === profile.isub_src_id
        );
        if (initialSubSource) {
          setSearchSubSource(initialSubSource.ssub_src_name);
        }
      }
    } catch (err) {
      console.error("Error fetching sub-source:", err);
      setSubSources([]);
    }
  };

  fetchSubSources();
  
}, [form.lead_source_id, token, apiEndPoint, profile?.isub_src_id]);

  const fetchCitiesData = async () => {
    try {
      const response = await fetch(`${apiEndPoint}/city`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Can't fetch cities, there was an error.");
        return;
      }

      const data = await response.json();
      if (data && Array.isArray(data.cities)) {
        setCities(data.cities);
        setFilteredCities(data.cities);
      }
    } catch (e) {
      console.error("Error in fetching cities:", e);
    }
  };


  // for status
  useEffect(() => {
    const fetchLeadStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiEndPoint}/lead-status/company-lead`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { icompany_id: company_id },
        });
        
        // setStatus(res.data);
        setStatus(res.data.data || []);  

      } catch (err) {
        console.error("Failed to fetch lead status", err);
      }
    };
    fetchLeadStatus();
  }, []);



  const fetchService = async () => {
    try {
      const response = await fetch(`${apiEndPoint}/lead-service`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Can't fetch lead service");
        return;
      }

      const rawData = await response.json();
      setService(rawData.data || []);
    } catch (e) {
      console.error("Error in fetching lead services:", e);
    }
  };

      const fetchSubService = async () => {
    try {
      const response = await fetch(ENDPOINTS.SUB_SERVICE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Can't fetch sub services");
        return;
      }

      const rawData = await response.json();
      // console.log("Sub-service response:", rawData);
      setSubService(rawData.data || []);
    } catch (e) {
      console.error("Error in fetching sub services:", e);
    }
  };
  const fetchIndustryAndSubIndustry = async () => {
    try {
      const response = await fetch(`${apiEndPoint}/lead-industry/company-industry`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Can't fetch lead industry and sub-industry");
        return;
      }

      const rawData = await response.json();
      setIndustry(rawData.response?.industry || []);
      setSubIndustry(rawData.response?.subindustries || []);
    } catch (e) {
      console.error("Error in fetching lead industry and sub-industry:", e);
    }
  };

  useEffect(() => {
    fetchDropdownData("lead-potential/company-potential", setPotential, "lead potential", (res) => res.data || []);
    fetchDropdownData("lead-status/company-lead", setStatus, "lead status", (res) => res.response || []);
    fetchDropdownData("lead-source/company-src", setSource, "lead sources", (data) => data.data || []);
    fetchCitiesData();
    // fetchCountryCodes();
    fetchService();
    fetchSubService();
    fetchIndustryAndSubIndustry();
  }, [token]);

  useEffect(() => {
  if (profile) {
    const setInitialDropdownValue = (items, idKey, nameKey, formId, setSearch) => {
      if (!Array.isArray(items)) {
        console.warn(`Expected array for ${formId}, but got:`, items);
        return;
      }
      const selectedItem = items.find(item => item[idKey] === profile[formId]);
      if (selectedItem) setSearch(selectedItem[nameKey]);
    };

    setInitialDropdownValue(Potential, 'ileadpoten_id', 'clead_name', 'iLeadpoten_id', setSearchPotential);
    setInitialDropdownValue(service, 'serviceId', 'serviceName', 'iservice_id', setSearchService);
    setInitialDropdownValue(status, 'ilead_status_id', 'clead_name', 'ileadstatus_id', setSearchStatus);
    setInitialDropdownValue(leadIndustry, 'iindustry_id', 'cindustry_name', 'cindustry_id', setSearchIndustry);
    setInitialDropdownValue(leadSubIndustry, 'isubindustry', 'subindustry_name', 'isubindustry', setSearchSubIndustry);
    setInitialDropdownValue(source, 'source_id', 'source_name', 'lead_source_id', setSearchSource);
    setInitialDropdownValue(cities, 'icity_id', 'cCity_name', 'icity', setSearchCity);
    setInitialDropdownValue(subService, 'isubservice_id', 'subservice_name', 'isubservice_id', setSearchSubService);
    
    if (profile?.sub_src_lead?.sub_source?.ssub_src_name) {
      setSearchSubSource(profile.sub_src_lead.sub_source.ssub_src_name);
    } else {
      setSearchSubSource("");
    }
  }
}, [profile, Potential, status, leadIndustry, leadSubIndustry, source, cities, service]);



  const handleSearchCity = (e) => {
    if (isReadOnly) return;
    const searchTerm = e.target.value;
    setSearchCity(searchTerm);
    const filtered = cities.filter((city) =>
      city.cCity_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCities(filtered);
    setIsCityDropdownOpen(true);
  };

  const handleCitySelect = (cityId, cityName) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, icity: cityId }));
    setSearchCity(cityName);
    setIsCityDropdownOpen(false);
    setErrors((prev) => ({ ...prev, icity: "" }));
  };

  const handlePotentialSelect = (potentialId, potentialName) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, iLeadpoten_id: potentialId }));
    setSearchPotential(potentialName);
    setIsPotentialDropdownOpen(false);
    setErrors((prev) => ({ ...prev, iLeadpoten_id: "" }));
  };

   const handleServiceSelect = (serviceId, serviceName) => {
    if (isReadOnly) return;
    setForm(prev => ({ 
      ...prev, 
      iservice_id: serviceId,
      
      isubservice_id: "" 
    }));
    setSearchService(serviceName);
    setSearchSubService("");
    setIsServiceDropdownOpen(false);
    setErrors((prev) => ({ ...prev, iservice_id: "" }));
  };

  const handleStatusSelect = (statusId, statusName) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, ilead_status_id: statusId }));
    setSearchStatus(statusName);
    setIsStatusDropdownOpen(false);
    setErrors((prev) => ({ ...prev, ilead_status_id: "" }));
  };

  const handleIndustrySelect = (industryId, industryName) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, cindustry_id: industryId, csubindustry_id: "" }));
    setSearchIndustry(industryName);
    setIsIndustryDropdownOpen(false);
    setSearchSubIndustry("");
    setErrors((prev) => ({ ...prev, cindustry_id: "" }));
    setErrors((prev) => ({ ...prev, csubindustry_id: "" }));
  };

  const handleSubIndustrySelect = (subIndustryId, subIndustryName) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, csubindustry_id: subIndustryId }));
    setSearchSubIndustry(subIndustryName);
    setIsSubIndustryDropdownOpen(false);
    setErrors((prev) => ({ ...prev, csubindustry_id: "" }));
  };
   const handleSubServiceSelect = (subServiceId, subServiceName) => {
    if (isReadOnly) return;
    setForm(prev => ({ ...prev, isubservice_id: subServiceId }));
    setSearchSubService(subServiceName);
    setIsSubServiceDropdownOpen(false);
    setErrors((prev) => ({ ...prev, isubservice_id: "" }));
  };

  const handleSourceSelect = (sourceId, sourceName) => {
  if (isReadOnly) return;
  setForm((prev) => ({ 
    ...prev, 
    lead_source_id: sourceId, 
    isub_src_id: "" 
  }));
  setSearchSource(sourceName);
  setSearchSubSource(""); 
  setIsSourceDropdownOpen(false);
  setErrors((prev) => ({ ...prev, lead_source_id: "" }));
};

  const handleSubSourceSelect = (subSourceId, subSourceName) => {
  if (isReadOnly) return;
  setForm((prev) => ({ 
    ...prev, 
    isub_src_id: subSourceId 
  }));
  setSearchSubSource(subSourceName);
  setIsSubSourceDropdownOpen(false);
  setErrors((prev) => ({ ...prev, isub_src_id: "" }));
};

  const handlePhoneCountryCodeSelect = (code) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, phone_country_code: code }));
    setIsPhoneCountryCodeOpen(false);
  };

  const handleWhatsappCountryCodeSelect = (code) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, whatsapp_country_code: code }));
    setIsWhatsappCountryCodeOpen(false);
  };

  const filteredSubIndustries = leadSubIndustry.filter(
    (sub) => sub.iindustry_parent === form.cindustry_id
  );
const filteredSubServices = subService.filter(
  (sub) => sub.iservice_parent === form.iservice_id
);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
      if (potentialDropdownRef.current && !potentialDropdownRef.current.contains(event.target)) {
        setIsPotentialDropdownOpen(false);
      }
      if (subServiceDropdownRef.current && !subServiceDropdownRef.current.contains(event.target)) {
  setIsSubServiceDropdownOpen(false);
}
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target)) {
        setIsIndustryDropdownOpen(false);
      }
      if (subIndustryDropdownRef.current && !subIndustryDropdownRef.current.contains(event.target)) {
        setIsSubIndustryDropdownOpen(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target)) {
        setIsSourceDropdownOpen(false);
      }
      if (phoneCountryCodeRef.current && !phoneCountryCodeRef.current.contains(event.target)) {
        setIsPhoneCountryCodeOpen(false);
      }
      if (whatsappCountryCodeRef.current && !whatsappCountryCodeRef.current.contains(event.target)) {
        setIsWhatsappCountryCodeOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
      setIsCurrencyDropdownOpen(false);
    }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFieldChange = (e) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };


const validateForm = () => {
  if (isReadOnly) return false;
  let newErrors = {};
  const isNumeric = (value) => /^\d+$/.test(value);

  if (!form.clead_name.trim()) {
    newErrors.clead_name = "Name is required.";
  } else if (form.clead_name.trim().length > 40) {
    newErrors.clead_name = "Name cannot exceed 40 characters.";
  }

  if (!form.iphone_no.trim()) {
    newErrors.iphone_no = "Mobile number is required.";
  } 
//   else if (!isNumeric(form.iphone_no)) {
//     newErrors.iphone_no = "Mobile number must contain only digits.";
//   } 
  else if (!/^\+?[0-9]{6,15}$/.test(form.iphone_no)) {
    newErrors.iphone_no = "Mobile number must be contain only 6 to 15 digits";
  }

  // if (!form.corganization.trim()) {
  //   newErrors.corganization = "Organization is required.";
  // } else if (form.corganization.trim().length > 50) {
  //   newErrors.corganization = "Organization cannot exceed 50 characters.";
  // }

  if (!form.iLeadpoten_id) {
    newErrors.iLeadpoten_id = "Potential is required.";
  }
  if (!form.ilead_status_id) {
    newErrors.ilead_status_id = "Lead Status is required.";
  }
  if (!form.iservice_id) {
    newErrors.iservice_id = "Lead service is required.";
  }
  if (!form.lead_source_id) {
    newErrors.lead_source_id = "Lead source is required.";
  }
  if (!form.icity) {
    newErrors.icity = "City is required.";
  }
  
  if (form.cwhatsapp.trim()) {
    //   if (!isNumeric(form.cwhatsapp)) {
    //     newErrors.cwhatsapp = "WhatsApp number must contain only digits.";
    //   } else 
        if (!/^\+?[0-9]{6,15}$/.test(form.cwhatsapp)) {
        newErrors.cwhatsapp = "WhatsApp number must be contain only 6 to 15 digits.";
      }
    }
  if (form.cemail.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.cemail)) {
      newErrors.cemail = "Invalid email format.";
    } else if (form.cemail.trim().length > 70) {
      newErrors.cemail = "Email cannot exceed 70 characters.";
    }
  }

  if (form.cwebsite.trim()) {
    if (!/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/.test(form.cwebsite)) {
      newErrors.cwebsite = "Invalid website format.";
    }
  }
  
  if (form.cpincode && !/^[0-9]{6,10}$/.test(form.cpincode)) {  
    newErrors.cpincode = "Pincode must be 6 to 10 digits.";
  }
  // Address 75 char limit
  if (form.clead_address1.trim().length > 75) {
    newErrors.clead_address1 = "Address Line 1 cannot exceed 75 characters.";
  }
  if (form.clead_address2.trim().length > 75) {
    newErrors.clead_address2 = "Address Line 2 cannot exceed 75 characters.";
  }
  if (form.clead_address3.trim().length > 75) {
    newErrors.clead_address3 = "Address Line 3 cannot exceed 75 characters.";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, value]) => value !== null && value !== undefined && value !== "")
  );
};


const updateLeadProfile = async () => {
  try {
    const payload = {};
    payload.clead_name = form.clead_name;
    payload.cemail = form.cemail;
    payload.corganization = form.corganization;
    payload.cwebsite = form.cwebsite;
    payload.iphone_no = form.iphone_no;
    payload.whatsapp_number = form.cwhatsapp;
    // payload.iphone_no = form.phone_country_code + form.iphone_no;
    // payload.whatsapp_number = form.cwhatsapp ? form.whatsapp_country_code + form.cwhatsapp : "";
    payload.cgender = form.cgender;
    payload.clead_address1 = form.clead_address1;
    payload.clead_address2 = form.clead_address2;
    payload.clead_address3 = form.clead_address3;
    payload.cpincode = form.cpincode ? parseInt(form.cpincode, 10) : null;
    payload.ino_employee = form.ino_employee ? parseInt(form.ino_employee, 10) : null;
    payload.iproject_value = form.iproject_value ? parseInt(form.iproject_value, 10) : null;
    if (form.iLeadpoten_id) {
        payload.lead_potential = { connect: { ileadpoten_id: parseInt(form.iLeadpoten_id, 10) } };
    }
    if (form.iservice_id) {
        payload.service = { connect: { iservice_id: parseInt(form.iservice_id, 10) } };
    }
    if (form.isubservice_id) {
        payload.subservice = { connect: { isubservice_id: parseInt(form.isubservice_id, 10) } };
    }
    // if (form.ilead_status_id) {
    //     payload.lead_status = { connect: { ilead_status_id: parseInt(form.ilead_status_id, 10) } };
    // }
    // if (form.cindustry_id) {
    //     payload.industry = { connect: { iindustry_id: parseInt(form.cindustry_id, 10) } };
    // }
    if (form.cindustry_id) {
      payload.cindustry_id = parseInt(form.cindustry_id, 10); 
    }
    if (form.ilead_status_id) {
      payload.ileadstatus_id = parseInt(form.ilead_status_id, 10); 
    }

    if (form.csubindustry_id) {
      payload.isubindustry = parseInt(form.csubindustry_id, 10);  
    }
    // if (form.csubindustry_id) {
    //     payload.subindustry = { connect: { isubindustry: parseInt(form.csubindustry_id, 10) } };
    // }
    if (form.lead_source_id) {
        payload.lead_sources = { connect: { source_id: parseInt(form.lead_source_id, 10) } };
    }
    if (selectedSubSourceId) {
        payload.sub_src_lead = { connect: { isub_src_id: parseInt(selectedSubSourceId, 10) } };
    }

    if (form.icity) {
        payload.city = { connect: { icity_id: parseInt(form.icity, 10) } };
    }
    if (form.icurrency_id) {
        payload.currency = { connect: { icurrency_id: parseInt(form.icurrency_id, 10) } };
    }
    if (form.icompany_id) {
        payload.company = { connect: { iCompany_id: parseInt(form.icompany_id, 10) } };
    }
    if (form.modified_by) {
      payload.modified_by = form.modified_by;
    }

    const response = await fetch(`${ENDPOINTS.LEAD_DETAILS}${profile.ilead_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to update lead", errorData);
      throw new Error("API update failed");
    }

    const data = await response.json();
  } catch (e) {
    console.error("Error updating lead:", e);
    throw e;
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();
  if (validateForm()) {
    try {
      await updateLeadProfile(form); 
      await onSave(form); 
      showPopup("Success", "Profile updated successfully!", "success");
      // setSuccessMessage("Profile updated successfully!");
      setTimeout(() => {onClose(); }, 1000);
    } 
    catch (error) {
      showPopup("Error", "Failed to update profile.", "error");
      console.error("Error saving profile:", error);
    }
  } 
  else {
    // console.log("Validation failed:", errors);
  }
};

  useEffect(() => {
  if (successMessage) {
    const timeout = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(timeout);
  }
}, [successMessage]);

  const getInputClasses = (hasError) => {
    let classes = `mt-1 block w-full border rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none transition-all duration-200 text-sm ${
      hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "focus:ring-blue-600 "
    }`;
    if (isReadOnly) {
      classes += " bg-gray-100 cursor-not-allowed";
    }
    return classes;
  };

  const getDropdownButtonClasses = () => {
    let classes = "w-20 border rounded-lg py-2 px-3 text-gray-800 text-sm  flex items-center justify-between";
    if (isReadOnly) {
      classes += " bg-gray-100 cursor-not-allowed";
    }
    return classes;
  };

  const getSaveButtonClasses = () => {
    let classes = "bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors duration-200";
    if (isReadOnly) {
      classes = "bg-gray-400 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-md cursor-not-allowed";
    }
    return classes;
  };

  // --- Theme Classes ---
  const labelClasses = "block text-sm font-medium  mb-1";
  const errorTextClasses = "text-red-500 text-xs mt-1";
  const dropdownItemClasses = "cursor-pointer hover:bg-blue-100 px-4 py-2 ";

  return (
     <div className="fixed inset-0 bg-gray-800 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
      <div
        ref={modalRef}
        className="block bg-white p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl w-[70vw] min-w-[300px] max-w-[1200px] shadow-md sm:shadow-lg overflow-y-auto h-[80vh] sm:h-[85vh] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mx-4"
      >        
  <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-blue-700 transition-colors">
          <FiX size={24} />
  </button>

        <h3 className="text-xl sm:text-2xl font-semibold mb-6 border-b pb-3 ">
          {isReadOnly ? "View Lead Profile" : "Edit Lead Profile"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name Field */}
            <div>
              <label htmlFor="clead_name" className={labelClasses}>
                Lead Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clead_name"
                name="clead_name"
                value={form.clead_name}
                onChange={handleFieldChange}
                className={getInputClasses(errors.clead_name)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.clead_name && <p className={errorTextClasses}>{errors.clead_name}</p>}
            </div>

            {/* Organization Field */}
            {/* <div>
              <label htmlFor="corganization" className={labelClasses}>
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="corganization"
                name="corganization"
                value={form.corganization}
                onChange={handleFieldChange}
                className={getInputClasses(errors.corganization)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.corganization && <p className={errorTextClasses}>{errors.corganization}</p>}
            </div> */}

            {/* Website Field */}
            <div>
              <label htmlFor="cwebsite" className={labelClasses}>
                Website
              </label>
              <input
                type="text"
                id="cwebsite"
                name="cwebsite"
                value={form.cwebsite}
                onChange={handleFieldChange}
                className={getInputClasses(errors.cwebsite)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.cwebsite && <p className={errorTextClasses}>{errors.cwebsite}</p>}
            </div>


            {/* Lead Potential Dropdown */}
            <div className="relative" ref={potentialDropdownRef}>
              <label htmlFor="iLeadpoten_id" className={labelClasses}>
                Lead potential <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchPotential}
                onChange={(e) => {
                  if (isReadOnly) return;
                  setSearchPotential(e.target.value);
                  setIsPotentialDropdownOpen(true);
                  setErrors((prev) => ({ ...prev, iLeadpoten_id: "" }));
                }}
                onClick={() => !isReadOnly && setIsPotentialDropdownOpen(true)}
                className={getInputClasses(errors.iLeadpoten_id)}
                placeholder="Select potential"
                readOnly={isReadOnly || Potential.length === 0}
                disabled={isReadOnly || Potential.length === 0}
              />
              {isPotentialDropdownOpen && Potential.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                  {Potential.filter(potential =>
                    potential.clead_name.toLowerCase().includes(searchPotential.toLowerCase())
                  ).map((potential) => (
                    <div
                      key={potential.ileadpoten_id}
                      className={dropdownItemClasses}
                      onClick={() => handlePotentialSelect(potential.ileadpoten_id, potential.clead_name)}
                    >
                      {potential.clead_name}
                    </div>
                  ))}
                </div>
              )}
              {errors.iLeadpoten_id && <p className={errorTextClasses}>{errors.iLeadpoten_id}</p>}
            </div>

            {/* Lead Status Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <label htmlFor="ilead_status_id" className={labelClasses}>
                Lead Status <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ileadstatus_id"
                value={searchStatus}
                onChange={(e) => {
                  if (isReadOnly) return;
                  setSearchStatus(e.target.value);
                  setIsStatusDropdownOpen(true);
                  setErrors((prev) => ({ ...prev, ilead_status_id: "" })); 
                }}
                onClick={() => !isReadOnly && setIsStatusDropdownOpen(true)}
                className={getInputClasses(errors.ilead_status_id)}
                placeholder="Select status"
                readOnly={isReadOnly || status.length === 0}
                disabled={isReadOnly || status.length === 0}
              />
              {isStatusDropdownOpen && status.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                  {status.filter(statusItem =>
                    statusItem.clead_name && statusItem.clead_name.toLowerCase().includes(searchStatus.toLowerCase())
                  ).map((statusItem) => (
                    <div
                      key={statusItem.ilead_status_id}
                      className={dropdownItemClasses}
                      onClick={() => handleStatusSelect(statusItem.ilead_status_id, statusItem.clead_name)}
                    >
                      {statusItem.clead_name}
                    </div>
                  ))}
                </div>
              )}
              {errors.ilead_status_id && <p className={errorTextClasses}>{errors.ilead_status_id}</p>}
            </div>


            {/* Industry Dropdown */}
            {/* <div className="relative" ref={industryDropdownRef}>
              <label htmlFor="cindustry_id" className={labelClasses}>
                Industry
              </label>
              <input
                type="text"
                value={searchIndustry}
                onChange={(e) => {
                  if (isReadOnly) return;
                  setSearchIndustry(e.target.value == "" ? 0 : e.target.value);
                  setIsIndustryDropdownOpen(true);
                  setErrors((prev) => ({ ...prev, cindustry_id: "" }));
                }}
                onClick={() => !isReadOnly && setIsIndustryDropdownOpen(true)}
                className={getInputClasses(errors.cindustry_id)}
                placeholder="Select industry"
                readOnly={isReadOnly || leadIndustry.length === 0}
                disabled={isReadOnly || leadIndustry.length === 0}
              />
              {isIndustryDropdownOpen && leadIndustry.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-blue-500 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                  {leadIndustry.filter(industry =>
                    industry.cindustry_name.toLowerCase().includes(searchIndustry.toLowerCase())
                  ).map((industry) => (
                    <div
                      key={industry.iindustry_id}
                      className={dropdownItemClasses}
                      onClick={() => handleIndustrySelect(industry.iindustry_id, industry.cindustry_name)}
                    >
                      {industry.cindustry_name}
                    </div>
                  ))}
                </div>
              )}
              {errors.cindustry_id && <p className={errorTextClasses}>{errors.cindustry_id}</p>}
            </div> */}

            {/* Sub-Industry Dropdown */}
            {/* <div className="relative" ref={subIndustryDropdownRef}>
              <label htmlFor="csubindustry_id" className={labelClasses}>
                Sub-Industry {form.cindustry_id && filteredSubIndustries.length > 0 }
              </label>
              <input
                type="text"
                value={searchSubIndustry}
                onChange={(e) => {
                  if (isReadOnly) return;
                  setSearchSubIndustry(e.target.value);
                  setIsSubIndustryDropdownOpen(true);
                  setErrors((prev) => ({ ...prev, csubindustry_id: "" }));
                }}
                onClick={() => !isReadOnly && setIsSubIndustryDropdownOpen(true)}
                className={getInputClasses(errors.csubindustry_id)}
                placeholder="Select sub-industry"
                readOnly={isReadOnly || !form.cindustry_id || filteredSubIndustries.length === 0}
                disabled={isReadOnly || !form.cindustry_id || filteredSubIndustries.length === 0}
              />
              {isSubIndustryDropdownOpen && form.cindustry_id && filteredSubIndustries.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-blue-500 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                  {filteredSubIndustries.filter(subIndustry =>
                    subIndustry.subindustry_name.toLowerCase().includes(searchSubIndustry.toLowerCase())
                  ).map((subIndustry) => (
                    <div
                      key={subIndustry.isubindustry}
                      className={dropdownItemClasses}
                      onClick={() => handleSubIndustrySelect(subIndustry.isubindustry, subIndustry.subindustry_name)}
                    >
                      {subIndustry.subindustry_name}
                    </div>
                  ))}
                </div>
              )}
              {errors.csubindustry_id && <p className={errorTextClasses}>{errors.csubindustry_id}</p>}
            </div> */}

            {/* Lead Source Dropdown */}
            <div className="relative" ref={sourceDropdownRef}>
              <label htmlFor="lead_source_id" className={labelClasses}>
                Lead source <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchSource}
                onChange={(e) => {
                  if (isReadOnly) return;
                  setSearchSource(e.target.value);
                  setIsSourceDropdownOpen(true);
                  setErrors((prev) => ({ ...prev, lead_source_id: "" }));
                }}
                onClick={() => !isReadOnly && setIsSourceDropdownOpen(true)}
                className={getInputClasses(errors.lead_source_id)}
                placeholder="Select source"
                readOnly={isReadOnly || source.length === 0}
                disabled={isReadOnly || source.length === 0}
              />
              {isSourceDropdownOpen && source.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-blue-500 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                  {source.filter(sourceItem =>
                    sourceItem.source_name.toLowerCase().includes(searchSource.toLowerCase())
                  ).map((sourceItem) => (
                    <div
                      key={sourceItem.source_id}
                      className={dropdownItemClasses}
                      onClick={() => handleSourceSelect(sourceItem.source_id, sourceItem.source_name)}
                    >
                      {sourceItem.source_name}
                    </div>
                  ))}
                </div>
              )}
              {errors.lead_source_id && <p className={errorTextClasses}>{errors.lead_source_id}</p>}
            </div>

            {/* sub source dropdown */}

           {/* <div className="relative" ref={subSourceDropdownRef}>
            <label htmlFor="sub_source_id" className={labelClasses}>
              Sub Source
            </label>
            <input
              type="text"
              value={searchSubSource}
              onChange={(e) => {
                if (isReadOnly) return;
                setSearchSubSource(e.target.value);
                setIsSubSourceDropdownOpen(true);
                setErrors((prev) => ({ ...prev, sub_source_id: "" }));
              }}
              onClick={() => !isReadOnly && subSources.length > 0 && setIsSubSourceDropdownOpen(true)}
              className={getInputClasses(errors.sub_source_id)}
              placeholder="Select sub source"
              readOnly={isReadOnly || subSources.length === 0}
              disabled={isReadOnly || subSources.length === 0}
            />

            {isSubSourceDropdownOpen && subSources.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-blue-500 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                {subSources
                  .filter((sub) =>
                    sub.ssub_src_name?.toLowerCase().includes(searchSubSource.toLowerCase())
                  )
                  .map((sub) => (
                    <div
                      key={sub.isub_src_id}
                      className={dropdownItemClasses}
                      onClick={() => {
                        setSelectedSubSourceId(sub.isub_src_id);
                        setSearchSubSource(sub.ssub_src_name);
                        setIsSubSourceDropdownOpen(false);
                        setForm((prev) => ({ ...prev, sub_source_id: sub.isub_src_id }));
                      }}
                    >
                      {sub.ssub_src_name}
                    </div>
                  ))}
              </div>
            )}

            {errors.sub_source_id && <p className={errorTextClasses}>{errors.sub_source_id}</p>}
          </div> */}


            {/* Services Dropdown */}
            <div className="relative" ref={serviceDropdownRef}>
              <label htmlFor="iservice_id" className={labelClasses}>
                Lead service <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchService}
                onChange={(e) => {
                  if (isReadOnly) return;
                  setSearchService(e.target.value);
                  setIsServiceDropdownOpen(true);
                  setErrors((prev) => ({ ...prev, iservice_id: "" }));
                }}
                onClick={() => !isReadOnly && setIsServiceDropdownOpen(true)}
                className={getInputClasses(errors.iservice_id)}
                placeholder="Select Services"
                readOnly={isReadOnly || service.length === 0}
                disabled={isReadOnly || service.length === 0}
              />
              {isServiceDropdownOpen && service.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-blue-500 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                  {service.filter(serviceItem =>(
                    serviceItem.serviceName || "").toLowerCase().includes((searchService || "").toLowerCase())
                    // serviceItem.serviceName.toLowerCase().includes(searchService.toLowerCase())
                  ).map((serviceItem) => (
                    <div
                      key={serviceItem.serviceId}
                      className={dropdownItemClasses}
                      onClick={() => handleServiceSelect(serviceItem.serviceId, serviceItem.serviceName)}
                    >
                      {serviceItem.serviceName}
                    </div>
                  ))}
                </div>
              )}
              {errors.iservice_id && <p className={errorTextClasses}>{errors.iservice_id}</p>}
            </div>

      {/* Sub-Services Dropdown */}
      <div className="relative" ref={subServiceDropdownRef}>
        <label htmlFor="isubservice_id" className={labelClasses}>
          Sub Service {form.iservice_id && filteredSubServices.length > 0 }
        </label>
        <input
          type="text"
          value={searchSubService}
          onChange={(e) => {
            if (isReadOnly) return;
            setSearchSubService(e.target.value);
            setIsSubServiceDropdownOpen(true);
            setErrors((prev) => ({ ...prev, isubservice_id: "" }));
          }}
          onClick={() => !isReadOnly && setIsSubServiceDropdownOpen(true)}
          className={getInputClasses(errors.isubservice_id)}
          placeholder="Select Sub-Services"
          readOnly={isReadOnly || !form.iservice_id || filteredSubServices.length === 0}
          disabled={isReadOnly || !form.iservice_id || filteredSubServices.length === 0}
        />
        {isSubServiceDropdownOpen && form.iservice_id && filteredSubServices.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-blue-500 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
            {filteredSubServices
              .filter(subServiceItem =>
                subServiceItem.subservice_name.toLowerCase().includes(searchSubService.toLowerCase())
              )
              .map((subServiceItem) => (
                <div
                  key={subServiceItem.isubservice_id}
                  className={dropdownItemClasses}
                  onClick={() => handleSubServiceSelect(subServiceItem.isubservice_id, subServiceItem.subservice_name)}
                >
                  {subServiceItem.subservice_name}
                </div>
              ))}
          </div>
        )}
        {errors.isubservice_id && <p className={errorTextClasses}>{errors.isubservice_id}</p>}
      </div>


      {/* Number of Employees Field */}
            {/* <div>
              <label htmlFor="ino_employee" className={labelClasses}>
                Number of Employees
              </label>
              <input
                type="number"
                id="ino_employee"
                name="ino_employee"
                value={form.ino_employee}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : "";
                  setForm((prev) => ({ ...prev, ino_employee: value }));
                  setErrors((prev) => ({ ...prev, ino_employee: "" }));
                }}
                className={getInputClasses(errors.ino_employee)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.ino_employee && <p className={errorTextClasses}>{errors.ino_employee}</p>}
            </div> */}

          {/* Project Value with Currency */}
          <div>
            <label htmlFor="iproject_value" className={labelClasses}>
              Project Value
            </label>
            <div className="flex mt-1">
              {/* Currency Dropdown */}
              <div className="relative" ref={currencyDropdownRef}>
                <button
                  type="button"
                  onClick={() => !isReadOnly && setIsCurrencyDropdownOpen(prev => !prev)}
                  className={`border px-3 py-2 rounded-l-md focus:ring-2 focus:ring-blue-500 outline-none flex items-center gap-1 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={isReadOnly}
                >
                  {selectedCurrency.currency_code} ({selectedCurrency.symbol})
                  {!isReadOnly && (
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {isCurrencyDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-1 w-36 bg-white border rounded shadow-md max-h-48 overflow-y-auto">
                    {currencies.map((cur) => (
                      <div
                        key={cur.icurrency_id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleCurrencySelect(cur)}
                      >
                        {cur.currency_code} ({cur.symbol})
                      </div>
                    ))}
                  </div>
                )}
              </div>

           {/* Project Value Input */}

            {/* <input
              type="number"
              id="iproject_value"
              name="iproject_value"
              value={form.iproject_value || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  iproject_value: e.target.value ? parseInt(e.target.value, 10) : ""
                }))
              }
              className={getInputClasses(errors.iproject_value)}
              readOnly={isReadOnly}
              disabled={isReadOnly}
            /> */}

                <input
                  type="number"
                  id="iproject_value"
                  name="iproject_value"
                  value={form.iproject_value === 0 ? "" : form.iproject_value}
                  onChange={handleFieldChange} 
                  className={`flex-1 ${getInputClasses(errors.iproject_value)} rounded-r-md`}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
              {errors.iproject_value && <p className={errorTextClasses}>{errors.iproject_value}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="cemail" className={labelClasses}>
                E-mail ID
              </label>
              <input
                type="email"
                id="cemail"
                name="cemail"
                value={form.cemail}
                onChange={handleFieldChange}
                className={getInputClasses(errors.cemail)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.cemail && <p className={errorTextClasses}>{errors.cemail}</p>}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="iphone_no" className={labelClasses}>
                Mobile Number <span className="text-red-500">*</span>
              </label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              
              <div className="relative" ref={phoneCountryCodeRef}>
                <button
                  type="button"
                  onClick={() => !isReadOnly && setIsPhoneCountryCodeOpen(!isPhoneCountryCodeOpen)}
                  className={getDropdownButtonClasses()}
                  disabled={isReadOnly}
                >
                  {form.phone_country_code}
                  {!isReadOnly && <FiChevronDown size={16} className="ml-1" />}
                </button>
                {isPhoneCountryCodeOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                    {allCountries.map((country) => (
                      <div
                        key={country.countryCode}
                        className={dropdownItemClasses}
                        onClick={() => {
                          setForm(prev => ({ ...prev, phone_country_code: country.callingCode }));
                          setIsPhoneCountryCodeOpen(false);
                          setErrors(prev => ({ ...prev, iphone_no: "" }));
                        }}
                      >
                        {country.callingCode}
                      </div>
                    ))}
                  </div>
                )}
              </div>
             

              <input
                type="text"
                id="iphone_no"
                name="iphone_no"
                value={form.iphone_no}
                onChange={(e) => {
                  if (isReadOnly) return;
                  const value = e.target.value.replace(/\D/g, '');
                  setForm(prev => ({ ...prev, iphone_no: value }));
                  setErrors(prev => ({ ...prev, iphone_no: "" }));
                }}
                className={`flex-1 ${getInputClasses(errors.iphone_no)}`}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>
              {errors.iphone_no && <p className={errorTextClasses}>{errors.iphone_no}</p>}
            </div>
            {/* WhatsApp Field */}
            <div>
              <label htmlFor="cwhatsapp" className={labelClasses}>
                WhatsApp Number
              </label>
              <div className="flex gap-2">
              <div className="relative" ref={whatsappCountryCodeRef}>
                <button
                  type="button"
                  onClick={() => !isReadOnly && setIsWhatsappCountryCodeOpen(!isWhatsappCountryCodeOpen)}
                  className={getDropdownButtonClasses()}
                  disabled={isReadOnly}
                >
                  {form.whatsapp_country_code}
                  {!isReadOnly && <FiChevronDown size={16} className="ml-1" />}
                </button>
                {isWhatsappCountryCodeOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm"> 
                    {/* Use the dynamically generated allCountries array */}
                     {allCountries.map((country) => (
                      <div
                        key={country.countryCode}
                        className={dropdownItemClasses}
                        onClick={() => {
                          setForm(prev => ({ ...prev, whatsapp_country_code: country.callingCode }));
                          setIsWhatsappCountryCodeOpen(false);
                          setErrors(prev => ({ ...prev, cwhatsapp: "" }));
                        }}
                      >
                        {country.callingCode}
                      </div>
                    ))}
                  </div>
                )}
              </div> 
              <input
                type="text"
                id="cwhatsapp"
                name="cwhatsapp"
                value={form.cwhatsapp}
                onChange={(e) => {
                  if (isReadOnly) return;
                  const value = e.target.value.replace(/\D/g, '');
                  setForm(prev => ({ ...prev, cwhatsapp: value }));
                  setErrors(prev => ({ ...prev, cwhatsapp: "" }));
                }}
                className={`flex-1 ${getInputClasses(errors.cwhatsapp)}`}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>
            {errors.cwhatsapp && <p className={errorTextClasses}>{errors.cwhatsapp}</p>}
          </div>

            {/* Address 1 Field */}
            <div>
              <label htmlFor="clead_address1" className={labelClasses}>
                Address Line 1
              </label>
              <input
                type="text"
                id="clead_address1"
                name="clead_address1"
                value={form.clead_address1}
                onChange={handleFieldChange}
                className={getInputClasses(errors.clead_address1)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.clead_address1 && <p className={errorTextClasses}>{errors.clead_address1}</p>}
            </div>

            {/* Address 2 Field */}
            <div>
              <label htmlFor="clead_address2" className={labelClasses}>
                Address Line 2
              </label>
              <input
                type="text"
                id="clead_address2"
                name="clead_address2"
                value={form.clead_address2}
                onChange={handleFieldChange}
                className={getInputClasses(false)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
                {errors.clead_address2 && <p className={errorTextClasses}>{errors.clead_address2}</p>}
            </div>

            {/* Address 3 Field */}
            <div>
              <label htmlFor="clead_address3" className={labelClasses}>
                Address Line 3
              </label>
              <input
                type="text"
                id="clead_address3"
                name="clead_address3"
                value={form.clead_address3}
                onChange={handleFieldChange}
                className={getInputClasses(errors.clead_address3)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.clead_address3 && <p className={errorTextClasses}>{errors.clead_address3}</p>}
            </div>

            {/* City Dropdown */}
            <div className="relative" ref={cityDropdownRef}>
              <label htmlFor="icity" className={labelClasses}>
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchCity}
                onChange={handleSearchCity}
                onClick={() => !isReadOnly && setIsCityDropdownOpen(true)}
                className={getInputClasses(errors.icity)}
                placeholder="Search city"
                readOnly={isReadOnly || cities.length === 0}
                disabled={isReadOnly || cities.length === 0}
              />
              {isCityDropdownOpen && cities.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-blue-500 ring-opacity-50 overflow-auto focus:outline-none sm:text-sm">
                  {filteredCities.map((city) => (
                    <div
                      key={city.icity_id}
                      className={dropdownItemClasses}
                      onClick={() => handleCitySelect(city.icity_id, city.cCity_name)}
                    >
                      {city.cCity_name}
                    </div>
                  ))}
                </div>
              )}
              {errors.icity && <p className={errorTextClasses}>{errors.icity}</p>}
            </div>

            
            {/* Pincode Field */}
            <div>
              <label htmlFor="cpincode" className={labelClasses}>Pincode </label>
              <input
                type="number"
                id="cpincode"
                name="cpincode"
                value={form.cpincode || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cpincode: e.target.value ? parseInt(e.target.value, 10) : ""
                  }))
                }
                className={getInputClasses(errors.cpincode)}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {errors.cpincode && <p className={errorTextClasses}>{errors.cpincode}</p>}
            </div>

             </div> 
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button
              type="submit"
              className={getSaveButtonClasses()}
              disabled={isReadOnly}
            >
              <FiSave size={16} />
              {isReadOnly ? "Close" : "Save Changes"}
            </button>
            {!isReadOnly && (
              <button
                type="button"
                onClick={onClose}
                className="bg-blue-200 text-blue-800 px-5 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {successMessage && (
  <div className="mb-4 text-green-600 bg-green-100 border border-green-300 rounded px-4 py-2">
    {successMessage}
  </div>
)}
      </div>
    </div>
  );
};

export default EditProfileForm_Customer ;