import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ENDPOINTS } from "../api/constraints";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';

import { getNames, getCodes } from 'country-list';

const RequestDemo = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    work_email: "",
    role: "",
    countryCode: "IN", // Default to India (ISO code)
    phoneNumberLocal: "", // Changed to store only the local part of the phone number
    extra_message: "",
    marketing_opt_in: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [countriesData, setCountriesData] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState(null);

  // --- Fetch All Country Details from REST Countries API ---
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const response = await fetch("https://restcountries.com/v3.1/all?fields=cca2,name,flags,idd");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const processedCountries = data
          .map(country => {
            const countryName = country.name?.common || "Unknown Country";
            const countryCode = country.cca2;
            const dialingCode = country.idd?.root && country.idd.suffixes && country.idd.suffixes.length > 0 ?
              `${country.idd.root}${country.idd.suffixes[0]}` :
              'N/A';

            return {
              code: countryCode,
              name: countryName,
              dialingCode: dialingCode,
            };
          })
          .filter(country => country.dialingCode !== '-') // Filter out countries without dialing codes
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountriesData(processedCountries);

        // No need to pre-fill phoneNumberLocal here, it starts empty
        // The countryCode default remains.
      } catch (error) {
        console.error("Error fetching country data:", error);
        setCountriesError("Failed to load country list. Please try again later.");
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // --- Memoized Country Options for Dropdown ---
  const allCountryOptions = useMemo(() => {
    if (countriesLoading || countriesData.length === 0) {
      const countryNames = getNames();
      const countryCodes = getCodes();
      const fallbackCallingCodes = {
        "US": "+1", "CA": "+1", "IN": "+91", "GB": "+44", "AU": "+61",
      };
      return countryCodes.map((code) => ({
        code: code,
        name: countryNames[countryCodes.indexOf(code)] || code,
        dialingCode: fallbackCallingCodes[code] || 'N/A'
      })).filter(country => country.dialingCode !== 'N/A')
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return countriesData; // countriesData is already processed
  }, [countriesData, countriesLoading]);

  // Find the currently selected country's dialing code and details
  const selectedCountryDetails = useMemo(() => {
    return allCountryOptions.find(
      (country) => country.code === formData.countryCode
    ) || null;
  }, [formData.countryCode, allCountryOptions]);

  // Validation rules
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Unified validation function for form fields
  const validateField = useCallback((name, value, currentFormData) => {
    switch (name) {
      case "full_name":
        if (!value.trim()) return "Full name is required.";
        if (!nameRegex.test(value.trim())) return "Full name must be 2-50 alphabetic characters and spaces only.";
        return "";
      case "work_email":
        if (!value.trim()) return "Work email is required.";
        if (!emailRegex.test(value.trim())) return "Please enter a valid email address (e.g., example@domain.com).";
        return "";
      case "role":
        if (!value) return "Role is required.";
        return "";
      case "phoneNumberLocal": // Validation for the local part
      case "countryCode": // Validate phone_number and countryCode together
        {
          const localNumber = name === "phoneNumberLocal" ? value : currentFormData.phoneNumberLocal;
          const countryToValidate = name === "countryCode" ? value : currentFormData.countryCode;

          if (!localNumber.trim()) {
            return "Phone number is required.";
          }
          if (!countryToValidate) {
            return "Country must be selected for phone validation.";
          }

          try {
            // parsePhoneNumber expects the number *without* the dialing code,
            // as the dialing code is inferred from the country code.
            const phoneNumber = parsePhoneNumber(localNumber.trim(), countryToValidate);

            if (!phoneNumber || !phoneNumber.isValid()) {
              if (phoneNumber && !phoneNumber.isPossible()) {
                  return `Phone number is too short or invalid for ${selectedCountryDetails?.name || countryToValidate}.`;
              }
              return `Invalid phone number for ${selectedCountryDetails?.name || countryToValidate}.`;
            }

            // Strict digit check for India
            if (countryToValidate === "IN" && phoneNumber.nationalNumber.length !== 10) {
                return "Indian phone number must be 10 digits.";
            }
            // Add similar strict digit checks for other countries if needed
            // For example, US/Canada numbers are 10 digits after +1
            // if (countryToValidate === "US" && phoneNumber.nationalNumber.length !== 10) {
            //     return "US phone number must be 10 digits.";
            // }

          } catch (error) {
            console.error("Phone validation error:", error);
            // Catch errors from parsePhoneNumber itself (e.g., invalid country code format)
            return `Invalid phone number or country selection.`;
          }
          return "";
        }
      case "extra_message":
        if (value.length > 500) return "Message should be less than 500 characters.";
        return "";
      default:
        return "";
    }
  }, [nameRegex, emailRegex, selectedCountryDetails]); // selectedCountryDetails added to dependencies

  // Handles input and select changes, performing immediate validation
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    let updatedFormData = { ...formData };

    if (name === "countryCode") {
      updatedFormData.countryCode = newValue;
      // When country code changes, clear the local number part
      updatedFormData.phoneNumberLocal = "";
    } else if (name === "phoneNumberLocal") {
      // Only allow digits in the phone number local part
      const digitsOnly = newValue.replace(/\D/g, '');

      // Use AsYouType for live formatting as the user types the local number
      try {
        const asYouType = new AsYouType(updatedFormData.countryCode);
        const formatted = asYouType.input(digitsOnly);
        updatedFormData.phoneNumberLocal = formatted;
      } catch (e) {
        console.warn("AsYouType formatting error:", e);
        updatedFormData.phoneNumberLocal = digitsOnly; // Fallback
      }
    } else {
      updatedFormData = { ...formData, [name]: newValue };
    }

    setFormData(updatedFormData);

    // Then, validate the changed field using the updated form data
    // For phone validation, we re-validate both phoneNumberLocal and countryCode
    const newErrors = {};
    if (name === "phoneNumberLocal" || name === "countryCode") {
      newErrors.phoneNumberLocal = validateField("phoneNumberLocal", updatedFormData.phoneNumberLocal, updatedFormData);
      newErrors.countryCode = validateField("countryCode", updatedFormData.countryCode, updatedFormData);
    } else {
      newErrors[name] = validateField(name, updatedFormData[name], updatedFormData);
    }

    setValidationErrors((prev) => ({
      ...prev,
      ...newErrors,
    }));
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessPopup(false);

    const errors = {};
    let formIsValid = true;

    // Validate all required fields
    const fieldsToValidate = ["full_name", "work_email", "role", "countryCode", "phoneNumberLocal", "extra_message"];
    for (const key of fieldsToValidate) {
      const error = validateField(key, formData[key], formData);
      if (error) {
        errors[key] = error;
        formIsValid = false;
      }
    }

    setValidationErrors(errors);

    if (!formIsValid) {
      setLoading(false);
      return;
    }

    try {
      // Use parsePhoneNumber with the local part and country code
      const phoneNumberObj = parsePhoneNumber(formData.phoneNumberLocal.trim(), formData.countryCode);

      if (!phoneNumberObj || !phoneNumberObj.isValid()) {
        throw new Error('Invalid phone number provided. Please check the number and country.');
      }

      const formattedPhoneNumber = phoneNumberObj.format('E.164'); // Format to international E.164 standard

      const response = await fetch(ENDPOINTS.DEMO_REQUEST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",   
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          work_email: formData.work_email.trim(),
          role: formData.role,
          phone_number: formattedPhoneNumber, // Send the E.164 formatted number
          country_code: formData.countryCode, // Also send the selected ISO country code
          extra_message: formData.extra_message.trim(),
          marketing_opt_in: formData.marketing_opt_in,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Network response was not ok");
      }

      setSuccessPopup(true);
      setFormData({
        full_name: "",
        work_email: "",
        role: "",
        countryCode: "IN", // Reset to default India
        phoneNumberLocal: "", // Clear local number
        extra_message: "",
        marketing_opt_in: false,
      });
      setValidationErrors({});
    } catch (generalError) {
      console.error("Error submitting demo request:", generalError);
      alert("Error submitting demo request: " + generalError.message);
    } finally {
      setLoading(false);
    }
  };

  if (countriesLoading) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center">
        <p className="text-gray-700 text-lg">Loading country data...</p>
      </div>
    );
  }

  if (countriesError) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center flex-col p-4">
        <p className="text-red-500 text-lg">Error: {countriesError}</p>
        <p className="text-gray-500 text-sm mt-2">Could not load the list of countries. Please check your internet connection or try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white/70 backdrop-blur-md rounded-[28px] shadow-xl flex flex-col md:flex-row w-full max-w-6xl overflow-hidden border border-gray-100">
        {/* Left Panel - unchanged */}
        <div className="w-full md:w-3/4 p-10 flex flex-col justify-between">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
              Request a Demo
            </h2>
            <p className="text-gray-500 text-base mb-6 max-w-md mx-auto">
              Explore how our product can elevate your business. Get a personalized walkthrough.
            </p>
            <ul className="space-y-3 text-left max-w-md mx-auto text-gray-700 text-[15px]">
              {[
                "Learn more about our products",
                "Get your questions answered",
                "We'll help you get started",
              ].map((text, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✔️</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center mb-6">
            <img
              src="/public/illustrations/Demo-bro.svg"
              alt="Demo Preview"
              className="max-h-40 object-contain"
            />
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 font-medium mb-4">Follow us on</p>
            <div className="flex justify-center gap-6 text-[20px] text-gray-400">
              <a href="https://www.linkedin.com/company/inklidox-technologies-private-limited/?trk=public_post_follow-view-profile"
                target="_blank" rel="noopener noreferrer">
                <FaLinkedinIn className="hover:text-blue-700 transition-all duration-150" />
              </a>
              <a href="https://www.instagram.com/inklidox_technologies/?igsh=M3F3eThuZDY2NzR5#"
                target="_blank" rel="noopener noreferrer">
                <FaInstagram className="hover:text-pink-500 transition-all duration-150" />
              </a>
              <a href="https://www.youtube.com/@InklidoxTechnologies"
                target="_blank" rel="noopener noreferrer">
                <FaYoutube className="hover:text-red-600 transition-all duration-150" />
              </a>
              <a href="https://x.com/inklidox"
                target="_blank" rel="noopener noreferrer">
                <FaXTwitter className="hover:text-gray-900 transition-all duration-150" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full md:w-3/4 p-8 md:p-12 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5 text-[15px]">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                maxLength={50}
                required
                className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.full_name ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
                placeholder="Your full name"
              />
              {validationErrors.full_name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.full_name}</p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Work Email *</label>
                <input
                  type="email"
                  name="work_email"
                  value={formData.work_email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.work_email ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
                  placeholder="Your business email"
                />
                {validationErrors.work_email && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.work_email}</p>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.role ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
                >
                  <option value="">Select...</option>
                  <option value="Developer">Developer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Executive">Executive</option>
                  <option value="Others">Others</option>
                </select>
                {validationErrors.role && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.role}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Phone Number *</label>
              <div className="flex w-full items-center">
                {/* Country Code Dropdown */}
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  // Adjusted width for the country code dropdown
                  className={`px-3 py-3 h-11 bg-[#f9f9f9] border ${validationErrors.countryCode ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all
                  ${formData.countryCode ? 'w-[85px]' : 'w-[150px]'} rounded-l-xl overflow-hidden appearance-none pr-8 text-ellipsis whitespace-nowrap`}
                  style={{ backgroundImage: 'none' }} // Hide default dropdown arrow
                >
                  {countriesLoading && <option value="">Loading...</option>}
                  {countriesError && <option value="">Error</option>}
                  {!countriesLoading && !countriesError && (
                    <>
                      {!formData.countryCode && <option value="">Select Country</option>}
                      {allCountryOptions.map((country) => (
                        <option key={country.code} value={country.code}>
                          {formData.countryCode === country.code
                            ? country.dialingCode // Show only dialing code when selected
                            : `${country.name} (${country.dialingCode})` // Show name and code in dropdown
                          }
                        </option>
                      ))}
                    </>
                  )}
                </select>
                 {/* Custom dropdown arrow to replace the native one */}
                 <div className="relative -ml-6 pointer-events-none z-10">
                    <svg className="fill-current h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>

                {/* Phone Number Local Part Input */}
                <input
                  type="tel"
                  name="phoneNumberLocal" // Changed name to reflect local part
                  value={formData.phoneNumberLocal}
                  onChange={handleChange}
                  required
                  className={`flex-grow px-4 py-3 h-11 rounded-r-xl bg-[#f9f9f9] border ${validationErrors.phoneNumberLocal ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
                  placeholder="e.g., 9876543210"
                />
              </div>
              {/* Display validation error for either phoneNumberLocal or countryCode */}
              {(validationErrors.phoneNumberLocal || validationErrors.countryCode) && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.phoneNumberLocal || validationErrors.countryCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Anything Else?</label>
              <textarea
                name="extra_message"
                value={formData.extra_message}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.extra_message ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all resize-none`}
                placeholder="Tell us more about your project"
              ></textarea>
              {validationErrors.extra_message && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.extra_message}</p>
              )}
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                name="marketing_opt_in"
                checked={formData.marketing_opt_in}
                onChange={handleChange}
                className="mt-1"
              />
              <label>
                Yes, I’d like to receive marketing communications. I can unsubscribe at any time.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || countriesLoading}
              className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
                loading || countriesLoading
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#007aff] text-white hover:bg-[#005bb5]"
              }`}
            >
              {loading ? "Submitting..." : "Request Demo"}
            </button>
          </form>

          {successPopup && (
            <div className="mt-6 text-green-700 bg-green-100 border border-green-300 p-4 rounded-xl shadow-sm">
              🎉 Your demo request was successfully submitted! Our team will contact you shortly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDemo;

// import React, { useState, useEffect, useMemo } from "react";
// import { ENDPOINTS } from "../api/constraints";
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaYoutube,
//   FaLinkedinIn,
// } from "react-icons/fa";
// import { FaXTwitter } from "react-icons/fa6"; 

// import { parsePhoneNumber } from 'libphonenumber-js';

// import { getNames, getCodes } from 'country-list';

// const RequestDemo = () => {
//   const [formData, setFormData] = useState({
//     full_name: "",
//     work_email: "",
//     role: "",
//     countryCode: "IN",
//     phone_number: "",
//     extra_message: "",
//     marketing_opt_in: false,
//   });

//   const [validationErrors, setValidationErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [successPopup, setSuccessPopup] = useState(false);
//   const [countriesData, setCountriesData] = useState([]); 
//   const [countriesLoading, setCountriesLoading] = useState(true); 
//   const [countriesError, setCountriesError] = useState(null);

//   useEffect(() => {
//     const fetchCountries = async () => {
//       try {
//         setCountriesLoading(true);
//         const response = await fetch("https://restcountries.com/v3.1/all?fields=cca2,name,flags,capital,idd,altSpellings");
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();

//         const processedCountries = data
//           .map(country => {
//             const countryName = country.name?.common || "Unknown Country";
//             const countryCode = country.cca2;
//             const dialingCode = country.idd?.root && country.idd.suffixes && country.idd.suffixes.length > 0 ?
//                                 `${country.idd.root}${country.idd.suffixes[0]}` :
//                                 'N/A'; 

//             return {
//               code: countryCode,
//               name: countryName,
//               dialingCode: dialingCode, 
//               flag: country.flags?.png || country.flags?.svg || '',
//               capital: country.capital?.[0] || 'N/A',
//             };
//           })
//           .sort((a, b) => a.name.localeCompare(b.name));

//         setCountriesData(processedCountries);
//         if (processedCountries.length > 0 && !processedCountries.some(c => c.code === formData.countryCode)) {
//              setFormData(prev => ({ ...prev, countryCode: processedCountries[0].code }));
//         }
//       } catch (error) {
//         console.error("Error fetching country data:", error);
//         setCountriesError("Failed to load country list. Please try again later.");
//       } finally {
//         setCountriesLoading(false);
//       }
//     };

//     fetchCountries();
//   }, []); 
//   const allCountryOptions = useMemo(() => {
//     if (countriesLoading || countriesData.length === 0) {
//         const countryNames = getNames();
//         const countryCodes = getCodes();
//         const fallbackCallingCodes = {
//           "US": "+1", "CA": "+1", "IN": "+91", "GB": "+44", "AU": "+61",
//         };
//         return countryCodes.map((code) => ({
//             code: code,
//             name: `${countryNames[countryCodes.indexOf(code)] || code} (${fallbackCallingCodes[code] || 'N/A'})`,
//             dialingCode: fallbackCallingCodes[code] || 'N/A' 
//         })).sort((a, b) => a.name.localeCompare(b.name));
//     }

//     return countriesData.map(country => ({
//       code: country.code,
//       name: country.name, 
//       dialingCode: country.dialingCode, 
//       flag: country.flag, 
//       capital: country.capital,
//     }));
//   }, [countriesData, countriesLoading]);
//   const nameRegex = /^[A-Za-z\s]{2,50}$/;
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; 

//   const validateField = (name, value, currentFormData) => {
//     switch (name) {
//       case "full_name":
//         if (!value.trim()) {
//           return "Full name is required.";
//         }
//         if (!nameRegex.test(value.trim())) {
//           return "Full name must be 2-50 alphabetic characters and spaces only.";
//         }
//         return ""; // No error
//       case "work_email":
//         if (!value.trim()) {
//           return "Work email is required.";
//         }
//         if (!emailRegex.test(value.trim())) {
//           return "Please enter a valid email address (e.g., example@domain.com).";
//         }
//         return "";
//       case "role":
//         if (!value) {
//           return "Role is required.";
//         }
//         return ""; 
// case "phone_number":
// case "countryCode": {
//   const numberToValidate = name === "phone_number" ? value : currentFormData.phone_number;
//   const countryToValidate = name === "countryCode" ? value : currentFormData.countryCode;

//   if (!numberToValidate.trim()) {
//     return "Phone number is required.";
//   }

//   if (!countryToValidate) {
//     return "Country must be selected for phone validation.";
//   }

//   const cleanedNumber = numberToValidate.trim();

//   const isValid = /^\d{10}$/.test(cleanedNumber);
//   if (!isValid) {
//     return "Phone number must be exactly 10 digits.";
//   }

//   try {
//     const phoneNumber = parsePhoneNumber(numberToValidate.trim(), countryToValidate);

//     if (!phoneNumber || !phoneNumber.isValid()) {
//       return `Invalid phone number for ${countryToValidate}.`;
//     }

//   } catch (error) {
//     console.error("Phone validation error:", error); 
//     return `Invalid phone number or country selection.`;
//   }
//   return ""; 
// }
//       case "extra_message":
//         if (value.length > 500) {
//           return "Message should be less than 500 characters.";
//         }
//         return ""; 
//       default:
//         return ""; 
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     const newValue = type === "checkbox" ? checked : value;

//     const updatedFormData = {
//       ...formData,
//       [name]: newValue,
//     };
//     setFormData(updatedFormData);

//     const errorMessage = validateField(name, newValue, updatedFormData);
//     setValidationErrors((prev) => ({
//       ...prev,
//       [name]: errorMessage,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setSuccessPopup(false); 

//     const errors = {};
//     let formIsValid = true;

//     const fieldsToValidate = ["full_name", "work_email", "role", "countryCode", "phone_number", "extra_message"];
//     for (const key of fieldsToValidate) {
//         const error = validateField(key, formData[key], formData);
//         if (error) {
//             errors[key] = error;
//             formIsValid = false;
//         }
//     }

//     setValidationErrors(errors); 

//     if (!formIsValid) {
//       setLoading(false); 
//       return; 
//     }

//     try {
//       let formattedPhoneNumber = formData.phone_number.trim();
//       try {
//         const phoneNumberObj = parsePhoneNumber(formData.phone_number.trim(), formData.countryCode);
//         if (phoneNumberObj && phoneNumberObj.isValid()) {
//           formattedPhoneNumber = phoneNumberObj.format('E.164'); 
//         } else {
//             throw new Error('Invalid phone number provided. Please check the number and country.');
//         }
//       } catch (submissionPhoneError) {
//         setLoading(false);
//         alert('Phone number processing error: ' + submissionPhoneError.message);
//         return; 
//       }

//       const response = await fetch(ENDPOINTS.DEMO_REQUEST, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           full_name: formData.full_name.trim(),
//           work_email: formData.work_email.trim(),
//           role: formData.role,
//           phone_number: formattedPhoneNumber, 
//           country_code: formData.countryCode, // Also send the selected ISO country code
//           extra_message: formData.extra_message.trim(),
//           marketing_opt_in: formData.marketing_opt_in,
//         }),
//       });

//       // Handle non-OK HTTP responses
//       if (!response.ok) {
//         const errorData = await response.json(); // Attempt to parse error message from body
//         throw new Error(errorData.message || "Network response was not ok");
//       }

//       // On successful submission
//       setSuccessPopup(true); // Show success message
//       // Reset form fields
//       setFormData({
//         full_name: "",
//         work_email: "",
//         role: "",
//         countryCode: "IN", // Reset to your preferred default
//         phone_number: "",
//         extra_message: "",
//         marketing_opt_in: false,
//       });
//       setValidationErrors({}); // Clear validation errors
//     } catch (generalError) {
//       console.error("Error submitting demo request:", generalError);
//       alert("Error submitting demo request: " + generalError.message); // Display error to user
//     } finally {
//       setLoading(false); // Always stop loading, regardless of success or failure
//     }
//   };

//   // Render loading state while countries data is being fetched
//   if (countriesLoading) {
//     return (
//       <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center">
//         <p className="text-gray-700 text-lg">Loading country data...</p>
//       </div>
//     );
//   }

//   // Render error state if country data fetching failed
//   if (countriesError) {
//     return (
//       <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center flex-col p-4">
//         <p className="text-red-500 text-lg">Error: {countriesError}</p>
//         <p className="text-gray-500 text-sm mt-2">Could not load the list of countries. Please check your internet connection or try refreshing the page.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center justify-center px-4 py-12 [system-ui]">
//       <div className="bg-white/70 backdrop-blur-md rounded-[28px] shadow-xl flex flex-col md:flex-row w-full max-w-6xl overflow-hidden border border-gray-100">
//         {/* Left Panel - unchanged from your previous version */}
//         <div className="w-full md:w-3/4 p-10 flex flex-col justify-between">
//           <div className="text-center mb-10">
//             <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
//               Request a Demo
//             </h2>
//             <p className="text-gray-500 text-base mb-6 max-w-md mx-auto">
//               Explore how our product can elevate your business. Get a personalized walkthrough.
//             </p>
//             <ul className="space-y-3 text-left max-w-md mx-auto text-gray-700 text-[15px]">
//               {[
//                 "Learn more about our products",
//                 "Get your questions answered",
//                 "We'll help you get started",
//               ].map((text, index) => (
//                 <li key={index} className="flex items-start">
//                   <span className="text-green-500 mr-2">✔️</span>
//                   {text}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           <div className="flex justify-center mb-6">
//             <img
//               src="/public/illustrations/Demo-bro.svg"
//               alt="Demo Preview"
//               className="max-h-40 object-contain"
//             />
//           </div>

//           <div className="text-center mt-6">
//             <p className="text-sm text-gray-500 font-medium mb-4">Follow us on</p>
//             <div className="flex justify-center gap-6 text-[20px] text-gray-400">
//               <a href="https://www.linkedin.com/company/inklidox-technologies-private-limited/?trk=public_post_follow-view-profile"
//                 target="_blank" rel="noopener noreferrer">
//                 <FaLinkedinIn className="hover:text-blue-700 transition-all duration-150" />
//               </a>
//               <a href="https://www.instagram.com/inklidox_technologies/?igsh=M3F3eThuZDY2NzR5#"
//                 target="_blank" rel="noopener noreferrer">
//                 <FaInstagram className="hover:text-pink-500 transition-all duration-150" />
//               </a>
//               <a href="https://www.youtube.com/@InklidoxTechnologies"
//                 target="_blank" rel="noopener noreferrer">
//                 <FaYoutube className="hover:text-red-600 transition-all duration-150" />
//               </a>
//               <a href="https://x.com/inklidox"
//                 target="_blank" rel="noopener noreferrer">
//                 <FaXTwitter className="hover:text-gray-900 transition-all duration-150" />
//               </a>
//             </div>
//           </div>
//         </div>

//         {/* Right Form - updated with country code dropdown and phone validation */}
//         <div className="w-full md:w-3/4 p-8 md:p-12 bg-white">
//           <form onSubmit={handleSubmit} className="space-y-5 text-[15px]">
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
//               <input
//                 type="text"
//                 name="full_name"
//                 value={formData.full_name}
//                 onChange={handleChange}
//                 maxLength={50}
//                 required
//                 className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.full_name ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
//                 placeholder="Your full name"
//               />
//               {validationErrors.full_name && (
//                 <p className="text-red-500 text-xs mt-1">{validationErrors.full_name}</p>
//               )}
//             </div>

//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="flex-1">
//                 <label className="block text-sm text-gray-600 mb-1">Work Email *</label>
//                 <input
//                   type="email"
//                   name="work_email"
//                   value={formData.work_email}
//                   onChange={handleChange}
//                   required
//                   className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.work_email ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
//                   placeholder="Your business email"
//                 />
//                 {validationErrors.work_email && (
//                   <p className="text-red-500 text-xs mt-1">{validationErrors.work_email}</p>
//                 )}
//               </div>

//               <div className="flex-1">
//                 <label className="block text-sm text-gray-600 mb-1">Role *</label>
//                 <select
//                   name="role"
//                   value={formData.role}
//                   onChange={handleChange}
//                   required
//                   className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.role ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
//                 >
//                   <option value="">Select...</option>
//                   <option value="Developer">Developer</option>
//                   <option value="Product Manager">Product Manager</option>
//                   <option value="Executive">Executive</option>
//                   <option value="Others">Others</option>
//                 </select>
//                 {validationErrors.role && (
//                   <p className="text-red-500 text-xs mt-1">{validationErrors.role}</p>
//                 )}
//               </div>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm text-gray-600 mb-1">Phone Number *</label>
//               <div className="flex w-full items-center"> {/* Added items-center for vertical alignment */}
//                 {/* Country Code Dropdown */}
//                 <select
//                   name="countryCode"
//                   value={formData.countryCode}
//                   onChange={handleChange}
//                   // Added h-11 for consistent height
//                   className={`px-3 py-3 h-11 rounded-l-xl bg-[#f9f9f9] border ${validationErrors.countryCode ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
//                 >
//                   {/* Default/Loading/Error options for the dropdown */}
//                   {countriesLoading && <option value="">Loading countries...</option>}
//                   {countriesError && <option value="">Error loading countries</option>}
//                   {!countriesLoading && !countriesError && (
//                     <>
//                       <option value="">Select Country</option> {/* Changed text for brevity */}
//                       {allCountryOptions.map((country) => (
//                         <option key={country.code} value={country.code}>
//                           {country.name} ({country.dialingCode}) {/* Corrected: Use country.dialingCode */}
//                         </option>
//                       ))}
//                     </>
//                   )}
//                 </select>
//                 {/* Phone Number Input */}
//                 <input
//                   type="tel" // Semantic type for telephone numbers
//                   name="phone_number"
//                   value={formData.phone_number}
//                   onChange={handleChange}
//                   required
//                   // Added h-11 for consistent height
//                   className={`flex-grow px-4 py-3 h-11 rounded-r-xl bg-[#f9f9f9] border ${validationErrors.phone_number ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
//                   placeholder="e.g., 9876543210"
//                 />
//               </div>
//               {/* Display validation error for either phone_number or countryCode */}
//               {(validationErrors.phone_number || validationErrors.countryCode) && (
//                 <p className="text-red-500 text-xs mt-1">
//                   {validationErrors.phone_number || validationErrors.countryCode}
//                 </p>
//               )}
//             </div>

//             <div> {/* Moved label inside its own div for consistent spacing */}
//               <label className="block text-sm text-gray-600 mb-1">Anything Else?</label>
//               <textarea
//                 name="extra_message"
//                 value={formData.extra_message}
//                 onChange={handleChange}
//                 rows={4}
//                 maxLength={500} // Restrict message length to 500 characters
//                 className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.extra_message ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all resize-none`}
//                 placeholder="Tell us more about your project"
//               ></textarea>
//               {validationErrors.extra_message && (
//                 <p className="text-red-500 text-xs mt-1">{validationErrors.extra_message}</p>
//               )}
//             </div>

//             <div className="flex items-start gap-2 text-sm text-gray-600">
//               <input
//                 type="checkbox"
//                 name="marketing_opt_in"
//                 checked={formData.marketing_opt_in}
//                 onChange={handleChange}
//                 className="mt-1"
//               />
//               <label>
//                 Yes, I’d like to receive marketing communications. I can unsubscribe at any time.
//               </label>
//             </div>

//             <button
//               type="submit"
//               disabled={loading || countriesLoading} // Disable button if form is submitting or countries are still loading
//               className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
//                 loading || countriesLoading
//                   ? "bg-gray-300 text-gray-600 cursor-not-allowed"
//                   : "bg-[#007aff] text-white hover:bg-[#005bb5]"
//               }`}
//             >
//               {loading ? "Submitting..." : "Request Demo"}
//             </button>
//           </form>

//           {/* Success Popup */}
//           {successPopup && (
//             <div className="mt-6 text-green-700 bg-green-100 border border-green-300 p-4 rounded-xl shadow-sm">
//               🎉 Your demo request was successfully submitted! Our team will contact you shortly.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RequestDemo;