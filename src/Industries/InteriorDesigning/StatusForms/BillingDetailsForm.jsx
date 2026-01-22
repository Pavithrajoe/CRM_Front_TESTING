import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { ENDPOINTS } from "../../../api/constraints"; // Adjust path as needed

const BillingDetailsForm = ({ leadId, ilead_status_id, companyId, createdBy, onClose }) => {
  const [form, setForm] = useState({
    invoice_no: "",
    invoice_date: "",
    comments: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = ENDPOINTS.CUSTOM_STATUS;

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    // Basic validation
    if (!form.invoice_no || !form.invoice_date) {
      alert("Please provide both Invoice Number and Date");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        leadId: parseInt(leadId),
        ilead_status_id: ilead_status_id,
        companyId: companyId,
        data: form, // Backend maps this to the JSON 'data' field
        comments: form.comments || "",
        createdBy: createdBy,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.Message || "Failed to save billing details");
      }

      alert("Billing details saved successfully!");

      if (onClose) {
        onClose(); // Closes the dialog in StatusBar.js
      }
    } catch (err) {
      console.error("Billing Form Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      <TextField
        label="Invoice Number"
        fullWidth
        value={form.invoice_no}
        onChange={e => update("invoice_no", e.target.value)}
      />

      <TextField
        label="Invoice Date"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        value={form.invoice_date}
        onChange={e => update("invoice_date", e.target.value)}
      />

      <TextField
        label="Comments"
        multiline
        rows={2}
        fullWidth
        value={form.comments}
        onChange={e => update("comments", e.target.value)}
      />

      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmit}
        disabled={isSubmitting}
        sx={{ 
          bgcolor: '#1976d2', 
          color: 'white', 
          '&:hover': { bgcolor: '#1565c0' },
          mt: 1 
        }}
      >
        {isSubmitting ? "Saving..." : "Save Billing Details"}
      </Button>
    </Box>
  );
};

export default BillingDetailsForm;

// import React, { useState } from "react";
// import { TextField } from "@mui/material";

// const BillingDetailsForm = ({ value = {}, onChange }) => {
//   const [form, setForm] = useState({
//     invoice_no: value.invoice_no || "",
//     invoice_date: value.invoice_date || "",
//     comments: value.comments || "",
//   });

//   const update = (key, val) => {
//     const updated = { ...form, [key]: val };
//     setForm(updated);
//     onChange(updated);
//   };

//   return (
//     <>
//       <TextField
//         label="Invoice Number"
//         fullWidth
//         sx={{ mt: 2 }}
//         value={form.invoice_no}
//         onChange={e => update("invoice_no", e.target.value)}
//       />

//       <TextField
//         label="Invoice Date"
//         type="date"
//         fullWidth
//         sx={{ mt: 2 }}
//         InputLabelProps={{ shrink: true }}
//         value={form.invoice_date}
//         onChange={e => update("invoice_date", e.target.value)}
//       />

//       <TextField
//         label="Comments"
//         multiline
//         rows={3}
//         fullWidth
//         sx={{ mt: 2 }}
//         value={form.comments}
//         onChange={e => update("comments", e.target.value)}
//       />
//     </>
//   );
// };

// export default BillingDetailsForm;
