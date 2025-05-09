import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
const apiEndPoint = import.meta.env.VITE_API_URL;

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
    console.error("Invalid or missing JWT token");
  }

  const [form, setForm] = useState({
    iLeadpoten_id: "",
    ileadstatus_id: "",
    cindustry_id: "",
    lead_source_id: 1,
    ino_employee: 0,
    clead_name: "",
    cemail: "",
    corganization: "",
    cwebsite: "www.com",
    icity: 1,
    iphone_no: "",
    cgender: 1,
    clogo: "logo.png",
    clead_address1: "",
    clead_address2: "",
    clead_address3: "",
    cservices: "No services entered",
    clead_owner: userId,
    cresponded_by: userId,
    modified_by: userId,
  });

  const [errors, setErrors] = useState({});
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [Potential, setPotential] = useState([]);
  const [status, setStatus] = useState([]);
  const [leadIndustry, setIndustry] = useState([]);

  useEffect(() => {
    const leadPotential = async () => {
      try {
        const response = await fetch(`${apiEndPoint}/lead-potential`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log("Can't fetch lead potential", response);
        }

        const data = await response.json();
        setPotential(data);
      } catch (e) {
        console.log("Error in fetching lead potential", e);
      }
    };

    const leadStatus = async () => {
      try {
        const response = await fetch(`${apiEndPoint}/lead-status/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log("Can't fetch lead status", response);
        }

        const data = await response.json();
        setStatus(data);
      } catch (e) {
        console.log("Can't fetch lead status", e);
      }
    };

    const leadIndustry = async () => {
      try {
        const response = await fetch(`${apiEndPoint}/lead-industry/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log("Can't fetch lead industry", response);
        }

        const data = await response.json();
        setIndustry(data);
      } catch (e) {
        console.log("Error in fetching lead industry", e);
      }
    };

    leadStatus();
    leadPotential();
    leadIndustry();
  }, [token]);

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

    // const validationErrors = validateForm();
    // if (Object.keys(validationErrors).length > 0) {
    //   setErrors(validationErrors);
    //   console.error("Form validation errors:", validationErrors);
    //   return;
    // }

    const formData = {
      bactive: true,
      cemail: form.cemail,
      cgender: 1,
      cimage: "noimg.png",
      clead_address1: form.clead_address1,
      clead_address2: form.clead_address2,
      clead_address3: form.clead_address3,
      clead_city: 1,
      clead_name: form.clead_name,
      clead_owner: userId,
      clogo: "logo.png",
      corganization: form.corganization,
      cresponded_by: userId,
      ileadstatus_id: Number(form.ileadstatus_id),
      cindustry_id: Number(form.cindustry_id),
    
      iLeadpoten_id: Number(form.iLeadpoten_id),
      cwebsite: "No website entered here",
      dmodified_dt: new Date().toISOString(),
      cservices: form.cservices,
      ino_employee: 0,
      icity: 1,
      icompany_id: company_id,
      lead_source_id: 1,
      iphone_no: form.iphone_no,
      iproject_value: 0,
      modified_by: userId,
      iuser_tags: userId,
    };

    try {
      const res = await fetch(`${apiEndPoint}/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      console.log("Form submitted:", formData);
      console.info("Server response:", resData);

      if (res.ok) {
        alert("Lead created successfully!");
        onClose();
      } else {
        // alert(res);
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
<div className="flex flex-wrap gap-4">

  <div className="flex flex-col">
    <label className="h-10 p-2 block text-sm font-medium text-gray-700 mb-1">Lead potential:</label>
    <select
      name="iLeadpoten_id"
      value={form.ileadpoten_id}
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
      name="leadsource_id"
      value={form.leadsource_id}
      onChange={handleChange}
      className="p-2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition h-10 w-60"
    >
      
      <option value="">lead source</option>
      <option value={1}>Office</option>
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
