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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = ENDPOINTS.CUSTOM_STATUS;
  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.payment_status) {
      alert("Please select a payment status");
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
      
      if (onClose) {
        onClose();
      }
      
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
        label="Payment Status"
        fullWidth
        value={form.payment_status}
        onChange={e => update("payment_status", e.target.value)}
      >
        <MenuItem value="FULL">Fully Paid</MenuItem>
        <MenuItem value="PARTIAL">Partially Paid</MenuItem>
      </TextField>

      {form.payment_status === "FULL" && (
        <>
          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={form.paid_amount}
            onChange={e => update("paid_amount", e.target.value)}
          />
          <TextField
            label="Payment Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.payment_date}
            onChange={e => update("payment_date", e.target.value)}
          />
        </>
      )}

      {form.payment_status === "PARTIAL" && (
        <>
          <TextField
            label="Paid Amount"
            type="number"
            fullWidth
            value={form.paid_amount}
            onChange={e => update("paid_amount", e.target.value)}
          />
          <TextField
            label="Balance Amount"
            type="number"
            fullWidth
            value={form.balance_amount}
            onChange={e => update("balance_amount", e.target.value)}
          />
          <TextField
            label="Next Payment Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.next_payment_date}
            onChange={e => update("next_payment_date", e.target.value)}
          />
        </>
      )}

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
        {isSubmitting ? "Saving..." : "Save Payment Status"}
      </Button>
    </Box>
  );
};

export default PaymentStatusForm;




// import React, { useState } from "react";
// import { TextField, MenuItem, Button, Box, Typography } from "@mui/material";

// const PaymentStatusForm = ({ leadId, ilead_status_id, companyId, createdBy }) => {
//   const [form, setForm] = useState({
//     payment_status: "",
//     paid_amount: "",
//     balance_amount: "",
//     payment_date: "",
//     next_payment_date: "",
//     comments: "",
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // YOUR API URL
//   const API_URL = "http://192.168.29.236:3000/api/custom-status";

//   const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

//   const handleSubmit = async () => {
//     if (!form.payment_status) {
//       alert("Please select a payment status");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // 1. Get token from localStorage
//       const token = localStorage.getItem("token"); 

//       const payload = {
//         leadId: parseInt(leadId),
//         ilead_status_id: ilead_status_id,
//         companyId: companyId,
//         // BACKEND KEY CHANGE: Use 'data' instead of 'formData' 
//         // to match req.body.data in your controller
//         data: form, 
//         comments: form.comments || "",
//       };

//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: { 
//           "Content-Type": "application/json",
//           // 2. SEND THE TOKEN
//           "Authorization": `Bearer ${token}` 
//         },
//         body: JSON.stringify(payload),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.Message || "Failed to submit payment status");
//       }

//       alert("Payment status saved successfully!");
      
//       // Clear form logic...
//     } catch (err) {
//       console.error(err);
//       alert(`Error: ${err.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
//       <TextField
//         select
//         label="Payment Status"
//         fullWidth
//         value={form.payment_status}
//         onChange={e => update("payment_status", e.target.value)}
//       >
//         <MenuItem value="FULL">Fully Paid</MenuItem>
//         <MenuItem value="PARTIAL">Partially Paid</MenuItem>
//       </TextField>

//       {form.payment_status === "FULL" && (
//         <>
//           <TextField
//             label="Amount"
//             type="number"
//             fullWidth
//             value={form.paid_amount}
//             onChange={e => update("paid_amount", e.target.value)}
//           />
//           <TextField
//             label="Payment Date"
//             type="date"
//             fullWidth
//             InputLabelProps={{ shrink: true }}
//             value={form.payment_date}
//             onChange={e => update("payment_date", e.target.value)}
//           />
//         </>
//       )}

//       {form.payment_status === "PARTIAL" && (
//         <>
//           <TextField
//             label="Paid Amount"
//             type="number"
//             fullWidth
//             value={form.paid_amount}
//             onChange={e => update("paid_amount", e.target.value)}
//           />
//           <TextField
//             label="Balance Amount"
//             type="number"
//             fullWidth
//             value={form.balance_amount}
//             onChange={e => update("balance_amount", e.target.value)}
//           />
//           <TextField
//             label="Next Payment Date"
//             type="date"
//             fullWidth
//             InputLabelProps={{ shrink: true }}
//             value={form.next_payment_date}
//             onChange={e => update("next_payment_date", e.target.value)}
//           />
//         </>
//       )}

//       <TextField
//         label="Comments"
//         multiline
//         rows={2}
//         fullWidth
//         value={form.comments}
//         onChange={e => update("comments", e.target.value)}
//       />

//       <Button
//         variant="contained"
//         fullWidth
//         onClick={handleSubmit}
//         disabled={isSubmitting}
//         sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#1565c0' } }}
//       >
//         {isSubmitting ? "Saving..." : "Save Payment Status"}
//       </Button>
//     </Box>
//   );
// };

// export default PaymentStatusForm;