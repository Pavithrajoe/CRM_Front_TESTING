// last update 11/12 workinh fine
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from 'axios';
import { X, Search } from "lucide-react";
const apiEndPoint = import.meta.env.VITE_API_URL;

  const LeadForm = ({ onClose, onSuccess, clientType }) => {
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

  // const [existingLeadsList, setExistingLeadsList] = useState([]);
  // const [isLeadListVisible, setIsLeadListVisible] = useState(false);
  // const [searchError, setSearchError] = useState('');
  // const [isExistingLeadDetailsVisible, setIsExistingLeadDetailsVisible] = useState(false);
  // const [backendError, setBackendError] = useState("");
  const [foundLeads, setFoundLeads] = useState([]); 
  // const [isSearching, setIsSearching] = useState(false);
  // new for new/exis
  const [isExistingClientForm, setIsExistingClientForm] = useState(false);
  const [existingClientMobile, setExistingClientMobile] = useState("");
  const [existingClientData, setExistingClientData] = useState(null);

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
    phone_country_code: "",
    cgender: 1,
    clogo: "logo.png",
    clead_address1: "",
    cwhatsapp: "",
    whatsapp_country_code: "",
    clead_address2: "",
    clead_address3: "",
    cstate: "",
    cdistrict: "",
    cpincode: "",
    ccountry: "",
    clead_owner: userId,
    clead_source: "",
    cresponded_by: userId,
    modified_by: userId,
    iservice_id: "",
    isubservice_id: "" 
  });

  const [formLabels, setFormLabels] = useState({
    leadFormTitle: "🚀 Let's Get Started - Create a New Lead",
    section1Label: "Lead Details",
    section2Label: "Contact Information",
    section3Label: "Address Details",
  });

  const [errors, setErrors] = useState({});
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [Potential, setPotential] = useState([]);
  const [status, setStatus] = useState([]);
  const [leadIndustry, setIndustry] = useState([]);
  const [leadSubIndustry, setSubIndustry] = useState([]);
  const [cities, setCities] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [searchPotential, setSearchPotential] = useState("");
  const [isPotentialDropdownOpen, setIsPotentialDropdownOpen] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [searchIndustry, setSearchIndustry] = useState("");
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [searchSubIndustry, setSearchSubIndustry] = useState("");
  const [filteredSubIndustries, setFilteredSubIndustries] = useState([]);
  const [isSubIndustryDropdownOpen, setIsSubIndustryDropdownOpen] = useState(false);
  const [searchSource, setSearchSource] = useState("");
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [searchService, setSearchService] = useState('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [countryCodes, setCountryCodes] = useState([]);
  const [searchMobileCountryCode, setSearchMobileCountryCode] = useState(form.phone_country_code);
  const [isMobileCountryCodeDropdownOpen, setIsMobileCountryCodeDropdownOpen] = useState(false);
  const [filteredMobileCountryCodes, setFilteredMobileCountryCodes] = useState([]);
  const [searchWhatsappCountryCode, setSearchWhatsappCountryCode] = useState(form.whatsapp_country_code);
  const [isWhatsappCountryCodeDropdownOpen, setIsWhatsappCountryCodeDropdownOpen] = useState(false);
  const [filteredWhatsappCountryCodes, setFilteredWhatsappCountryCodes] = useState([]);
  const [service, setService] = useState([]);
  const [isSave, setIsSave] = useState(false);
  // sub service
  const [subServiceList, setSubServiceList] = useState([]);
  const [filteredSubService, setFilteredSubService] = useState([]); 
  const [searchSubService, setSearchSubService] = useState(""); 
  const [isSubServiceDropdownOpen, setIsSubServiceDropdownOpen] = useState(false); 
  const subServiceDropdownRef = useRef(null); 
  const formRef = useRef(null);
  const saveTriggerRef = useRef(false);
  const cityDropdownRef = useRef(null);
  const potentialDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const industryDropdownRef = useRef(null);
  const subIndustryDropdownRef = useRef(null);
  const sourceDropdownRef = useRef(null);
  const serviceDropdownRef = useRef(null);
  const mobileCountryCodeRef = useRef(null);
  const whatsappCountryCodeRef = useRef(null);
  const [searchMobile, setSearchMobile] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  // for currency
   const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState({ currency_code: "INR", symbol: "₹" });
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef(null);
  // for sub source
  const [subSources, setSubSources] = useState([]);
  const [searchSubSource, setSearchSubSource] = useState("");
  const [isSubSourceDropdownOpen, setIsSubSourceDropdownOpen] = useState(false);
  const subSourceDropdownRef = useRef(null);

  useEffect(() => {
      const fetchSubSources = async () => {
      if (!form.lead_source_id) {
          setSubSources([]);
          return;
      }

      try {
          const res = await fetch(`${apiEndPoint}/subSrc/getAllActiveSubSrc`, {
              method: "GET",
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          });
          const resData = await res.json();
                  if (res.ok && resData.data && Array.isArray(resData.data)) {
              const filtered = resData.data.filter(
                  (subSrc) => subSrc.isrc_id === Number(form.lead_source_id)
              );
              setSubSources(filtered);
          } else {
              setSubSources([]);
              console.error("Failed to fetch sub-sources or data is not an array");
          }
      } catch (error) {
          setSubSources([]);
          console.error("Error fetching sub-sources:", error);
      }
  };
      fetchSubSources();
  }, [form.lead_source_id, token]);

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
          setCurrencies(res.data.data.data);
        } else {
          // console.log("API response has no currency data:", res.data);
        }
      } catch (error) {
        console.error("Failed to fetch currencies", error);
      }
    };

    fetchCurrencies();
  }, [token, apiEndPoint]); 

  //outside onclose function 
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if click is outside the modal form
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
      
      if (existingClientData &&
          Potential.length > 0 &&
          status.length > 0 &&
          leadIndustry.length > 0 &&
          leadSubIndustry.length > 0 &&
          source.length > 0 &&
          service.length > 0 &&
          subServiceList.length > 0 &&
          cities.length > 0
      ) {

          // Extract phone number parts
          const phoneNum = existingClientData.iphone_no || "";
          const phoneMatch = phoneNum.match(/^(\+\d{1,2})(.*)$/);
          const phoneCountryCode = phoneMatch ? phoneMatch[1] : "+91";
          const phoneWithoutCode = phoneMatch ? phoneMatch[2] : phoneNum;

          // Extract WhatsApp number parts
          const waNum = existingClientData.whatsapp_number || "";
          const waMatch = waNum.match(/^(\+\d{1,2})(.*)$/);
          const waCountryCode = waMatch ? waMatch[1] : "+91";
          const waWithoutCode = waMatch ? waMatch[2] : waNum;

          setForm(prev => ({
              ...prev,
              iLeadpoten_id: existingClientData.iLeadpoten_id || "",
              ileadstatus_id: existingClientData.ileadstatus_id || "",
              cindustry_id: existingClientData.cindustry_id || "",
              csubindustry_id: existingClientData.isubindustry || "",
              lead_source_id: existingClientData.lead_source_id || "",
              ino_employee: existingClientData.ino_employee || "",
              iproject_value: existingClientData.iproject_value || "",
              clead_name: existingClientData.clead_name || "",
              cemail: existingClientData.cemail || "",
              corganization: existingClientData.corganization || "",
              cwebsite: existingClientData.cwebsite || "",
              icity: existingClientData.clead_city || "",
              iphone_no: phoneWithoutCode || "",
              phone_country_code: phoneCountryCode || "+91",
              clead_address1: existingClientData.clead_address1 || "",
              cwhatsapp: waWithoutCode || "",
              whatsapp_country_code: waCountryCode || "+91",
              clead_address2: existingClientData.clead_address2 || "",
              clead_address3: existingClientData.clead_address3 || "",
              cstate: existingClientData.cstate || "",
              cdistrict: existingClientData.cdistrict || "",
              cpincode: existingClientData.cpincode || "",
              ccountry: existingClientData.ccountry || "",
              iservice_id: existingClientData.serviceId || "",
              isubservice_id: existingClientData.isubservice_id || "",
          }));

          // Update dropdown search text fields
          const selectedPotential = Potential.find(p => p.ileadpoten_id === existingClientData.iLeadpoten_id);
          if (selectedPotential) setSearchPotential(selectedPotential.clead_name);

          const selectedStatus = status.find(s => s.ilead_status_id === existingClientData.ileadstatus_id);
          if (selectedStatus) setSearchStatus(selectedStatus.clead_name);

          const selectedIndustry = leadIndustry.find(i => i.iindustry_id === existingClientData.cindustry_id);
          if (selectedIndustry) setSearchIndustry(selectedIndustry.cindustry_name);

          const selectedSubIndustry = leadSubIndustry.find(si => si.isubindustry === existingClientData.isubindustry);
          if (selectedSubIndustry) setSearchSubIndustry(selectedSubIndustry.subindustry_name);

          const selectedSource = source.find(s => s.source_id === existingClientData.lead_source_id);
          if (selectedSource) setSearchSource(selectedSource.source_name);

          const selectedSubSource = subSources.find(ss => ss.isub_src_id === existingClientData.subSrcId);
          if (selectedSubSource) setSearchSubSource(selectedSubSource.ssub_src_name);

          const selectedService = service.find(s => s.serviceId === existingClientData.iservice_id);
          if (selectedService) setSearchService(selectedService.serviceName);

          const selectedSubService = subServiceList.find(ss => ss.isubservice_id === existingClientData.isubservice_id);
          if (selectedSubService) setSearchSubService(selectedSubService.subservice_name);

          const selectedCity = cities.find(c => c.icity_id === existingClientData.clead_city);
          if (selectedCity) setSearchCity(selectedCity.cCity_name);

      } 
  }, [existingClientData, Potential, status, leadIndustry, leadSubIndustry, source, subSources, service, subServiceList, cities]);


    // for new/existing client
    const resetForm = () => {
      setForm({
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
        cstate: "",
        cdistrict: "",
        cpincode: "",
        ccountry: "",
        clead_owner: userId,
        clead_source: "",
        cresponded_by: userId,
        modified_by: userId,
        iservice_id: "",
        isubservice_id: "" 
      });
      setErrors({});
      setSearchCity("");
      setSearchPotential("");
      setSearchStatus("");
      setSearchIndustry("");
      setSearchSubIndustry("");
      setSearchSource("");
      setSearchService("");
      setSearchSubService("");
      setSameAsPhone(false);
    };

    const toggleSame = () => {
        setSameAsPhone(prevSameAsPhone => {
            const newSameAsPhone = !prevSameAsPhone;
            if (newSameAsPhone) {
                setForm(currentForm => {
                    const updatedForm = {
                        ...currentForm,
                        cwhatsapp: currentForm.iphone_no,
                        whatsapp_country_code: currentForm.phone_country_code,
                    };
                    return updatedForm;
                });
                setSearchWhatsappCountryCode(searchMobileCountryCode);
            } else {
                setForm(currentForm => ({
                    ...currentForm,
                    cwhatsapp: "",
                    whatsapp_country_code: "",
                }));
                setSearchWhatsappCountryCode("");
            }

            return newSameAsPhone; 
        });
    };
      

    const checkExisting = async (fieldName, fieldValue) => {
        if (!fieldValue) return;

        let body = {};
        if (fieldName === "iphone_no" || fieldName === "cwhatsapp") {
          body = { phonenumber: `${form.phone_country_code}${fieldValue}` };
        } else if (fieldName === "cemail") {
          body = { email: fieldValue };
        }

        try {
          const res = await fetch(`${apiEndPoint}/lead/getExistingLeads`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          });

          const data = await res.json();

          if (Array.isArray(data.data) && data.data.length > 0) {
            setPopupMessage(`A lead with this ${fieldName} already exists`);
            setIsPopupVisible(true);
          }
        } catch (err) {
          console.error("Error checking existing lead:", err);
        }
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

      // Validate email if entered
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
            // phonenumber: `${searchMobileCountryCode}${searchMobile}`
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
        console.log("Existing lead search response:", resData);

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
      const phoneCode = resData.iphone_no?.match(/^\+\d{1,4}/)?.[0] || "+91";
      const whatsappCode = resData.whatsapp_number?.match(/^\+\d{1,4}/)?.[0] || "+91";

      const newFormData = {
        ...form,
        ...resData,
        iphone_no: resData.iphone_no?.replace(phoneCode, "").trim() || "",
        cwhatsapp: resData.whatsapp_number?.replace(whatsappCode, "").trim() || "",
        phone_country_code: phoneCode,
        whatsapp_country_code: whatsappCode,
      };

      setForm(newFormData);
      setExistingClientData(resData);

      const validationErrors = validateForm(newFormData);
      setErrors(validationErrors);
    }

    else {
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

    const fetchDropdownData = useCallback(
      async (endpoint, setter, errorMessage, transform = (data) => Array.isArray(data) ? data : []) => {
        try {
          const response = await fetch(`${apiEndPoint}/${endpoint}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            setter([]);
            return;
          }
          const rawData = await response.json();
          const processedData = transform(rawData);
          setter(Array.isArray(processedData) ? processedData : []);
        } catch (e) {
          // console.log(`Error in fetching ${errorMessage}:`, e);
          setter([]);
        }
      },
      [token]
    );

    useEffect(() => {
    if (form.cindustry_id) {
      const newFilteredSubIndustries = leadSubIndustry.filter(
        (sub) => sub.iindustry_parent === Number(form.cindustry_id)
      );
      setFilteredSubIndustries(newFilteredSubIndustries);
    } else {
      setFilteredSubIndustries([]);
    }
   }, [form.cindustry_id, leadSubIndustry]);

    // for sub service
    useEffect(() => {
      fetchDropdownData(
        "sub-service",
        setSubServiceList,
        "sub services",
        (res) => Array.isArray(res?.data) ? res.data : []
      );
    }, [fetchDropdownData]);

    // for sub service filtering
    useEffect(() => {
 
      if (form.iservice_id && subServiceList.length > 0) {
        const filtered = subServiceList.filter(
          (sub) =>
            sub.iservice_parent === Number(form.iservice_id) &&
            sub.subservice_name.toLowerCase().includes(searchSubService.toLowerCase())
        );
        setFilteredSubService(filtered);
      } else {
        setFilteredSubService([]);
        setSearchSubService("");
      }
    }, [form.iservice_id, searchSubService, subServiceList]);


    useEffect(() => {
      const fetchCountryCodes = async () => {
        try {
          const response = await fetch("https://restcountries.com/v3.1/all?fields=name,idd");
          if (!response.ok) {
            throw new Error("Failed to fetch country codes");
          }
          const data = await response.json();
          const codes = data
            .map((country) => {
              if (country.idd && country.idd.root && country.idd.suffixes) {
                const fullCode = `${country.idd.root}${country.idd.suffixes[0] || ""}`;
                return {
                  name: country.name.common,
                  code: fullCode,
                };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
          setCountryCodes(codes);
          setFilteredMobileCountryCodes(codes);
          setFilteredWhatsappCountryCodes(codes);
        } catch (error) {
          console.error("Error fetching country codes:", error);
          setCountryCodes([{ name: "India", code: "+91" }, { name: "USA", code: "+1" }]);
          setFilteredMobileCountryCodes([{ name: "India", code: "+91" }, { name: "USA", code: "+1" }]);
          setFilteredWhatsappCountryCodes([{ name: "India", code: "+91" }, { name: "USA", code: "+1" }]);
        }
      };
      fetchCountryCodes();
    }, []);


    useEffect(() => {
        if (searchMobileCountryCode) {
            const filtered = countryCodes.filter(
                (cc) =>
                    cc.code.toLowerCase().includes(searchMobileCountryCode.toLowerCase()) ||
                    cc.name.toLowerCase().includes(searchMobileCountryCode.toLowerCase())
            );
            setFilteredMobileCountryCodes(filtered);
        } else {
            setFilteredMobileCountryCodes(countryCodes);
        }
    }, [searchMobileCountryCode, countryCodes]);


    useEffect(() => {
        const filtered = countryCodes.filter(
          (cc) =>
            cc.code.toLowerCase().includes(searchWhatsappCountryCode.toLowerCase()) ||
            cc.name.toLowerCase().includes(searchWhatsappCountryCode.toLowerCase())
        );
        setFilteredWhatsappCountryCodes(filtered);
    }, [searchWhatsappCountryCode, countryCodes]);

    //-----------
      useEffect(() => {
        fetchDropdownData(
          "lead-potential/company-potential",
          setPotential,
          "lead potential",
          (res) => Array.isArray(res?.data) ? res.data : []
        );

        fetchDropdownData(
          "lead-status/company-lead",
          setStatus,
          "lead status",
          (res) => Array.isArray(res?.response) ? res.response : []
        );

        fetchDropdownData(
          "lead-source/company-src",
          setSource,
          "lead sources",
          (data) => Array.isArray(data?.data) ? data.data : []
        );

        fetchDropdownData(
          "lead-service",
          setService,
          "service",
          (res) => Array.isArray(res?.data) ? res.data : []
        );

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
              console.error(`Can't fetch lead industry and sub-industry. Status: ${response.status}`);
              setIndustry([]);
              setSubIndustry([]);
              return;
            }

            const rawData = await response.json();
            setIndustry(Array.isArray(rawData.response?.industry) ? rawData.response.industry : []);
            setSubIndustry(Array.isArray(rawData.response?.subindustries) ? rawData.response.subindustries : []);
          } catch (e) {
            console.error(`Error in fetching lead industry and sub-industry:`, e);
            setIndustry([]);
            setSubIndustry([]);
          }
        };

        fetchIndustryAndSubIndustry();
        fetchCitiesData();
      }, [fetchDropdownData, token]);

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
            alert("Can't fetch cities, there was an error.");
            return;
          }

          const data = await response.json();
          if (data && Array.isArray(data.cities)) {
            setCities(data.cities);
            setFilteredCities(data.cities);
          } else {
            alert("Invalid city data received.");
          }
        } catch (e) {
          alert("Error fetching cities.");
        }
      };

      const handleSearchCity = (e) => {
        const searchTerm = e.target.value;
        setSearchCity(searchTerm);
        const filtered = Array.isArray(cities) ? cities.filter((city) =>
          city.cCity_name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) : [];
        setFilteredCities(filtered);
        setIsCityDropdownOpen(true);

        if (!searchTerm) {
          setForm((prev) => ({ ...prev, icity: "" }));
          setErrors((prev) => ({ ...prev, icity: validateField("icity", "") }));
        }
      };

      useEffect(() => {
        const fetchCityDetails = async (cityId) => {
          if (cityId) {
            try {
              const response = await fetch(`${apiEndPoint}/city/${cityId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                setForm((prev) => ({
                  ...prev,
                  cstate: "",
                  cdistrict: "",
                  ccountry: "",
                  cpincode: "",
                }));
                return;
              }

              const data = await response.json();
              if (data) {
                setForm((prev) => ({
                  ...prev,
                  cstate: data.state || "",
                  cdistrict: data.district || "",
                  ccountry: data.country || "",
                  cpincode: data.cpincode || "",
                }));
              }
            } catch (error) {
              console.error("Error fetching city details:", error);
              setForm((prev) => ({
                ...prev,
                cstate: "",
                cdistrict: "",
                ccountry: "",
                cpincode: "",
              }));
            }
          }
        };

        if (form.icity) {
          fetchCityDetails(form.icity);
          const selectedCity = Array.isArray(cities) ? cities.find((city) => city.icity_id === form.icity) : null;
          setSearchCity(selectedCity ? selectedCity.cCity_name : "");
        } else {
          setForm((prev) => ({
            ...prev,
            cstate: "",
            cdistrict: "",
            ccountry: "",
            cpincode: "",
          }));
          setSearchCity("");
        }
      }, [form.icity, token, cities]);

      useEffect(() => {
        const fetchFormLabels = async () => {
          try {
            const res = await fetch(`${apiEndPoint}/lead-form-label`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

            const data = await res.json();

            if (data?.Message) {
              setFormLabels({
                leadFormTitle: data.Message.leadFormTitle || "🚀 Let's Get Started - Create a New Lead",
                section1Label: data.Message.section1Label || "Lead Details",
                section2Label: data.Message.section2Label || "Contact Information",
                section3Label: data.Message.section3Label || "Address Details",
              });
            }
          } catch (err) {
            console.error("Failed to load lead form labels", err);
          }
        };

        if (token && company_id) {
          fetchFormLabels();
        }
      }, [token, company_id]);

      useEffect(() => {
        const handleClickOutside = (event) => {
            if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
                setIsCurrencyDropdownOpen(false);
            }
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
                setIsCityDropdownOpen(false);
            }
            if (potentialDropdownRef.current && !potentialDropdownRef.current.contains(event.target)) {
                setIsPotentialDropdownOpen(false);
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
            if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
                setIsServiceDropdownOpen(false);
            }
            if (subServiceDropdownRef.current && !subServiceDropdownRef.current.contains(event.target)) {
                setIsSubServiceDropdownOpen(false);
            }
            if (mobileCountryCodeRef.current && !mobileCountryCodeRef.current.contains(event.target)) {
                setIsMobileCountryCodeDropdownOpen(false);
            }
            if (whatsappCountryCodeRef.current && !whatsappCountryCodeRef.current.contains(event.target)) {
                setIsWhatsappCountryCodeDropdownOpen(false);
            }
            if (subSourceDropdownRef.current && !subSourceDropdownRef.current.contains(event.target)) {
                setIsSubSourceDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

  const validateField = (name, value) => {
    let error = "";
    if (
      (name === "iphone_no" || name === "cwhatsapp") &&
      value &&
      !/^\d{6,15}$/.test(value)
    ) {
      error = "Must be between 6 and 15 digits";  
    }
    if (name === "cemail") {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (value && !emailRegex.test(value)) {
        error = "Invalid email format";
      }
      else if (value.length > 70) {
        error = "Lead Name cannot exceed 70 characters";
      }
    }
    
    if (name === "cpincode" && value && !/^\d{6,10}$/.test(value)) {
      error = "Pincode must be between 6 and 10 digits";
    }

    if (name === "clead_name") {
      if (!value) {
        // error = "Lead Name is mandatory";
        error = "Mandatory";
      }
      //  else if (!/^[A-Za-z\s]+$/.test(value)) {
      //   error = "Lead Name can only contain letters and spaces";
      // } 
      else if (value.length > 100) {
        error = "Lead Name cannot exceed 100 characters";
      }
    }
    if (name === "clead_address1") {
      // if (!value) {
      //   error = "Mandatory";
      // } 
      
      if (value.length > 200) {
        error = "Lead Address cannot exceed 200 characters";
      }
    }
    if (name === "clead_address2") {
      if (value.length > 200) {
        error = "Lead Address cannot exceed 200 characters";
      }
    }
    if (name === "clead_address3") {
      if (value.length > 200) {
        error = "Lead Address cannot exceed 200 characters";
      }
    }
    if (name === "cwebsite") {
      const urlRegex = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i;
      if (value && !urlRegex.test(value)) {
        error = "Invalid website URL format";
      }
    }

    if (name === "corganization") {
      if (!value) {
        error = "Mandatory";
      } 
      // else if (!/^[A-Za-z\s]+$/.test(value)) {
      //   error = "Organization Name can only contain letters and spaces";
      // } 
      else if (value.length > 100) {
        error = "Organization Name cannot exceed 100 characters";
      }
    }

    if (name === "iphone_no" && !value) {
      error = "Mandatory";
    }
    // if (name === "clead_address1" && !value) {
    //   error = "Mandatory";
    // }
    if (name === "icity" && !value) {
      error = "Mandatory";
    }
    if (name === "iLeadpoten_id" && !value) {
      error = "Mandatory";
    }
    if (name === "serviceId" && !value) {
      error = "Mandatory";
    }
    if (name === "ileadstatus_id" && !value) {
      error = "Mandatory";
    }
    // if (name === "cindustry_id" && !value) {
    //   error = "Mandatory";
    // }
    if (name === "lead_source_id" && !value) {
      error = "Mandatory";
    }
    if (name === "ino_employee") {
      const num = Number(value);
      if (value !== "" && (isNaN(num) || !Number.isInteger(num))) {
        error = "Must be a valid whole number";
      } else if (value !== "" && num < 0) {
        error = "Mandatory && Number must be greater than 0";
      } else if (value !== "" && num > 999999) {
        error = "Number must be less than 1 million";
      }
    }

    if (name === "iproject_value") {
      const amount = parseFloat(value);
      if (value !== "" && isNaN(amount)) {
        error = "Must be a valid number";
      } else if (value !== "" && amount < 0) {
        error = "Value cannot be negative";
      } else if (value !== "" && !/^\d+(\.\d{1,2})?$/.test(value)) {
        error = "Only up to 2 decimal places allowed";
      } else if (value !== "" && amount > 1000000000) {
        error = "Value must be less than 1 billion";
      }
    }

    return error;
  };

const splitPhoneNumber = (fullPhoneNumber) => {
  if (!fullPhoneNumber) {
    return {
      countryCode: '+91', 
      nationalNumber: '',
    };
  }

  if (!fullPhoneNumber.startsWith('+')) {
    return {
      countryCode: '+91', 
      nationalNumber: fullPhoneNumber,
    };
  }

  const regexMatch = fullPhoneNumber.match(/^\+(\d{1,4})\s*(.*)/);

  if (regexMatch && regexMatch.length === 3) {
    return {
      countryCode: `+${regexMatch[1]}`,
      nationalNumber: regexMatch[2],
    };
  }

  const fallbackMatch = fullPhoneNumber.match(/^\+(\d{1,4})(.*)/);
  if (fallbackMatch && fallbackMatch.length === 3) {
    return {
      countryCode: `+${fallbackMatch[1]}`,
      nationalNumber: fallbackMatch[2],
    };
  }

  return {
    countryCode: '+91',
    nationalNumber: fullPhoneNumber,
  };
};

const searchSetters = {
  searchMobileCountryCode: setSearchMobileCountryCode,
  searchWhatsappCountryCode: setSearchWhatsappCountryCode,
  searchCity: setSearchCity,
  searchPotential: setSearchPotential,
  searchStatus: setSearchStatus,
  searchIndustry: setSearchIndustry,
  searchSubIndustry: setSearchSubIndustry,
  searchSource: setSearchSource,
  searchService: setSearchService,
  searchSubService: setSearchSubService
};

const dropdownOpenSetters = {
  searchMobileCountryCode: setIsMobileCountryCodeDropdownOpen,
  searchWhatsappCountryCode: setIsWhatsappCountryCodeDropdownOpen,
  searchCity: setIsCityDropdownOpen,
  searchPotential: setIsPotentialDropdownOpen,
  searchStatus: setIsStatusDropdownOpen,
  searchIndustry: setIsIndustryDropdownOpen,
  searchSubIndustry: setIsSubIndustryDropdownOpen,
  searchSource: setIsSourceDropdownOpen,
  searchService: setIsServiceDropdownOpen,
  searchSubService: setIsSubServiceDropdownOpen
};


const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'existingClientMobile') {
        setExistingClientMobile(value);
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
        return;
    }

    // logic for all searchable dropdowns
    if (name.startsWith("search")) {
        if (name === "searchMobileCountryCode") {
            setSearchMobileCountryCode(value);
        } 
        // else if (name === "searchExistingCountryCode") { // for existing lead country code search
        //   setSearchExistingCountryCode(value);
        // }
        else if (name === "searchWhatsappCountryCode") {
            setSearchWhatsappCountryCode(value);
        } else if (searchSetters[name]) {
            searchSetters[name](value);
        }

        if (dropdownOpenSetters[name]) {
            dropdownOpenSetters[name](true);
        }

        if (!value) {
            if (name === "searchPotential") setForm(prev => ({ ...prev, iLeadpoten_id: "" }));
            if (name === "searchStatus") setForm(prev => ({ ...prev, ileadstatus_id: "" }));
            if (name === "searchIndustry") {
                setForm(prev => ({ ...prev, cindustry_id: "", csubindustry_id: "" }));
                setSearchSubIndustry(""); 
            }
            if (name === "searchSource") setForm(prev => ({ ...prev, lead_source_id: "" }));
            if (name === "searchService") {
                setForm(prev => ({ ...prev, iservice_id: "", isubservice_id: "" }));
                setSearchSubService("");
            }
            if (name === "searchCity") setForm(prev => ({ ...prev, icity: "" }));
        }
        return;
    }

    // --- Start of Main form state update logic ---
    setForm((prev) => {
        let updated = { ...prev, [name]: value };

        // Handle phone number splitting
        if (name === 'iphone_no') {
            const { countryCode, nationalNumber } = splitPhoneNumber(value);
            if (countryCode) updated.iphone_country_code = countryCode;
            updated.iphone_no = nationalNumber;
        }

        // Handle WhatsApp number splitting
        if (name === 'cwhatsapp' && !sameAsPhone) {
            const { countryCode, nationalNumber } = splitPhoneNumber(value);
            if (countryCode) updated.cwhatsapp_country_code = countryCode;
            updated.cwhatsapp = nationalNumber;
        }

        // Sync WhatsApp with phone if checkbox is checked
        if (sameAsPhone) {
            if (name === "iphone_no") {
                updated.cwhatsapp = updated.iphone_no;
            }
            if (name === "iphone_country_code") {
                updated.cwhatsapp_country_code = updated.iphone_country_code;
            }
        }
        
        // This is where you handle the dependent reset on the primary field change
        if (name === "cindustry_id" && prev.cindustry_id !== value) {
            updated.csubindustry_id = "";
            setSearchSubIndustry("");
        }

        if (name === "iservice_id" && prev.serviceId !== value) {
            updated.isubservice_id = "";
            setSearchSubService("");
        }

        // Add this new condition for sub-source
        if (name === "lead_source_id" && prev.lead_source_id !== value) {
            updated.subSrcId = "";
            setSearchSubSource("");
        }

        return updated;
    });

    // Validate the field after the main form state is updated
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
    // setForm((prev) => ({ ...prev, [fieldName]: itemId }));
    setSearchTerm(itemName);
    setIsDropdownOpen(false);
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  const handleSelectCountryCode = (type, codeToSet, codeToDisplay) => {
    const countryCodeFieldName = type === "phone" ? "phone_country_code" : "whatsapp_country_code";

    setForm((prev) => ({ ...prev, [countryCodeFieldName]: codeToSet }));

    if (type === "phone") {
      setSearchMobileCountryCode(codeToDisplay);
      setIsMobileCountryCodeDropdownOpen(false);
      if (sameAsPhone) {
        setForm((prev) => ({ ...prev, whatsapp_country_code: codeToSet }));
        setSearchWhatsappCountryCode(codeToDisplay);
      }
    } else if (type === "whatsapp") {
      setSearchWhatsappCountryCode(codeToDisplay);
      setIsWhatsappCountryCodeDropdownOpen(false);
    }
    setErrors((prev) => ({ ...prev, [countryCodeFieldName]: undefined }));
  };


  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === "searchMobileCountryCode") {
        const selectedCode = countryCodes.find(
            (cc) => cc.code === value || cc.name.toLowerCase().includes(value.toLowerCase())
        );
        
        if (selectedCode) {
            setSearchMobileCountryCode(selectedCode.code);
            setForm((prev) => ({ ...prev, phone_country_code: selectedCode.code }));
        } else {
             setSearchMobileCountryCode(form.phone_country_code);
            setForm((prev) => ({ ...prev, phone_country_code: prev.phone_country_code }));
        }
        setIsMobileCountryCodeDropdownOpen(false);
    } else if (name === "searchWhatsappCountryCode") {
        const selectedCode = countryCodes.find(
            (cc) => cc.code === value || cc.name.toLowerCase().includes(value.toLowerCase())
        );
        if (selectedCode) {
            setSearchWhatsappCountryCode(selectedCode.code);
            setForm((prev) => ({ ...prev, whatsapp_country_code: selectedCode.code }));
        } else {
         
            setSearchWhatsappCountryCode(form.whatsapp_country_code);
            setForm((prev) => ({ ...prev, whatsapp_country_code: prev.whatsapp_country_code }));
        }
        setIsWhatsappCountryCodeDropdownOpen(false);
    }

    else if (name === "searchIndustry") {
        const selectedIndustry = Array.isArray(leadIndustry) ? leadIndustry.find(ind => ind.iindustry_id === form.cindustry_id) : null;
        if (!selectedIndustry || selectedIndustry.cindustry_name !== value) {
            setSearchIndustry(selectedIndustry ? selectedIndustry.cindustry_name : "");
            setForm((prev) => ({
                ...prev,
                cindustry_id: selectedIndustry ? selectedIndustry.iindustry_id : "",
                csubindustry_id: "" 
            }));
            setSearchSubIndustry(""); 
        }
        setIsIndustryDropdownOpen(false);
    } else if (name === "searchSubIndustry") {
        const selectedSubIndustry = Array.isArray(leadSubIndustry) ? leadSubIndustry.find(subInd => subInd.isubindustry === form.csubindustry_id) : null;
        if (!selectedSubIndustry || selectedSubIndustry.subindustry_name !== value) {
            setSearchSubIndustry(selectedSubIndustry ? selectedSubIndustry.subindustry_name : "");
            setForm((prev) => ({ ...prev, csubindustry_id: selectedSubIndustry ? selectedSubIndustry.isubindustry : "" }));
        }
        setIsSubIndustryDropdownOpen(false);
    } 
    else if (name === "searchPotential") {
      const selectedPotential = Array.isArray(Potential) ? Potential.find(pot => pot.ileadpoten_id === form.iLeadpoten_id) : null;
      if (!selectedPotential || selectedPotential.clead_name !== value) {
        setSearchPotential(selectedPotential ? selectedPotential.clead_name : "");
        setForm((prev) => ({ ...prev, iLeadpoten_id: selectedPotential ? selectedPotential.ileadpoten_id : "" }));
      }
      setIsPotentialDropdownOpen(false);
    } else if (name === "searchStatus") {
      const selectedStatus = Array.isArray(status) ? status.find(stat => stat.ilead_status_id === form.ileadstatus_id) : null;
      if (!selectedStatus || selectedStatus.clead_name !== value) {
        setSearchStatus(selectedStatus ? selectedStatus.clead_name : "");
        setForm((prev) => ({ ...prev, ileadstatus_id: selectedStatus ? selectedStatus.ilead_status_id : "" }));
      }
      setIsStatusDropdownOpen(false);
    } else if (name === "searchSource") {
      const selectedSource = Array.isArray(source) ? source.find(src => src.source_id === form.lead_source_id) : null;
      if (!selectedSource || selectedSource.source_name !== value) {
        setSearchSource(selectedSource ? selectedSource.source_name : "");
        setForm((prev) => ({ ...prev, lead_source_id: selectedSource ? selectedSource.source_id : "" }));
      }
      setIsSourceDropdownOpen(false);
    }
   

        else if (name === "searchSubSource") {
        const selectedSubSource = subSources.find(
            (subSrc) => subSrc.isub_src_id === form.subSrcId
        );
        if (!selectedSubSource || selectedSubSource.ssub_src_name !== value) {
            setSearchSubSource(selectedSubSource ? selectedSubSource.ssub_src_name : "");
            setForm((prev) => ({
                ...prev,
                subSrcId: selectedSubSource ? selectedSubSource.isub_src_id : "",
            }));
        }
        setIsSubSourceDropdownOpen(false);
    }

    else if (name === "searchSubService") {
        const selectedSubService = subServiceList.find(
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

const validateForm = () => {
    let newErrors = {};

    if (isExistingClientForm) {
        const existingMobileError = validateField("existingClientMobile", existingClientMobile);
        if (existingMobileError) {
            newErrors.existingClientMobile = existingMobileError;
        }

        if (!existingClientData) {
            newErrors.ilead_id = "Please select a lead from the search results.";
        }
        
        return newErrors;
    }

    ["clead_name", "corganization", "clead_address1"].forEach((field) => {
        const error = validateField(field, form[field]);
        if (error) newErrors[field] = error;
    });

    ["iLeadpoten_id", "icity", "ileadstatus_id", "cindustry_id", "lead_source_id", "iservice_id"].forEach((field) => {
        const error = validateField(field, form[field]);
        if (error) newErrors[field] = error;
    });

    const employeeError = validateField("ino_employee", form.ino_employee);
    if (employeeError) newErrors.ino_employee = employeeError;
    const projectValueError = validateField("iproject_value", form.iproject_value);
    if (projectValueError) newErrors.iproject_value = projectValueError;

    const phoneError = validateField("iphone_no", form.iphone_no);
    if (phoneError) newErrors.iphone_no = phoneError;
    
    if (form.cwhatsapp && !sameAsPhone) {
        const whatsappError = validateField("cwhatsapp", form.cwhatsapp);
        if (whatsappError) newErrors.cwhatsapp = whatsappError;
    }
    
    const websiteError = validateField("cwebsite", form.cwebsite);
    if (websiteError) newErrors.cwebsite = websiteError;
    const emailError = validateField("cemail", form.cemail);
    if (emailError) newErrors.cemail = emailError;

    return newErrors;
};

  
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  let validationErrors = {};
  let formValid = true;
  if (isExistingClientForm && !existingClientData) {
   
    if (!existingClientMobile || existingClientMobile.length < 6 || existingClientMobile.length > 15) {
      validationErrors.existingClientMobile = "Please enter a valid mobile number (6 to 15 digits).";
    }
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      setLoading(false);
      return;
    }
    
    setLoading(false);
    return;
  }
  
  if (!isExistingClientForm || existingClientData) {
    
    validationErrors = validateForm();
    setErrors(validationErrors);
    formValid = Object.keys(validationErrors).length === 0;

    if (!formValid) {
      // console.log("Validation failed with errors:", validationErrors);
      setLoading(false);
      return;
    }
  }
  try {
    const formData = {
      bactive: true,
      cemail: form.cemail,
      cgender: 1,
      cimage: "noimg.png",
      clead_address1: form.clead_address1,
      clead_address2: form.clead_address2,
      clead_address3: form.clead_address3,
      clead_city: Number(form.icity),
      clead_name: form.clead_name,
      clead_owner: userId,
      clogo: "logo.png",
      corganization: form.corganization,
      cresponded_by: userId,
      ileadstatus_id: Number(form.ileadstatus_id),
      cindustry_id: Number(form.cindustry_id),
      isubindustry: form.csubindustry_id ? Number(form.csubindustry_id) : null,
      iLeadpoten_id: Number(form.iLeadpoten_id),
      cwebsite: form.cwebsite,
      dmodified_dt: new Date().toISOString(),
      ino_employee: form.ino_employee === "" ? 0 : Number(form.ino_employee),
      icity: Number(form.icity),
      icompany_id: company_id,
      // iphone_no: `${form.phone_country_code}${form.iphone_no}`,
      iphone_no: form.iphone_no,
      iproject_value: form.iproject_value === "" ? 0 : Number(form.iproject_value),
      modified_by: userId,
      iuser_tags: userId,
      iservice_id: form.iservice_id,
      isubservice_id: form.isubservice_id ? Number(form.isubservice_id) : null,
      lead_source_id: Number(form.lead_source_id),
      // whatsapp_number: `${form.whatsapp_country_code}${form.cwhatsapp}`,
      whatsapp_number: form.cwhatsapp,
      // cpincode: form.cpincode,
      cpincode: form.cpincode ? Number(form.cpincode) : null,
      icurrency_id: selectedCurrency.icurrency_id,
      subSrcId: form.subSrcId ? Number(form.subSrcId) : null,
      phone_country_code: form.phone_country_code,
      whatsapp_country_code: form.whatsapp_country_code,
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
      setPopupMessage("Lead created successfully!");
      setIsPopupVisible(true);

      setTimeout(() => {
        setIsPopupVisible(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }, 3000);
    } 
    else {
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
  } 
  catch (error) {
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

  const filteredPotential = Array.isArray(Potential)
    ? Potential.filter((item) =>
      item.clead_name?.toLowerCase().includes(searchPotential.toLowerCase())
    )
    : [];

  const filteredStatus = Array.isArray(status)
    ? status.filter((item) =>
      item.clead_name?.toLowerCase().includes(searchStatus.toLowerCase())
    )
    : [];

  const filteredIndustry = Array.isArray(leadIndustry)
    ? leadIndustry.filter((item) =>
      item.cindustry_name?.toLowerCase().includes(searchIndustry.toLowerCase())
    )
    : [];

  const filteredSubIndustry = Array.isArray(leadSubIndustry) && form.cindustry_id
    ? leadSubIndustry.filter((item) =>
      item.iindustry_parent === Number(form.cindustry_id) &&
      item.subindustry_name?.toLowerCase().includes(searchSubIndustry.toLowerCase())
    )
    : [];

  const filteredSource = Array.isArray(source)
    ? source.filter((item) =>
      item.source_name?.toLowerCase().includes(searchSource.toLowerCase())
    )
    : [];
  const filterService = Array.isArray(service)
    ? service.filter((item) =>
      item.serviceName?.toLowerCase().includes(searchService.toLowerCase())
    )
    : [];

  const EmptyDropdownMessage = ({ type }) => {
    const messages = {
      potential: "No lead potentials found. Please create potentials in the master section.",
      status: "No lead statuses found. Please create statuses in the master section.",
      industry: "No industries found. Please create industries in the master section.",
      subindustry: form.cindustry_id
        ? "No sub-industries found for this industry. Please create sub-industries in the master section."
        : "Please select an industry first",
      source: "No lead sources found. Please create sources in the master section.",
      city: "No cities found. Please create cities in the master section.",
      subservice: form.iservice_id
        ? "No sub-services found for this service. Please create sub-services in the master section."
        : "Please select a service first",
      // subsource: form.lead_source_id
      //   ? "No sub-sources found for this source. Please create sub-sources in the master section."
      //   : "Please select a source first",
      default: "Data not available. Please check your connection or contact support.",

    };

    return (
      <div className="px-4 py-2 text-sm text-gray-500 italic">
        {messages[type] || messages.default}
      </div>
    );
  };

     const popupStyle = {
      position: "fixed",               // Make it global, not relative to form
      top: "140%",   
      // top: "50%",                  // Center vertically
      left: "50%",                     // Center horizontally
      transform: "translate(-50%, -50%)",
      backgroundColor: "#f9f9f9ff",
      padding: "16px 24px",
      borderRadius: "10px",
      boxShadow: "3px 4px 10px rgba(0, 81, 255, 0.86)",
      zIndex: 10000,                   // Ensure it overlays form content
      minWidth: "300px",
      textAlign: "center",
    };

    const topPopupStyle = {
  ...popupStyle, 
  top: "85%", 
};


  const closeButtonStyle = {
    background: "none",
    border: "none",
    color: "black",
    fontSize: "1em",
    cursor: "pointer",
    marginLeft: "16px",
  };

  const alertStyle = {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "16px 24px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    zIndex: 50,
    opacity: 1,
    transition: "opacity 0.3s ease-in-out",
    textAlign: "center",
  };

  const buttonStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const basicLeadFields = [
    { label: "Lead Name", name: "clead_name", required: true },
    { label: "Organization Name", name: "corganization", required: true },
    { label: "Website", name: "cwebsite", required: false },
  ];

  const contactInfoFields = [
    { label: "E-mail ID", name: "cemail", required: false },
    { label: "Mobile Number", name: "iphone_no", required: true, type: "phone" },
    { label: "WhatsApp Number", name: "cwhatsapp", required: false, type: "whatsapp" },
  ];

  const addressDetailsFields = [
    { label: "Address Line 1", name: "clead_address1", required: false },
    { label: "Address Line 2", name: "clead_address2", required: false },
    { label: "Address Line 3", name: "clead_address3", required: false },
    { label: "City", name: "icity", type: "searchable-select-city", required: true },
    { label: "Country", name: "ccountry", value: form.ccountry, readOnly: true },
    { label: "State", name: "cstate", value: form.cstate, readOnly: true },
    { label: "District", name: "cdistrict", value: form.cdistrict, readOnly: true },
    { label: "Pincode", name: "cpincode", required: false },
  ];

  return (
    
 <div className="fixed inset-0 bg-transparent backdrop-blur-md flex justify-center items-start pt-10 z-50 overflow-y-auto hide-scrollbar px-8">
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative bg-white w-[95%] max-w-[1060px] rounded-2xl shadow-3xl p-6 space-y-6"
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
            {formLabels.leadFormTitle}
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
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={isExistingClientForm}
                onChange={() => {
                  setIsExistingClientForm(true);
                  setExistingClientData(null);
                  setExistingClientMobile("");
                  setFoundLeads([]);
                  resetForm();
                }}
              />
              <span className="ml-2">Existing Lead</span>
            </label>
          </div>
        </div>

        {/* --- EXISTING LEAD SEARCH SECTION --- */}
        {isExistingClientForm && (
            <div className="space-y-6 mb-6">
                <h3 className="text-lg font-semibold mt-6">Search Existing Lead</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Mobile Search */}
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <div className="flex items-center">
              {/* Country code input and dropdown */}
              <div className="relative" ref={mobileCountryCodeRef}>
                <input
                  type="text"
                  name="searchMobileCountryCode" 
                  value={searchMobileCountryCode}  
                  onChange={handleChange}
                  onFocus={() => setIsMobileCountryCodeDropdownOpen(true)}
                  onBlur={handleBlur}
                  placeholder="+XXX"
                  className="border px-2 py-2 rounded-l-md focus:ring-2 focus:ring-blue-500 outline-none w-[100px] flex-none"
                />
                {isMobileCountryCodeDropdownOpen && (
                  <div className="absolute z-10 top-full mt-1 bg-white border rounded shadow-md max-h-40 overflow-y-auto min-w-[250px] w-max">
                    {Array.isArray(filteredMobileCountryCodes) &&
                    filteredMobileCountryCodes.length > 0 ? (
                      filteredMobileCountryCodes.map((cc) => (
                        <div
                          key={cc.code}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            handleSelectCountryCode("phone", cc.code, cc.code);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {cc.code} ({cc.name})
                        </div>
                      ))
                    ) : (
                      <EmptyDropdownMessage type="country" />
                    )}
                  </div>
                )}
              </div>

              {/* Phone number input */}
              <input
                type="text"
                name="searchMobile"
                value={searchMobile}
                onChange={(e) => {
                  setSearchMobile(e.target.value);
                  if (e.target.value) setSearchEmail(""); 
                }}
                placeholder="Enter mobile number"
                className="flex-1 border px-3 py-2 rounded-r-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Email Search */}
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <input
              // type="email"
              type="text"
              name="searchEmail"
              value={searchEmail}
              onChange={(e) => {
                setSearchEmail(e.target.value);
                if (e.target.value) setSearchMobile(""); // clear mobile if email is entered
              }}
              placeholder="Enter email address"
              className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Search Button */}
          <div className="col-span-2">
            <button
              onClick={handleSearchExistingLead}
              disabled={loading}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

                {/* Loading and results display below */}
                {loading && (
                    <p className="text-blue-600 text-sm">Searching for leads...</p>
                )}

                {foundLeads.length > 0 && (
                    <div className="flex flex-col relative w-full md:w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lead Name <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="ilead_id"
                            value={form.ilead_id || ''}
                            onChange={(e) => handleSelectLead(e.target.value)}
                            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select an existing lead...</option>
                            {foundLeads.map((lead) => (
                                <option key={lead.ilead_id} value={lead.ilead_id}>
                                    {lead.clead_name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        )}

        {!isExistingClientForm || existingClientData ? (
          <>
            <h3 className="text-lg font-semibold mt-6">{formLabels.section1Label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {basicLeadFields.map(({ label, name, required, value, readOnly }) => (
              <div key={name}>
                <label className="text-sm font-medium">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name={name}
                  value={value !== undefined ? value : form[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  readOnly={readOnly}
                />
                {errors[name] && (
                  <p className="text-red-600 text-sm">{errors[name]}</p>
                )}
              </div>
            ))}
              {[
                {
                  label: "Lead potential",
                  ref: potentialDropdownRef,
                  inputName: "searchPotential",
                  searchValue: searchPotential,
                  setSearch: setSearchPotential,
                  open: isPotentialDropdownOpen,
                  setOpen: setIsPotentialDropdownOpen,
                  list: filteredPotential,
                  keyField: "ileadpoten_id",
                  displayField: "clead_name",
                  formField: "iLeadpoten_id",
                  error: errors.iLeadpoten_id,
                  required: true,
                  emptyType: "potential"
                },
                {
                  label: "Lead status",
                  ref: statusDropdownRef,
                  inputName: "searchStatus",
                  searchValue: searchStatus,
                  setSearch: setSearchStatus,
                  open: isStatusDropdownOpen,
                  setOpen: setIsStatusDropdownOpen,
                  list: filteredStatus,
                  keyField: "ilead_status_id",
                  displayField: "clead_name",
                  formField: "ileadstatus_id",
                  error: errors.ileadstatus_id,
                  required: true,
                  emptyType: "status"
                },
                {
                  label: "Industry",
                  ref: industryDropdownRef,
                  inputName: "searchIndustry",
                  searchValue: searchIndustry,
                  setSearch: setSearchIndustry,
                  open: isIndustryDropdownOpen,
                  setOpen: setIsIndustryDropdownOpen,
                  list: filteredIndustry,
                  keyField: "iindustry_id",
                  displayField: "cindustry_name",
                  formField: "cindustry_id",
                  error: errors.cindustry_id,
                  required: false,
                  emptyType: "industry"
                },
                {
                  label: "Sub-Industry",
                  ref: subIndustryDropdownRef,
                  inputName: "searchSubIndustry",
                  searchValue: searchSubIndustry,
                  setSearch: setSearchSubIndustry,
                  open: isSubIndustryDropdownOpen,
                  setOpen: setIsSubIndustryDropdownOpen,
                  list: filteredSubIndustry,
                  keyField: "isubindustry",
                  displayField: "subindustry_name",
                  formField: "csubindustry_id",
                  error: errors.csubindustry_id,
                  disabled: !form.cindustry_id || filteredSubIndustries.d === 0,
                  required: false,
                  emptyType: "subindustry"
                },
                {
                  label: "Lead source",
                  ref: sourceDropdownRef,
                  inputName: "searchSource",
                  searchValue: searchSource,
                  setSearch: setSearchSource,
                  open: isSourceDropdownOpen,
                  setOpen: setIsSourceDropdownOpen,
                  list: filteredSource,
                  keyField: "source_id",
                  displayField: "source_name",
                  formField: "lead_source_id",
                  error: errors.lead_source_id,
                  required: true,
                  emptyType: "source"
                },
                {
                  label: "Sub-source",
                  ref: subSourceDropdownRef,
                  inputName: "searchSubSource",
                  searchValue: searchSubSource,
                  setSearch: setSearchSubSource,
                  open: isSubSourceDropdownOpen,
                  setOpen: setIsSubSourceDropdownOpen,
                  list: subSources.filter(
                    (item) =>
                      item.ssub_src_name
                        ?.toLowerCase()
                        .includes(searchSubSource.toLowerCase())
                  ),
                  keyField: "isub_src_id",
                  displayField: "ssub_src_name",
                  formField: "subSrcId",
                  error: errors.subSrcId,
                  disabled: !form.lead_source_id || subSources.length === 0,
                  required: false,
                  emptyType: "subsource",
                },
                {
                  label: "Lead service",
                  ref: serviceDropdownRef,
                  inputName: "searchService",
                  searchValue: searchService,
                  setSearch: setSearchService,
                  open: isServiceDropdownOpen,
                  setOpen: setIsServiceDropdownOpen,
                  list: filterService,
                  keyField: "serviceId", 
                  displayField: "serviceName",
                  formField: "iservice_id",
                  error: errors.iservice_id,
                  required: true,
                  emptyType: "service"
                },
                {
                  label: "Sub Service",
                  ref: subServiceDropdownRef,
                  inputName: "searchSubService",
                  searchValue: searchSubService,
                  setSearch: setSearchSubService,
                  open: isSubServiceDropdownOpen,
                  setOpen: setIsSubServiceDropdownOpen,
                  list: filteredSubService,
                  keyField: "isubservice_id",
                  displayField: "subservice_name",
                  formField: "isubservice_id",
                  error: errors.isubservice_id,
                  disabled: !form.iservice_id || filteredSubService.length === 0,
                  required: false,
                  emptyType: "subservice"
                },
              ].map(
                ({ label, ref, inputName,searchValue, setSearch, open, setOpen, list,keyField, displayField,
                  formField, error, disabled = false, required = false, emptyType }) => (
                  <div className="flex flex-col relative" key={formField} ref={ref}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                      {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={`Search ${label.toLowerCase()}...`}
                      className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${
                        disabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      value={searchValue}
                      onChange={(e) => handleChange({ target: { name: inputName, value: e.target.value } })}
                      onFocus={() => !disabled && setOpen(true)}
                      disabled={disabled}
                    />
                    {open && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                        {Array.isArray(list) && list.length > 0 ? (
                          list.map((item) => (
                            <div
                              key={item[keyField]}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() =>
                                handleSelectDropdownItem(
                                  formField,
                                  item[keyField],
                                  item[displayField],
                                  setSearch,
                                  setOpen
                                )
                              }
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {item[displayField]}
                            </div>
                          ))
                        ) : (
                          <EmptyDropdownMessage type={emptyType} />
                        )}
                      </div>
                    )}
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                  </div>
                )
              )}
              <div>
                <label className="text-sm font-medium">No. of employees 
                {/* <span className="text-red-600">*</span>  */}
                </label>
                <input
                  type="number"
                  name="ino_employee"
                  value={form.ino_employee === 0 ? "" : form.ino_employee}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter number of employees"
                  className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                />
                {errors.ino_employee && (
                  <p className="text-red-600 text-sm">{errors.ino_employee}</p>
                )}
              </div>

              {/* for currency coode + project value */}
              <div>
              <label className="text-sm font-medium">Project Value</label>
              <div className="flex mt-1">
                {/* Currency Dropdown */}
                <div className="relative" ref={currencyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyDropdownOpen(prev => !prev)}
                    className="border px-3 py-2 rounded-l-md focus:ring-2 focus:ring-blue-500 outline-none flex items-center gap-1"
                  >
                    {selectedCurrency.currency_code} ({selectedCurrency.symbol})
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isCurrencyDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 mt-1 w-36 bg-white border rounded shadow-md max-h-48 overflow-y-auto">
                      {currencies.map((cur) => (
                        <div
                          key={cur.icurrency_id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setSelectedCurrency(cur);
                            setIsCurrencyDropdownOpen(false);
                          }}
                        >
                          {cur.currency_code} ({cur.symbol})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project Value Input */}
                <input
                  type="number"
                  name="iproject_value"
                  value={form.iproject_value === 0 ? "" : form.iproject_value}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter project value"
                  className="flex-1 border px-3 py-2 rounded-r-md focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                />
              </div>
              {errors.iproject_value && (
                <p className="text-red-600 text-sm">{errors.iproject_value}</p>
              )}
            </div>
            </div>
            <hr className="my-6 " />
            <h3 className="text-lg font-semibold mt-6">{formLabels.section2Label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contactInfoFields.map(({ label, name, required, type, value, readOnly }) => {
                if (type === "phone" || type === "whatsapp") {
                  const numberFieldName = type === "phone" ? "iphone_no" : "cwhatsapp";
                  const searchCountryCodeState = type === "phone" ? searchMobileCountryCode : searchWhatsappCountryCode;
                  const isDropdownOpen = type === "phone" ? isMobileCountryCodeDropdownOpen : isWhatsappCountryCodeDropdownOpen;
                  const setIsDropdownOpen = type === "phone" ? setIsMobileCountryCodeDropdownOpen : setIsWhatsappCountryCodeDropdownOpen;
                  const filteredCodes = type === "phone" ? filteredMobileCountryCodes : filteredWhatsappCountryCodes;
                  const dropdownRef = type === "phone" ? mobileCountryCodeRef : whatsappCountryCodeRef;
                  const searchInputName = type === "phone" ? "searchMobileCountryCode" : "searchWhatsappCountryCode";
                  return (
                    <div key={name}>
                      <label className="text-sm font-medium">
                        {label} {required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="flex mt-1">
                        <div className="relative" ref={dropdownRef}>
                          <input
                            type="text"
                            name={searchInputName}
                            value={searchCountryCodeState}
                            onChange={handleChange}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={handleBlur}
                            placeholder="+XXX"
                            className="border px-2 py-2 rounded-l-md focus:ring-2 focus:ring-blue-500 outline-none w-[100px] flex-none"
                            disabled={name === "cwhatsapp" && sameAsPhone}
                          />
                          {isDropdownOpen && (
                            <div className="absolute z-10 top-full mt-1 bg-white border rounded shadow-md max-h-40 overflow-y-auto min-w-[250px] w-max">
                              {Array.isArray(filteredCodes) && filteredCodes.length > 0 ? (
                                filteredCodes.map((cc) => (
                                  <div
                                    key={cc.code}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      handleSelectCountryCode(type, cc.code, cc.code);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  >
                                    {cc.code} ({cc.name})
                                  </div>
                                ))
                              ) : (
                                <EmptyDropdownMessage type="country" />
                              )}
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          name={numberFieldName}
                          value={form[numberFieldName]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder={`Enter ${label.toLowerCase()}`}
                          className="flex-1 border px-3 py-2 rounded-r-md focus:ring-2 focus:ring-blue-500 outline-none"
                          disabled={name === "cwhatsapp" && sameAsPhone}
                        />
                      </div>
                      {errors[numberFieldName] && (
                        <p className="text-red-600 text-sm">{errors[numberFieldName]}</p>
                      )}
                      {name === "iphone_no" && (
                        <label className="inline-flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={sameAsPhone}
                            onChange={toggleSame}
                            className="mr-2"
                          />
                          WhatsApp same as phone
                        </label>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div key={name}>
                      <label className="text-sm font-medium">
                        {label} {required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name={name}
                        value={value !== undefined ? value : form[name]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        readOnly={readOnly}
                      />
                      {errors[name] && (
                        <p className="text-red-600 text-sm">{errors[name]}</p>
                      )}
                    </div>
                  );
                }
              })}
            </div>
            <hr className="my-6 " />
            <h3 className="text-lg font-semibold mt-6">{formLabels.section3Label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {addressDetailsFields.map(({ label, name, required, type, value, readOnly }) => {
                if (type === "searchable-select-city") {
                  return (
                    <div key={name}>
                      <label className="text-sm font-medium">
                        {label} {required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative mt-1" ref={cityDropdownRef}>
                        <input
                          type="text"
                          placeholder={`Search ${label.toLowerCase()}`}
                          className="w-full border px-3 py-2 rounded pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={searchCity}
                          onChange={handleSearchCity}
                          onFocus={() => setIsCityDropdownOpen(true)}
                        />
                        {isCityDropdownOpen && (
                          <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                            {Array.isArray(filteredCities) && filteredCities.length > 0 ? (
                              filteredCities.map((city) => (
                                <div
                                  key={city.icity_id}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    handleSelectDropdownItem(
                                      "icity",
                                      city.icity_id,
                                      city.cCity_name,
                                      setSearchCity,
                                      setIsCityDropdownOpen
                                    );
                                  }}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  {city.cCity_name}
                                </div>
                              ))
                            ) : (
                              <EmptyDropdownMessage type="city" />
                            )}
                          </div>
                        )}
                      </div>
                      {errors.icity && (
                        <p className="text-red-600 text-sm">{errors.icity}</p>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div key={name}>
                      <label className="text-sm font-medium">
                        {label} {required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name={name}
                        value={value !== undefined ? value : form[name]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        readOnly={readOnly}
                      />
                      {errors[name] && (
                        <p className="text-red-600 text-sm">{errors[name]}</p>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </>
        ) : null}
  
         <div className="flex justify-end gap-4 pt-4">

          <button
    type="submit"
    disabled={ loading || (isExistingClientForm ? !existingClientData : Object.keys(errors).some((key) => errors[key])) }

    className={`w-[150px] flex justify-center items-center bg-blue-600 text-white py-2 font-semibold rounded-md transition
        ${
            loading || (isExistingClientForm ? !existingClientData : Object.keys(errors).some((key) => errors[key]))
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-blue-700"
        }`
    }
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
            <path className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    ) : (
        "Create Lead"
    )}
          </button>
            </div>

            {isAlertVisible && (
                <div style={alertStyle}>
                    <span>{alertMessage}</span>
                </div>
            )}
        </form>
        
        {isPopupVisible && (
        <div
            style={
              popupMessage.includes("Please enter either mobile number or email") ||
              popupMessage.includes("There is no leads found for") ||
              popupMessage.includes("Mobile number must contain only 6 to 15 digits") ||
              popupMessage.includes("Please enter a valid email address") ||
              popupMessage.includes("Lead details not found") ||
              popupMessage.includes("Failed to load lead details")
                ? topPopupStyle
                : popupStyle
            }
        
        >
          <span>{popupMessage}</span>
          {popupMessage.includes("already exists") ? (
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setIsPopupVisible(false)}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#8d8b8bff",
                  borderRadius: "5px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveTriggerRef.current = true;
                  formRef.current?.requestSubmit();
                  setIsPopupVisible(false);
                }}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#34b352ff",
                  borderRadius: "10px",
                }}
              >
                Save Anyway
              </button>
            </div>
          ) : (
            <></> 
            
          )}
        </div>
       )}
    </div>
    );
   };
export default LeadForm;


