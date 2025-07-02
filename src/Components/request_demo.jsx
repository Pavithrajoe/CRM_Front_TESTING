import React, { useState, useEffect, useMemo } from "react";
import { ENDPOINTS } from "../api/constraints";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6"; // Correct import for the 'X' icon

// Import libphonenumber-js for phone number parsing and validation
import { parsePhoneNumber } from 'libphonenumber-js';

// Import country-list for country names (as a fallback/cross-reference)
import { getNames, getCodes } from 'country-list';

const RequestDemo = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    work_email: "",
    role: "",
    countryCode: "IN", // Default to India (ISO code) - ensure this is a valid ISO code
    phone_number: "",
    extra_message: "",
    marketing_opt_in: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [countriesData, setCountriesData] = useState([]); // State to store fetched country data
  const [countriesLoading, setCountriesLoading] = useState(true); // Loading state for countries data
  const [countriesError, setCountriesError] = useState(null); // Error state for countries data

  // --- Fetch All Country Details from REST Countries API ---
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        // Request specific fields to minimize payload size
        const response = await fetch("https://restcountries.com/v3.1/all?fields=cca2,name,flags,capital,idd,altSpellings");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Process data to a more usable format and sort alphabetically by common name
        const processedCountries = data
          .map(country => {
            const countryName = country.name?.common || "Unknown Country";
            const countryCode = country.cca2; // ISO 3166-1 alpha-2 code

            // Construct dialing code from API data (root + first suffix)
            const dialingCode = country.idd?.root && country.idd.suffixes && country.idd.suffixes.length > 0 ?
                                `${country.idd.root}${country.idd.suffixes[0]}` :
                                'N/A'; // Fallback if no dialing code is found

            return {
              code: countryCode,
              name: countryName,
              dialingCode: dialingCode, // This is the correct property name
              flag: country.flags?.png || country.flags?.svg || '', // Store flag URL
              capital: country.capital?.[0] || 'N/A', // Store first capital
              // You can add more fields here if needed for display or logic
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountriesData(processedCountries);
        // Set default countryCode to the first available country if 'IN' is not guaranteed, or keep 'IN' if preferred.
        // It's safer to ensure 'IN' is in the list before setting it, or use the first available.
        if (processedCountries.length > 0 && !processedCountries.some(c => c.code === formData.countryCode)) {
             setFormData(prev => ({ ...prev, countryCode: processedCountries[0].code }));
        }
      } catch (error) {
        console.error("Error fetching country data:", error);
        setCountriesError("Failed to load country list. Please try again later.");
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // --- Memoized Country Options for Dropdown ---
  // This memoizes the options array, preventing recalculation on every render
  // unless countriesData or countriesLoading changes.
  const allCountryOptions = useMemo(() => {
    // If countriesData is still loading or empty (e.g., API failed),
    // provide a fallback using the 'country-list' package.
    if (countriesLoading || countriesData.length === 0) {
        const countryNames = getNames();
        const countryCodes = getCodes();
        // A minimal, hardcoded fallback for dialing codes if API fails.
        // This is less accurate but ensures some options are available.
        const fallbackCallingCodes = {
          "US": "+1", "CA": "+1", "IN": "+91", "GB": "+44", "AU": "+61",
          // Add more common ones here as needed for a robust fallback
        };
        return countryCodes.map((code) => ({
            code: code,
            name: `${countryNames[countryCodes.indexOf(code)] || code} (${fallbackCallingCodes[code] || 'N/A'})`,
            dialingCode: fallbackCallingCodes[code] || 'N/A' // Ensure dialingCode property exists for fallback too
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Otherwise, use the data fetched from the REST Countries API
    return countriesData.map(country => ({
      code: country.code,
      name: country.name, // Display full country name in the option
      dialingCode: country.dialingCode, // Dialing code is now available
      flag: country.flag, // Flag URL is now available in the option object
      capital: country.capital, // Capital is also available
    }));
  }, [countriesData, countriesLoading]); // Re-generate when these dependencies change

  // Validation rules
  const nameRegex = /^[A-Za-z\s]{2,50}$/; // Allows 2 to 50 alphabetic characters and spaces
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // Basic email regex

  // Unified validation function for form fields
  const validateField = (name, value, currentFormData) => {
    switch (name) {
      case "full_name":
        if (!value.trim()) {
          return "Full name is required.";
        }
        if (!nameRegex.test(value.trim())) {
          return "Full name must be 2-50 alphabetic characters and spaces only.";
        }
        return ""; // No error
      case "work_email":
        if (!value.trim()) {
          return "Work email is required.";
        }
        if (!emailRegex.test(value.trim())) {
          return "Please enter a valid email address (e.g., example@domain.com).";
        }
        return ""; // No error
      case "role":
        if (!value) { // Select dropdowns often return an empty string if no option is chosen
          return "Role is required.";
        }
        return ""; // No error
      case "phone_number":
      case "countryCode": // Validate phone_number and countryCode together
        {
          const numberToValidate = name === "phone_number" ? value : currentFormData.phone_number;
          const countryToValidate = name === "countryCode" ? value : currentFormData.countryCode;

          if (!numberToValidate.trim()) {
            return "Phone number is required.";
          }
          if (!countryToValidate) { // Ensure a country code is selected
            return "Country must be selected for phone validation.";
          }

          try {
            // parsePhoneNumber can throw if country code is not recognized or number is malformed
            const phoneNumber = parsePhoneNumber(numberToValidate.trim(), countryToValidate);

            if (!phoneNumber || !phoneNumber.isValid()) {
              // If number cannot be parsed or is invalid for the given country
              return `Invalid phone number for ${countryToValidate}.`;
            }

          } catch (error) {
            // Catch errors from parsePhoneNumber itself (e.g., invalid country code format)
            console.error("Phone validation error:", error); // For debugging
            return `Invalid phone number or country selection.`;
          }
          return ""; // No error
        }
      case "extra_message":
        if (value.length > 500) {
          return "Message should be less than 500 characters.";
        }
        return ""; // No error
      default:
        return ""; // No validation for other fields
    }
  };

  // Handles input and select changes, performing immediate validation
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    // Update form data first
    const updatedFormData = {
      ...formData,
      [name]: newValue,
    };
    setFormData(updatedFormData);

    // Then, validate the changed field using the updated form data
    const errorMessage = validateField(name, newValue, updatedFormData);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading state
    setSuccessPopup(false); // Hide success message from previous attempts

    const errors = {};
    let formIsValid = true;

    // Validate all required fields
    const fieldsToValidate = ["full_name", "work_email", "role", "countryCode", "phone_number", "extra_message"];
    for (const key of fieldsToValidate) {
        const error = validateField(key, formData[key], formData);
        if (error) {
            errors[key] = error;
            formIsValid = false;
        }
    }

    setValidationErrors(errors); // Update all validation errors

    if (!formIsValid) {
      setLoading(false); // Stop loading if validation fails
      return; // Prevent form submission
    }

    try {
      let formattedPhoneNumber = formData.phone_number.trim();
      // Final robust phone number validation and formatting right before submission
      try {
        const phoneNumberObj = parsePhoneNumber(formData.phone_number.trim(), formData.countryCode);
        if (phoneNumberObj && phoneNumberObj.isValid()) {
          formattedPhoneNumber = phoneNumberObj.format('E.164'); // Format to international E.164 standard (+CCXXXXXXXXXX)
        } else {
            // This case should ideally be caught by validateField, but as a final safeguard
            throw new Error('Invalid phone number provided. Please check the number and country.');
        }
      } catch (submissionPhoneError) {
        setLoading(false);
        alert('Phone number processing error: ' + submissionPhoneError.message);
        return; // Stop submission if phone number formatting fails
      }

      // Send form data to your backend endpoint
      const response = await fetch(ENDPOINTS.DEMO_MAIL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Assuming you still need authorization token
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

      // Handle non-OK HTTP responses
      if (!response.ok) {
        const errorData = await response.json(); // Attempt to parse error message from body
        throw new Error(errorData.message || "Network response was not ok");
      }

      // On successful submission
      setSuccessPopup(true); // Show success message
      // Reset form fields
      setFormData({
        full_name: "",
        work_email: "",
        role: "",
        countryCode: "IN", // Reset to your preferred default
        phone_number: "",
        extra_message: "",
        marketing_opt_in: false,
      });
      setValidationErrors({}); // Clear validation errors
    } catch (generalError) {
      console.error("Error submitting demo request:", generalError);
      alert("Error submitting demo request: " + generalError.message); // Display error to user
    } finally {
      setLoading(false); // Always stop loading, regardless of success or failure
    }
  };

  // Render loading state while countries data is being fetched
  if (countriesLoading) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center">
        <p className="text-gray-700 text-lg">Loading country data...</p>
      </div>
    );
  }

  // Render error state if country data fetching failed
  if (countriesError) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center flex-col p-4">
        <p className="text-red-500 text-lg">Error: {countriesError}</p>
        <p className="text-gray-500 text-sm mt-2">Could not load the list of countries. Please check your internet connection or try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center justify-center px-4 py-12 font-[system-ui]">
      <div className="bg-white/70 backdrop-blur-md rounded-[28px] shadow-xl flex flex-col md:flex-row w-full max-w-6xl overflow-hidden border border-gray-100">
        {/* Left Panel - unchanged from your previous version */}
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

        {/* Right Form - updated with country code dropdown and phone validation */}
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
              <div className="flex w-full items-center"> {/* Added items-center for vertical alignment */}
                {/* Country Code Dropdown */}
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  // Added h-11 for consistent height
                  className={`px-3 py-3 h-11 rounded-l-xl bg-[#f9f9f9] border ${validationErrors.countryCode ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
                >
                  {/* Default/Loading/Error options for the dropdown */}
                  {countriesLoading && <option value="">Loading countries...</option>}
                  {countriesError && <option value="">Error loading countries</option>}
                  {!countriesLoading && !countriesError && (
                    <>
                      <option value="">Select Country</option> {/* Changed text for brevity */}
                      {allCountryOptions.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.dialingCode}) {/* Corrected: Use country.dialingCode */}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {/* Phone Number Input */}
                <input
                  type="tel" // Semantic type for telephone numbers
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                  // Added h-11 for consistent height
                  className={`flex-grow px-4 py-3 h-11 rounded-r-xl bg-[#f9f9f9] border ${validationErrors.phone_number ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
                  placeholder="e.g., 9876543210"
                />
              </div>
              {/* Display validation error for either phone_number or countryCode */}
              {(validationErrors.phone_number || validationErrors.countryCode) && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.phone_number || validationErrors.countryCode}
                </p>
              )}
            </div>

            <div> {/* Moved label inside its own div for consistent spacing */}
              <label className="block text-sm text-gray-600 mb-1">Anything Else?</label>
              <textarea
                name="extra_message"
                value={formData.extra_message}
                onChange={handleChange}
                rows={4}
                maxLength={500} // Restrict message length to 500 characters
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
              disabled={loading || countriesLoading} // Disable button if form is submitting or countries are still loading
              className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
                loading || countriesLoading
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#007aff] text-white hover:bg-[#005bb5]"
              }`}
            >
              {loading ? "Submitting..." : "Request Demo"}
            </button>
          </form>

          {/* Success Popup */}
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