import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from "@mui/material";
import ProfileCard from "../Components/common/ProfileCard";
import Comments from "../Components/commandshistory";
import RemainderPage from "../pages/RemainderPage";
import StatusBar from "./StatusBar";
import LeadTimeline from "../Components/LeadTimeline";
import ActionCard from "../Components/common/ActrionCard";
import { ENDPOINTS } from "../api/constraints";
import { usePopup } from "../context/PopupContext";
import { MdEmail } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaWhatsapp } from "react-icons/fa";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const LeadDetailView = () => {
  const { leadId } = useParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDeal, setIsDeal] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [leadData, setLeadData] = useState(null);
  const [leadLostDescriptionTrue, setLeadLostDescriptionTrue] = useState(false);
  const [lostReasons, setLostReasons] = useState([]);
  const [selectedLostReasonId, setSelectedLostReasonId] = useState("");
  const [lostDescription, setLostDescription] = useState("");
  const { showPopup } = usePopup();
  const navigate = useNavigate();
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailContent, setMailContent] = useState("");
  const [isWon, setIsWon] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState("Your Name");
  const [loggedInCompanyName, setLoggedInCompanyName] = useState("Your Company");
  const [showRemarkDialog, setShowRemarkDialog] = useState(false);
  const [remarkData, setRemarkData] = useState({ remark: '', projectValue: '' });

  const handleTabChange = (event, newValue) => setTabIndex(newValue);
  const handleReasonChange = (e) => setSelectedLostReasonId(e.target.value);

  const handleWonClick = () => {
    setShowRemarkDialog(true);
    setRemarkData({ remark: '', projectValue: '' });
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

      // First convert to deal
      const convertResponse = await fetch(`${ENDPOINTS.CONVERT_TO_DEAL}/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!convertResponse.ok) {
        throw new Error("Failed to convert lead to deal");
      }

      // Then save the remark
      const remarkPayload = {
        remark: remarkData.remark.trim(),
        leadId: parseInt(leadId),
        leadStatusId: leadData?.ileadstatus_id, // Use current status ID
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
          ...(token && { Authorization: `Bearer ${token}` }),
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
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.SENTMAIL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
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
    }
  };

  const fetchLeadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LEAD_DETAILS}${leadId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch lead data. Status:", response.status);
        throw new Error("Failed to fetch lead data");
      }

      const data = await response.json();
      setLeadData(data);
      setIsDeal(data.bisConverted);
      setIsLost(!data.bactive);

      if (data.clead_status_name?.toLowerCase() === 'won') {
        setIsWon(true);
        setIsDeal(true);
        setIsLost(false);
      } else if (!data.bactive) {
        setIsWon(false);
        setIsLost(true);
      } else {
        setIsWon(false);
        setIsLost(false);
      }

      setSentTo(data.cemail || "");
    } catch (error) {
      console.error("Error fetching lead data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLostReasons = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.LOST_REASON}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
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

  const isLeadActive = !isLost && !isWon;
  const showActionButtons = !loading && isLeadActive;
  const showLostButton = !loading && isLeadActive;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 relative overflow-x-hidden">
      {/* Left Sidebar - Profile and Action Cards */}
      <div className="w-full lg:w-1/4 p-2 sm:p-3 md:p-4">
        <div className="sticky top-4 z-10 space-y-4">
          <ProfileCard 
            leadId={leadId} 
            isReadOnly={isLost || isWon} 
            
          />
          {isLeadActive && <ActionCard leadId={leadId} />}
        </div>
      </div>

      <div className="w-full md:w-full lg:w-full p-4">
        <div className="mb-4 flex items-center justify-between">
          <StatusBar 
            leadId={leadId} 
            leadData={leadData} 
            isLost={isLost} 
            isWon={isWon} 
          />
          {!loading && isWon && (
            <div className="flex items-center gap-2 text-green-600 text-sm sm:text-lg font-semibold bg-green-50 px-3 sm:px-4 py-1 sm:py-2 rounded-full shadow">
              <span role="img" aria-label="won">🎉</span> WON
            </div>
          )}
          {!loading && isLost && (
            <div className="flex items-center gap-2 text-red-600 text-sm sm:text-lg font-semibold bg-red-50 px-3 sm:px-4 py-1 sm:py-2 rounded-full shadow">
              <span role="img" aria-label="lost">😞</span> LOST
            </div>
          )}
        </div>

        {/* Tabs and Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 mb-4 w-full">
          {/* Tabs - Always visible but some functionality may be limited */}
          <div className="flex flex-wrap gap-1 sm:gap-2 bg-gray-100 rounded-full p-1 shadow-inner w-full sm:w-auto">
            {["Activity", "Comments", "Reminders"].map((label, idx) => (
              <button
                key={label}
                onClick={() => handleTabChange(null, idx)}
                className={`px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-colors duration-200 ${
                  tabIndex === idx
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:bg-white hover:text-blue-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action Buttons - Only shown for active leads */}
          {showActionButtons && (
            <div className="flex gap-2 sm:gap-3 flex-wrap justify-end sm:justify-start w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={() => setIsMailOpen(true)}
                className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-1 sm:py-2 px-3 sm:px-4 rounded-full shadow transition flex items-center justify-center gap-1 text-xs sm:text-sm"
                title="Email"
              >
                <MdEmail size={16} className="hidden sm:block" /> 
                <span>Email</span>
              </button>
              {!loading && !isWon && (
              <button
                className="bg-green-600 hover:bg-green-900 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-full shadow transition text-xs sm:text-sm"
                onClick={handleWonClick}
              >
                Won
              </button>
              )}

              <button
                className="bg-red-100 text-red-600 hover:bg-red-200 font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-full shadow-inner transition text-xs sm:text-sm"
                onClick={handleLostClick}
              >
                Lost
              </button>
            </div>
          )}
        </div>

        {/* Tab Content - Always visible */}
        <Box className="mt-4 relative z-0 w-full">
          {tabIndex === 0 && <LeadTimeline leadId={leadId} isReadOnly={isLost || isWon} />}
          {tabIndex === 1 && <Comments leadId={leadId} />}
          {tabIndex === 2 && <RemainderPage leadId={leadId} />}
        </Box>
      </div>

      {/* Won Remark Dialog */}
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

      {/* Lost Reason Modal */}
      {leadLostDescriptionTrue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md sm:max-w-lg md:max-w-xl">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Why mark this lead as Lost?</h2>
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

      {/* Email Modal */}
      {isMailOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl flex flex-col">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">📩 Send Your Mail</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendEmail();
              }}
              className="flex flex-col flex-grow space-y-3 sm:space-y-4"
            >
              <div>
                <label className="block font-medium text-sm sm:text-base">To</label>
                <input
                  type="email"
                  className="w-full border px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-sm sm:text-base"
                  value={sentTo}
                  onChange={(e) => setSentTo(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-sm sm:text-base">Subject</label>
                <input
                  type="text"
                  className="w-full border px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-sm sm:text-base"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  required
                />
              </div>
              <div className="flex-grow flex flex-col min-h-0">
                <label className="block font-medium mb-1 text-sm sm:text-base">Message</label>
                <div className="border rounded-xl overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={mailContent}
                    onChange={setMailContent}
                    modules={modules}
                    formats={formats}
                    className="h-[150px] sm:h-[200px] overflow-y-auto"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-3 sm:mt-4">
                <button
                  type="button"
                  onClick={() => setIsMailOpen(false)}
                  className="bg-gray-700 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-white text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-900 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-base hover:bg-green-900"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailView;