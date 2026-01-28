import React, { useState } from "react";
import { TextField, MenuItem, Button, Box } from "@mui/material";
import { ENDPOINTS } from "../../../api/constraints";

const PaymentStatusForm = ({ leadId, ilead_status_id, companyId, createdBy, onClose }) => {
  const [form, setForm] = useState({
    payment_status: "",
    paid_amount: "",
    balance_amount: "",
    payment_date: "",
    next_payment_date: "",
    comments: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = ENDPOINTS.CUSTOM_STATUS;

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    
    // Clear error when user types/selects
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Payment Status is always mandatory
    if (!form.payment_status?.trim()) {
      newErrors.payment_status = "Payment Status is required ";
    }

    // FULL payment validations
    if (form.payment_status === "FULL") {
      if (!form.paid_amount || parseFloat(form.paid_amount) <= 0) {
        newErrors.paid_amount = "Paid Amount is required ";
      }
      if (!form.payment_date) {
        newErrors.payment_date = "Payment Date is required ";
      }
    }

    // PARTIAL payment validations
    if (form.payment_status === "PARTIAL") {
      if (!form.paid_amount || parseFloat(form.paid_amount) <= 0) {
        newErrors.paid_amount = "Paid Amount is required ";
      }
      if (!form.balance_amount || parseFloat(form.balance_amount) <= 0) {
        newErrors.balance_amount = "Balance Amount is required ";
      }
      if (!form.next_payment_date) {
        newErrors.next_payment_date = "Next Payment Date is required ";
      }
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
        throw new Error(result.Message || "Failed to submit payment status");
      }

      alert("Payment status saved successfully!");
      if (onClose) onClose();
    } catch (err) {
      console.error("Payment Form Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      <TextField
        select
        label="Payment Status "
        fullWidth
        required
        value={form.payment_status}
        onChange={e => update("payment_status", e.target.value)}
        error={!!errors.payment_status}
        helperText={errors.payment_status}
        sx={{
          "& .MuiFormLabel-asterisk": {
            color: "#d32f2f",
          },
        }}
      >
        <MenuItem value="FULL">Fully Paid</MenuItem>
        <MenuItem value="PARTIAL">Partially Paid</MenuItem>
      </TextField>

      {form.payment_status === "FULL" && (
        <>
          <TextField
            label="Amount "
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: "0.01" }}
            value={form.paid_amount}
            onChange={e => update("paid_amount", e.target.value)}
            error={!!errors.paid_amount}
            helperText={errors.paid_amount}
            sx={{
              "& .MuiFormLabel-asterisk": {
                color: "#d32f2f",
              },
            }}
          />
          <TextField
            label="Payment Date "
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
            value={form.payment_date}
            onChange={e => update("payment_date", e.target.value)}
            error={!!errors.payment_date}
            helperText={errors.payment_date}
            sx={{
              "& .MuiFormLabel-asterisk": {
                color: "#d32f2f",
              },
            }}
          />
        </>
      )}

      {form.payment_status === "PARTIAL" && (
        <>
          <TextField
            label="Paid Amount "
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: "0.01" }}
            value={form.paid_amount}
            onChange={e => update("paid_amount", e.target.value)}
            error={!!errors.paid_amount}
            helperText={errors.paid_amount}
            sx={{
              "& .MuiFormLabel-asterisk": {
                color: "#d32f2f",
              },
            }}
          />
          <TextField
            label="Balance Amount "
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: "0.01" }}
            value={form.balance_amount}
            onChange={e => update("balance_amount", e.target.value)}
            error={!!errors.balance_amount}
            helperText={errors.balance_amount}
            sx={{
              "& .MuiFormLabel-asterisk": {
                color: "#d32f2f",
              },
            }}
          />
          <TextField
            label="Next Payment Date "
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
            value={form.next_payment_date}
            onChange={e => update("next_payment_date", e.target.value)}
            error={!!errors.next_payment_date}
            helperText={errors.next_payment_date}
            sx={{
              "& .MuiFormLabel-asterisk": {
                color: "#d32f2f",
              },
            }}
          />
        </>
      )}

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
          '&:hover': { bgcolor: '#1565c0' } 
        }}
      >
        {isSubmitting ? "Saving..." : "Save Payment Status"}
      </Button>
    </Box>
  );
};

export default PaymentStatusForm;