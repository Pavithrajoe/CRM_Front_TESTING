import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const LeadForm = ({ onClose }) => {
  const token = localStorage.getItem("token");
  let userId = "";
  let company_id = ""; // ✅ Declare company_id
  
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
    console.error("Invalid or missing JWT token"); // Log for debugging
  }

  const [form, setForm] = useState({
    clead_name: "",
    cemail: "",
    corganization: "",
    cwebsite:"www.com",
    icity: 1,
    iphone_no: "",
    cgender: 1,
    clogo: "logo.png",
   
    clead_address1: "",
    clead_address2: "",
    clead_address3: "", // Corrected default value

    cservices: "",

    ileadstatus_id: 2,
    clead_owner: userId,
    cresponded_by: userId,
    ino_employee: 10,
    icompany_id: company_id,
    iLeadpoten_id: 1,
    iuser_tags:userId,
  });
  
  const [errors, setErrors] = useState({});
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    services: [],
    sources: [],
    employees: [],
    leadStatuses: [],
    statuses: [],
  });

  useEffect(() => {
    // Simulate API call to fetch dropdown values
    const fetchDropdowns = async () => {
      try {
        setDropdownData({
          services: ["Web", "Mobile", "Design"],
          sources: ["Google", "LinkedIn", "Referral"],
          employees: ["Employee A", "Employee B", "Employee C"],
          leadStatuses: [1, 2, 3],
          statuses: [1, 2, 3],
        });
      } catch (err) {
        console.error("Failed to fetch dropdowns", err);
      }
    };

    fetchDropdowns();
  }, []);

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

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

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
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "clead_address2" && !value) {
        newErrors[key] = "This field is required";
      } else {
        const inlineErr = validateField(key, value);
        if (inlineErr) newErrors[key] = inlineErr;
      }
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const apiEndPoint = import.meta.env.VITE_API_URL;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      console.error("Form validation errors:", validationErrors);
      return;
    }

    try {
      // Merge form data with hardcoded parameters like userId, company_id, etc.
      const formData = {
        bactive:true,
        cemail:form.cemail,
     
        cgender:1,
        cimage:"noimg.png",
        clead_address1: form.clead_address1,
        clead_address2: form.clead_address2,
        clead_address3:form.clead_address3,
        clead_city: 1,
        clead_name:form.clead_name,
        clead_owner: userId,
        clogo:"logo.png",
        corganization:form.corganization,
        cresponded_by: userId,
        cservices:form.cservices,
        cwebsite: "No website entered here",
        cindustry_id: 1,
        dmodified_dt: new Date().toISOString(),
        iLeadpoten_id: 1,
        icity: 1,
        icompany_id: company_id,
        ileadstatus_id: 2 ,
        ino_employee: 0,  
        iphone_no:form.iphone_no,
        iproject_value: 0,
        iuser_tags: userId,          // Add this field
        modified_by: userId,    // Add this field
      };
      
     console.log("entered User data:",formData)
      const res = await fetch(`${apiEndPoint}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      console.log("Form submitted:", formData);
      console.info("Server response:", resData);

      if (res.ok) {
        alert("Lead created successfully!");
        onClose();
      } else {
        alert(res);
      }
    } catch (error) {
      console.error("Submit error:", error);
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
        <h2 className="text-xl font-bold text-center">Enter the details to create the Lead</h2>

        {/* Customer Details Section */}
        <h3 className="text-lg font-semibold">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Lead Name", name: "clead_name", required: true },
            { label: "Organization Name", name: "corganization", required: true },
            { label: "E-mail ID", name: "cemail", required: true },
            { label: "Mobile Number", name: "iphone_no", required: true },
            { label: "WhatsApp Number", name: "whatsapp", required: true },
            // { label: "Location", name: "clead_address3", required: true },
            { label: "Address 1", name: "clead_address1", required: true },
            { label: "Address 2", name: "clead_address2", required: false },
            { label: "Address 3", name: "clead_address3", required: true },
          ].map(({ label, name, required }) => (
            <div key={name}>
              <label className="text-sm font-medium">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="mt-1 w-full border px-3 py-2 rounded"
                disabled={name === "whatsapp" && sameAsPhone}
              />
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
        <h3 className="text-lg font-semibold">Lead Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Source", name: "source", options: dropdownData.sources },
            { label: "Service", name: "cservices", options: dropdownData.services },
          
            { label: "Lead Status", name: "ileadstatus_id", options: dropdownData.leadStatuses },
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
                className="mt-1 w-full border px-3 py-2 rounded"
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );

};

export default LeadForm;