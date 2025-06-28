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

// --- MessageBubble Component is now completely removed ---

const LeadDetailView = () => {
  const { leadId } = useParams();
  const [tabIndex, setTabIndex] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [isDeal, setIsDeal] = useState(false);
  const [isLost, setIsLost] = useState(true);
  const [leadData, setLeadData] = useState(null);
  const [leadLostDescription, setLeadLostDescription] = useState("");
  const [leadLostDescriptionTrue, setLeadLostDescriptionTrue] = useState(false);
  const { showPopup } = usePopup();

  // Email states (original and unchanged, with layout fixes applied to the modal)
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailContent, setMailContent] = useState("");

  const handleTabChange = (event, newValue) => setTabIndex(newValue);

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
  const descriptionValueChange = (e) => setLeadLostDescription(e.target.value);

  const lostLead = async () => {
    try {
      const token = localStorage.getItem("token");
      let userId = null;
      if (token) {
        const base64Payload = token.split(".")[1];
        const decodedPayload = atob(base64Payload);
        const payloadObject = JSON.parse(decodedPayload);
        userId = payloadObject.user_id;
      } else {
        console.log("No token found.");
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
          description: leadLostDescription,
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
        "This one’s gone. But hey, champions always bounce back 🔥🏆",
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      showPopup("Info", `Lead updated as lost. ${randomQuote}`, "info");
      setIsLost(false);
      setLeadLostDescription("");
      setLeadLostDescriptionTrue(false);
    } catch (error) {
      console.error("Error marking lead as lost:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await lostLead();
  };

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${ENDPOINTS.LEAD}/${leadId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) throw new Error("Failed to fetch lead data");

        const data = await response.json();
        setLeadData(data);
        setIsDeal(data.bisConverted);
        setIsLost(data.bactive);
      } catch (error) {
        console.error("Error fetching lead data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [leadId]);

  // Email sending logic (unchanged)
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

      console.log("Mail Sent:", resData);
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

  // Quill modules for toolbar options - NOW WITH FONT AND SIZE OPTIONS
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      [{ 'font': [] }], // Added font family selection
      [{ 'size': ['small', false, 'large', 'huge'] }], // Added font size selection
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'font', // Added 'font' to formats
    'size', // Added 'size' to formats
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link',
    'color', 'background'
  ];

  // Function to open external WhatsApp chat (kept)
  const openExternalWhatsAppChat = () => {
    if (leadData?.sphone) {
      const phoneNumber = leadData.sphone.replace(/\D/g, '');
      const message = `Hello ${leadData?.sname || 'there'}, regarding your lead: ${leadId}.`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    } else {
      showPopup("Info", "No phone number available for this lead.", "info");
    }
  };


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
            {/* Tabs are Activity, Comments, Reminders */}
            {["Activity", "Comments", "Reminders"].map((label, idx) => (
              <button
                key={label}
                onClick={() => handleTabChange(null, idx)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                  tabIndex === idx ? "bg-white shadow text-blue-600" : "text-gray-500 hover:bg-white hover:text-blue-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-4 flex-wrap">
            {/* Email Button */}
            <button
              onClick={() => setIsMailOpen(true)}
              className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1"
              title="Email"
            >
              <MdEmail size={20} />
            </button>
            {/* Call Button */}
            {/* <button className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1" title="Call">
              <FaPhone size={18} />
            </button> */}
            {/* External WhatsApp Integration Button */}
            {/* <button
              onClick={openExternalWhatsAppChat}
              className="bg-white hover:bg-blue-300 text-gray-700 font-semibold py-2 px-4 rounded-full shadow transition flex items-center justify-center gap-1"
              title="Open WhatsApp App"
            >
              <FaWhatsapp size={20} />
            </button> */}

            {!loading && !isDeal && isLost && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow transition" onClick={convertToDeal}>
                Convert
              </button>
            )}
            {!loading && isLost && (
              <button className="bg-red-100 text-red-600 hover:bg-red-200 font-semibold py-2 px-6 rounded-full shadow-inner transition" onClick={handleLostClick}>
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
                <label className="block font-medium">Description</label>
                <textarea name="description" value={leadLostDescription} onChange={descriptionValueChange} className="w-full border px-3 py-2 rounded resize-none min-h-[90px]" required />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setLeadLostDescriptionTrue(false)} className="bg-gray-300 px-4 py-2 rounded-full">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-full">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal - Layout fixed for button overlap and alignment (retained) */}
      {isMailOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="bg-white p-6 rounded-xl h-[90vh] shadow-xl w-[90%] max-w-[700px] flex flex-col">
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
                <input type="email" className="w-full border px-3 py-2 rounded-xl" value={sentTo} onChange={(e) => setSentTo(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium">Subject</label>
                <input type="text" className="w-full border px-3 py-2 rounded-xl" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} required />
              </div>
              <div className="flex-grow flex flex-col min-h-0">
                <label className="block font-medium mb-1">Message</label>
                <ReactQuill
                  theme="snow"
                  value={mailContent}
                  onChange={setMailContent}
                  modules={modules} // Updated modules with more font options
                  formats={formats} // Updated formats
                  className="bg-white flex-grow rounded-xl overflow-hidden custom-quill-editor"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setIsMailOpen(false)} className="bg-gray-700 px-4 py-2 rounded-full text-white">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-full">
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