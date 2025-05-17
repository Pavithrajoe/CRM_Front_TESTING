import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
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
      console.log("Logged in User ID:", userId, company_id);
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
    cwebsite: "www.com",
    icity: "", // Changed to empty string initially
    iphone_no: "",
    cgender: 1,
    clogo: "logo.png",
    clead_address1: "",
    whatsapp: "",
    clead_address2: "",
    clead_address3: "",
    cstate: "",
    cdistrict: "",
    cpincode: "",
    ccountry: "", // Added country to the form state
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
  const [, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');


  // useEffect hook to fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async (endpoint, setter, errorMessage) => {
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

        const data = await response.json();
        setter(data);
      } catch (e) {
        console.log(`Error in fetching ${errorMessage}`, e);
      }
    };

    fetchDropdownData("lead-potential", setPotential, "lead potential");
    fetchDropdownData("lead-status", setStatus, "lead status");
    fetchDropdownData("lead-industry", setIndustry, "lead industry");
    fetchSource();
    fetchCitiesData(); // Fetch cities data
  }, [token]);

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
      console.log("city response:", response);

      if (!response.ok) {
        alert("Can't fetch cities, there was an error.");
        return;
      }

      const data = await response.json();
      console.log("city data:", data);

      if (data && Array.isArray(data.cities)) {
        setCities(data.cities);
        setFilteredCities(data.cities); // Initialize filtered cities
      } else {
        console.error("Invalid city data format:", data);
        alert("Invalid city data received.");
      }
    } catch (e) {
      console.log("Error in fetching cities:", e);
      alert("Error fetching cities.");
    }
  };

  // Function to handle city search input change
  const handleSearchCity = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchCity(searchTerm);
    const filtered = cities.filter((city) =>
      city.cCity_name.toLowerCase().includes(searchTerm)
    );
    setFilteredCities(filtered);
    setIsCityDropdownOpen(true);
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
            console.log(`Can't fetch details for city ID ${cityId}`, response);
            setForm((prev) => ({ ...prev, cstate: "", cdistrict: "", ccountry: "" }));
            return;
          }

          const data = await response.json();
          console.log(`City details for ID ${cityId}:`, data);
          if (data) {
            setForm((prev) => ({
              ...prev,
              cstate: data.state || "",
              cdistrict: data.district || "",
              ccountry: data.country || "",
            }));
          } else {
            setForm((prev) => ({ ...prev, cstate: "", cdistrict: "", ccountry: "" }));
          }
        } catch (error) {
          console.error(`Error fetching details for city ID ${cityId}:`, error);
          setForm((prev) => ({ ...prev, cstate: "", cdistrict: "", ccountry: "" }));
        }
      } else {
        setForm((prev) => ({ ...prev, cstate: "", cdistrict: "", ccountry: "" }));
      }
    };

    if (form.icity) {
      fetchCityDetails(form.icity);
      const selectedCity = cities.find((city) => city.icity_id === form.icity);
      setSearchCity(selectedCity ? selectedCity.cCity_name : "");
      setIsCityDropdownOpen(false);
    } else {
      setForm((prev) => ({ ...prev, cstate: "", cdistrict: "", ccountry: "" }));
      setSearchCity("");
      setIsCityDropdownOpen(false);
    }
  }, [form.icity, token, cities]);

  const validateField = (name, value) => {
    let error = "";
    if ((name === "iphone_no" || name === "whatsapp") && !/^\d{10}$/.test(value)) {
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
    if (name === "cemail" && !value) {
      error = "Email ID is required";
    }
    if (name === "iphone_no" && !value) {
      error = "Mobile Number is required";
    }
    if (name === "clead_address1" && !value) {
      error = "Address 1 is required";
    }
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

    // Validate the changed field for basic format
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));

    // Clear dependent fields when city changes
    if (name === "icity") {
      const selectedCity = cities.find((city) => city.icity_id === value);
      setSearchCity(selectedCity ? selectedCity.cCity_name : "");
      setForm((prev) => ({ ...prev, icity: value, cstate: "", cdistrict: "", cpincode: "", ccountry: "" }));
      setDistricts([]);
      setIsCityDropdownOpen(false);
    } else if (name === "searchCity") {
      // Handle changes to the search input
      const searchTerm = value.toLowerCase();
      setSearchCity(value);
      const filtered = cities.filter((city) =>
        city.cCity_name.toLowerCase().includes(searchTerm)
      );
      setFilteredCities(filtered);
      setIsCityDropdownOpen(true);
      // If the search input is cleared, reset the icity
      if (!value) {
        setForm((prev) => ({ ...prev, icity: "" }));
      }
    }
  };

  const checkExisting = async (fieldName, value) => {
    if (!value) return;

    try {
      const response = await fetch(`${apiEndPoint}/check-existing-lead`, { // Replace with your actual API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ field: fieldName, value: value, company_id: company_id }),
      });

      if (!response.ok) {
        console.error(`Error checking existing ${fieldName}:`, response);
        return;
      }

      const data = await response.json();
      if (data.exists) {
        const message = `This ${fieldName.replace('iphone_no', 'phone').replace('whatsapp', 'WhatsApp')} number already exists.`;
        setAlertMessage(message);
        setIsAlertVisible(true);
        setTimeout(() => {
          setIsAlertVisible(false);
        }, 3000);
        setErrors(prev => ({ ...prev, [fieldName]: message }));
      } else {
        setErrors(prev => ({ ...prev, [fieldName]: errors[fieldName] === `This ${fieldName.replace('iphone_no', 'phone').replace('whatsapp', 'WhatsApp')} number already exists.` ? undefined : errors[fieldName] }));
      }
    } catch (error) {
      console.error(`Error checking existing ${fieldName}:`, error);
    }
  };

  const checkExistingEmail = async (email) => {
    if (!email) return;

    try {
      const response = await fetch(`${apiEndPoint}/check-existing-lead`, { // Replace with your actual API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ field: "cemail", value: email, company_id: company_id }),
      });

      if (!response.ok) {
        console.error("Error checking existing email:", response);
        return;
      }

      const data = await response.json();
      if (data.exists) {
        setAlertMessage("This email address already exists.");
        setIsAlertVisible(true);
        setTimeout(() => {
          setIsAlertVisible(false);
        }, 3000);
        setErrors(prev => ({ ...prev, cemail: "This email address already exists." }));
      } else {
        setErrors(prev => ({ ...prev, cemail: errors.cemail === "This email address already exists." ? undefined : errors.cemail }));
      }
    } catch (error) {
      console.error("Error checking existing email:", error);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "iphone_no" || name === "whatsapp") {
      checkExisting(name, value);
    } else if (name === "cemail") {
      checkExistingEmail(value);
    }
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
        setErrors(prev => ({ ...prev, whatsapp: errors.iphone_no }));
      } else if (!errors.iphone_no && errors.whatsapp === `This whatsapp number already exists.`) {
        setErrors(prev => ({ ...prev, whatsapp: undefined }));
      }
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};
    Object.entries(form).forEach(([key, value]) => {
      console.log("form data", form);
      // Basic required field validation
      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
      }
    });
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const validationErrors = validateForm();

    // Check for existing email or phone errors first
    if (errors.cemail?.includes("already exists")) {
      setAlertMessage(errors.cemail);
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
      }, 3000);
      setLoading(false);
      return;
    }
    if (errors.iphone_no?.includes("already exists")) {
      setAlertMessage(errors.iphone_no);
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
      }, 3000);
      setLoading(false);
      return;
    }
    if (errors.whatsapp?.includes("already exists")) {
      setAlertMessage(errors.whatsapp);
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
      }, 3000);
      setLoading(false);
      return;
    }

    // If no existing email/phone errors, check for other validation errors
    if (Object.keys(validationErrors).length > 0) {
      // Create a combined error message
      const allErrors = Object.values(validationErrors).join(", ");
      setAlertMessage(`Please correct the following errors: ${allErrors}`);
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
      }, 3000);
      setErrors(validationErrors); // Update the error state to show individual field errors
      setLoadingreturn;
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
        iLeadpoten_id: Number(form.iLeadpoten_id),
        cwebsite: form.cwebsite,
        dmodified_dt: new Date().toISOString(),
        cservices: form.cservices,
        ino_employee: form.ino_employee ? Number(form.ino_employee) : 0,
        icity: Number(form.icity),
        icompany_id: company_id,
        iphone_no: form.iphone_no,
        iproject_value: 0,
        modified_by: userId,
        iuser_tags: userId,
        lead_source_id: Number(form.lead_source_id),
      };

      console.log("Form submitted:", formData);
      const res = await fetch(`${apiEndPoint}/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      console.info("Server response:", resData);

      if (res.ok) {
        setPopupMessage("Lead created successfully!");
        setIsPopupVisible(true);
        setTimeout(() => {
          setIsPopupVisible(false);
          onClose();
        }, 3000);
      } else {
        setPopupMessage(`Failed to create lead`);
        setIsPopupVisible(true);
        setTimeout(() => {
          setIsPopupVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setPopupMessage("Failed to create lead.");
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch lead sources
  const fetchSource = async () => {
    try {
      const response = await fetch(`${apiEndPoint}/leadsource`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("source response:", response);

      if (!response.ok) {
        alert("Can't fetch lead sources, there was an error.");
        return;
      }

      const data = await response.json();
      console.log("source data:", data);

      // Access the 'data' array from// the response
      if (data && Array.isArray(data.data)) {
        setSource(data.data);
      } else {
        console.error("Invalid lead source data format:", data);
        alert("Invalid lead source data received.");
      }
    } catch (e) {
      console.log("Error in fetching lead sources:", e);
      alert("Error fetching lead sources.");
    }
  };

  console.log("source details:", source);
  const popupStyle = {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: popupMessage.includes("Failed") ? '#dc3545' : '#28a745',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 50,
    opacity: 1,
    transition: 'opacity 0.3s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1em',
    cursor: 'pointer',
    marginLeft: '16px',
  };

  const alertStyle = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 50,
    opacity: 1,
    transition: 'opacity 0.3s ease-in-out',
    textAlign: 'center',
  };

  return (
    <div className="relative inset-0 bg-blur flex justify-center items-start pt-10 overflow-y-hiddden z-50">
      <form
        onSubmit={handleSubmit}
        className="relative bg-transparent w-[95%] max-w-[1060px] rounded-2xl shadow-3xl p-2 space-y-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-center">🚀 Let's Get Started - Create a New Lead</h2>

        {/* Customer Details Section */}
        <h3 className="text-lg font-semibold">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Lead Name", name: "clead_name", required: true },
            { label: "Organization Name", name: "corganization", required: true },
            { label: "E-mail ID", name: "cemail", required: true },
            { label: "Mobile Number", name: "iphone_no", required: true },
            { label: "WhatsApp Number", name: "whatsapp", required: false },
            { label: "Address 1", name: "clead_address1", required: true },
            { label: "Address 2", name: "clead_address2", required: false },
            { label: "Address 3", name: "clead_address3", required: false },
            {
              label: "City",
              name: "searchCity", // Changed name to searchCity to control the input
              type: "searchable-select",
              options: filteredCities.map((city) => ({ value: city.icity_id, label: city.cCity_name })),
              required: true,
              value: cities.find(c => c.icity_id === form.icity)?.cCity_name || "", // Display selected city name
            },
            {
              label: "Country",
              name: "ccountry",
              value: form.ccountry,
              readOnly: true,
            },
            {
              label: "State",
              name: "cstate",
              value: form.cstate,
              readOnly: true,
            },
            {
              label: "District",
              name: "cdistrict",
              value: form.cdistrict,
              readOnly: true,
            },

            { label: "Pincode", name: "cpincode", required: false },
          ].map(({ label, name, required, type, options, value, readOnly }) => (
            <div key={name}>
              <label className="text-sm font-medium">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              {type === "searchable-select" ? (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search ${label.toLowerCase()}`}
                    className="mt-1 w-full border px-3 py-2 rounded"
                    value={searchCity} // Use searchCity state
                    onChange={handleChange} // Handle search input changes
                    onFocus={() => setIsCityDropdownOpen(true)}
                  />
                  {isCityDropdownOpen && filteredCities.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <div
                          key={city.icity_id}
                          onClick={() => {
                            setForm({ ...form, icity: city.icity_id });
                            setSearchCity(city.cCity_name);
                            setIsCityDropdownOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {city.cCity_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  name={name}
                  value={value !== undefined ? value : form[name]}
                  onChange={handleChange}
                  onBlur={handleBlur} // Added onBlur for checking existing
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="mt-1 w-full border px-3 py-2 rounded"
                  disabled={name === "whatsapp" && sameAsPhone}
                  readOnly={readOnly}
                />
              )}
              {errors[name] && <p className="text-red-600 text-sm">{errors[name]}</p>}
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
          ))}
        </div>

        {/* Lead Details Section */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="h-10 p-2 block text-sm font-medium text-gray-700 mb-1">Lead potential:</label>
            <select
              name="iLeadpoten_id"
              value={form.iLeadpoten_id}
              onChange={handleChange}
              className="p-2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition h-10 w-60"
            >
              <option value="">select potential </option>
              {Potential.map((poten) => (
                <option key={poten.ileadpoten_id} value={poten.ileadpoten_id}>
                  {poten.clead_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="h-10 p-2 block text-sm font-medium text-gray-700 mb-1">Lead status:</label>
            <select
              name="ileadstatus_id"
              value={form.ileadstatus_id}
              onChange={handleChange}
              className="p-2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition h-10 w-60"
            >
              <option value="">lead status</option>
              {status.map((sts) => (
                <option key={sts.ilead_status_id} value={sts.ilead_status_id}>
                  {sts.clead_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="h-10 p-2 block text-sm font-medium text-gray-700 mb-1">Industry:</label>
            <select
              name="cindustry_id"
              value={form.cindustry_id}
              onChange={handleChange}
              className="p-2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition h-10 w-60"
            >
              <option value="">Industry</option>
              {leadIndustry.map((lIndustry) => (
                <option key={lIndustry.iindustry_id} value={lIndustry.iindustry_id}>
                  {lIndustry.cindustry_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="p-2 h-10 block text-sm font-medium text-gray-700 mb-1">Lead source:</label>
            <select
              name="lead_source_id" // Corrected name to match form state
              value={form.lead_source_id}
              onChange={handleChange}
              className="p-2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition h-10 w-60"
            >
              <option value="">lead source</option>
              {source && source.map((src) => ( // Map through the fetched source data
                <option key={src.source_id} value={src.source_id}>
                  {src.source_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          {/* <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
          >
            Save as Draft
          </button> */}
          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(errors).some(key => errors[key])}
            className={`w-[150px] flex justify-center items-center bg-black text-white py-2 font-semibold rounded-md hover:bg-gray-900 ${
              loading || Object.keys(errors).some(key => errors[key]) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              'Create Lead'
            )}
          </button>
        </div>
      </form>

      {/* Alert Message for Validation Errors */}
      {isAlertVisible && (
        <div style={alertStyle}>
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Alert Popup Message for Success/Failure */}
      {isPopupVisible && (
        <div style={popupStyle}>
          <span>{popupMessage}</span>
          <button onClick={() => setIsPopupVisible(false)} style={closeButtonStyle}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadForm;