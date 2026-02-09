import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { ENDPOINTS } from "../api/constraints";
import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';
import { getNames, getCodes } from 'country-list';
import { useBusiness } from "../context/BusinessTypeContext.jsx"; 

const CreateAnAccount = () => {
  const navigate = useNavigate(); 
  const { businessTypes, loading: businessLoading } = useBusiness();
  
  const [formData, setFormData] = useState({
    full_name: "",
    work_email: "",
    password: "",
    org_name: "",
    countryCode: "IN", 
    phoneNumberLocal: "",
    business_type: "",    
    user_count: 2,
    currency_id: 2,
    marketing_opt_in: false,
  });

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [userOtpInput, setUserOtpInput] = useState("");
  const [serverOtp, setServerOtp] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [countriesData, setCountriesData] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);


  const OTP_RESEND_DELAY = 60;

const [otpCooldown, setOtpCooldown] = useState(() => {
  const expiresAt = localStorage.getItem("otpResendExpiresAt");
  if (!expiresAt) return 0;
  const remainingSeconds = Math.ceil((Number(expiresAt) - Date.now()) / 1000);
  return remainingSeconds > 0 ? remainingSeconds : 0;
});

  /* ================= OTP COOLDOWN TIMER ================= */

useEffect(() => {
  if (otpCooldown <= 0) {
    localStorage.removeItem("otpResendExpiresAt");
    return;
  }

  const timer = setInterval(() => {
    setOtpCooldown(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [otpCooldown]);

  /* ================= COUNTRY FETCH ================= */
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const response = await fetch("https://restcountries.com/v3.1/all?fields=cca2,name,idd");
        const data = await response.json();

        const processed = data
          .map(c => ({
            code: c.cca2,
            name: c.name?.common || "",
            dialingCode: c.idd?.root && c.idd?.suffixes?.[0]
              ? `${c.idd.root}${c.idd.suffixes[0]}`
              : "-"
          }))
          .filter(c => c.dialingCode !== "-")
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountriesData(processed);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const allCountryOptions = useMemo(() => {
    if (!countriesData.length) {
      const names = getNames();
      const codes = getCodes();
      return codes.map((c, i) => ({
        code: c,
        name: names[i] || c,
        dialingCode: "+1"
      }));
    }
    return countriesData;
  }, [countriesData]);

  /* ================= VALIDATION ================= */
  const validateField = useCallback((name, value) => {
    switch (name) {
      case "full_name": return value.trim().length < 2 ? "Full name required" : "";
      case "work_email": return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Valid email required" : "";
      case "password": return value.length < 6 ? "Min 6 characters" : "";
      case "org_name": return !value.trim() ? "Organization required" : "";
      case "business_type": return !value ? "Business type required" : "";
      case "phoneNumberLocal":
        if (!value.trim()) return "Phone number required";
        if (value.replace(/\D/g, "").length < 6) return "Minimum 6 digits";
        return "";
      default: return "";
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    if (name === "phoneNumberLocal") {
      updated.phoneNumberLocal = new AsYouType(formData.countryCode).input(value.replace(/\D/g, ""));
    }

    setFormData(updated);
    setValidationErrors(prev => ({ ...prev, [name]: validateField(name, updated[name]) }));
  };

  /* ================= SEND OTP ================= */
const handleSendOtp = async () => {
  if (verifyingEmail || otpCooldown > 0) return;

  const emailError = validateField("work_email", formData.work_email);
  if (emailError) {
    setValidationErrors(prev => ({ ...prev, work_email: emailError }));
    return;
  }

  setVerifyingEmail(true);
  try {
    const res = await fetch(ENDPOINTS.SIGNUP_OTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.work_email }),
    });

    const result = await res.json();

    if (res.ok && result?.data?.success) {
  
      setOtpSent(true);
      setUserOtpInput("");
      setOtpCooldown(OTP_RESEND_DELAY);

      localStorage.setItem(
        "otpResendExpiresAt",
        String(Date.now() + OTP_RESEND_DELAY * 1000)
      );

      alert("OTP sent to your email!");
    } else {
      alert(result.message || "OTP failed");
    }
  } finally {
    setVerifyingEmail(false);
  }
};




  /* ================= VERIFY OTP ================= */
const handleCheckOtp = async () => {
  try {
    const res = await fetch(ENDPOINTS.VERIFY_OTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.work_email,
        otp: userOtpInput.trim(),
      }),
    });
    const result = await res.json();

    if (res.ok && result?.data?.success) {
      setIsEmailVerified(true);
      setOtpSent(false);
      setUserOtpInput("");
      setOtpCooldown(0);
      alert("Email Verified!");
    } else {
      alert(result.message || "Invalid OTP");
    }
  } catch (e) {
    alert("Verification failed");
  }
};


  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailVerified) return alert("Verify email first");

    setLoading(true);
    try {
      const phone = parsePhoneNumber(formData.phoneNumberLocal, formData.countryCode);
      const payload = {
        fullName: formData.full_name,
        email: formData.work_email,
        password: formData.password,
        organizationName: formData.org_name,
        businessTypeId: Number(formData.business_type),
        userCount: Number(formData.user_count),
        currencyId: 2,
        phoneNumber: phone.format("E.164"),
      };

      const res = await fetch(ENDPOINTS.SIGNUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Signup failed");
      setSuccessPopup(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white/70 backdrop-blur-md rounded-[28px] shadow-xl flex flex-col md:flex-row w-full max-w-6xl overflow-hidden border border-gray-100">
        
        {/* Left Panel */}
        <div className="w-full md:w-5/12 p-10 flex flex-col justify-between bg-gray-50/50">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">Create an Account</h2>
            <p className="text-gray-500 text-base mb-8">Start your journey with Inklidox. Setup your workspace in minutes.</p>
            
            <ul className="space-y-4 text-gray-700 text-[15px]">
              {["Secure Workspace", "Team Collaboration", "Lead Management"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-600 p-1 rounded-full text-xs">✔</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:flex justify-center"> 
             <img src="/illustrations/CreateAnAccount.svg" alt="Signup" className="max-h-52 object-contain" /> 
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.full_name ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="John Doe" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Work Email <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="email" name="work_email" disabled={isEmailVerified} value={formData.work_email} onChange={handleChange} className={`flex-grow px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.work_email ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="john@company.com" />
                  {!isEmailVerified && (
                    <button
  type="button"
  onClick={handleSendOtp}
  disabled={verifyingEmail || otpCooldown > 0}
  className="px-4 bg-blue-50 text-blue-600 font-semibold rounded-xl text-xs
             hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
  {verifyingEmail
    ? "Sending..."
    : otpCooldown > 0
    ? `Resend in ${otpCooldown}s`
    : otpSent
    ? "Resend"
    : "Verify"}
</button>

                  )}
                </div>
                {isEmailVerified && <p className="text-green-600 text-[10px] mt-1 font-medium">✓ Email Verified</p>}
              </div>
            </div>

            {/* OTP Section */}
            {otpSent && !isEmailVerified && (
              <div className="animate-fade-in bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex gap-2">
                  <input type="text" maxLength="4" value={userOtpInput} onChange={(e) => setUserOtpInput(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-blue-200 text-center text-xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500" placeholder="0000" />
                  <button type="button" onClick={handleCheckOtp} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Check</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                
                  className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.password ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} 
                  placeholder="123456" 
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-[12px] mt-1 font-medium">{validationErrors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Organization Name <span className="text-red-500">*</span></label>
                <input type="text" name="org_name" value={formData.org_name} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.org_name ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Inklidox Tech" />
              </div>
            </div>

            {/*  Business Type & User Count Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Business Type <span className="text-red-500">*</span></label>
                <select 
                  name="business_type" 
                  value={formData.business_type} 
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.business_type ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">{businessLoading ? "Loading..." : "Select Type"}</option>
                  {businessTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {validationErrors.business_type && <p className="text-red-500 text-[10px] mt-1">{validationErrors.business_type}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Number of Users</label>
                <input type="number" name="user_count" value={formData.user_count} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
            <div className="w-full">
              <label className="block text-sm text-gray-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <div className="flex">
                <select 
                  name="countryCode" 
                  value={formData.countryCode} 
                  onChange={handleChange} 
                  className="px-3 py-3 bg-[#f9f9f9] border border-r-0 border-gray-200 rounded-l-xl outline-none w-[100px]"
                >
                  {allCountryOptions.map(c => ( 
                    <option key={c.code} value={c.code}>{c.dialingCode}</option>
                  ))}
                </select>
                <input 
                  type="tel" 
                  name="phoneNumberLocal" 
                  value={formData.phoneNumberLocal} 
                  onChange={handleChange} 
                  maxLength="15"
                  className={`flex-grow px-4 py-3 rounded-r-xl bg-[#f9f9f9] border ${validationErrors.phoneNumberLocal ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} 
                  placeholder="98765 43210" 
                />
              </div>
              {validationErrors.phoneNumberLocal && (
                <p className="text-red-500 text-[12px] mt-1 font-medium">{validationErrors.phoneNumberLocal}</p>
              )}
            </div>

            </div>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button type="submit" disabled={loading || !isEmailVerified} className={`w-fit px-12 bg-[#007aff] text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-all ${(!isEmailVerified || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {loading ? "Creating Account..." : "Sign Up Now"}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account? <a href="/" className="text-blue-600 font-medium hover:underline">Log in</a>
              </p>
            </div>
          </form>

          {successPopup && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center animate-pulse">
              🎉 Account created successfully! Redirecting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAnAccount;


// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { useNavigate } from "react-router-dom"; 
// import { ENDPOINTS } from "../api/constraints";
// import { FaInstagram, FaYoutube, FaLinkedinIn } from "react-icons/fa";
// import { FaXTwitter } from "react-icons/fa6";
// import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';
// import { getNames, getCodes } from 'country-list';
// import { useBusiness } from "../context/BusinessTypeContext.jsx"; 

// const CreateAnAccount = () => {
//   const navigate = useNavigate(); 
//   const { businessTypes, loading: businessLoading } = useBusiness();
  
//   const [formData, setFormData] = useState({
//     full_name: "",
//     work_email: "",
//     password: "",
//     org_name: "",
//     countryCode: "IN", 
//     phoneNumberLocal: "",
//     business_type: "",    
//     user_count: 2,
//     currency_id: 2,       // 2 for INR
//     marketing_opt_in: false,
//   });

//   // OTP States
//   const [otpSent, setOtpSent] = useState(false);
//   const [userOtpInput, setUserOtpInput] = useState("");
//   const [serverOtp, setServerOtp] = useState(null);
//   const [isEmailVerified, setIsEmailVerified] = useState(false);
//   const [verifyingEmail, setVerifyingEmail] = useState(false);
//   const [validationErrors, setValidationErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [successPopup, setSuccessPopup] = useState(false);
//   const [countriesData, setCountriesData] = useState([]);
//   const [countriesLoading, setCountriesLoading] = useState(true);

//   // Fetch Country Data
//   useEffect(() => {
//     const fetchCountries = async () => {
//       try {
//         setCountriesLoading(true);
//         const response = await fetch("https://restcountries.com/v3.1/all?fields=cca2,name,flags,idd");
//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//         const data = await response.json();

//         const processedCountries = data
//           .map(country => ({
//             code: country.cca2,
//             name: country.name?.common || "Unknown Country",
//             dialingCode: country.idd?.root && country.idd.suffixes?.[0] ? `${country.idd.root}${country.idd.suffixes[0]}` : '-',
//           }))
//           .filter(country => country.dialingCode !== '-')
//           .sort((a, b) => a.name.localeCompare(b.name));

//         setCountriesData(processedCountries);
//       } catch (error) {
//         console.error("Error fetching country data:", error);
//       } finally {
//         setCountriesLoading(false);
//       }
//     };
//     fetchCountries();
//   }, []);

//   const allCountryOptions = useMemo(() => {
//     if (countriesLoading || countriesData.length === 0) {
//       const countryNames = getNames();
//       const countryCodes = getCodes();
//       return countryCodes.map((code, idx) => ({
//         code: code,
//         name: countryNames[idx] || code,
//         dialingCode:  "+1" 
//       })).sort((a, b) => a.name.localeCompare(b.name));
//     }
//     return countriesData;
//   }, [countriesData, countriesLoading]);

//   // Validation Logic
//   const validateField = useCallback((name, value, currentFormData) => {
//     switch (name) {
//       case "full_name":
//         return value.trim().length < 2 ? "Full name is required." : "";
//       case "work_email":
//         return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? "Valid work email is required." : "";
//       case "password":
//          return value.length < 6 ? "Password must be min 6 digits." : "";
//       case "org_name":
//         return !value.trim() ? "Organization name is required." : "";
//       case "business_type":
//         return !value ? "Business type is required." : "";
//       // case "phoneNumberLocal":
//       //   if (!value.trim()) return "Phone number is required.";
//       //   try {
//       //     const phoneNumber = parsePhoneNumber(value.trim(), currentFormData.countryCode);
//       //     if (!phoneNumber || !phoneNumber.isValid()) return "Invalid phone number.";
//       //   } catch (e) { return "Invalid phone number."; }
//       //   return "";
//       case "phoneNumberLocal":
//   if (!value.trim()) return "Phone number is required.";
  
//   const digitsOnly = value.replace(/\D/g, '');
  
//   // 6 digits minimum - NO max limit, NO format check after 6 digits!
//   if (digitsOnly.length < 6) {
//     return "Phone number must be at least 6 to 15 digits.";
//   }
  
//   // 6+ digits = PERFECT! No format check, no max limit!
//   return "";
//       default:
//         return "";
//     }
//   }, []);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     const newValue = type === "checkbox" ? checked : value;
//     const updatedData = { ...formData, [name]: newValue };

//     if (name === "countryCode") updatedData.phoneNumberLocal = "";
//     if (name === "phoneNumberLocal") {
//         const digitsOnly = value.replace(/\D/g, '');
//         updatedData.phoneNumberLocal = new AsYouType(formData.countryCode).input(digitsOnly);
//     }

//     setFormData(updatedData);
//     setValidationErrors(prev => ({ 
//       ...prev, 
//       [name]: validateField(name, updatedData[name], updatedData) 
//     }));
//   };

//   // OTP FUNCTIONS
//   const handleSendOtp = async () => {
//     const emailError = validateField("work_email", formData.work_email);
//     if (emailError) {
//       setValidationErrors(prev => ({ ...prev, work_email: emailError }));
//       return;
//     }

//     setVerifyingEmail(true);
//     try {
//       const response = await fetch(ENDPOINTS.SIGNUP_OTP, {    
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: formData.work_email }),
//       });
//       const result = await response.json();
      
//       if (response.ok || result.success) {
//         setServerOtp(result.data); 
//         setOtpSent(true);
//         alert("OTP sent to your email!");
//       } else {
//         alert(result.message || "Failed to send OTP");
//       }
//     } catch (error) {
//       alert("Error connecting to server");
//     } finally {
//       setVerifyingEmail(false);
//     }
//   };

//   const handleCheckOtp = () => {
//     if (userOtpInput === serverOtp?.toString()) {
//       setIsEmailVerified(true);
//       setOtpSent(false);
//       alert("Email Verified!");
//     } else {
//       alert("Invalid OTP. Please try again.");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!isEmailVerified) {
//       alert("Please verify your email with OTP first.");
//       return;
//     }

//     const errors = {};
//     Object.keys(formData).forEach(key => {
//         const err = validateField(key, formData[key], formData);
//         if (err) errors[key] = err;
//     });

//     if (Object.keys(errors).length > 0) {
//       setValidationErrors(errors);
//       return;
//     }

//     setLoading(true);
    
//     try {
//       const phoneNumberObj = parsePhoneNumber(formData.phoneNumberLocal, formData.countryCode);
      
//       const payload = {
//         fullName: formData.full_name,
//         email: formData.work_email,
//         password: formData.password,
//         organizationName: formData.org_name,
//         businessTypeId: parseInt(formData.business_type, 10), 
//         userCount: parseInt(formData.user_count, 10),
//         currencyId: 2, // 2 for INR
//         phoneNumber: phoneNumberObj.format('E.164'),
//       };

//       const response = await fetch(ENDPOINTS.SIGNUP, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const result = await response.json();

//       if (!response.ok || result.success === false) {
//         throw new Error(result.message || "Submission failed");
//       }

//       setSuccessPopup(true);
//       setTimeout(() => {
//         navigate("/"); 
//       }, 1500);

//     } catch (err) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center justify-center px-4 py-12">
//       <div className="bg-white/70 backdrop-blur-md rounded-[28px] shadow-xl flex flex-col md:flex-row w-full max-w-6xl overflow-hidden border border-gray-100">
        
//         {/* Left Panel */}
//         <div className="w-full md:w-5/12 p-10 flex flex-col justify-between bg-gray-50/50">
//           <div className="text-center md:text-left">
//             <h2 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">Create an Account</h2>
//             <p className="text-gray-500 text-base mb-8">Start your journey with Inklidox. Setup your workspace in minutes.</p>
            
//             <ul className="space-y-4 text-gray-700 text-[15px]">
//               {["Secure Workspace", "Team Collaboration", "Lead Management"].map((item, i) => (
//                 <li key={i} className="flex items-center gap-3">
//                   <span className="bg-blue-100 text-blue-600 p-1 rounded-full text-xs">✔</span>
//                   {item}
//                 </li>
//               ))}
//             </ul>
//           </div>
//           <div className="hidden md:flex justify-center"> 
//              <img src="/illustrations/CreateAnAccount.svg" alt="Signup" className="max-h-52 object-contain" /> 
//           </div>
//         </div>

//         {/* Right Form */}
//         <div className="w-full md:w-7/12 p-8 md:p-12 bg-white">
//           <form onSubmit={handleSubmit} className="space-y-5">
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
//                 <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.full_name ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="John Doe" />
//               </div>
              
//               <div>
//                 <label className="block text-sm text-gray-600 mb-1">Work Email <span className="text-red-500">*</span></label>
//                 <div className="flex gap-2">
//                   <input type="email" name="work_email" disabled={isEmailVerified} value={formData.work_email} onChange={handleChange} className={`flex-grow px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.work_email ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="john@company.com" />
//                   {!isEmailVerified && (
//                     <button type="button" onClick={handleSendOtp} disabled={verifyingEmail} className="px-4 bg-blue-50 text-blue-600 font-semibold rounded-xl text-xs hover:bg-blue-100 transition-all">
//                       {verifyingEmail ? "..." : otpSent ? "Resend" : "Verify"}
//                     </button>
//                   )}
//                 </div>
//                 {isEmailVerified && <p className="text-green-600 text-[10px] mt-1 font-medium">✓ Email Verified</p>}
//               </div>
//             </div>

//             {/* OTP Section */}
//             {otpSent && !isEmailVerified && (
//               <div className="animate-fade-in bg-blue-50/50 p-4 rounded-xl border border-blue-100">
//                 <div className="flex gap-2">
//                   <input type="text" maxLength="4" value={userOtpInput} onChange={(e) => setUserOtpInput(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-blue-200 text-center text-xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500" placeholder="0000" />
//                   <button type="button" onClick={handleCheckOtp} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Check</button>
//                 </div>
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
//                 <input 
//                   type="password" 
//                   name="password" 
//                   value={formData.password} 
//                   onChange={handleChange} 
                
//                   className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.password ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} 
//                   placeholder="123456" 
//                 />
//                 {validationErrors.password && (
//                   <p className="text-red-500 text-[12px] mt-1 font-medium">{validationErrors.password}</p>
//                 )}
//               </div>
//               <div>
//                 <label className="block text-sm text-gray-600 mb-1">Organization Name <span className="text-red-500">*</span></label>
//                 <input type="text" name="org_name" value={formData.org_name} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.org_name ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Inklidox Tech" />
//               </div>
//             </div>

//             {/*  Business Type & User Count Row */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm text-gray-600 mb-1">Business Type <span className="text-red-500">*</span></label>
//                 <select 
//                   name="business_type" 
//                   value={formData.business_type} 
//                   onChange={handleChange}
//                   className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.business_type ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`}
//                 >
//                   <option value="">{businessLoading ? "Loading..." : "Select Type"}</option>
//                   {businessTypes.map((type) => (
//                     <option key={type.id} value={type.id}>
//                       {type.name}
//                     </option>
//                   ))}
//                 </select>
//                 {validationErrors.business_type && <p className="text-red-500 text-[10px] mt-1">{validationErrors.business_type}</p>}
//               </div>

//               <div>
//                 <label className="block text-sm text-gray-600 mb-1">Number of Users</label>
//                 <input type="number" name="user_count" value={formData.user_count} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
//             <div className="w-full">
//               <label className="block text-sm text-gray-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
//               <div className="flex">
//                 <select 
//                   name="countryCode" 
//                   value={formData.countryCode} 
//                   onChange={handleChange} 
//                   className="px-3 py-3 bg-[#f9f9f9] border border-r-0 border-gray-200 rounded-l-xl outline-none w-[100px]"
//                 >
//                   {allCountryOptions.map(c => ( 
//                     <option key={c.code} value={c.code}>{c.dialingCode}</option>
//                   ))}
//                 </select>
//                 <input 
//                   type="tel" 
//                   name="phoneNumberLocal" 
//                   value={formData.phoneNumberLocal} 
//                   onChange={handleChange} 
//                   maxLength="15"
//                   className={`flex-grow px-4 py-3 rounded-r-xl bg-[#f9f9f9] border ${validationErrors.phoneNumberLocal ? 'border-red-400' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} 
//                   placeholder="98765 43210" 
//                 />
//               </div>
//               {validationErrors.phoneNumberLocal && (
//                 <p className="text-red-500 text-[12px] mt-1 font-medium">{validationErrors.phoneNumberLocal}</p>
//               )}
//             </div>

//             </div>

//             <div className="flex flex-col items-center gap-3 pt-2">
//               <button type="submit" disabled={loading || !isEmailVerified} className={`w-fit px-12 bg-[#007aff] text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-all ${(!isEmailVerified || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
//                 {loading ? "Creating Account..." : "Sign Up Now"}
//               </button>
//               <p className="text-center text-sm text-gray-500">
//                 Already have an account? <a href="/" className="text-blue-600 font-medium hover:underline">Log in</a>
//               </p>
//             </div>
//           </form>

//           {successPopup && (
//             <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center animate-pulse">
//               🎉 Account created successfully! Redirecting...
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateAnAccount;
