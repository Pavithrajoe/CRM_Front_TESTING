import React, { useState } from "react";
import { TextField, MenuItem, Button, Box } from "@mui/material";
import { ENDPOINTS } from "../../../api/constraints"; // Adjust path if needed

const orderOptions = [
  "Order Confirmed",
  "Negotiation",
  "Need Time to Confirm"
];

const OrderStatusForm = ({ leadId, ilead_status_id, companyId, createdBy, onClose }) => {
  const [form, setForm] = useState({
    order_status: "",
    comments: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = ENDPOINTS.CUSTOM_STATUS;

    const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    
    
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };
    const validateForm = () => {
    const newErrors = {};

    if (!form.order_status?.trim()) {
      newErrors.order_status = "Order Status is required ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async () => {
    if (!form.order_status) {
      alert("Please select an order status");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        leadId: parseInt(leadId),
        ilead_status_id: ilead_status_id,
        companyId: companyId,
        data: form, // Backend maps this to the JSON column
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
        throw new Error(result.Message || "Failed to submit order status");
      }

      alert("Order status saved successfully!");

      if (onClose) {
        onClose(); // Closes the Dialog in StatusBar.js
      }
    } catch (err) {
      console.error("Order Form Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
       <TextField
        select
        label="Order Status "
        fullWidth
        required
        value={form.order_status}
        onChange={e => update("order_status", e.target.value)}
        error={!!errors.order_status}
        helperText={errors.order_status}
        sx={{
          "& .MuiFormLabel-asterisk": {
            color: "#d32f2f",
          },
        }}
      >
        {orderOptions.map(opt => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </TextField>

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
        {isSubmitting ? "Saving..." : "Save Order Status"}
      </Button>
    </Box>
  );
};

export default OrderStatusForm;

