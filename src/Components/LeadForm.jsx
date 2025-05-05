import React, { useState } from "react";

const LeadForm = ({ onClose }) => {
  const initialForm = {
    name: "",
    email: "",
    mobile: "",
    whatsapp: "",
    company: "",
    location: "",
    address1: "",
    address2: "",
    pincode: "",
    service: "",
    source: "",
    assignTo: "",
    leadStatus: "",
    status: "",
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.entries(form).forEach(([key, value]) => {
      if (!value) newErrors[key] = "This field is required";
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert("Lead created successfully!");
        onClose();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      alert("Failed to create lead.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-blur w-[1200px] bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-xl font-bold text-center">Enter the details to create the Lead</h2>

      {/* Customer Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Name", name: "name" },
          { label: "E-mail ID", name: "email" },
          { label: "Mobile Number", name: "mobile" },
          { label: "WhatsApp Number", name: "whatsapp" },
          { label: "Company Name", name: "company" },
          { label: "Location", name: "location" },
          { label: "Address 1", name: "address1" },
          { label: "Address 2", name: "address2" },
          { label: "Pincode", name: "pincode" },
        ].map(({ label, name }) => (
          <div key={name}>
            <label className="text-sm font-medium">{label}</label>
            <input
              type="text"
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={`Enter your ${label.toLowerCase()}`}
              className="mt-1 w-full border border-gray-300 px-3 py-2 rounded"
            />
            {errors[name] && <p className="text-red-600 text-sm">{errors[name]}</p>}
          </div>
        ))}
      </div>

      {/* Lead Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Service", name: "service", options: ["Web", "Mobile", "Design"] },
          { label: "Source", name: "source", options: ["Google", "LinkedIn", "Referral"] },
          { label: "Assign To", name: "assignTo", options: ["Employee A", "Employee B"] },
          { label: "Lead Status", name: "leadStatus", options: ["New", "Follow-up", "Closed"] },
          { label: "Status", name: "status", options: ["Open", "In Progress", "Completed"] },
        ].map(({ label, name, options }) => (
          <div key={name}>
            <label className="text-sm font-medium">{label}</label>
            <select
              name={name}
              value={form[name]}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 px-3 py-2 rounded"
            >
              <option value="">Select {label}</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors[name] && <p className="text-red-600 text-sm">{errors[name]}</p>}
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default LeadForm;
