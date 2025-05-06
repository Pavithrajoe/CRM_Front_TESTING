import React, { useState, useEffect } from "react";
import { X } from "lucide-react"; // optional icon

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
  const [dropdownData, setDropdownData] = useState({
    services: [],
    sources: [],
    employees: [],
    leadStatuses: [],
    statuses: [],
  });

  useEffect(() => {
    // Mock API fetches — replace with your real API endpoints
    const fetchDropdowns = async () => {
      setDropdownData({
        services: ["Web", "Mobile", "Design"],
        sources: ["Google", "LinkedIn", "Referral"],
        employees: ["Employee A", "Employee B", "Employee C"],
        leadStatuses: ["New", "Follow-up", "Closed"],
        statuses: ["Open", "In Progress", "Completed"],
      });
    };
    fetchDropdowns();
  }, []);

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
        alert("Error: " + err.message);
      }
    } catch (error) {
      alert("Failed to create lead.");
    }
  };

  return (
    <div className="relative inset-0 flex justify-center items-start pt-10 overflow-y-auto z-50">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-[95%] max-w-[1200px] rounded-2xl shadow-2xl p-6 space-y-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-center">
          Enter the details to create the Lead
        </h2>

        <h3 className="text-lg font-semibold">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Lead Name", name: "name" },
            { label: "Organization Name", name: "company" },
            { label: "E-mail ID", name: "email" },
            { label: "Mobile Number", name: "mobile" },
            { label: "WhatsApp Number", name: "whatsapp" },
            { label: "Location", name: "location" },
            { label: "Address 1", name: "address1" },
            { label: "Address 2", name: "address2" },
            { label: "Pincode", name: "pincode" },
          ].map(({ label, name }) => (
            <div key={name}>
              <label className="text-sm font-medium">
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="mt-1 w-full border px-3 py-2 rounded"
              />
              {errors[name] && <p className="text-red-600 text-sm">{errors[name]}</p>}
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold">Lead Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Source", name: "source", options: dropdownData.sources },
            { label: "Service", name: "service", options: dropdownData.services },
            { label: "Assign To", name: "assignTo", options: dropdownData.employees },
            { label: "Lead status", name: "leadStatus", options: dropdownData.leadStatuses },
            { label: "Status", name: "status", options: dropdownData.statuses },
          ].map(({ label, name, options }) => (
            <div key={name}>
              <label className="text-sm font-medium">
                {label} <span className="text-red-500">*</span>
              </label>
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

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;
