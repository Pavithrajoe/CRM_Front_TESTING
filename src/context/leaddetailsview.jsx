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
  const { showPopup } = usePopup();

  const [isMailOpen, setIsMailOpen] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailContent, setMailContent] = useState("");

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
          sent_to: sentTo, // Corrected: Use 'sentTo' state variable
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
      setSentTo(""); // Clear the sentTo field after sending
      setMailSubject("");
      setMailContent("");
    } catch (error) {
      console.error("Error sending mail:", error);
      showPopup("Error", "Something went wrong while sending email", "error");
    }
  };

  useEffect(() => {
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
        setLeadData(data); // Set leadData first
        setIsDeal(data.bisConverted);
        setIsLost(data.bactive);

        // Set sentTo to lead's email or empty string
        setSentTo(data.cemail || ""); // This line auto-populates the email field

        console.log("DEBUG: cEmail found and set to:", data.cemail);

        console.log("DEBUG: Lead Data cFirstName:", data.cFirstName);
        console.log("DEBUG: Lead Data cLastName:", data.cLastName);
        console.log("DEBUG: Lead Data cProjectName:", data.cProjectName);

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

          console.log("DEBUG: Decoded JWT Payload:", payloadObject);

          // Attempt to get user name from common properties
          setLoggedInUserName(
            payloadObject.cFull_name || // Your specified property
            payloadObject.fullName ||
            payloadObject.name ||
            payloadObject.cUser_name || // Your other specified property
            "User"
          );

          // Attempt to get company name from common properties
          // Note: If 'company_name' or similar is truly not in the JWT,
          // you'll need to fetch it from a separate user profile API.
          setLoggedInCompanyName(
            payloadObject.company_name ||
            payloadObject.company ||
            payloadObject.organization ||
            payloadObject.orgName ||
            "Your Company"
          );

          console.log("DEBUG: User Name extracted (attempted):", loggedInUserName);
          console.log("DEBUG: Company Name extracted (attempted):", loggedInCompanyName);

        } else {
          console.warn("DEBUG: No JWT token found in localStorage.");
          // Fallback if token is not present, check for userInfo in localStorage (if stored separately)
          const userInfoString = localStorage.getItem("userInfo");
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            console.log("DEBUG: UserInfo from localStorage (separate storage):", userInfo);
            setLoggedInUserName(userInfo.cFull_name || userInfo.fullName || userInfo.name || userInfo.cUser_name || "User");
            setLoggedInCompanyName(userInfo.company_name || userInfo.company || userInfo.organization || userInfo.orgName || "Your Company");
            console.log("DEBUG: User Info from localStorage (separate) extracted:", loggedInUserName);
            console.log("DEBUG: Company Info from localStorage (separate) extracted:", loggedInCompanyName);
          } else {
            console.warn("DEBUG: No 'userInfo' found in localStorage either.");
          }
        }
      } catch (error) {
        console.error("Error extracting user info from token/localStorage:", error);
        setLoggedInUserName("Your Name"); // Default if extraction fails
        setLoggedInCompanyName("Your Company"); // Default if extraction fails
      }
    };

    fetchLeadData();
    fetchLostReasons();
    getUserInfoFromLocalStorage();
  }, [leadId]); // Depend on leadId only for these initial fetches

  useEffect(() => {
    // This useEffect populates the email template when the modal opens or leadData/user info changes
    if (isMailOpen && leadData) {
      console.log("DEBUG: Inside mail-specific useEffect (template generation).");
      console.log("DEBUG: leadData available for template:", leadData);
      console.log("DEBUG: loggedInUserName for template:", loggedInUserName);
      console.log("DEBUG: loggedInCompanyName for template:", loggedInCompanyName);
      console.log("DEBUG: current sentTo state (pre-modal update):", sentTo);


      // Re-setting sentTo here is generally redundant if fetchLeadData sets it correctly,
      // but keeping it as a fallback in case of race conditions.
      if (leadData.cEmail && sentTo !== leadData.cEmail) {
          setSentTo(leadData.cEmail);
          console.log("DEBUG: Re-set sentTo in mail useEffect (redundant, but safe) to:", leadData.cEmail);
      } else if (!leadData.cEmail) {
          console.warn("DEBUG: leadData.cEmail is missing or empty when opening mail modal for template.");
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


      console.log("DEBUG: Email Modal Prepared - Subject:", defaultSubject);
      console.log("DEBUG: Email Modal Prepared - Content (truncated):", defaultContent.substring(0, 150) + "...");
      console.log("DEBUG: Final sentTo state when modal opens (after potential re-set):", sentTo);
    } else if (isMailOpen && !leadData) {
        console.warn("DEBUG: Mail modal opened but leadData is not yet available for template generation!");
    }

  }, [isMailOpen, leadData, loggedInUserName, loggedInCompanyName]); // Removed sentTo from dependencies here as it's set inside the effect

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
          {!loading && isDeal && isLost && (
            <div className="flex items-center gap-2 text-green-600 text-lg font-semibold bg-green-50 px-4 py-2 rounded-full shadow">
              <span role="img" aria-label="deal">🎉</span> Deal
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-4 w-full overflow-x-hidden">
          <div className="flex flex-wrap gap-2 bg-gray-100 rounded-full p-1 shadow-inner w-full sm:w-auto">
            {["Activity", "Comments", "Reminders"].map((label, idx) => (
              <button
                key={label}
                onClick={() => handleTabChange(null, idx)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                  tabIndex === idx
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:bg-white hover:text-blue-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setIsMailOpen(true)}
              className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1"
              title="Email"
            >
              <MdEmail size={20} /> Email
            </button>

            {/* <button className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1">
              <FaPhone size={18} /> Call
            </button>

            <button className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1">
              <FaWhatsapp size={20} /> WhatsApp
            </button> */}

            {!loading && !isDeal && isLost && (
              <>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow transition"
                  onClick={convertToDeal}
                >
                  Convert
                </button>
                <button
                  className="bg-red-100 text-red-600 hover:bg-red-200 font-semibold py-2 px-6 rounded-full shadow-inner transition"
                  onClick={handleLostClick}
                >
                  Lost
                </button>
              </>
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
                  Pick the reason for marking this lead as Lost:
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
                sendEmail(); // Call sendEmail function directly here
              }}
              className="flex flex-col flex-grow space-y-4"
            >
              <div>
                <label className="block font-medium">To</label>
                <input
                  type="email"
                  className="w-full border px-3 py-2 rounded-xl"
                  value={sentTo} // Corrected: Use 'sentTo' state variable
                  onChange={(e) => setSentTo(e.target.value)} // Corrected: Update 'sentTo' state
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