import React, { useState } from "react";
import { ENDPOINTS } from "../api/constraints";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

const RequestDemo = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    work_email: "",
    role: "",
    phone_number: "",
    extra_message: "",
    marketing_opt_in: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  // Validation rules
  const nameRegex = /^[A-Za-z\s]{2,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phoneRegex = /^[0-9]{7,15}$/;

  const validateField = (name, value) => {
    switch (name) {
      case "full_name":
        if (!nameRegex.test(value.trim())) {
          return "Full name should contain only alphabets and spaces.";
        }
        return "";
      case "work_email":
        if (!emailRegex.test(value.trim())) {
          return "Please enter a valid email address.";
        }
        return "";
      case "role":
        if (!value) {
          return "Role is required.";
        }
        return "";
      case "phone_number":
        if (!phoneRegex.test(value.trim())) {
          return "Phone number should be 7-15 digits and contain only numbers.";
        }
        return "";
      case "extra_message":
        if (value.length > 500) {
          return "Message should be less than 500 characters.";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    // Validate on change
    const errorMessage = validateField(name, newValue);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessPopup(false);

    // Validate all fields before submit
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.DEMO_MAIL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          full_name: formData.full_name.trim(),
          work_email: formData.work_email.trim(),
          phone_number: formData.phone_number.trim(),
          extra_message: formData.extra_message.trim(),
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      setSuccessPopup(true);
      setFormData({
        full_name: "",
        work_email: "",
        role: "",
        phone_number: "",
        extra_message: "",
        marketing_opt_in: false,
      });
      setValidationErrors({});
    } catch (error) {
      alert("Error submitting demo request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col items-center justify-center px-4 py-12 font-[system-ui]">
      <div className="bg-white/70 backdrop-blur-md rounded-[28px] shadow-xl flex flex-col md:flex-row w-full max-w-6xl overflow-hidden border border-gray-100">
        {/* Left Panel */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-between">
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
                <FaTwitter className="hover:text-sky-500 transition-all duration-150" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5 text-[15px]">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
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

            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border ${validationErrors.phone_number ? 'border-red-400' : 'border-gray-200'} text-gray-800 outline-none focus:ring-2 focus:ring-[#007aff] transition-all`}
                placeholder="Phone Number (digits only)"
              />
              {validationErrors.phone_number && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Anything Else?</label>
              <textarea
                name="extra_message"
                value={formData.extra_message}
                onChange={handleChange}
                rows={4}
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

            {/* <p className="text-xs text-gray-400">
              By submitting, you agree to our{" "}
              <a href="#" className="text-[#007aff] underline">
                Privacy Policy
              </a>
              .
            </p> */}

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
                loading
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
