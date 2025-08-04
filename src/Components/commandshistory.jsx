import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import { FiMic, FiMicOff, FiSearch, FiX } from "react-icons/fi";

const apiEndPoint = import.meta.env.VITE_API_URL;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = SpeechRecognition ? new SpeechRecognition() : null;

if (mic) {
  mic.continuous = true;
  mic.interimResults = true;
  mic.lang = "en-US";
}

const Comments = () => {
  const { leadId } = useParams();
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ comments: "", LeadId: leadId });
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // State for search bar
  const formRef = useRef(null);
  const searchInputRef = useRef(null); // Ref for search input
  const commentsPerPage = 10;
  const token = localStorage.getItem("token");
  const { showPopup } = usePopup();

  // Effect to decode user ID from token
  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        setUserId(payload.user_id);
      } catch (error) {
        console.error("Token decode error:", error);
      }
    }
  }, [token]);

  // Effect for Speech Recognition
  useEffect(() => {
    if (!mic) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    const handleMicListen = () => {
      if (isListening) {
        mic.start();
        mic.onend = () => {
          if (isListening) mic.start();
        };
      } else {
        mic.stop();
        mic.onend = () => {};
      }
      mic.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setFormData((prev) => ({ ...prev, comments: transcript }));
      };
      mic.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    };

    handleMicListen();
    return () => {
      if (mic) {
        mic.stop();
        mic.onend = null;
        mic.onresult = null;
        mic.onerror = null;
      }
    };
  }, [isListening]);

  // Fetch comments on component mount or leadId/token change
  const fetchComments = async () => {
    if (!token || !leadId) return;
    try {
      const response = await fetch(`${apiEndPoint}/comments/allcomment/${leadId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setComments(data.result.sort((a, b) => new Date(b.icreate_dt) - new Date(a.icreate_dt)));
      } else {
        showPopup("Error", data.message || "Failed to fetch comments.", "error");
      }
    } catch (error) {
      console.error("Fetch comments error:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [leadId, token]);

  const handleNewCommentClick = async () => {
    if (comments.length === 0) {
      await fetchComments();
    }
    setFormData({ comments: "", LeadId: leadId });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();
    const trimmedComment = formData.comments.trim();

    if (trimmedComment.length === 0) {
      showPopup("Warning", "Comment cannot be empty!", "warning");
      return;
    }

    if (trimmedComment.length < 5) {
      showPopup("Warning", "Comment must be at least 5 characters long.", "warning");
      return;
    }

    try {
      const response = await fetch(`${apiEndPoint}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comments: formData.comments,
          LeadId: Number(leadId),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showPopup("Error", data.message || "Failed to add comment.", "error");
        return;
      }

      showPopup("Success", "🎉 Comment added successfully!", "success");
      setFormData((prev) => ({ ...prev, comments: "" }));
      setIsListening(false);
      
      // Auto-close the form after 2 seconds
      setTimeout(() => {
        setShowForm(false);
      }, 2000);

      fetchComments(); // Re-fetch comments to display the new one
    } catch (error) {
      showPopup("Error", "Failed to add comment due to network error.", "error");
      console.error("Add comment error:", error);
    }
  };

  // Focus the search input when it opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const activeComments = comments.filter((comment) => comment.bactive === true);
  const filteredComments = activeComments.filter((comment) =>
    comment.ccomment_content?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);

  const formatDateTime = (dateStr) =>
    new Date(dateStr).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="w-full overflow-x-hidden h-full sm:h-[100vh] shadow rounded bg-[#f8f8f8]">
      <div className="relative bg-white mt-10 border rounded-2xl overflow-hidden transition-all duration-300 w-[100%] lg:w-[90%] xl:w-[95%] mx-auto">
        
        {/* Header with Search and New Comment Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b bg-gray-50 rounded-t-2xl gap-3 sm:gap-0">
          
          {/* Interactive Search Bar */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex items-center w-full">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`
                  transition-all duration-300 ease-in-out
                  px-3 py-2 border rounded-xl text-sm
                  shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
                  bg-white
                  ${isSearchOpen ? 'w-full opacity-100' : 'w-0 opacity-0 px-0 py-0 border-none'}
                `}
              />
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`
                  p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors
                  ${isSearchOpen ? 'text-indigo-600 hover:text-indigo-800' : ''}
                `}
                aria-label="Toggle search bar"
              >
                {isSearchOpen ? <FiX size={18} /> : <FiSearch size={18} />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleNewCommentClick}
            className="bg-blue-900 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-700 transition text-sm sm:text-base w-full sm:w-auto"
          >
            + New Comment
          </button>
        </div>

        {/* Comments List */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {filteredComments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm sm:text-base py-8">No comments found.</p>
          ) : (
            currentComments.map((comment) => (
              <div
                key={comment.icomment_id}
                className="border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{comment.name}</span>
                </div>
                <p className="text-gray-700 text-sm mt-2 leading-normal sm:leading-relaxed">{comment.ccomment_content}</p>
                <p className="text-xs text-gray-400 mt-2 italic">
                  {comment.imodify_dt
                    ? `Edited by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.imodify_dt)}`
                    : `Posted by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.icreate_dt)}`}
                </p>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 sm:mt-6 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Comment Form Overlay (Modal) */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity"></div>
            <div
              ref={formRef}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 z-50 transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="font-medium text-lg sm:text-xl text-gray-800">Add Comment</h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setIsListening(false);
                  }}
                  className="text-xl sm:text-2xl text-gray-500 hover:text-red-500"
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleFormSubmission} className="flex flex-col h-full">
                <textarea
                  name="comments"
                  onChange={handleChange}
                  value={formData.comments}
                  className="w-full border rounded-lg sm:rounded-xl p-3 h-28 sm:h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                  placeholder="Write your comment..."
                />
                <div className="flex justify-between items-center mt-3 sm:mt-4">
                  {mic && (
                    <button
                      type="button"
                      onClick={() => setIsListening((prev) => !prev)}
                      className={`
                        px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all
                        ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-300 text-black"}
                      `}
                    >
                      {isListening ? <FiMicOff className="inline-block mr-1" /> : <FiMic className="inline-block mr-1" />}
                      {isListening ? "Stop" : "Start"}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-indigo-700 text-white px-4 py-1.5 sm:px-5 sm:py-2 rounded-full hover:bg-indigo-800 text-sm sm:text-base"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Comments;