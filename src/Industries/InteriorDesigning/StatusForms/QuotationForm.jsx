import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { ENDPOINTS } from "../../../api/constraints";

const QuotationForm = ({ leadId, ilead_status_id, companyId, createdBy, onClose }) => {
  const [form, setForm] = useState({
    quotation_value: "",
    quotation_no: "",
    quotation_date: "",
    comments: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = ENDPOINTS.CUSTOM_STATUS;
  const MAX_LEN = 25;

  const update = (key, val) => {
    // Clamp length for required fields
    if ((key === "quotation_value" || key === "quotation_no") && val.length > MAX_LEN) {
      val = val.slice(0, MAX_LEN);
    }
    setForm(prev => ({ ...prev, [key]: val }));
    
    // ✅ FIXED: Clear specific error when user types
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.quotation_value?.toString().trim()) {
      newErrors.quotation_value = "Quotation Value is required ";
    } else if (form.quotation_value.toString().length > MAX_LEN) {
      newErrors.quotation_value = `Max ${MAX_LEN} characters allowed`;
    }

    if (!form.quotation_no?.trim()) {
      newErrors.quotation_no = "Quotation Number is required ";
    } else if (form.quotation_no.length > MAX_LEN) {
      newErrors.quotation_no = `Max ${MAX_LEN} characters allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // ✅ FIXED: Use validateForm() instead of old alert()
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        leadId: parseInt(leadId),
        ilead_status_id: ilead_status_id,
        companyId: companyId,
        data: form,
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
      if (onClose) onClose();
    } catch (err) {
      console.error("Quotation Form Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      {/* ✅ Add * to labels for consistency */}
      <TextField
        label="Quotation Value "
        type="number"
        fullWidth
        required
        inputProps={{ maxLength: MAX_LEN }}
        value={form.quotation_value}
        onChange={e => update("quotation_value", e.target.value)}
        error={!!errors.quotation_value}
        helperText={errors.quotation_value}
        sx={{
          "& .MuiFormLabel-asterisk": {
            color: "#d32f2f",
          },
        }}
      />

      <TextField
        label="Quotation Number "
        fullWidth
        required
        inputProps={{ maxLength: MAX_LEN }}
        value={form.quotation_no}
        onChange={e => update("quotation_no", e.target.value)}
        error={!!errors.quotation_no}
        helperText={errors.quotation_no}
        sx={{
          "& .MuiFormLabel-asterisk": {
            color: "#d32f2f",
          },
        }}
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
        label="Remarks"
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