import React, { useState, useEffect , useRef  } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ProfileCard from "../Components/common/ProfileCard";
import Comments from "../Components/commandshistory";
import Tasks from "../Components/task";
import RemainderPage from "../pages/RemainderPage";
import StatusBar from "./StatusBar";
import LeadTimeline from "../Components/LeadTimeline";
import ActionCard from "../Components/common/ActrionCard";
import QuotationForm from "../Components/Quotation/QuotationForm";
import { ENDPOINTS } from "../api/constraints";
import { usePopup } from "../context/PopupContext";
import { MdEmail, MdExpandMore, MdExpandLess } from "react-icons/md";
import { Close, Download, Visibility } from "@mui/icons-material";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Confetti from "react-confetti";
import { FaFilePdf, FaEye, FaEdit, FaDownload, FaPlus, FaCheck } from 'react-icons/fa';
import { generateQuotationPDF } from '../Components/utils/pdfGenerator';
import PostSalesForm from "../Industries/Marketing/XcodeFix/Components/postSales/postSalesForm";

// const XCODEFIX_COMPANY_ID = import.meta.env.VITE_XCODEFIX_FLOW;
const XCODEFIX_COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);


// PDF Viewer Component
  const PDFViewer = ({ open, onClose, pdfUrl, quotationNumber, onDownload }) => {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          style: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6">
            Quotation: {quotationNumber}
          </Typography>
          <Box>
            <IconButton onClick={onDownload} color="primary" title="Download PDF">
              {/* <Download /> */}
            </IconButton>
            <IconButton onClick={onClose} title="Close">
              <Close />
            </IconButton>

          </Box>
        </Box>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              width="100%" 
              height="100%" 
              frameBorder="0"
              title={`Quotation-${quotationNumber}`}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Generating PDF...</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const LeadDetailView = () => {
    const { leadId } = useParams();
    const { showPopup } = usePopup();

      const lostReasonDialogRef = useRef(null);

    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.only('xs'));
    const isSm = useMediaQuery(theme.breakpoints.only('sm'));
    const isMd = useMediaQuery(theme.breakpoints.only('md'));
    const isLg = useMediaQuery(theme.breakpoints.only('lg'));
    const isXl = useMediaQuery(theme.breakpoints.up('xl'));
    
    // State declarations
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isDeal, setIsDeal] = useState(false);
    const [isLost, setIsLost] = useState(false);
    const [leadData, setLeadData] = useState(null);
    const [leadLostDescriptionTrue, setLeadLostDescriptionTrue] = useState(false);
    const [lostReasons, setLostReasons] = useState([]);
    const [selectedLostReasonId, setSelectedLostReasonId] = useState("");
    const [lostDescription, setLostDescription] = useState("");
    const [showConfetti, setShowConfetti] = useState(false);
    const [immediateWonStatus, setImmediateWonStatus] = useState(false);
    const [isMailOpen, setIsMailOpen] = useState(false);
    const [sentTo, setSentTo] = useState("");
    const [mailSubject, setMailSubject] = useState("");
    const [mailContent, setMailContent] = useState("");
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [loggedInUserName, setLoggedInUserName] = useState("Your Name");
    const [loggedInCompanyName, setLoggedInCompanyName] = useState("Your Company");
    const [ccRecipients, setCcRecipients] = useState("");
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [isSendingMail, setIsSendingMail] = useState(false);
    const [statusRemarks, setStatusRemarks] = useState([]);
    const [users, setUsers] = useState([]);
    const [urlUserId, setUrlUserId] = useState(null); 
    const [loadingProfile, setLoadingProfile] = useState(false);
    // for post sales form
    const [showPostSalesForm, setShowPostSalesForm] = useState(false);

    // New states for Quotation
    const [showQuotationForm, setShowQuotationForm] = useState(false);
    const [quotations, setQuotations] = useState([]);
    const [showQuotationsList, setShowQuotationsList] = useState(false);
    const [quotationsLoading, setQuotationsLoading] = useState(false);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [expandedQuotation, setExpandedQuotation] = useState(null);
    const [currencies, setCurrencies] = useState([]);

    // PDF Viewer states
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
    const [currentQuotation, setCurrentQuotation] = useState(null);
    const [showRemarkDialog, setShowRemarkDialog] = useState(false);
    const [remarkData, setRemarkData] = useState({ remark: '', projectValue: '',currencyId: null  });
    const [profileSettings, setProfileSettings] = useState(null);
    const [userSettings, setUserSettings] = useState({
        mail_access: false,
        whatsapp_access: false,
        phone_access: false,
        website_access: false
      });

    // Derived state
    const isLeadActive =
      !isLost && !isWon && !immediateWonStatus && !(leadData?.bisConverted === true);
    const showActionButtons = !loading && isLeadActive;
    const showCreateQuotationButton = (isWon || immediateWonStatus || leadData?.bisConverted) && !showQuotationForm;
      const showProjectValue = (isWon || immediateWonStatus || leadData?.bisConverted);


    // Get the latest project value from status remarks
    const latestProjectValue = statusRemarks.length > 0 
      ? statusRemarks[statusRemarks.length - 1] 
      : null;
    
    const projectValueDisplay = latestProjectValue 
      ? `${latestProjectValue.currency_details?.symbol || '₹'} ${latestProjectValue.project_value || 0}` 
      : null;

    const handleTabChange = (event, newValue) => setTabIndex(newValue);
    const handleReasonChange = (e) => setSelectedLostReasonId(e.target.value);

    // Extract company info from localStorage
    const extractAllUserInfo = () => {
      try {
        const token = localStorage.getItem("token");
        let userData = null;

        if (token) {
          const base64Payload = token.split(".")[1];
          const decodedPayload = atob(base64Payload);
          userData = JSON.parse(decodedPayload);
        } else {
          const storedUserData = localStorage.getItem("user");
          if (storedUserData) {
            userData = JSON.parse(storedUserData);
          } else {
            throw new Error("User data not found in localStorage.");
          }
        }

        const companyData = {
          company_id: userData.company_id,
          icurrency_id: userData.icurrency_id || 2,
          iCreated_by: userData.user_id,
        };
        setCompanyInfo(userData);

        setLoggedInUserName(userData.cFull_name || userData.fullName || "User");
        setLoggedInCompanyName(userData.company_name || userData.organization || "Your Company");
        
      } catch (error) {
        console.error("Error extracting user info:", error);
        showPopup("Error", "Failed to load user and company information", "error");
      }
    };

    useEffect(() => {
      if (leadId) {
        fetchLeadData();
        fetchLostReasons();
        fetchQuotations();
        extractAllUserInfo();
      }
    }, [leadId]);

  // Add this useEffect to call fetchUserProfile when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication required!");
          setLoadingProfile(false);
          return;
        }

        // Decode JWT token to extract user ID
        const base64Payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(base64Payload));
        const userId = decodedPayload?.id || decodedPayload?.user_id;

        // If no ID in token, use fallback or show error
        if (!userId && !urlUserId) {
          toast.error("User ID not found!");
          setLoadingProfile(false);
          return;
        }

        const finalUserId = urlUserId || userId;

        // Fetch user details
        const response = await fetch(`${ENDPOINTS.USERS}/${finalUserId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch user");
        setProfileSettings(data)
              // Update settings
              setUserSettings({
                mail_access: data.mail_access || data.email_access || false,
                whatsapp_access: data.whatsapp_access || false,
                phone_access: data.phone_access || false,
                website_access: data.website_access || false,
              });

            } catch (err) {
              console.error("Error fetching user:", err);
              toast.error("Failed to load user details.");
            } finally {
              setLoadingProfile(false);
            }
          };

          fetchUserProfile();
        }, [urlUserId]);

    // PDF View Handler
  const handleViewPdf = async (quotation) => {
    try {
      if (!companyInfo || !leadData) {
        showPopup('Error', 'Missing company or lead data. Please try again.', 'error');
        return;
      }
      
      // Show loading state immediately
      setCurrentPdfUrl(null);
      setCurrentQuotation(quotation);
      setPdfViewerOpen(true);
      
      // Generate the PDF and get the data URL
      const pdfDataUrl = await generateQuotationPDF(quotation, companyInfo, leadData, true);
      
      // Set the PDF URL to display in viewer
      setCurrentPdfUrl(pdfDataUrl);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      showPopup('Error', error.message || 'Failed to generate PDF', 'error');
      setPdfViewerOpen(false);
    }
  };
    // PDF Download Handler
  const handleDownloadPdf = async (quotation) => {
    try {
      if (!companyInfo || !leadData) {
        showPopup('Error', 'Missing company or lead data. Please try again.', 'error');
        return;
      }
      const handleDownload = async () => {
    await generateQuotationPDF(quotation, companyInfo, leadData);
  };
    
      showPopup('Success', `PDF downloaded successfully!`, 'success');
    } catch (error) {
      console.error("Error generating PDF:", error);
      showPopup('Error', error.message || 'Failed to generate PDF', 'error');
    }
  };


    // Download from PDF Viewer
    const handleDownloadFromViewer = async () => {
      if (currentQuotation) {
        await handleDownloadPdf(currentQuotation);
      }
    };

    // New handler for Won button
    const handleWonClick = () => {
      setShowRemarkDialog(true);
    };

    const handleRemarkSubmit = async () => {
    if (!remarkData.remark.trim()) {
      showPopup("Error", "Remark is required", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(localStorage.getItem("user"))?.iUser_id;
      if (!userId) throw new Error("User not authenticated");

      setImmediateWonStatus(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      const convertResponse = await fetch(`${ENDPOINTS.CONVERT_TO_DEAL}/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      

      if (!convertResponse.ok) {
        setImmediateWonStatus(false);
        setShowConfetti(false);
        throw new Error("Failed to convert lead to deal");
      }

      const remarkPayload = {
        remark: remarkData.remark.trim(),
        leadId: parseInt(leadId),
        leadStatusId: leadData?.ileadstatus_id,
        createBy: userId,
        ...(remarkData.projectValue && { projectValue: parseFloat(remarkData.projectValue) }),
        currencyId: remarkData.currencyId,
      };

      const remarkResponse = await fetch(ENDPOINTS.STATUS_REMARKS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(remarkPayload),
      });

      if (!remarkResponse.ok) {
        throw new Error("Failed to submit remark");
      }

      await remarkResponse.json();
      await fetchStatusRemarks();

      showPopup("Success", "Lead marked as won and remark saved!", "success");
      setIsDeal(true);
      setIsWon(true);
      setIsLost(false);
      setShowRemarkDialog(false);
      fetchLeadData();
    } catch (error) {
      console.error("Error marking lead as won:", error);
      showPopup("Error", error.message || "Failed to mark lead as won", "error");
    }
  };

    const handleQuotationCreated = async (quotationData) => {
      try {
        showPopup("Success", "Quotation created successfully!", "success");
        setShowQuotationForm(false);
        setQuotations(prev => [quotationData, ...prev]);
        fetchQuotations();
      } catch (error) {
        console.error("Error creating quotation:", error);
        showPopup("Error", error.message || "Failed to create quotation", "error");
      }
    };
  const handleLostClick = () => {
    if (!lostReasons || lostReasons.length === 0) {
      showPopup(
        "Info",
        "No Lost Reasons available. Please set your reasons in masters or contact your admin.",
        "info"
      );
      return;
    }

    setLeadLostDescriptionTrue(true);
  };


    const toggleQuotationExpand = (quotationId, e) => {
      if (e) {
        e.stopPropagation();
      }
      
      if (expandedQuotation === quotationId) {
        setExpandedQuotation(null);
      } else {
        setExpandedQuotation(quotationId);
      }
    };

    const fetchCurrencies = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(ENDPOINTS.CURRENCY, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCurrencies(data.data.data.filter(c => c.bactive));
        }
      } catch (error) {
        console.error("Failed to fetch currencies", error);
      }
    };
    const handleCloseMail = () => {
    setIsMailOpen(false);
  };

    useEffect(() => {
      fetchCurrencies();
    }, []);

    const lostLead = async () => {
      try {
        const token = localStorage.getItem("token");
        let userId = null;
        if (token) {
          const base64Payload = token.split(".")[1];
          const decodedPayload = atob(base64Payload);
          const payloadObject = JSON.parse(decodedPayload);
          userId = payloadObject.iUser_id;
        } else {
          return;
        }

        if (!selectedLostReasonId) {
          showPopup("Error", "Please select a reason for marking as lost.", "error");
          return;
        }

        const response = await fetch(`${ENDPOINTS.CONVERT_TO_LOST}/${leadId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "Lost",
            userId,
            LeadLostReasonId: parseInt(selectedLostReasonId),
            description: lostDescription,
          }),
        });

        if (!response.ok) {
          showPopup("Error", "Failed to update lead as lost", "error");
          return;
        }

        showPopup("Info", "Lead updated as lost", "info");
        setLeadLostDescriptionTrue(false);
        setSelectedLostReasonId("");
        setLostDescription("");
        setIsLost(true);
        setIsDeal(false);
        setIsWon(false);
        setImmediateWonStatus(false);
        fetchLeadData();
      } catch (error) {
        console.error("Error marking lead as lost:", error);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      await lostLead();
    };

    const fetchStatusRemarks = async () => {
      try {
        const token = localStorage.getItem("token");
              const endpointsToTry = [
          `${ENDPOINTS.STATUS_REMARKS}/${leadId}`,
          `${ENDPOINTS.STATUS_REMARKS}?leadId=${leadId}`,
          `${ENDPOINTS.STATUS_REMARKS}?iLead_id=${leadId}`,
          `${ENDPOINTS.STATUS_REMARKS}/${leadId}/remarks`
        ];

        let response = null;
        let successfulEndpoint = null;
        let lastError = null;

        // Try each endpoint until one works
        for (const endpoint of endpointsToTry) {
          try {
            response = await fetch(endpoint, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              successfulEndpoint = endpoint;
              break;
            } else {
              console.warn("Endpoint failed with status:", response.status);
            }
          } catch (error) {
        lastError = error;
        console.warn("Failed with endpoint:", endpoint, error);
        continue;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error("All endpoint formats failed");
    }

    const data = await response.json();
    
    // Handle different response structures
    const remarks = data.Response || data.data || data || [];
    setStatusRemarks(Array.isArray(remarks) ? remarks : [remarks]);
    
  }
  catch (error) {
    console.error("Error fetching status remarks:", error);
    if (showPopup) {
      showPopup("Error", error.message || "Failed to fetch status remarks", "error");
    }
  }
  };

  // Call the function if leadId is available
  useEffect(() => {
    if (leadId) {
      fetchStatusRemarks();
    }
  }, [leadId, showPopup]);

  const sendEmail = async () => {
    setIsSendingMail(true);
    try {
      const token = localStorage.getItem("token");
      const leadIdAsNumber = parseInt(leadId, 10);
      
      // Check if the conversion was successful
      if (isNaN(leadIdAsNumber)) {
          showPopup("Error", "Invalid lead ID. Please refresh the page.", "error");
          setIsSendingMail(false);
          return;
      }

      const response = await fetch(`${ENDPOINTS.SENTMAIL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sent_to: sentTo,
          cc: ccRecipients,
          mailSubject,
          mailContent,
          leadId: leadIdAsNumber, // Use the converted number here
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error("Failed to send mail. Backend says:", resData);
        showPopup("Error", resData.message || "Failed to send mail", "error");
        return;
      }

      showPopup("Success", "Email sent successfully!", "success");
      setIsMailOpen(false);
      setSentTo("");
      setCcRecipients("");
      setMailSubject("");
      setMailContent("");
    } catch (error) {
      console.error("Error sending mail:", error);
      showPopup("Error", "Something went wrong while sending email", "error");
    } finally {
      setIsSendingMail(false);
    }
  };

  useEffect(() => {
      const handleClickOutside = (event) => {
        if (lostReasonDialogRef.current && 
            !lostReasonDialogRef.current.contains(event.target)) {
          setLeadLostDescriptionTrue(false);
        }
      };

      // Add event listener when dialog is open
      if (leadLostDescriptionTrue) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      // Clean up event listener
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [leadLostDescriptionTrue]);


  const fetchLeadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LEAD_DETAILS}${leadId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch lead data");
      }

      const data = await response.json();
      setLeadData(data);
      setIsDeal(data.bisConverted);
      setIsLost(!data.bactive);

      if (data.bisConverted === "true" || data.bisConverted === true || data.clead_status_name?.toLowerCase() === 'won') {
        setIsWon(true);
        setIsDeal(true);
        setIsLost(false);
        setImmediateWonStatus(true);
      } else if (!data.bactive) {
        setIsWon(false);
        setIsLost(true);
        setImmediateWonStatus(false);
      } else {
        setIsWon(false);
        setIsLost(false);
        setImmediateWonStatus(false);
      }

      setSentTo(data.cemail || "");
    } catch (error) {
      console.error("Error fetching lead data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    setQuotationsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.QUOTATION_LEAD}/${leadId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quotations");
      }

      const data = await response.json();
      setQuotations(data.data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    } finally {
      setQuotationsLoading(false);
    }
  };

  const fetchLostReasons = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LOST_REASON}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch lost reasons");
      const data = await response.json();
      setLostReasons(data.data);
    } catch (error) {
      console.error("Error fetching lost reasons:", error);
    }
  };

  const getUserInfoFromLocalStorage = () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Payload = token.split(".")[1];
        const decodedPayload = atob(base64Payload);
        const payloadObject = JSON.parse(decodedPayload);

        setLoggedInUserName(
          payloadObject.cFull_name ||
          payloadObject.fullName ||
          payloadObject.name ||
          payloadObject.cUser_name ||
          "User"
        );
      } else {
        const userInfoString = localStorage.getItem("userInfo");
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setLoggedInUserName(userInfo.cFull_name || userInfo.iUser_id || userInfo.name || userInfo.cUser_name || "User");
          setLoggedInCompanyName(userInfo.company_id || userInfo.company_name || userInfo.organization || userInfo.orgName || "Your Company");
        }
      }
    } catch (error) {
      console.error("Error extracting user info from token/localStorage:", error);
      setLoggedInUserName("Your Name");
      setLoggedInCompanyName("Your Company");
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadData();
      fetchLostReasons();
      getUserInfoFromLocalStorage();
      fetchQuotations();
    }
  }, [leadId]);

  useEffect(() => {
    if (isMailOpen && leadData) {
      if (leadData.cemail && sentTo !== leadData.cemail) {
        setSentTo(leadData.cemail);
      }

      const leadFirstName = leadData.cFirstName || '';
      const leadLastName = leadData.cLastName || '';
      const leadProjectName = leadData.cProjectName || 'our services/products';

      const defaultSubject = `Following up on your inquiry with ${leadFirstName} ${leadLastName}`.trim();

      const defaultContent = `
        <p>Dear ${leadFirstName || 'Sir/Madam'},</p>
        <p>Hope this email finds you well.</p>
        <p>I'm following up on our recent discussion regarding your interest in ${leadProjectName}.</p>
        <p>Please let me know if you have any questions or if there's anything else I can assist you with.</p>
        <p>Best regards,</p>
        <p>${loggedInUserName}</p>
        <p>${loggedInCompanyName}</p>
      `;
      setMailSubject(defaultSubject);
      setMailContent(defaultContent);
    }
  }, [isMailOpen, leadData, loggedInUserName, loggedInCompanyName]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "link",
    "color",
    "background",
  ];

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.MAIL_TEMPLATE}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      showPopup("Error", "Failed to load email templates", "error");
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    if (isMailOpen) {
      fetchTemplates();
    }
  },[isMailOpen]);

  const applyTemplate = (template) => {
    setMailSubject(template.mailTitle);
    setMailContent(template.mailBody);
  };

  // You'll need to fetch stages for the StatusBar component
  const [stages, setStages] = useState([]);

  const fetchStages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LEAD_STATUS}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stages');
      const data = await response.json();

      const formattedStages = Array.isArray(data.response)
        ? data.response
            .map(item => ({
              id: item.ilead_status_id,
              name: item.clead_name,
              order: item.orderId || 9999,
              bactive: item.bactive,
            }))
            .sort((a, b) => a.order - b.order)
        : [];

      setStages(formattedStages);
    } catch (err) {
      console.error('Error fetching stages:', err.message);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const handleOutsideClick = (event) => {
    if (formRef.current && !formRef.current.contains(event.target)) {
      setShowForm(false);
      setIsListening(false);
      setEditingComment(null);
    }
  };

  return (
    <>
    <div className="flex flex-col lg:flex-row min-h-[100vh] bg-gray-100 relative overflow-x-hidden">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Left Column: Profile Card & Action Card */}
      <div className="w-full lg:w-1/3 xl:w-1/4 p-2 sm:p-3 md:p-4">
        <div className="sticky top-4 z-10 space-y-4">
          <ProfileCard
            leadId={leadId}
            settingsData={profileSettings}
            isReadOnly={isLost || isWon || immediateWonStatus || leadData?.bisConverted === true}
          />
          {isLeadActive && <ActionCard leadId={leadId} />}
        </div>
      </div>

      {/* Right Column: Status Bar, Tabs, and Content */}
      <div className="w-full lg:w-3/4 xl:w-4/5 p-2 sm:p-3 md:p-4">
        <StatusBar
          leadId={leadId}
          leadData={leadData}
          isLost={isLost}
          isWon={isWon || immediateWonStatus || leadData?.bisConverted === true}
        />

        {(isWon || immediateWonStatus || leadData?.bisConverted) && quotations.length > 0 && (
          <Box className="mb-4">
            <div className="flex justify-between w-1/4 items-center bg-white p-4 rounded-[30px] shadow-sm border border-gray-200">
              <Typography variant="h6" className="flex text-center ms-[30px] justify-center items-center text-green-600">
                Quotation Available!
              </Typography>
            </div>
          </Box>
        )}

        {/* Tab Navigation and Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 mb-4 w-full">
          <div className="flex flex-wrap gap-1 sm:gap-2 bg-gray-100 shadow-md rounded-full p-1 w-full sm:w-auto">
            {["Activity", "Task", "Comments", "Reminders"]
            .filter((label) => !(label === "Reminders" && companyInfo?.company_id === XCODEFIX_COMPANY_ID)) 
            // .filter((label) => !(label === "Reminders" && companyInfo?.company_id === 15)) // XCODEFIX_COMPANY_ID
            .map((label, idx) => (
              <button
                key={label}
                onClick={() => handleTabChange(null, idx)}
                className={`px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm md:text-base font-semibold rounded-full transition-colors duration-200 ${
                  tabIndex === idx
                    ? "bg-blue-100 shadow text-blue-900"
                    : "text-gray-500 hover:bg-white hover:text-blue-900"
                }`}
              >
                {label}
              </button>
            ))}
        </div>

          <div className="flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start w-full sm:w-auto mt-2 sm:mt-0">
            {/* Project Value Display - Only shown when there's a project value */}
            {showProjectValue && projectValueDisplay && (
              <div className="flex items-center bg-blue-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-xl shadow-md">
                <FaCheck className="mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm md:text-base font-semibold">
                  Project Value: {projectValueDisplay}
                </span>
              </div>
            )}

            {/* View Quotations Button (only visible when Won and has quotations) */}
            {(isWon || immediateWonStatus || leadData?.bisConverted) && quotations.length > 0 && (
              <button
                onClick={() => setShowQuotationsList(true)}
                className="bg-blue-600 shadow-md shadow-blue-900 hover:bg-blue-900 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl transition text-xs sm:text-sm md:text-base flex items-center"
              >
                <FaEye className="mr-1" /> View Quotations
              </button>
            )}
            
            {/* Create Quotation Button (only visible when Won) */}
            {showCreateQuotationButton && (
              <>
              <button
                className="bg-green-600 shadow-md shadow-green-900 hover:bg-green-900 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl transition text-xs sm:text-sm md:text-base flex items-center"
                onClick={() => setShowQuotationForm(true)}
              >
                <FaPlus className="mr-1" /> Create Quotation
              </button>

              {/* Post Sales Button */}

              {companyInfo?.company_id === XCODEFIX_COMPANY_ID && (
                <button
                  type="button"
                  onClick={() => setShowPostSalesForm(true)}
                  className="bg-blue-600 shadow-md shadow-blue-900 hover:bg-blue-900 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl transition text-xs sm:text-sm md:text-base flex items-center"
                >
                  Post Sales
                </button>
              )}

              {/* <button
                className="bg-blue-600 shadow-md shadow-blue-900 hover:bg-blue-900 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl transition text-xs sm:text-sm md:text-base flex items-center"
                onClick={() => setShowPostSalesForm(true)}
              >
                Post Sales
              </button> */}

              </>
            )}
            
            {showActionButtons && (
              <>
                  {userSettings.mail_access && (
                    <button
                      onClick={() => setIsMailOpen(true)}
                      className="bg-white hover:bg-blue-100 shadow-md shadow-gray-400 text-gray-900 border-grey-900 font-semibold py-1 sm:py-2 px-3 sm:px-4 rounded-xl transition flex items-center justify-center gap-1 text-xs sm:text-sm md:text-base"
                      title="Email"
                    >
                      <div className="w-px h-5 bg-gray-600"></div>
                      <img src="../../public/images/detailview/email.svg" className="hidden sm:block" size={16} alt="Email icon" />
                      <div className="w-px h-5 bg-gray-600"></div>
                    </button>
                      )}

                    {!(leadData?.bisConverted === true) && (
                      <button
                        className="bg-green-600 shadow-md shadow-green-900 hover:bg-green-900 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl transition text-xs sm:text-sm md:text-base flex items-center"
                        onClick={handleWonClick}
                      >
                        <FaPlus className="mr-1" /> Won
                      </button>
                    )}

                    <button
                      className="bg-red-300 text-red-600 shadow-md shadow-red-900 hover:bg-red-400 font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl transition text-xs sm:text-sm md:text-base"
                      onClick={handleLostClick}
                    >
                      Lost
                    </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <Box className="mt-4 relative z-0 w-full">
          {tabIndex === 0 && (
            <LeadTimeline
              leadId={leadId}
              isReadOnly={isLost || isWon || immediateWonStatus || leadData?.bisConverted === true}
            />
          )}
          {tabIndex === 1 && <Tasks leadId={leadId} />}
          {tabIndex === 2 && <Comments leadId={leadId} />}
          {tabIndex === 3 && <RemainderPage leadId={leadId} />}
        </Box>
      </div>

      {/* Quotation Form Dialog */}
      <QuotationForm
        open={showQuotationForm}
        onClose={() => setShowQuotationForm(false)}
        leadId={leadId}
        leadData={leadData}
        companyInfo={companyInfo}
        quotations={quotations}
        onQuotationCreated={handleQuotationCreated}
      />

      {/* Remark Dialog */}
      <Dialog 
        open={showRemarkDialog} 
        onClose={() => setShowRemarkDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        
        <DialogTitle>Enter Remark for Won Status</DialogTitle>
        <DialogContent>
          <TextField
            label={
              <span>
                Remark <span style={{ color: 'red' }}>*</span>
              </span>
            }
            fullWidth
            multiline
            rows={3}
            value={remarkData.remark}
            onChange={e => setRemarkData({ ...remarkData, remark: e.target.value })}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <Autocomplete
            options={currencies}
            getOptionLabel={(option) => `${option.country_name} - ${option.symbol}`}
            value={currencies.find(c => c.icurrency_id === remarkData.currencyId) || null}
            onChange={(e, newValue) =>
              setRemarkData(prev => ({ ...prev, currencyId: newValue?.icurrency_id || null }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  <span>
                    Currency <span style={{ color: 'red' }}>*</span>
                  </span>
                }
                sx={{ mt: 2 }}
                // error={!remarkData.currencyId}
                // helperText={!remarkData.currencyId ? 'Currency is required' : ''}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          
          <TextField
            label="Project Value (optional)"
            type="number"
            fullWidth
            value={remarkData.projectValue}
            onChange={e => setRemarkData({...remarkData, projectValue: e.target.value})}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRemarkDialog(false)}>Cancel</Button>
          <Button onClick={handleRemarkSubmit} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quotations List Dialog with Detailed View */}
      <Dialog 
        open={showQuotationsList} 
        onClose={() => setShowQuotationsList(false)} 
        maxWidth="lg" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-blue-700">
              Quotation Details
            </div>
            <IconButton onClick={() => setShowQuotationsList(false)} size="small">
              <MdExpandLess />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent dividers className="bg-gray-50">
          {quotationsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
              <CircularProgress />
            </Box>
          ) : quotations.length > 0 ? (
            <List>
              {quotations.map((quotation) => (
                <Card key={quotation.iQuotation_id} className="mb-3">
                  <ListItem 
                    className="bg-blue-50"
                    secondaryAction={
                      <div className="flex items-center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPdf(quotation);
                          }}
                          title="View PDF"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPdf(quotation);
                          }}
                          title="Download PDF"
                        >
                          {/* <FaDownload /> */}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => toggleQuotationExpand(quotation.iQuotation_id, e)}
                        >
                          {expandedQuotation === quotation.iQuotation_id ? <MdExpandLess /> : <MdExpandMore />}
                        </IconButton>
                      </div>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6" className="text-blue-800">
                          {quotation.cQuote_number}
                        </Typography>
                      }
                      secondary={
                        <div className="text-sm text-gray-600">
                          Valid until: {formatDate(quotation.dValid_until)}
                          {quotation.fTotal_amount && ` | Amount: ${quotation.fTotal_amount.toFixed(2)}`}
                        </div>
                      }
                    />
                  </ListItem>
                  <Collapse in={expandedQuotation === quotation.iQuotation_id} timeout="auto" unmountOnExit>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" className="font-bold">Terms & Conditions</Typography>
                          <Typography variant="body2" className="mt-2 text-gray-700">
                            {quotation.cTerms || "No terms specified"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" className="font-bold">Financial Details</Typography>
                          <TableContainer component={Paper} className="mt-2">
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-bold">Subtotal</TableCell>
                                  <TableCell>{quotation.fSub_total?.toFixed(2) || "0.00"}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-bold">Tax Amount</TableCell>
                                  <TableCell>{quotation.fTax_amount?.toFixed(2) || "0.00"}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-bold">Total Amount</TableCell>
                                  <TableCell className="font-bold">{quotation.fTotal_amount?.toFixed(2) || "0.00"}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" className="font-bold">Additional Information</Typography>
                          <Typography variant="body2" className="mt-2 text-gray-700">
                            {quotation.cNotes || "No additional notes"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Collapse>
                </Card>
              ))}
            </List>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No quotations found for this lead.
            </div>
          )}
        </DialogContent>
        <DialogActions className="bg-gray-100">
          <Button onClick={() => setShowQuotationsList(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <PDFViewer
        open={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrl={currentPdfUrl}
        quotationNumber={currentQuotation?.cQuote_number || ''}
        onDownload={handleDownloadFromViewer}
      />

        {/* Lead Lost Reason Dialog */}
        {leadLostDescriptionTrue && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          >
            <div 
              ref={lostReasonDialogRef} // Add the ref here
              className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl"
              // Remove the onClick handler from here
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
                Why mark this lead as Lost?
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="lostReason" className="block font-medium mb-1 text-sm sm:text-base">
                    Pick the reason for marking this lead as Lost<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="lostReason"
                    name="lostReason"
                    value={selectedLostReasonId}
                    onChange={handleReasonChange}
                    className="w-full border px-2 sm:px-3 py-1 sm:py-2 rounded-md text-sm sm:text-base"
                    required
                  >
                    <option value="">Select a reason</option>
                    {lostReasons.map((reason) => (
                      <option
                        key={reason.ilead_lost_reason_id}
                        value={reason.ilead_lost_reason_id}
                      >
                        {reason.cLeadLostReason}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lostDescription" className="block font-medium mb-1 text-sm sm:text-base">
                    Remarks
                  </label>
                  <textarea
                    id="lostDescription"
                    name="lostDescription"
                    rows="3"
                    value={lostDescription}
                    onChange={(e) => setLostDescription(e.target.value)}
                    className="w-full border px-2 sm:px-3 py-1 sm:py-2 rounded-md text-sm sm:text-base"
                    placeholder="Enter a brief description for marking as lost..."
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setLeadLostDescriptionTrue(false)}
                    className="bg-gray-300 px-3 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-gray-400 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-blue-600 text-sm sm:text-base"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Status Remarks Section */}
        {/* {(isWon || immediateWonStatus || leadData?.bisConverted) && statusRemarks.length > 0 && (
          <Box className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <Typography variant="h6" className="text-green-600 mb-3">
              Won Status Remarks
            </Typography>
            <List>
              {statusRemarks.map((remark) => (
                <ListItem key={remark.ilead_status_remarks_id} className="border-b border-gray-100">
                  <ListItemText
                    primary={
                      <div>
                        <Typography variant="body1" className="font-medium">
                          {remark.remark}
                        </Typography>
                        {remark.project_value && (
                          <Typography variant="body2" className="text-gray-600 mt-1">
                            Project Value: {remark.currency_details?.symbol || '$'} {remark.project_value}
                          </Typography>
                        )
                        }
                        <Typography variant="caption" className="text-gray-400">
                          Added on: {formatDate(remark.dCreatedDate)}
                        </Typography>
                      </div>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )} */}


        {/* for postsales form */}
        {showPostSalesForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-tranparent rounded-xl shadow-2xl p-6 w-full max-w-5xl relative">
              <button
                type="button"
                onClick={() => setShowPostSalesForm(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-3xl font-light z-10"
                title="Close Form"
              >
                ✕
              </button>

              {/* PostSalesForm content will be rendered here */}
              <PostSalesForm
                leadId={leadId}


                onBack={() => setShowPostSalesForm(false)}
              />
              {/* <PostSalesForm />  */}
            </div>
          </div>
        )}

            {/* Email Compose Dialog */}
            {isMailOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2 sm:p-4 overflow-y-scroll" onClick={handleCloseMail}
            >
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl h-[70vh] w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl flex flex-col overflow-y-scroll"   onClick={(e) => e.stopPropagation()} >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <img
                    src="../../public/images/detailview/email.svg"
                    className="w-6 h-6"
                    alt="Email icon"
                  />
                  Compose Email
                </h2>
                <button
                  onClick={() => setIsMailOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-col md:flex-row gap-4 flex-grow overflow-hidden">
                {/* Templates Section */}
                <div className="w-full md:w-1/2 lg:w-2/5 h-[600px] p-4 rounded-xl border border-gray-200 ">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Email Templates</h3>
                  </div>

                  {templatesLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto mb-2 text-blue-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <p>No templates available</p>
                    </div>
                  ) : (
                    <div className="space-y-3 h-[calc(100%-50px)] overflow-y-scroll pr-2">
                      {templates.map((template) => (
                        <div
                          key={template.mailTemplateId}
                          className="p-4 bg-white border rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                          onClick={() => applyTemplate(template)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg">
                              <MdEmail className="text-blue-600" size={18} />
                            </div>
                            <div>
                              <h4 className="font-semibold">{template.mailTitle}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {template.mailBody.replace(/<[^>]*>/g, "").substring(0, 100)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              {/* Email Form Section */}
              <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col max-h-[63vh]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendEmail();
                  }}
                  className="flex flex-col flex-grow space-y-4 bg-white/60 backdrop-blur-xl p-5 rounded-2xl shadow-lg overflow-y-auto max-h-[50vh]"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {/* To Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">To</label>
                      <input
                        type="email"
                        className="w-full bg-white/80 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm placeholder-gray-400"
                        placeholder="example@email.com"
                        value={sentTo}
                        onChange={(e) => setSentTo(e.target.value)}
                        required
                      />
                    </div>

                    {/* CC Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">CC</label>
                      <input
                        type="text"
                        className="w-full bg-white/80 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm placeholder-gray-400"
                        placeholder="cc@example.com (separate with commas)"
                        value={ccRecipients}
                        onChange={(e) => setCcRecipients(e.target.value)}
                      />
                    </div>

                    {/* Subject Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        className="w-full bg-white/80 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm placeholder-gray-400"
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder="Write subject..."
                        required
                      />
                    </div>
                  </div>

                  {/* Message Editor */}
                  <div className="flex-grow flex flex-col min-h-[300px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <div className="rounded-xl bg-white/80 shadow-sm flex-grow h-[380px] overflow-y-scroll">
                      <ReactQuill
                        theme="snow"
                        value={mailContent}
                        onChange={setMailContent}
                        modules={{
                          ...modules,
                          toolbar: [
                            [{ header: [1, 2, false] }],
                            ["bold", "italic", "underline", "strike"],
                            [{ color: [] }, { background: [] }],
                            [{ list: "ordered" }, { list: "bullet" }],
                            ["link"],
                            ["clean"],
                          ],
                        }}
                        formats={formats}
                        className="min-h-[200px] md:min-h-[200px] lg:min-h-[250px] xl:min-h-[200px]"
                        style={{ border: "white" }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons (sticky) */}
                  <div className="flex justify-end space-x-3 pt-2 sticky bottom-0 bg-white/70 backdrop-blur-md pb-2">
                    <button
                      type="button"
                      onClick={() => setIsMailOpen(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100/80 hover:bg-gray-200 transition shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md hover:shadow-lg transition flex items-center gap-2"
                      disabled={isSendingMail}
                    >
                      {isSendingMail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <MdEmail size={16} />
                          <span>Send Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showUserProfile && <UserProfile settingsData={settingsData} />}
      </>
    );
  };
export default LeadDetailView;