import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box } from "@mui/material";
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
  const [isLost, setIsLost] = useState(false); // true if lead is active, false if it's lost
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
  const [isWon, setIsWon] = useState(false); // New state for tracking if lead is "Won"

  // States to hold logged-in user and company info
  const [loggedInUserName, setLoggedInUserName] = useState("Your Name");
  const [loggedInCompanyName, setLoggedInCompanyName] = useState("Your Company");

  const handleTabChange = (event, newValue) => setTabIndex(newValue);
  const handleReasonChange = (e) => setSelectedLostReasonId(e.target.value);

  const convertToDeal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.CONVERT_TO_DEAL}/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        showPopup("Error", "Failed to update status!", "error");
        return;
      }

      showPopup("Success", "Lead converted to deal!", "success");
      setIsDeal(true);
      // If converted to deal, it effectively means it's 'Won' for UI purposes
      setIsWon(true); // Set isWon to true
      // Also refetch lead data to update the status bar and other components
      fetchLeadData();
    } catch (error) {
      console.error("Error occurred while converting the lead to deal", error);
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
        userId = payloadObject.iUser_id; // Using iUser_id from your provided JWT payload structure
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

      const quotes = [
        "Not every door opens, but every knock builds experience 💪 Keep going 💥.",
        "Sometimes a 'no' is just redirection to a better opportunity 🔁✨",
        "Losses are lessons in disguise 📘 Next one’s yours!",
        "Strong minds build from setbacks 🧠💥 You got this!",
        "This one’s gone. But hey, champions always bounce back 🏆🔥",
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      showPopup("Info", `Lead updated as lost. ${randomQuote}`, "info");
      setLeadLostDescriptionTrue(false);
      setSelectedLostReasonId("");
      setLostDescription("");
      setIsLost(false); // Set isLost to false as the lead is now lost
      // navigate("/leads"); // You might want to remove or comment this if you want to stay on the page and show disabled state
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
      setIsDeal(data.bisConverted); // This indicates if it's converted to a deal (e.g., Won)
      setIsLost(data.bactive); // This indicates if the lead is active (true) or lost (false)

      // Determine if the lead is in the "Won" stage
      if (data.clead_status_name?.toLowerCase() === 'won') {
        setIsWon(true);
        setIsDeal(true); // If won, it's also a deal
        setIsLost(true); // If won, it's also considered 'active' not 'lost' in terms of deletion.
      } else {
        setIsWon(false);
      }


      setSentTo(data.cemail || "");

      console.log("DEBUG: cEmail found and set to:", data.cemail);
      console.log("DEBUG: Lead Data cFirstName:", data.cFirstName);
      console.log("DEBUG: Lead Data cLastName:", data.cLastName);
      console.log("DEBUG: Lead Data cProjectName:", data.cProjectName);
      console.log("DEBUG: Lead Data clead_status_name:", data.clead_status_name);
      console.log("DEBUG: Lead Data bisConverted:", data.bisConverted);
      console.log("DEBUG: Lead Data bactive:", data.bactive);
      console.log("DEBUG: isWon:", isWon);
      console.log("DEBUG: isDeal:", isDeal);
      console.log("DEBUG: isLost (bactive):", isLost);

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
    // This useEffect populates the email template when the modal opens or leadData/user info changes
    if (isMailOpen && leadData) {
      console.log("DEBUG: Inside mail-specific useEffect (template generation).");
      console.log("DEBUG: leadData available for template:", leadData);
      console.log("DEBUG: loggedInUserName for template:", loggedInUserName);
      console.log("DEBUG: loggedInCompanyName for template:", loggedInCompanyName);
      console.log("DEBUG: current sentTo state (pre-modal update):", sentTo);


      if (leadData.cEmail && sentTo !== leadData.cEmail) {
        setSentTo(leadData.cEmail);
        console.log("DEBUG: Re-set sentTo in mail useEffect (redundant, but safe) to:", leadData.cEmail);
      } else if (!leadData.cEmail) {
        console.warn("DEBUG: leadData.cEmail is missing or empty when opening mail modal for template.");
      }

      // **IMPORTANT**: Uncomment this section to enable auto-filling of mail subject and content
      // based on lead details and logged-in user info.
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


      console.log("DEBUG: Email Modal Prepared - Subject:", defaultSubject);
      console.log("DEBUG: Email Modal Prepared - Content (truncated):", defaultContent.substring(0, 150) + "...");
      console.log("DEBUG: Final sentTo state when modal opens (after potential re-set):", sentTo);
    } else if (isMailOpen && !leadData) {
      console.warn("DEBUG: Mail modal opened but leadData is not yet available for template generation!");
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

  // Determine if action buttons should be visible/enabled
  const showActionButtons = !loading && isLost && !isWon; // Only show if not loading, lead is active (not lost), and not won
  const showLostButton = !loading && isLost && !isWon; // Only show if not loading, lead is active, and not won

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative overflow-x-hidden">
      <div className="w-full md:w-1/3 lg:w-1/4 p-4">
        <div className="sticky top-4 z-10">
          <ProfileCard leadId={leadId} />
          <ActionCard leadId={leadId} />
        </div>
      </div>

      <div className="w-full md:w-full lg:w-full p-4">
        <div className="mb-4 flex items-center justify-between">
          <StatusBar leadId={leadId} leadData={leadData} />
          {/* Display "WON" badge if lead is won */}
          {!loading && isWon && (
            <div className="flex items-center gap-2 text-green-600 text-lg font-semibold bg-green-50 px-4 py-2 rounded-full shadow">
              <span role="img" aria-label="deal">🎉</span> WON
            </div>
          )}
          {/* Display "LOST" badge if lead is lost (bactive is false) */}
          {/* {!loading && !isLost && (
            <div className="flex items-center gap-2 text-red-600 text-lg font-semibold bg-red-50 px-4 py-2 rounded-full shadow">
              <span role="img" aria-label="lost">💔</span> LOST
            </div>
          )} */}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-4 w-full overflow-x-hidden">
          <div className="flex flex-wrap gap-2 bg-gray-100 rounded-full p-1 shadow-inner w-full sm:w-auto">
            {["Activity", "Comments", "Reminders"].map((label, idx) => (
              <button
                key={label}
                onClick={() => handleTabChange(null, idx)}
                // Disable tab changes if lead is lost or won
                disabled={!isLost || isWon}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                  tabIndex === idx
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:bg-white hover:text-blue-600"
                } ${(!isLost || isWon) ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Action Buttons: Email, Call, WhatsApp, Convert, Lost */}
            {showActionButtons && ( // Conditionally render the group of buttons
              <>
                <button
                  onClick={() => setIsMailOpen(true)}
                  className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1"
                  title="Email"
                >
                  <MdEmail size={20} /> Email
                </button>

                {/* Keeping Call and WhatsApp commented out as in original, but they would also be inside showActionButtons */}
                {/* <button className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1">
                  <FaPhone size={18} /> Call
                </button>

                <button className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1">
                  <FaWhatsapp size={20} /> WhatsApp
                </button> */}

                {!isDeal && ( // Show Convert button only if not already a deal
                  <button
                    className="bg-green-600 hover:bg-green-900 text-white font-semibold py-2 px-6 rounded-full shadow transition"
                    onClick={convertToDeal}
                  >
                    Won
                  </button>
                )}
              </>
            )}

            {/* Lost Button (shown separately if conditions meet) */}
            {showLostButton && (
              <button
                className="bg-red-100 text-red-600 hover:bg-red-200 font-semibold py-2 px-6 rounded-full shadow-inner transition"
                onClick={handleLostClick}
              >
                Lost
              </button>
            )}
          </div>
        </div>

        <Box className="mt-4 relative z-0">
          {tabIndex === 0 && <LeadTimeline leadId={leadId} />}
          {tabIndex === 1 && <Comments leadId={leadId} />}
          {tabIndex === 2 && <RemainderPage leadId={leadId} />}
        </Box>
      </div>

      {leadLostDescriptionTrue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-[60%]">
            <h2 className="text-xl font-bold mb-4">Why mark this lead as Lost?</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="lostReason" className="block font-medium mb-1">
                  Pick the reason for marking this lead as Lost<span className="text-red-500">*</span>
                </label>
                <select
                  id="lostReason"
                  name="lostReason"
                  value={selectedLostReasonId}
                  onChange={handleReasonChange}
                  className="w-full border px-3 py-2 rounded-md"
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
                         {/* Display "LOST" badge if lead is lost (bactive is false) */}
          {/* {!loading && !isLost && (
            <div className="flex flex-1 ms-[150px] items-center gap-2 text-red-600 text-lg font-semibold bg-red-50 px-4 py-2 rounded-full shadow">
              <span role="img" aria-label="lost">💔</span> LOST
            </div>
          )} */}
                <label htmlFor="lostDescription" className="block font-medium mb-1">
                  Remarks
        
  
                </label>
                <textarea
                  id="lostDescription"
                  name="lostDescription"
                  rows="4"
                  value={lostDescription}
                  onChange={(e) => setLostDescription(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  placeholder="Enter a brief description for marking as lost..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setLeadLostDescriptionTrue(false)}
                  className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMailOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4"> 📩 Send Your Mail</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendEmail();
              }}
              className="flex flex-col flex-grow space-y-4"
            >
              <div>
                <label className="block font-medium">To</label>
                <input
                  type="email"
                  className="w-full border px-3 py-2 rounded-xl"
                  value={sentTo}
                  onChange={(e) => setSentTo(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Subject</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded-xl"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  required
                />
              </div>
              <div className="flex-grow flex flex-col min-h-0">
                <label className="block font-medium mb-1">Message</label>
                <div className="border rounded-xl overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={mailContent}
                    onChange={setMailContent}
                    modules={modules}
                    formats={formats}
                    className="h-[200px] overflow-y-auto"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsMailOpen(false)}
                  className="bg-gray-700 px-4 py-2 rounded-full text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-900 text-white px-4 py-2 rounded-full"
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