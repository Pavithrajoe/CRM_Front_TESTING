import React, { useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
  Stack,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import { ENDPOINTS } from "../../api/constraints";
import SendIcon from "@mui/icons-material/Send";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";

// Helper: Email Validation
const validateEmail = (email) =>
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

// Helper: Quill Empty Check
const isQuillContentEmpty = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return !div.textContent.trim() && !div.querySelector("img,video");
};

// Helper: ID Extraction
const getIdsFromStorage = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const companyId = decoded.company_id || decoded.iCompany_id || decoded.companyId;
      const userId = decoded.user_id || decoded.iUser_id || decoded.userId;
      if (companyId && userId) return { companyId, userId };
    } catch (e) { console.error("Token Error", e); }
  }
  return { companyId: undefined, userId: undefined };
};

const BulkMailSender = () => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [ccEmail, setCCEmail] = useState("");
  const [ccList, setCCList] = useState([]);
  const [alert, setAlert] = useState("");
  const [isSending, setIsSending] = useState(false); // Loading State

  const navigate = useNavigate();
  const { companyId, userId } = getIdsFromStorage();
  const token = localStorage.getItem("token");

  const addCC = () => {
    if (!validateEmail(ccEmail)) {
      setAlert("❌ Enter a valid CC Email address");
      return;
    }
    if (!ccList.includes(ccEmail)) {
      setCCList([...ccList, ccEmail]);
      setCCEmail("");
    }
    setAlert("");
  };

  const removeCC = (email) => {
    setCCList(ccList.filter((c) => c !== email));
  };

  const handleSendMail = async () => {
    if (!subject.trim()) { setAlert("❌ Subject is required"); return; }
    if (isQuillContentEmpty(content)) { setAlert("❌ Content is required"); return; }
    if (!companyId) { setAlert("❌ Company ID missing"); return; }

    const payload = {
      companyId: Number(companyId),
      userId: Number(userId),
      mailSubject: subject,
      mailContent: content,
      cc: ccList,
    };

    try {
      setIsSending(true);
      setAlert("");
      await axios.post(ENDPOINTS.BULK_MAIL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlert("✅ Bulk Email Broadcast Started Successfully!");
      setSubject("");
      setContent("");
      setCCList([]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Sending Failed";
      setAlert(`❌ ${errorMsg}`);
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card sx={{ p: 3, borderRadius: 4, boxShadow: "0px 4px 20px rgba(0,0,0,0.1)" }}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#1976D2" }}>
          ✉ Bulk Email Broadcast
        </Typography>

        {alert && (
          <Alert severity={alert.includes("✅") ? "success" : "error"} sx={{ mb: 2, borderRadius: 2 }}>
            {alert}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email Subject"
          variant="outlined"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isSending}
          sx={{ mb: 3, mt: 1 }}
        />

        <Typography variant="body2" sx={{ mb: 1, color: "gray" }}>Email Body Content:</Typography>
        <Box sx={{ mb: 8 }}>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            style={{ height: "250px" }}
            readOnly={isSending}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Add CC Email"
            size="small"
            value={ccEmail}
            onChange={(e) => setCCEmail(e.target.value)}
            disabled={isSending}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" onClick={addCC} disabled={isSending}>Add CC</Button>
        </Stack>

        <Stack direction="row" flexWrap="wrap" spacing={1} mt={2}>
          {ccList.map((email) => (
            <Chip key={email} label={email} onDelete={() => removeCC(email)} disabled={isSending} />
          ))}
        </Stack>

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            startIcon={<HistoryIcon />}
            onClick={() => navigate("/mailstatus")}
            disabled={isSending}
          >
            View Sent History
          </Button>

          <Button
            variant="contained"
            onClick={handleSendMail}
            disabled={isSending}
            sx={{ minWidth: 180, py: 1.2 }}
            endIcon={!isSending && <SendIcon />}
          >
            {isSending ? <CircularProgress size={24} color="inherit" /> : "Send Broadcast"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BulkMailSender;

// import React, { useState ,useRef } from "react";
// import axios from "axios";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
// import {
//   Card,
//   CardContent,
//   Typography,
//   TextField,
//   Button,
//   Chip,
//   Divider,
//   Stack,
//   Alert,
//   Box,
// } from "@mui/material";
// import { ENDPOINTS } from "../../api/constraints";
// import SendIcon from "@mui/icons-material/Send";
// import { useNavigate } from "react-router-dom";


// // Simple email regex for validation
// const validateEmail = (email) =>
//   /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

// // Advanced ReactQuill content empty check
// const isQuillContentEmpty = (html) => {
//   const div = document.createElement("div");
//   div.innerHTML = html;
//   return !div.textContent.trim() && !div.querySelector("img,video");
// };

// const getIdsFromStorage = () => {
//   // Try JWT token first
//   const token = localStorage.getItem("token");
//   if (token) {
//     try {
//       const decoded = JSON.parse(atob(token.split(".")[1]));
//       // console.log("token",decoded)
//       const companyId = decoded.company_id || decoded.iCompany_id || decoded.companyId;
//       const userId = decoded.user_id || decoded.iUser_id || decoded.userId;
//       if (companyId && userId) return { companyId, userId };
//     } catch {}
//   }
//   // Fallback to localStorage user object
//   try {
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (user?.iCompany_id && user?.iUser_id)
//       return { companyId: user.iCompany_id, userId: user.iUser_id };
//   } catch {}
//   return { companyId: undefined, userId: undefined };
// };

// const BulkMailSender = () => {
//   const [subject, setSubject] = useState("");
//   const [content, setContent] = useState("");
//   const [ccEmail, setCCEmail] = useState("");
//   const [ccList, setCCList] = useState([]);
//   const [alert, setAlert] = useState("");
//   const navigate = useNavigate();
//   const { companyId, userId } = getIdsFromStorage();
//   const token = localStorage.getItem("token");

//   const addCC = () => {
//     if (!validateEmail(ccEmail)) {
//       setAlert("❌ Enter a valid CC Email address");
//       return;
//     }
//     if (!ccList.includes(ccEmail)) {
//       setCCList([...ccList, ccEmail]);
//       setCCEmail("");
//     }
//     setAlert(""); // clear any previous alert
//   };

//   const removeCC = (email) => {
//     setCCList(ccList.filter((c) => c !== email));
//   };

//   const handleMailStatus = () => {
//     navigate("/mailstatus");
//   };

//   const handleSendMail = async () => {
//     if (!subject.trim()) {
//       setAlert("Subject is required");
//       return;
//     }
//     if (isQuillContentEmpty(content)) {
//       setAlert("Content is required");
//       return;
//     }
//     if (!companyId || !userId) {
//       setAlert("❌ Cannot send: company or user ID missing");
//       return;
//     }

//     const payload = {
//       companyId,
//       userId,
//       mailSubject: subject,
//       mailContent: content,
//       cc: ccList,
//     };

//     try {
//       setAlert("");
//       await axios.post(ENDPOINTS.BULK_MAIL, payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setAlert("✅ Bulk Email Sent Successfully!");
//       setSubject("");
//       setContent("");
//       setCCList([]);
//     } 
//     catch (err) {
//       setAlert("❌ Sending Failed. Check console.");
//       console.error(err);
//     }
//   };

//   return (
//     <Card sx={{ p: 3, borderRadius: 5, boxShadow: "0px 6px 20px rgba(0,0,0,0.15)", background: "#ffffff",}} >
//   <CardContent>
//     <Typography
//       variant="h5"
//       fontWeight="bold"
//       sx={{
//         mb: 1,
//         background: "linear-gradient(90deg, #1976D2, #21CBF3)",
//         WebkitBackgroundClip: "text",
//         WebkitTextFillColor: "transparent",
//       }}
//     >
//       ✉ Bulk Email Broadcast
//     </Typography>

//     {alert && (
//       <Alert
//         severity={alert.includes("✅") ? "success" : "error"}
//         sx={{ mt: 2, borderRadius: 3 }}
//       >
//         {alert}
//       </Alert>
//     )}

//     <TextField
//       fullWidth
//       variant="outlined"
//       label="Email Subject"
//       sx={{ mt: 3 }}
//       value={subject}
//       onChange={(e) => setSubject(e.target.value)}
//     />

//     <Typography fontSize={14} sx={{ mt: 2 }}> Email Body (HTML Supported) </Typography>

//     <div style={{ borderRadius: "10px", overflow: "hidden", marginTop: "8px" }}>
//       <ReactQuill
//         theme="snow"
//         value={content}
//         onChange={setContent}
//         style={{ height: "220px" }}
//       />
//     </div>

//     <Divider sx={{ my: 3 }} />

//     <Stack direction="row" spacing={1} alignItems="flex-end">
//       <TextField
//         label="Add CC Email"
//         variant="outlined"
//         size="small"
//         value={ccEmail}
//         onChange={(e) => setCCEmail(e.target.value)}
//         error={!!ccEmail && !validateEmail(ccEmail)}
//         helperText={ccEmail && !validateEmail(ccEmail) ? "Invalid Email" : ""}
//         sx={{
//           flex: 1, // takes half width if stack total width allows
//           maxWidth: "50%", // restrict to half
//           '& .MuiInputBase-root': {
//             height: 36,
//             fontSize: "13px",
//           },
//           '& .MuiFormHelperText-root': {
//             fontSize: "10px",
//           },
//         }}
//       />
//       <Button
//         variant="outlined"
//         size="small"
//         onClick={addCC}
//         sx={{
//           px: 2,
//           py: 0.7,
//           fontSize: "13px",
//           fontWeight: 600,
//           borderRadius: 1.5,
//           minHeight: 36,
//           transition: "0.3s",
//           "&:hover": {
//             boxShadow: "0px 4px 14px rgba(33, 203, 243, .4)",
//           },
//         }}
//       >
//         Add
//       </Button>
//    </Stack>

//     <Stack direction="row" flexWrap="wrap" spacing={1} mt={2}>
//       {ccList.map((email, i) => (
//         <Chip key={i} label={email} onDelete={() => removeCC(email)} />
//       ))}
//     </Stack>

//     <Button
//       variant="contained"
//       endIcon={<SendIcon />}
//       sx={{
//         mt: 3,
//         px: 3,
//         py: 1,
//         fontSize: "14px",
//         fontWeight: 600,
//         borderRadius: 2,
//         alignSelf: "flex-end",
//         transition: "0.3s",
//         "&:hover": {
//           boxShadow: "0px 4px 14px rgba(33, 203, 243, .4)",
//         },
//       }}
//       onClick={handleSendMail}
//     >
//       Send Bulk Mail
//     </Button>
//     <Box display="flex" justifyContent="flex-end" mt={3}>
//       <Button
//         variant="contained"
//         // endIcon={<SendIcon />}
//         sx={{
//           px: 3,
//           py: 1,
//           fontSize: "14px",
//           fontWeight: 600,
//           borderRadius: 2,
//           transition: "0.3s",
//           "&:hover": {
//             boxShadow: "0px 4px 14px rgba(33, 203, 243, .4)",
//           },
//         }}
//         onClick={handleMailStatus}
//       >
//         Sent Mail status
//       </Button>
//     </Box>

//   </CardContent>
// </Card>

//   );
// };

// export default BulkMailSender;
