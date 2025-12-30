import React, { useState, useEffect, use } from "react";
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
  FormControl,
  Select,           
  MenuItem,
  Checkbox,
  ListItemText,
   IconButton,
  
} from "@mui/material";
import { ENDPOINTS } from "../../api/constraints";
import SendIcon from "@mui/icons-material/Send";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

// Helper functions (unchanged)
const validateEmail = (email) =>
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

const isQuillContentEmpty = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return !div.textContent.trim() && !div.querySelector("img,video");
};

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
  const [leadOptions, setLeadOptions] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [alert, setAlert] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  const navigate = useNavigate();
  const { companyId, userId } = getIdsFromStorage();
  const token = localStorage.getItem("token");

  // Safe array check
  const isLeadOptionsArray = Array.isArray(leadOptions) && leadOptions.length > 0;
  const isAllLeadsSelected = leadOptions.length > 0 && 
    selectedLeadIds.length === leadOptions.length && 
    selectedLeadIds.every(id => leadOptions.some(lead => lead.id === id));

  // Fetch leads (unchanged)

  const getWordCount = (str) => str.trim().split(/\s+/).filter(Boolean).length;
  const handleSubjectChange = (e) => {
  const newValue = e.target.value;
  const currentWordCount = newValue.trim().split(/\s+/).filter(Boolean).length;
  
  if (currentWordCount <= 50) {
    setSubject(newValue);
  } else {
    const words = newValue.trim().split(/\s+/).filter(Boolean);
    const limitedValue = words.slice(0, 50).join(" ");
    setSubject(limitedValue);
  }
};

    const getQuillWordCount = (html) => {
      if (!html) return 0;
      const div = document.createElement("div");
      div.innerHTML = html;
      const text = div.textContent || div.innerText || "";
      return text.trim().split(/\s+/).filter(Boolean).length;
    };
    const handleContentChange = (value) => {
      const wordCount = getQuillWordCount(value);
      
      if (wordCount <= 1000) {
        setContent(value);
      } else {
      
        setAlert("❌ Email body cannot exceed 1000 words");
      }
    };
  useEffect(() => {
    const fetchLeads = async () => {
      if (!companyId || !token) {
        setIsLoadingLeads(false);
        return;
      }
      
      try {
        setIsLoadingLeads(true);
        const leadsUrl = ENDPOINTS.BULK_MAIL_ACTIVE_LEADS_GET_BY_COMPANYID(companyId);
        const res = await axios.get(leadsUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
       const rawLeads = Array.isArray(res.data) ? res.data : [];

        //  A to Z Alphabetical Sorting Logic
        const sortedLeads = [...rawLeads].sort((a, b) => {
          const nameA = a.name ? a.name.toLowerCase() : "";
          const nameB = b.name ? b.name.toLowerCase() : "";
          return nameA.localeCompare(nameB);
        });
        
        setLeadOptions(sortedLeads);
      } catch (err) {
        console.error("❌ Leads fetch error:", err.response?.data || err.message);
        setLeadOptions([]);
      } finally {
        setIsLoadingLeads(false);
      }
    };
    
    fetchLeads();
  }, [companyId, token]);

  const addCC = () => {
    if (!ccEmail.trim()) {
      setAlert("❌ Enter CC email");
      return;
    }
    if (!validateEmail(ccEmail)) {
      setAlert("❌ Enter valid CC Email address");
      return;
    }
    if (ccList.includes(ccEmail.toLowerCase())) {
      setAlert("❌ Email already added to CC");
      setCCEmail("");
      return;
    }
    
    const emailLower = ccEmail.toLowerCase().trim();
    setCCList([...ccList, emailLower]);
    setCCEmail("");
    setAlert("✅ CC email added");
    setTimeout(() => setAlert(""), 2000);
  };

  const removeCC = (email) => {
    setCCList(ccList.filter((c) => c !== email));
  };

  const handleLeadChange = (event) => {
    const value = event.target.value;
    
    if (value.includes("ALL")) {
      if (selectedLeadIds.length === leadOptions.length) {
        setSelectedLeadIds([]);
      } else {
        setSelectedLeadIds(leadOptions.map(l => l.id));
      }
    } else {
      setSelectedLeadIds(value);
    }
  };

  const handleSendMail = async () => {
    if (!subject.trim()) { 
      setAlert("❌ Subject is required"); 
      return; 
    }
    if (isQuillContentEmpty(content)) { 
      setAlert("❌ Content is required"); 
      return; 
    }
    if (!companyId) { 
      setAlert("❌ Company ID missing"); 
      return; 
    }
    if (selectedLeadIds.length === 0 && !isAllLeadsSelected && ccList.length === 0) { 
    setAlert("❌ Select leads OR add CC recipients"); 
    return; 
  }

    const payload = {
      companyId: Number(companyId),
      userId: Number(userId),
      mailSubject: subject,
      mailContent: content,
      cc: ccList,
      allLeads: isAllLeadsSelected,
      leadIds: !isAllLeadsSelected ? selectedLeadIds : [],
     ccOnly: ccList.length > 0 && selectedLeadIds.length === 0 && !isAllLeadsSelected  
    };
    
  // console.log("🚀 SEND PAYLOAD:", {
  //   leads: payload.leadIds.length || 'ALL',
  //   cc: payload.cc,
  //   ccOnly: payload.ccOnly
  // });

    try {
      setIsSending(true);
      setAlert("");
      
      await axios.post(ENDPOINTS.BULK_MAIL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const successMsg = isAllLeadsSelected 
        ? `✅ Sent to ALL ${leadOptions.length} leads!`
        : `✅ Sent to ${selectedLeadIds.length} selected leads!`;
      
      setAlert(successMsg);
      setSubject(""); setContent(""); setCCList([]); setSelectedLeadIds([]);
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Sending Failed";
      setAlert(`❌ ${errorMsg}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card sx={{ p: 3, borderRadius: 4, boxShadow: "0px 4px 20px rgba(0,0,0,0.1)" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>

       <Stack direction="row" alignItems="center" spacing={1.5}>
        {/* BOLD BACK BUTTON */}
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ 
            color: "#1976D2", 
            backgroundColor: "#f0f7ff",
            border: "2px solid #1976D2", 
            "&:hover": { backgroundColor: "#e3f2fd" },
            p: 0.8
          }}
        >
          <ArrowBackIcon sx={{ fontWeight: "bold", fontSize: "1.5rem" }} />
        </IconButton>

        <Typography variant="h5" fontWeight="bold" sx={{ color: "#1976D2", display: 'flex', alignItems: 'center', gap: 1 }}>
           Bulk Email Broadcast
        </Typography>
      </Stack>
        <Button 
          startIcon={<HistoryIcon />} 
          onClick={() => navigate("/mailstatus")}
          disabled={isSending} 
          variant="outlined" 
          size="medium"
          sx={{ borderRadius: 2, 
          textTransform: 'none', 
          fontWeight: 700, 
          px: 2,
          backgroundColor: "#1976D2", // Primary Blue
          color: "white", // White Text
          "&:hover": {
            backgroundColor: "#1565C0", 
          },
          boxShadow: "0px 4px 10px rgba(25, 118, 210, 0.2)"}}
        >
          View History
        </Button>
      </Box>
        {alert && (
          <Alert severity={alert.includes("✅") ? "success" : "error"} sx={{ mb: 2, borderRadius: 2 }}>
            {alert}
          </Alert>
        )}

        {/* Subject */}
      <Box sx={{ mb: 3, mt: 1 }}>
        <Typography variant="body2" sx={{ mb: 1, color: "gray", fontWeight: 600 }}>
          Email Subject <span style={{ color: 'red' }}>*</span>
        </Typography>
        <TextField
          fullWidth 
          variant="outlined"
          value={subject} 
          onChange={handleSubjectChange}
          disabled={isSending} 
          placeholder="Max 50 words"
          helperText={`${getWordCount(subject)}/50 words`}
          error={getWordCount(subject) >= 50}
        />
      </Box>
        {/* Leads Dropdown */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth disabled={isSending || isLoadingLeads}>
            <Typography variant="body2" sx={{ mb: 1, color: "gray", fontWeight: 600 }}>
              Select Recipients <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Select
              multiple
              value={isAllLeadsSelected ? leadOptions.map(l => l.id) : selectedLeadIds}
              onChange={handleLeadChange}
              displayEmpty
              renderValue={(selected) => {
                if (isLoadingLeads) return "Loading leads...";
                if (!isLeadOptionsArray) return "No leads available";
                if (selected.length === 0) return "Choose leads to send email";
                if (isAllLeadsSelected) return `${leadOptions.length} Leads (All)`;
                return `${selected.length}/${leadOptions.length} leads selected`;
              }}
            >
              <MenuItem value="ALL">
                <Checkbox checked={isAllLeadsSelected} />
                <ListItemText primary={`👥 All Leads (${leadOptions.length || 0})`} />
              </MenuItem>
              {isLeadOptionsArray && leadOptions.map((lead) => (
                <MenuItem key={lead.id} value={lead.id}>
                  <Checkbox checked={selectedLeadIds.includes(lead.id)} />
                  <ListItemText primary={lead.name} secondary={lead.email} />
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5, color: "text.secondary", display: 'block' }}>
              {selectedLeadIds.length === 0 ? "Select leads or 'All Leads' to send" :
               isAllLeadsSelected ? `All ${leadOptions.length} leads selected` :
               `${selectedLeadIds.length}/${leadOptions.length} leads ready`}
            </Typography>
          </FormControl>
        </Box>

        {/* Email Body */}
        <Box sx={{ mb: 10 }}> 
          <Typography variant="body2" sx={{ mb: 1, color: "gray", fontWeight: 600 }}>
            Email Body Content <span style={{ color: 'red' }}>*</span>
          </Typography>
          
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={handleContentChange} 
            style={{ height: "250px" }} 
            readOnly={isSending}
            placeholder="Max 100 words allowed..." 
          />
          
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 1, 
              display: 'block', 
              textAlign: 'right',
              color: getQuillWordCount(content) > 1000 ? "red" : "gray" 
            }}
          >
            {getQuillWordCount(content)} / 1000 words
          </Typography>
        </Box>

              {/* ✅ CC Section */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: "#1976D2" }}>
              👥 CC Recipients (Optional)
            </Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
          <TextField
            label="Add CC Email"
            size="small"
            value={ccEmail}
            onChange={(e) => setCCEmail(e.target.value)}
            disabled={isSending}
            placeholder="admin@company.com"
            error={ccEmail.trim() && !validateEmail(ccEmail.trim())}
            helperText={ccEmail.trim() && !validateEmail(ccEmail.trim()) ? "Invalid email" : ""}
            sx={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && !isSending && addCC()}
          />
          <Button 
            variant="outlined" 
            onClick={addCC} 
            disabled={isSending || !ccEmail.trim() || !validateEmail(ccEmail.trim())}
            sx={{ minWidth: 90 }}
          >
            Add CC
          </Button>
        </Stack>


        {ccList.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'success.main', fontWeight: 500 }}>
              ✅ CC added - will receive copies
            </Typography>
            <Stack direction="row" flexWrap="wrap" spacing={1}>
              {ccList.map((email) => (
                <Chip key={email} label={email} onDelete={() => removeCC(email)} 
                  disabled={isSending} size="small" color="primary" />
              ))}
              <Chip label={`CC: ${ccList.length}`} color="info" size="small" />
            </Stack>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
            Emails will go to selected leads only (add CC above if needed)
          </Typography>
        )}
        {/* Buttons */}
        <Box display="flex" justifyContent="center" mt={2}>
      
         <Button
            variant="contained"
            onClick={handleSendMail}
            disabled={isSending || isLoadingLeads || 
              (selectedLeadIds.length === 0 && !isAllLeadsSelected && ccList.length === 0)}
            sx={{ minWidth: 260, py: 1.5 }}
            endIcon={!isSending && <SendIcon />}
          >
            {isSending ? (
              <CircularProgress size={24} color="inherit" />
            ) : ccList.length > 0 && selectedLeadIds.length === 0 && !isAllLeadsSelected ? (
              `📧 Send to ${ccList.length} CC Only`
            ) : isAllLeadsSelected ? (
              `📤 Send to ALL (${leadOptions.length})${ccList.length > 0 ? ` + ${ccList.length} CC` : ''}`
            ) : selectedLeadIds.length > 0 ? (
              `📧 Send to ${selectedLeadIds.length}${ccList.length > 0 ? ` + ${ccList.length} CC` : ' Selected'}`
            ) : (
              "👆 Add CC or Select Leads"
            )}
          </Button>

        </Box>
      </CardContent>
    </Card>
  );
};

export default BulkMailSender;



// import React, { useState } from "react";
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
//   CircularProgress,
// } from "@mui/material";
// import { ENDPOINTS } from "../../api/constraints";
// import SendIcon from "@mui/icons-material/Send";
// import HistoryIcon from "@mui/icons-material/History";
// import { useNavigate } from "react-router-dom";

// // Helper: Email Validation
// const validateEmail = (email) =>
//   /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

// // Helper: Quill Empty Check
// const isQuillContentEmpty = (html) => {
//   const div = document.createElement("div");
//   div.innerHTML = html;
//   return !div.textContent.trim() && !div.querySelector("img,video");
// };

// // Helper: ID Extraction
// const getIdsFromStorage = () => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     try {
//       const decoded = JSON.parse(atob(token.split(".")[1]));
//       const companyId = decoded.company_id || decoded.iCompany_id || decoded.companyId;
//       const userId = decoded.user_id || decoded.iUser_id || decoded.userId;
//       if (companyId && userId) return { companyId, userId };
//     } catch (e) { console.error("Token Error", e); }
//   }
//   return { companyId: undefined, userId: undefined };
// };

// const BulkMailSender = () => {
//   const [subject, setSubject] = useState("");
//   const [content, setContent] = useState("");
//   const [ccEmail, setCCEmail] = useState("");
//   const [ccList, setCCList] = useState([]);
//   const [alert, setAlert] = useState("");
//   const [isSending, setIsSending] = useState(false); // Loading State

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
//     setAlert("");
//   };

//   const removeCC = (email) => {
//     setCCList(ccList.filter((c) => c !== email));
//   };

//   const handleSendMail = async () => {
//     if (!subject.trim()) { setAlert("❌ Subject is required"); return; }
//     if (isQuillContentEmpty(content)) { setAlert("❌ Content is required"); return; }
//     if (!companyId) { setAlert("❌ Company ID missing"); return; }

//     const payload = {
//       companyId: Number(companyId),
//       userId: Number(userId),
//       mailSubject: subject,
//       mailContent: content,
//       cc: ccList,
//     };

//     try {
//       setIsSending(true);
//       setAlert("");
//       await axios.post(ENDPOINTS.BULK_MAIL, payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setAlert("✅ Bulk Email Broadcast Started Successfully!");
//       setSubject("");
//       setContent("");
//       setCCList([]);
//     } catch (err) {
//       const errorMsg = err.response?.data?.message || "Sending Failed";
//       setAlert(`❌ ${errorMsg}`);
//       console.error(err);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   return (
//     <Card sx={{ p: 3, borderRadius: 4, boxShadow: "0px 4px 20px rgba(0,0,0,0.1)" }}>
//       <CardContent>
//         <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#1976D2" }}>
//           ✉ Bulk Email Broadcast
//         </Typography>

//         {alert && (
//           <Alert severity={alert.includes("✅") ? "success" : "error"} sx={{ mb: 2, borderRadius: 2 }}>
//             {alert}
//           </Alert>
//         )}

//         <TextField
//           fullWidth
//           label="Email Subject"
//           variant="outlined"
//           value={subject}
//           onChange={(e) => setSubject(e.target.value)}
//           disabled={isSending}
//           sx={{ mb: 3, mt: 1 }}
//         />

//         <Typography variant="body2" sx={{ mb: 1, color: "gray" }}>Email Body Content:</Typography>
//         <Box sx={{ mb: 8 }}>
//           <ReactQuill
//             theme="snow"
//             value={content}
//             onChange={setContent}
//             style={{ height: "250px" }}
//             readOnly={isSending}
//           />
//         </Box>

//         <Divider sx={{ my: 3 }} />

//         <Stack direction="row" spacing={2} alignItems="center">
//           <TextField
//             label="Add CC Email"
//             size="small"
//             value={ccEmail}
//             onChange={(e) => setCCEmail(e.target.value)}
//             disabled={isSending}
//             sx={{ flex: 1 }}
//           />
//           <Button variant="outlined" onClick={addCC} disabled={isSending}>Add CC</Button>
//         </Stack>

//         <Stack direction="row" flexWrap="wrap" spacing={1} mt={2}>
//           {ccList.map((email) => (
//             <Chip key={email} label={email} onDelete={() => removeCC(email)} disabled={isSending} />
//           ))}
//         </Stack>

//         <Box display="flex" justifyContent="space-between" mt={4}>
//           <Button
//             startIcon={<HistoryIcon />}
//             onClick={() => navigate("/mailstatus")}
//             disabled={isSending}
//           >
//             View Sent History
//           </Button>

//           <Button
//             variant="contained"
//             onClick={handleSendMail}
//             disabled={isSending}
//             sx={{ minWidth: 180, py: 1.2 }}
//             endIcon={!isSending && <SendIcon />}
//           >
//             {isSending ? <CircularProgress size={24} color="inherit" /> : "Send Broadcast"}
//           </Button>
//         </Box>
//       </CardContent>
//     </Card>
//   );
// };

// export default BulkMailSender;
