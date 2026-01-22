import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { ENDPOINTS } from "../../../api/constraints"; // Adjust path if needed

const QuotationForm = ({ leadId, ilead_status_id, companyId, createdBy, onClose }) => {
  const [form, setForm] = useState({
    quotation_value: "",
    quotation_no: "",
    quotation_date: "",
    comments: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = ENDPOINTS.CUSTOM_STATUS;

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    // Basic validation
    if (!form.quotation_value || !form.quotation_no) {
      alert("Please fill in Quotation Value and Number");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        leadId: parseInt(leadId),
        ilead_status_id: ilead_status_id,
        companyId: companyId,
        data: form, // Backend expects the form object in 'data'
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
        throw new Error(result.Message || "Failed to submit quotation");
      }

      alert("Quotation saved successfully!");

      if (onClose) {
        onClose(); // Close parent dialog
      }
    } catch (err) {
      console.error("Quotation Form Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      <TextField
        label="Quotation Value"
        type="number"
        fullWidth
        value={form.quotation_value}
        onChange={e => update("quotation_value", e.target.value)}
      />

      <TextField
        label="Quotation Number"
        fullWidth
        value={form.quotation_no}
        onChange={e => update("quotation_no", e.target.value)}
      />

      <TextField
        label="Quotation Date"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        value={form.quotation_date}
        onChange={e => update("quotation_date", e.target.value)}
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
        sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#1565c0' } }}
      >
        {isSubmitting ? "Saving..." : "Save Quotation"}
      </Button>
    </Box>
  );
};

export default QuotationForm;

//import React, { useState } from "react";
// import { TextField } from "@mui/material";

// const QuotationForm = ({ value = {}, onChange }) => {
//   const [form, setForm] = useState({
//     quotation_value: value.quotation_value || "",
//     quotation_no: value.quotation_no || "",
//     quotation_date: value.quotation_date || "",
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
//         label="Quotation Value"
//         type="number"
//         fullWidth
//         sx={{ mt: 2 }}
//         value={form.quotation_value}
//         onChange={e => update("quotation_value", e.target.value)}
//       />

//       <TextField
//         label="Quotation Number"
//         fullWidth
//         sx={{ mt: 2 }}
//         value={form.quotation_no}
//         onChange={e => update("quotation_no", e.target.value)}
//       />

//       <TextField
//         label="Quotation Date"
//         type="date"
//         fullWidth
//         sx={{ mt: 2 }}
//         InputLabelProps={{ shrink: true }}
//         value={form.quotation_date}
//         onChange={e => update("quotation_date", e.target.value)}
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

// export default QuotationForm;
