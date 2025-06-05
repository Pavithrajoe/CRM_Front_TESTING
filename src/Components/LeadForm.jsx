import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search } from "lucide-react";
const apiEndPoint = import.meta.env.VITE_API_URL;

const LeadForm = ({ onClose }) => {
  const token = localStorage.getItem("token");
  let userId = "";
  let company_id = "";

  // Decode JWT token to get user and company IDs
  if (token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      userId = payload.user_id;
      company_id = payload.company_id;
      // console.log("Logged in User ID:", userId, company_id);
    } catch (error) {
      console.error("Token decode error:", error);
    }
  } else {
    console.error("Invalid or missing JWT token");
  }

  // Initialize form state with default values
  const [form, setForm] = useState({
    iLeadpoten_id: "",
    ileadstatus_id: "",
    cindustry_id: "",
    lead_source_id: "",
    ino_employee: 0,
    clead_name: "",
    cemail: "",
    corganization: "",
    cwebsite: "",
    icity: "",
    iphone_no: "",
    cgender: 1,
    clogo: "logo.png",
    clead_address1: "",
    cwhatsapp: "",
    clead_address2: "",
    clead_address3: "",
    cstate: "",
    cdistrict: "",
    cpincode: "",
    ccountry: "",
    cservices: "No services entered",
    clead_owner: userId,
    clead_source: "",
    cresponded_by: userId,
    modified_by: userId,
  });

  // State variables for form validation errors and other UI states
  const [errors, setErrors] = useState({});
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [Potential, setPotential] = useState([]);
  const [status, setStatus] = useState([]);
  const [leadIndustry, setIndustry] = useState([]);
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

  // New states for searchable dropdowns
  const [searchPotential, setSearchPotential] = useState("");
  const [isPotentialDropdownOpen, setIsPotentialDropdownOpen] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [searchIndustry, setSearchIndustry] = useState("");
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [searchSource, setSearchSource] = useState("");
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

  const cityDropdownRef = useRef(null); // Ref for the city dropdown
  const potentialDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const industryDropdownRef = useRef(null);
  const sourceDropdownRef = useRef(null);

  // useEffect hook to fetch dropdown data on component mount
  const fetchDropdownData = useCallback(
    async (endpoint, setter, errorMessage, transform = (data) => data) => {
      try {
        const response = await fetch(`${apiEndPoint}/${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log(`Can't fetch ${errorMessage}`, response);
        }

        const rawData = await response.json();
        const processedData = transform(rawData); // Apply transformation
        setter(processedData);
      } catch (e) {
        console.log(`Error in fetching ${errorMessage}`, e);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchDropdownData("lead-potential", setPotential, "lead potential");
    fetchDropdownData("lead-status", setStatus, "lead status");
    fetchDropdownData("lead-industry", setIndustry, "lead industry");
    // For leadsource, assume it returns { data: [...] }
    fetchDropdownData("leadsource", setSource, "lead sources", (data) => data.data || []);
    fetchCitiesData(); // Fetch cities data
  }, [fetchDropdownData]);

  // Function to fetch cities data
  const fetchCitiesData = async () => {
    try {
      const response = await fetch(`${apiEndPoint}/city`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("city response:", response);

      if (!response.ok) {
        alert("Can't fetch cities, there was an error.");
        return;
      }

      const data = await response.json();
      // console.log("city data:", data);

      if (data && Array.isArray(data.cities)) {
        setCities(data.cities);
        setFilteredCities(data.cities); // Initialize filtered cities
      } else {
        // console.error("Invalid city data format:", data);
        alert("Invalid city data received.");
      }
    } catch (e) {
      console.log("Error in fetching cities:", e);
      alert("Error fetching cities.");
    }
  };

  // Function to handle city search input change
  const handleSearchCity = (e) => {
    const searchTerm = e.target.value; // Don't convert to lowercase yet, filter will handle it
    setSearchCity(searchTerm);
    const filtered = cities.filter((city) =>
      city.cCity_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCities(filtered);
    setIsCityDropdownOpen(true);

    // If the search term is cleared, also clear the selected city from the form
    if (!searchTerm) {
      setForm((prev) => ({ ...prev, icity: "" }));
      setErrors((prev) => ({ ...prev, icity: validateField("icity", "") }));
    }
  };

  // useEffect to fetch state, district, and country based on selected city
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
            // console.log(`Can't fetch details for city ID ${cityId}`, response);
            setForm((prev) => ({
              ...prev,
              cstate: "",
              cdistrict: "",
              ccountry: "",
            }));
            return;
          }

          const data = await response.json();
          // console.log(`City details for ID ${cityId}:`, data);
          if (data) {
            setForm((prev) => ({
              ...prev,
              cstate: data.state || "",
              cdistrict: data.district || "",
              ccountry: data.country || "",
              cpincode: data.cpincode || "", // Assuming pincode is in this response
            }));
          } else {
            setForm((prev) => ({
              ...prev,
              cstate: "",
              cdistrict: "",
              ccountry: "",
              cpincode: "",
            }));
          }
        } catch (error) {
          // console.error(`Error fetching details for city ID ${cityId}:`, error);
          setForm((prev) => ({
            ...prev,
            cstate: "",
            cdistrict: "",
            ccountry: "",
            cpincode: "",
          }));
        }
      } else {
        setForm((prev) => ({
          ...prev,
          cstate: "",
          cdistrict: "",
          ccountry: "",
          cpincode: "",
        }));
      }
    };

    if (form.icity) {
      fetchCityDetails(form.icity);
      const selectedCity = cities.find((city) => city.icity_id === form.icity);
      setSearchCity(selectedCity ? selectedCity.cCity_name : "");
    } else {
      setForm((prev) => ({
        ...prev,
        cstate: "",
        cdistrict: "",
        ccountry: "",
        cpincode: "",
      }));
      setSearchCity(""); // Clear search city if form.icity is cleared
    }
  }, [form.icity, token, cities]);

  // Handle clicks outside the dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
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
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target)) {
        setIsSourceDropdownOpen(false);
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
      (name === "iphone_no" || name === "whatsapp") &&
      value && // Only validate if there's a value
      !/^\d{10}$/.test(value)
    ) {
      error = "Must be exactly 10 digits";
    }
    if (name === "cemail") {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (value && !emailRegex.test(value)) {
        error = "Invalid email format";
      }
    }
    if (name === "cpincode" && value && !/^\d{6}$/.test(value)) {
      error = "Must be a 6-digit pincode";
    }
    if (name === "clead_name" && !value) {
      error = "Lead Name is required";
    }
    if (name === "corganization" && !value) {
      error = "Organization Name is required";
    }
    // Only require email if it's not empty, allowing it to be optional for now
    // if (name === "cemail" && !value) {
    //   error = "Email ID is required";
    // }
    if (name === "iphone_no" && !value) {
      error = "Mobile Number is required";
    }
    // if (name === "clead_address1" && value) {
    //   error = "Address 1 is required";
    // }
    if (name === "icity" && !value) {
      error = "City is required";
    }
    if (name === "iLeadpoten_id" && !value) {
      error = "Lead Potential is required";
    }
    if (name === "ileadstatus_id" && !value) {
      error = "Lead Status is required";
    }
    if (name === "cindustry_id" && !value) {
      error = "Industry is required";
    }
    if (name === "lead_source_id" && !value) {
      error = "Lead Source is required";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "iphone_no" && sameAsPhone) {
        updated.whatsapp = value;
        setErrors((prevErr) => ({
          ...prevErr,
          whatsapp: validateField("whatsapp", value),
        }));
      }
      return updated;
    });

    // Validate the changed field for basic format and required
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));

    // Handle changes to search inputs for dropdowns
    if (name === "searchCity") {
      handleSearchCity(e);
    } else if (name === "searchPotential") {
      setSearchPotential(value);
      setIsPotentialDropdownOpen(true);
      if (!value) {
        setForm((prev) => ({ ...prev, iLeadpoten_id: "" })); // Clear form value if search is cleared
        setErrors((prev) => ({ ...prev, iLeadpoten_id: validateField("iLeadpoten_id", "") }));
      }
    } else if (name === "searchStatus") {
      setSearchStatus(value);
      setIsStatusDropdownOpen(true);
      if (!value) {
        setForm((prev) => ({ ...prev, ileadstatus_id: "" }));
        setErrors((prev) => ({ ...prev, ileadstatus_id: validateField("ileadstatus_id", "") }));
      }
    } else if (name === "searchIndustry") {
      setSearchIndustry(value);
      setIsIndustryDropdownOpen(true);
      if (!value) {
        setForm((prev) => ({ ...prev, cindustry_id: "" }));
        setErrors((prev) => ({ ...prev, cindustry_id: validateField("cindustry_id", "") }));
      }
    } else if (name === "searchSource") {
      setSearchSource(value);
      setIsSourceDropdownOpen(true);
      if (!value) {
        setForm((prev) => ({ ...prev, lead_source_id: "" }));
        setErrors((prev) => ({ ...prev, lead_source_id: validateField("lead_source_id", "") }));
      }
    }
  };

  // Generic handler for selecting an item from a searchable dropdown
  const handleSelectDropdownItem = (
    fieldName,
    itemId,
    itemName,
    setSearchTerm,
    setIsDropdownOpen
  ) => {
    setForm((prev) => ({ ...prev, [fieldName]: itemId }));
    setSearchTerm(itemName); // Update the search input to display the selected name
    setIsDropdownOpen(false);
    setErrors((prev) => ({ ...prev, [fieldName]: undefined })); // Clear error on selection
  };

  const checkExisting = async (fieldName, value) => {
    // Only check if value is not empty and is a 10-digit number for phone/whatsapp
    if (!value || (fieldName !== "cemail" && !/^\d{10}$/.test(value))) return;
    // For email, check if it's a valid format before sending to API
    if (fieldName === "cemail" && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return;


    try {
      const response = await fetch(`${apiEndPoint}/check-existing-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          field: fieldName,
          value: value,
          company_id: company_id,
        }),
      });

      if (!response.ok) {
        //console.error(`Error checking existing ${fieldName}:`, response);
        // Do not return, allow the form to proceed if API check fails but field is valid
        return;
      }

      const data = await response.json();
      if (data.exists) {
        const message = `This ${fieldName
          .replace("iphone_no", "phone")
          .replace("whatsapp", "WhatsApp")
          .replace("cemail", "email")} already exists.`;
        setAlertMessage(message);
        setIsAlertVisible(true);
        setTimeout(() => {
          setIsAlertVisible(false);
        }, 3000);
        setErrors((prev) => ({ ...prev, [fieldName]: message }));
      } else {
        // Clear the specific "already exists" error if it was there and now it doesn't exist
        setErrors((prev) => {
          const newErrors = { ...prev };
          if (newErrors[fieldName]?.includes("already exists")) {
            newErrors[fieldName] = undefined;
          }
          // Re-validate to catch other format errors if applicable
          newErrors[fieldName] = validateField(fieldName, value) || newErrors[fieldName];
          return newErrors;
        });
      }
    } catch (error) {
      console.error(`Error checking existing ${fieldName}:`, error);
    }
  };

  // Removed checkExistingEmail as checkExisting is generic enough
  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Only perform existing checks for specific fields
    if (name === "iphone_no" || name === "whatsapp" || name === "cemail") {
      checkExisting(name, value);
    }
    // Also, re-validate the field on blur to show immediate errors
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  // Handle "Same as Phone" checkbox toggle
  const toggleSame = (e) => {
    const checked = e.target.checked;
    setSameAsPhone(checked);
    if (checked) {
      setForm((prev) => {
        const newWhatsapp = prev.iphone_no;
        setErrors((prevErr) => ({
          ...prevErr,
          whatsapp: validateField("whatsapp", newWhatsapp),
        }));
        return { ...prev, whatsapp: newWhatsapp };
      });
      // Optionally check if the phone number already exists and apply the error to WhatsApp as well
      if (errors.iphone_no && !errors.whatsapp) {
        setErrors((prev) => ({ ...prev, whatsapp: errors.iphone_no }));
      } else if (
        !errors.iphone_no &&
        errors.whatsapp === `This whatsapp number already exists.`
      ) {
        setErrors((prev) => ({ ...prev, whatsapp: undefined }));
      }
    } else {
      setForm((prev) => ({ ...prev, whatsapp: "" })); // Clear whatsapp if checkbox is unchecked
      setErrors((prev) => ({ ...prev, whatsapp: undefined })); // Clear whatsapp error
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      // Exclude fields that are read-only or not directly input by user for initial validation
      if (!["cstate", "cdistrict", "ccountry", "cservices", "clogo", "cgender", "clead_owner", "cresponded_by", "modified_by", "iproject_value", "clead_source"].includes(key)) {
        const error = validateField(key, form[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    // Explicitly check specific required fields if not already covered
    if (!form.clead_name) newErrors.clead_name = "Lead Name is required";
    if (!form.corganization) newErrors.corganization = "Organization Name is required";
    if (!form.iphone_no) newErrors.iphone_no = "Mobile Number is required";
    if (!form.clead_address1) newErrors.clead_address1 = "Address 1 is required";
    if (!form.icity) newErrors.icity = "City is required";
    if (!form.iLeadpoten_id) newErrors.iLeadpoten_id = "Lead Potential is required";
    if (!form.ileadstatus_id) newErrors.ileadstatus_id = "Lead Status is required";
    if (!form.cindustry_id) newErrors.cindustry_id = "Industry is required";
    if (!form.lead_source_id) newErrors.lead_source_id = "Lead Source is required";


    // Merge with existing errors to ensure `already exists` messages are preserved
    return { ...errors, ...newErrors };
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Run full form validation
    const validationErrors = validateForm();
    setErrors(validationErrors); // Update the error state immediately

    // Check if there are any errors (including existing and new validation errors)
    const hasErrors = Object.keys(validationErrors).some((key) => validationErrors[key]);

    if (hasErrors) {
      // Create a combined error message from all validation errors
      const combinedErrorMessages = Object.values(validationErrors).filter(Boolean).join(", ");
      setAlertMessage(`Please correct the following errors: ${combinedErrorMessages}`);
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
      }, 3000);
      setLoading(false);
      return;
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
        clead_city: Number(form.icity), // Ensure it's a number
        clead_name: form.clead_name,
        clead_owner: userId,
        clogo: "logo.png",
        corganization: form.corganization,
        cresponded_by: userId,
        ileadstatus_id: Number(form.ileadstatus_id),
        cindustry_id: Number(form.cindustry_id),
        iLeadpoten_id: Number(form.iLeadpoten_id),
        cwebsite: form.cwebsite,
        dmodified_dt: new Date().toISOString(),
        cservices: form.cservices,
        ino_employee: form.ino_employee ? Number(form.ino_employee) : 0,
        icity: Number(form.icity), // Ensure it's a number
        icompany_id: company_id,
        iphone_no: form.iphone_no,
        iproject_value: 0,
        modified_by: userId,
        iuser_tags: userId,
        lead_source_id: Number(form.lead_source_id), // Ensure it's a number
        whatsapp_number: form. whatsapp_number, // Include whatsapp number
      };

      // console.log("Form submitted:", formData);
      const res = await fetch(`${apiEndPoint}/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      // console.info("Server response:", resData);

      if (res.ok) {
        setPopupMessage("Lead created successfully!");
        setIsPopupVisible(true);
        setTimeout(() => {
          setIsPopupVisible(false);
          onClose(); // Close the form after successful submission
        }, 3000);
      } else {
        // Handle specific API errors if available, otherwise a generic one
        const errorMessage = resData.message || "Failed to create lead.";
        setPopupMessage(errorMessage);
        setIsPopupVisible(true);
        setTimeout(() => {
          setIsPopupVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setPopupMessage("Failed to create lead due to a network error.");
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredPotential = Potential.filter((item) =>
    item.clead_name.toLowerCase().includes(searchPotential.toLowerCase())
  );
  const filteredStatus = status.filter((item) =>
    item.clead_name.toLowerCase().includes(searchStatus.toLowerCase())
  );
  const filteredIndustry = leadIndustry.filter((item) =>
    item.cindustry_name.toLowerCase().includes(searchIndustry.toLowerCase())
  );
  const filteredSource = source.filter((item) =>
    item.source_name.toLowerCase().includes(searchSource.toLowerCase())
  );

  // console.log("source details:", source);
  const popupStyle = {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor:
      popupMessage.includes("Failed") || popupMessage.includes("Duplicate") ? "#dc3545" : "#28a745",
    color: "white",
    padding: "16px 24px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    zIndex: 50,
    opacity: 1,
    transition: "opacity 0.3s ease-in-out",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    color: "white",
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-start pt-10 z-50 overflow-y-auto hide-scrollbar">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-[95%] max-w-[1060px] rounded-2xl shadow-3xl p-6 space-y-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center">
          🚀 Let's Get Started - Create a New Lead
        </h2>

        {/* Customer Details */}
        <h3 className="text-lg font-semibold">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Lead Name", name: "clead_name", required: true },
            { label: "Organization Name", name: "corganization", required: true },
            { label: "E-mail ID", name: "cemail", required: false },
            { label: "Mobile Number", name: "iphone_no", required: true },
            { label: "WhatsApp Number", name: "whatsapp", required: false },
            { label: "Address 1", name: "clead_address1", required: false },
            { label: "Address 2", name: "clead_address2", required: false },
            { label: "Website", name: "cwebsite", required: false },
            {
              label: "City",
              name: "icity",
              type: "searchable-select-city",
              required: true,
            },
            { label: "Country", name: "ccountry", value: form.ccountry, readOnly: true },
            { label: "State", name: "cstate", value: form.cstate, readOnly: true },
            { label: "District", name: "cdistrict", value: form.cdistrict, readOnly: true },
            { label: "Pincode", name: "cpincode", required: false },
          ].map(({ label, name, required, type, value, readOnly }) => {
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
                      // onBlur will be handled by handleClickOutside
                    />
                    {isCityDropdownOpen && filteredCities.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                        {filteredCities.map((city) => (
                          <div
                            key={city.icity_id}
                            onMouseDown={(e) => e.preventDefault()} // Prevents input blur from closing dropdown
                            onClick={() => {
                              handleSelectDropdownItem(
                                "icity",
                                city.icity_id,
                                city.cCity_name,
                                setSearchCity, // Set searchCity to display selected name
                                setIsCityDropdownOpen
                              );
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {city.cCity_name}
                          </div>
                        ))}
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
                    onBlur={handleBlur} // Keep this for phone/email existence check
                    placeholder={`Enter ${label.toLowerCase()}`}
                    className="mt-1 w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={name === "whatsapp" && sameAsPhone}
                    readOnly={readOnly}
                  />
                  {errors[name] && (
                    <p className="text-red-600 text-sm">{errors[name]}</p>
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
            }
          })}
        </div>

        {/* Lead Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            },
          ].map(
            ({
              label,
              ref,
              inputName,
              searchValue,
              setSearch,
              open,
              setOpen,
              list,
              keyField,
              displayField,
              formField,
              error,
            }) => (
              <div className="flex flex-col relative" key={formField} ref={ref}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}:<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchValue}
                  onChange={(e) =>
                    handleChange({ target: { name: inputName, value: e.target.value } })
                  }
                  onFocus={() => setOpen(true)}
                  // onBlur handled by handleClickOutside
                />
                {open && list.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                    {list.map((item) => (
                      <div
                        key={item[keyField]}
                        onMouseDown={(e) => e.preventDefault()} // Prevents input blur from closing dropdown
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
                    ))}
                  </div>
                )}
                {error && <p className="text-red-600 text-sm">{error}</p>}
              </div>
            )
          )}
        </div>
        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || Object.keys(errors).some((key) => errors[key])}
            className={`w-[150px] flex justify-center items-center bg-blue-600 text-white py-2 font-semibold rounded-md hover:bg-blue-700 transition ${
              loading || Object.keys(errors).some((key) => errors[key])
                ? "opacity-70 cursor-not-allowed"
                : ""
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
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : (
              "Create Lead"
            )}
          </button>
        </div>

        {/* Validation Alert */}
        {isAlertVisible && (
          <div style={alertStyle}>
            <span>{alertMessage}</span>
          </div>
        )}

        {/* Popup Message */}
        {isPopupVisible && (
          <div style={popupStyle}>
            <span>{popupMessage}</span>
            <button onClick={() => setIsPopupVisible(false)} style={closeButtonStyle}>
              <X size={16} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default LeadForm;