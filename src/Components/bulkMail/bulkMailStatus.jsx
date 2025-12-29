import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  IconButton
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const getIdsFromStorage = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const companyId = decoded.company_id || decoded.iCompany_id || decoded.companyId;
      const userId = decoded.user_id || decoded.iUser_id || decoded.userId;
      return { companyId, userId };
    } catch (e) { 
      return {}; 
    }
  }
  return {};
};

const BulkMailStatus = () => {
  const [mailData, setMailData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [sentClicked, setSentClicked] = useState(false);
  const [failedClicked, setFailedClicked] = useState(false);

  

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { companyId, userId } = getIdsFromStorage();

  const fetchStatus = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${ENDPOINTS.BULK_MAIL_GET_BY_USER}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // sort
      const sorted = (res.data.mails || []).sort(
        (a, b) => new Date(b.dcreated_dt) - new Date(a.dcreated_dt)
      );
      setMailData(sorted);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleResendMail = async (mail) => {
    setResendingId(mail.ilead_mail_id);
    const payload = {
      companyId,
      userId,
      mailSubject: mail.mail_subject,
      mailContent: mail.mail_content,
      cc: mail.cc || [],
      ilead_mail_id: mail.ilead_mail_id,
    };

    try {
      await axios.post(ENDPOINTS.BULK_MAIL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Resent Successfully");
      fetchStatus(); // Refresh after resend
    } catch (err) {
      alert("❌ Resend Failed");
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Records...</Typography>
      </Box>
    );
  }

  //  12-hour format helper
  const formatDateTime12h = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // FILTER LOGIC
  const filteredMails =
    statusFilter === "all"
      ? mailData
      : mailData.filter((m) => m.status === statusFilter);

  return (
    <Card sx={{ mt: 3, borderRadius: 3 }}>
      <CardContent>
        {/*  NEW HEADER LAYOUT - Status dropdown TITLE PAKKATHULA */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" gap={2} alignItems="center">
            {/* Title */}
            <Typography variant="h6" fontWeight="bold">
              Bulk Mail Delivery Logs
            </Typography>
            
            {/* Status Dropdown - TITLE IMMEDIATE PAKKATHULA */}
          
          </Box>

          {/* Right side buttons */}
          <Box display="flex" gap={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="small">
              Back
            </Button>
          </Box>
        </Box>

        {/* TABLE WITH FILTERED DATA */}
        {filteredMails.length === 0 ? (
          <Typography color="textSecondary">No mail history found.</Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #eee" }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#fafafa" }}>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>CC</TableCell>
                  <TableCell>Date & Time</TableCell>
                   <TableCell>
            {/* NEW STATUS HEADER WITH ARROWS */}
            <TableCell>
              <Box display="flex" alignItems="center" gap={0.5}>
                {/* Status text */}
                <Box fontWeight={500}>Status</Box>

                {/* Arrows one below another */}
                <Box display="flex" flexDirection="column" alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => {
                        if (sentClicked) {
                          setStatusFilter("all");
                          setSentClicked(false);
                        } else {
                          setStatusFilter("sent");
                          setSentClicked(true);
                          setFailedClicked(false);
                        }
                      }}
                    sx={{ color: "success.main", p: 0.2 }}
                  >
                    <KeyboardArrowUpIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                  onClick={() => {
                        if (failedClicked) {
                          setStatusFilter("all");
                          setFailedClicked(false);
                        } else {
                          setStatusFilter("failed");
                          setFailedClicked(true);
                          setSentClicked(false);
                        }
                      }}
                    sx={{ color: "error.main", p: 0.2 }}
                  >
                    <KeyboardArrowDownIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </TableCell>

          </TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMails.map((mail, index) => (
                  <TableRow key={mail.ilead_mail_id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{mail.cemail}</TableCell>
                    <TableCell>{mail.mail_subject || "-"}</TableCell>
                    <TableCell>
                      {Array.isArray(mail.cc) && mail.cc.length > 0
                        ? mail.cc.join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDateTime12h(mail.dcreated_dt)}</TableCell>
                    <TableCell align="center"> 
                      <Chip 
                        label={mail.status} 
                        size="small" 
                        color={mail.status === "sent" ? "success" : "error"} 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={resendingId !== null}
                        onClick={() => handleResendMail(mail)}
                        sx={{ minWidth: 100 }}
                      >
                        {resendingId === mail.ilead_mail_id ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkMailStatus;


// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { ENDPOINTS } from "../../api/constraints";
// import {
//   Card,
//   CardContent,
//   Typography,
//   Chip,
//   CircularProgress,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Button,
//   Box
// } from "@mui/material";
// import SendIcon from "@mui/icons-material/Send";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import { useNavigate } from "react-router-dom";

// const getIdsFromStorage = () => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     try {
//       const decoded = JSON.parse(atob(token.split(".")[1]));
//       const companyId = decoded.company_id || decoded.iCompany_id || decoded.companyId;
//       const userId = decoded.user_id || decoded.iUser_id || decoded.userId;
//       return { companyId, userId };
//     } catch (e) { return {}; }
//   }
//   return {};
// };

// const BulkMailStatus = () => {
//   const [mailData, setMailData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [resendingId, setResendingId] = useState(null);
  
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");
//   const { companyId, userId } = getIdsFromStorage();

//   const fetchStatus = async () => {
//     if (!userId) return;
//     try {
//       setLoading(true);
//       const res = await axios.get(`${ENDPOINTS.BULK_MAIL_GET_BY_USER}/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setMailData(res.data.mails || []);
//     } catch (err) {
//       console.error("Fetch Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStatus();
//   }, []);

//   const handleResendMail = async (mail) => {
//     setResendingId(mail.ilead_mail_id);
//     const payload = {
//       companyId,
//       userId,
//       mailSubject: mail.mail_subject,
//       mailContent: mail.mail_content,
//       cc: mail.cc || [],
//       ilead_mail_id: mail.ilead_mail_id,
//     };

//     try {
//       await axios.post(ENDPOINTS.BULK_MAIL, payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       alert("✅ Resent Successfully");
//       fetchStatus();
//     } catch (err) {
//       alert("❌ Resend Failed");
//     } finally {
//       setResendingId(null);
//     }
//   };

//   if (loading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
//         <CircularProgress />
//         <Typography sx={{ ml: 2 }}>Loading Records...</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Card sx={{ mt: 3, borderRadius: 3 }}>
//       <CardContent>
//         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//           <Typography variant="h6" fontWeight="bold">Bulk Mail Delivery Logs</Typography>
//           <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
//         </Box>

//         {mailData.length === 0 ? (
//           <Typography color="textSecondary">No mail history found.</Typography>
//         ) : (
//           <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #eee" }}>
//             <Table size="small">
//               <TableHead sx={{ backgroundColor: "#fafafa" }}>
//                 <TableRow>
//                   <TableCell>Recipient</TableCell>
//                   <TableCell>Subject</TableCell>
//                   <TableCell>Date & Time</TableCell>
//                   <TableCell>Status</TableCell>
//                   <TableCell align="center">Action</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {mailData.map((mail) => (
//                   <TableRow key={mail.ilead_mail_id} hover>
//                     <TableCell>{mail.cemail}</TableCell>
//                     <TableCell>{mail.mail_subject}</TableCell>
//                     <TableCell>{new Date(mail.dcreated_dt).toLocaleString()}</TableCell>
//                     <TableCell>
//                       <Chip 
//                         label={mail.status} 
//                         size="small" 
//                         color={mail.status === "sent" ? "success" : "error"} 
//                         variant="outlined"
//                       />
//                     </TableCell>
//                     <TableCell align="center">
//                       <Button
//                         size="small"
//                         variant="contained"
//                         disabled={resendingId !== null}
//                         onClick={() => handleResendMail(mail)}
//                         sx={{ minWidth: 100 }}
//                       >
//                         {resendingId === mail.ilead_mail_id ? (
//                           <CircularProgress size={16} color="inherit" />
//                         ) : (
//                           "Resend"
//                         )}
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default BulkMailStatus;




// -----------------------------------------------------------------------------

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { ENDPOINTS } from "../../api/constraints";
// import {
//   Card,
//   CardContent,
//   Typography,
//   Chip,
//   CircularProgress,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Button,
// } from "@mui/material";
// import SendIcon from "@mui/icons-material/Send";

// // Get companyId and userId safely from token or localStorage
// const getIdsFromStorage = () => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     try {
//       const decoded = JSON.parse(atob(token.split(".")[1]));
//       // console.log("token", decoded)
//       const companyId = decoded.company_id || decoded.iCompany_id || decoded.companyId;
//       const userId = decoded.user_id || decoded.iUser_id || decoded.userId;
//       if (companyId && userId) return { companyId, userId };
//     } catch {}
//   }
//   try {
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (user?.iCompany_id && user?.iUser_id) return { companyId: user.iCompany_id, userId: user.iUser_id };
//   } catch {}
//   return { companyId: undefined, userId: undefined };
// };

// const BulkMailStatus = () => {
//   const [mailData, setMailData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [resendingId, setResendingId] = useState(null);

//   const token = localStorage.getItem("token");
//   const { companyId, userId } = getIdsFromStorage();

//   const fetchStatus = async () => {
//     if (!userId) return;
//     setLoading(true);
//     try {
//       const res = await axios.get(`${ENDPOINTS.BULK_MAIL_GET_BY_USER}/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setMailData(res.data.mails || []);
//     } catch (err) {
//       console.error("Status Fetch Failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStatus();
//   }, []);

//   const handleResendMail = async (mail) => {
//     if (!companyId || !userId) return;

//     setResendingId(mail.ilead_mail_id);

//     const payload = {
//       companyId, // always from storage
//       userId, // always from storage
//       mailSubject: mail.mail_subject || "Resending previous mail",
//       mailContent: mail.mail_content || "<p>Resending previous mail content</p>",
//       cc: mail.cc || [], // default empty array if none
//       ilead_mail_id: mail.ilead_mail_id, // important for backend
//     };

//     try {
//       await axios.post(ENDPOINTS.BULK_MAIL, payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       alert(`✅ Mail resent successfully for ${mail.cemail}`);
//       fetchStatus(); // refresh table after resend
//     } catch (err) {
//       console.error("Resend Failed:", err);
//       alert("❌ Resend failed. Check console.");
//     } finally {
//       setResendingId(null);
//     }
//   };

//   if (loading)
//     return (
//       <Card sx={{ mt: 3, py: 6, textAlign: "center" }}>
//         <CircularProgress />
//       </Card>
//     );

//   return (
//     <Card sx={{ mt: 3 }}>
//       <CardContent>
//         <Typography variant="h6" fontWeight={600} gutterBottom>
//           Bulk Mail Status
//         </Typography>

//         {mailData.length === 0 ? (
//           <Typography>No Records Found</Typography>
//         ) : (
//           <TableContainer component={Paper} sx={{ mt: 2 }}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>Email</TableCell>
//                   <TableCell>Subject</TableCell>
//                   <TableCell>Content</TableCell>
//                   <TableCell>Created</TableCell>
//                   <TableCell>Status</TableCell>
//                   <TableCell>Action</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {mailData.map((mail) => (
//                   <TableRow key={mail.ilead_mail_id}>
//                     <TableCell>{mail.cemail}</TableCell>
//                     <TableCell>{mail.mail_subject || "—"}</TableCell>
//                     <TableCell>
//                       <div dangerouslySetInnerHTML={{ __html: mail.mail_content || "—" }} />
//                     </TableCell>
//                     <TableCell>{new Date(mail.dcreated_dt).toLocaleString()}</TableCell>
//                     <TableCell>
//                       <Chip
//                         label={mail.status}
//                         color={mail.status === "sent" ? "success" : "warning"}
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Button
//                         variant="contained"
//                         size="small"
//                         endIcon={<SendIcon />}
//                         disabled={resendingId === mail.ilead_mail_id}
//                         onClick={() => handleResendMail(mail)}
//                       >
//                         {resendingId === mail.ilead_mail_id ? "Resending..." : "Resend"}
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default BulkMailStatus;
