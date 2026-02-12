import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import { FiX, FiMail, FiCalendar } from "react-icons/fi";
import Loader from "../../Loader";
import DOMPurify from "dompurify";

const apiEndPoint = import.meta.env.VITE_API_URL;
// console.log("API Endpoint:", apiEndPoint);

const LeadMailStorage = ({ leadId, isOpen, onClose }) => {
  const [mails, setMails] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !leadId) {
      setMails([]);
      setSelectedMail(null);
      return;
    }

    const fetchMails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiEndPoint}/sentmail`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        const allMails = Array.isArray(response?.data?.mails)
          ? response.data.mails
          : [];

        const leadMails = allMails.filter((mail) => {
          return String(mail.lead_id) === String(leadId);
        });


        if (leadMails.length > 0) {
          const sortedMails = leadMails.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setMails(sortedMails);
        } 
        else {
          setMails([]);
        }
      } 
      catch (err) {
        console.error("Failed to fetch mail history:", err);
        setError("Failed to load mail history. Please try again.");
      } 
      finally {
        setLoading(false);
      }
    };
    fetchMails();
  }, [isOpen, leadId]);

  // Fetch detailed for a selected mail
  const fetchMailDetails = async (mailId) => {
    setIsDetailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${apiEndPoint}/sentmail/${mailId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      setSelectedMail(response?.data?.mail ?? null);
    } catch (err) {
      console.error("Failed to fetch mail details:", err);
      setSelectedMail(mails.find((m) => m.lead_mail_id === mailId));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const sanitizeHtml = (html) => {
    return DOMPurify.sanitize(html);
  };

  const handleClose = () => {
    setSelectedMail(null);
    setMails([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col sm:flex-row overflow-hidden relative">
          <button  onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors" >
            <FiX size={24} />
          </button>

          {/* Header for mobile view */}
          <div className="sm:hidden flex items-center p-4 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-800">
              Mail History
            </Dialog.Title>
          </div>

          {/*  Inbox List */}
          <div className="w-full sm:w-1/3 flex flex-col border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="hidden sm:flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Inbox</h3>
            </div>
            {loading ? (
              <div className="p-4 flex justify-center items-center">
                <Loader />
              </div>
            ) : error ? (
              <p className="p-4 text-red-500 text-sm">{error}</p>
            ) : mails.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 italic">
                No emails found for this lead.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {mails.map((mail) => (
                  <li
                    key={mail.lead_mail_id}
                    onClick={() => fetchMailDetails(mail.lead_mail_id)}
                    className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedMail?.lead_mail_id === mail.lead_mail_id
                        ? "bg-blue-100 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FiMail className="text-gray-500" />
                      <h4 className="font-semibold text-sm text-gray-800 truncate">
                        {mail.subject}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                      <FiCalendar size={12} />
                      <span>
                        {new Date(mail.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mail Details */}
          <div className="w-full sm:w-2/3 flex flex-col p-6 overflow-y-auto">
            {isDetailLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader />
              </div>
            ) : selectedMail ? (
              <>
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedMail.subject}
                  </h3>
                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p>
                      <span className="font-medium">To:</span>{" "}
                      {selectedMail.to_email}
                    </p>
                    {selectedMail.cc_email && (
                      <p>
                        <span className="font-medium">Cc:</span>{" "}
                        {selectedMail.cc_email}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Sent on:{" "}
                      {new Date(selectedMail.created_at).toLocaleString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )}
                    </p>
                  </div>
                </div>
                <div
                  className="prose max-w-none text-gray-800 break-words"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedMail.message),
                  }}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <FiMail size={64} className="mb-4" />
                <p>Select an email from the left to view details.</p>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LeadMailStorage;
