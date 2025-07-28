import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import ProfileCard from "../Components/common/ProfileCard";
import Comments from "../Components/commandshistory";
import RemainderPage from "../pages/RemainderPage";
import StatusBar from "./StatusBar";
import LeadTimeline from "../Components/LeadTimeline";
import ActionCard from "../Components/common/ActrionCard"; // Typo: Should be ActionCard
import { ENDPOINTS } from "../api/constraints";
import { usePopup } from "../context/PopupContext";
import { MdEmail } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaWhatsapp } from "react-icons/fa"; // Not used in this snippet but kept for completeness
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Confetti from "react-confetti";

const LeadDetailView = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { showPopup } = usePopup();

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
  const [isWon, setIsWon] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState("Your Name");
  const [loggedInCompanyName, setLoggedInCompanyName] = useState("Your Company");
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);
  const [remarkData, setRemarkData] = useState({ remark: "", projectValue: "" });
  //email templates
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  // New state for email sending loading
  const [isSendingMail, setIsSendingMail] = useState(false);

  // Derived state
  const isLeadActive =
    !isLost && !isWon && !immediateWonStatus && !(leadData?.bisConverted === true);
  const showActionButtons = !loading && isLeadActive;

  const handleTabChange = (event, newValue) => setTabIndex(newValue);
  const handleReasonChange = (e) => setSelectedLostReasonId(e.target.value);

  const handleWonClick = () => {
    setShowRemarkDialog(true);
    setRemarkData({ remark: "", projectValue: "" });
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

  const handleLostClick = () => setLeadLostDescriptionTrue(true);

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

  const sendEmail = async () => {
    setIsSendingMail(true); // Set loading to true when sending starts
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.SENTMAIL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sent_to: sentTo,
          mailSubject,
          mailContent,
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
      setMailSubject("");
      setMailContent("");
    } catch (error) {
      console.error("Error sending mail:", error);
      showPopup("Error", "Something went wrong while sending email", "error");
    } finally {
      setIsSendingMail(false); // Set loading to false when sending completes (success or failure)
    }
  };

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
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
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
   useEffect(() => {
        if (leadId) {
            fetchLeadData();
        }
    }, [leadId]);

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
          setLoggedInUserName(userInfo.cFull_name || userInfo.fullName || userInfo.name || userInfo.cUser_name || "User");
          setLoggedInCompanyName(userInfo.company_name || userInfo.company || userInfo.organization || userInfo.orgName || "Your Company");
        }
      }
    } catch (error) {
      console.error("Error extracting user info from token/localStorage:", error);
      setLoggedInUserName("Your Name");
      setLoggedInCompanyName("Your Company");
    }
  };

  useEffect(() => {
    fetchLeadData();
    fetchLostReasons();
    getUserInfoFromLocalStorage();
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
  }, [isMailOpen]);

  const applyTemplate = (template) => {
    setMailSubject(template.mailTitle);
    setMailContent(template.mailBody);
  };

  return (
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
      <div className="w-full lg:w-1/4 xl:w-1/5 p-2 sm:p-3 md:p-4">
        <div className="sticky top-4 z-10 space-y-4">
          <ProfileCard
            leadId={leadId}
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

        {/* Tab Navigation and Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 mb-4 w-full">
          <div className="flex flex-wrap gap-1 sm:gap-2 bg-gray-100 rounded-full p-1 shadow-inner w-full sm:w-auto">
            {["Activity", "Comments", "Reminders"].map((label, idx) => (
              <button
                key={label}
                onClick={() => handleTabChange(null, idx)}
                className={`px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm md:text-base font-semibold rounded-full transition-colors duration-200 ${tabIndex === idx
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:bg-white hover:text-blue-600"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {showActionButtons && (
            <div className="flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start w-full sm:w-auto mt-2 sm:mt-0">
            
              <button
              
                onClick={() => setIsMailOpen(true)}
                className="bg-white hover:bg-yellow-300 text-gray-700 font-semibold py-1 sm:py-2 px-3 sm:px-4 rounded-xl shadow transition flex items-center justify-center gap-1 text-xs sm:text-sm md:text-base"
                title="Email"
              > <div className="w-px h-5 bg-gray-300"></div>
                <img src="../../public/images/detailview/email.svg" className="hidden sm:block" size={16} />
                 <div className="w-px h-5 bg-gray-300"></div>
                {/* <span>Email</span> */}
              </button>
               

              {!(leadData?.bisConverted === true) && (
                <button
                  className="bg-green-600 hover:bg-green-900 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl shadow transition text-xs sm:text-sm md:text-base"
                  onClick={handleWonClick}
                >
                  Won
                </button>
              )}

              <button
                className="bg-red-300 text-red-600 hover:bg-red-400 font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-xl shadow-inner transition text-xs sm:text-sm md:text-base"
                onClick={handleLostClick}
              >
                Lost
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <Box className="mt-4 relative z-0 w-full">
          {tabIndex === 0 && (
            <LeadTimeline
              leadId={leadId}
              isReadOnly={isLost || isWon || immediateWonStatus || leadData?.bisConverted === true}
            />
          )}
          {tabIndex === 1 && <Comments leadId={leadId} />}
          {tabIndex === 2 && <RemainderPage leadId={leadId} />}
        </Box>
      </div>

      {/* Remark Dialog for 'Won' */}
      <Dialog open={showRemarkDialog} onClose={() => setShowRemarkDialog(false)}>
        <DialogTitle>Enter Won Details</DialogTitle>
        <DialogContent>
          <TextField
            label={<span>Remark <span className="text-red-600">*</span></span>}
            fullWidth
            multiline
            rows={3}
            value={remarkData.remark}
            onChange={(e) => setRemarkData(prev => ({ ...prev, remark: e.target.value }))}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Project Value"
            type="number"
            fullWidth
            value={remarkData.projectValue}
            onChange={(e) => setRemarkData(prev => ({ ...prev, projectValue: e.target.value }))}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRemarkDialog(false)}>Cancel</Button>
          <Button onClick={handleRemarkSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Lead Lost Reason Dialog */}
      {leadLostDescriptionTrue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Why mark this lead as Lost?</h2>
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

      {/* Email Compose Dialog */}
      {isMailOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-black-800 flex items-center gap-2">
                <img src="../../public/images/detailview/email.svg" className="text-black-600" size={24} />
                Compose Email
              </h2>
              <button
                onClick={() => setIsMailOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-grow">
              {/* Templates Section */}
              <div className="w-full md:w-1/2 lg:w-2/5 p-4 rounded-xl border border-black-200 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-black-800">Email Templates</h3>
                </div>

                {templatesLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 "></div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>No templates available</p>
                  </div>
                ) : (
                  <div className="space-y-3 h-[calc(100%-50px)] overflow-y-auto pr-2">
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
                            <h4 className="font-semibold ">{template.mailTitle}</h4>
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
              <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendEmail();
                  }}
                  className="flex flex-col flex-grow space-y-4 bg-white/60 backdrop-blur-md border border-white/30 p-4 rounded-2xl shadow-inner"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {/* To Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">To</label>
                      <div className="relative">
                        <input
                          type="email"
                          className="w-full bg-white/70 border border-gray-300 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
                          placeholder="example@email.com"
                          value={sentTo}
                          onChange={(e) => setSentTo(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Subject Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Subject</label>
                      <input
                        type="text"
                        className="w-full bg-white/70 border border-gray-300 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder="Write subject..."
                        required
                      />
                    </div>
                  </div>

                  {/* Message Editor */}
                  <div className="flex-grow flex flex-col">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Message</label>
                    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white/70 flex-grow shadow-inner">
                      <ReactQuill
                        theme="snow"
                        value={mailContent}
                        onChange={setMailContent}
                        modules={{
                          ...modules,
                          toolbar: [
                            [{ header: [1, 2, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ color: [] }, { background: [] }],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            ['link'],
                            ['clean'],
                          ],
                        }}
                        formats={formats}
                        className="h-full min-h-[100px] sm:min-h-[150px] md:min-h-[200px] lg:min-h-[250px] xl:min-h-[300px]"
                        style={{ border: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsMailOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white/80 hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md hover:shadow-lg transition flex items-center gap-2"
                      disabled={isSendingMail} // Disable button while sending
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
  );
};

export default LeadDetailView;