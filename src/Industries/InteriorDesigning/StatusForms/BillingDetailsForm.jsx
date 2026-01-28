import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { ENDPOINTS } from "../../../api/constraints";

const BillingDetailsForm = ({ leadId, ilead_status_id, companyId, createdBy, onClose }) => {
  const [form, setForm] = useState({
    invoice_no: "",
    invoice_date: "",
    comments: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = ENDPOINTS.CUSTOM_STATUS;
  const MAX_LEN = 25;

  const update = (key, val) => {
    // Clamp invoice_no to 25 chars
    if (key === "invoice_no" && val.length > MAX_LEN) {
      val = val.slice(0, MAX_LEN);
    }
    
    setForm(prev => ({ ...prev, [key]: val }));
    
    // Clear error when user types/selects
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.invoice_no?.trim()) {
      newErrors.invoice_no = "Invoice Number is required ";
    } else if (form.invoice_no.length > MAX_LEN) {
      newErrors.invoice_no = `Max ${MAX_LEN} characters allowed`;
    }

    if (!form.invoice_date) {
      newErrors.invoice_date = "Invoice Date is required ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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
        throw new Error(result.Message || "Failed to save billing details");
      }

      alert("Billing details saved successfully!");
      if (onClose) onClose();
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
        label="Invoice Number "
        fullWidth
        required
        inputProps={{ maxLength: MAX_LEN }}
        value={form.invoice_no}
        onChange={e => update("invoice_no", e.target.value)}
        error={!!errors.invoice_no}
        helperText={errors.invoice_no}
        sx={{
          "& .MuiFormLabel-asterisk": {
            color: "#d32f2f",
          },
        }}
      />

      <TextField
        label="Invoice Date "
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        required
        value={form.invoice_date}
        onChange={e => update("invoice_date", e.target.value)}
        error={!!errors.invoice_date}
        helperText={errors.invoice_date}
        sx={{
          "& .MuiFormLabel-asterisk": {
            color: "#d32f2f",
          },
        }}
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