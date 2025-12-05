import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import { Search, X } from "lucide-react";

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
  const [editingComment, setEditingComment] = useState(null); // New state for editing
  const [isSearchOpen, setIsSearchOpen] = useState(false); // State to toggle search bar

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
    setEditingComment(null); // Ensure editing state is null for new comment
    setShowForm(true);
  };

  const handleEditClick = (comment) => {
    setEditingComment(comment);
    setFormData({ comments: comment.ccomment_content, LeadId: leadId });
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

      // showPopup("Success", "Comment added successfully!", "success");
      setFormData((prev) => ({ ...prev, comments: "" }));
      setIsListening(false);
      setShowForm(false);
      fetchComments(); // Re-fetch comments to display the new one
      return true;
    } catch (error) {
      showPopup("Error", "Failed to add comment due to network error.", "error");
      console.error("Add comment error:", error);
    }
  };

  const handleEditSubmission = async (e) => {
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
      const response = await fetch(`${apiEndPoint}/comments/${editingComment.icomment_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comments: trimmedComment,
          ilead_id: Number(leadId),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showPopup("Error", data.message || "Failed to update comment.", "error");
        return;
      }
      showPopup("Success", "🎉 Comment updated successfully!", "success");
      setEditingComment(null); // Clear the editing state
      setFormData({ comments: "", LeadId: leadId }); // Clear form
      setShowForm(false); // Close the form
      fetchComments(); // Re-fetch comments
    } catch (error) {
      showPopup("Error", "Failed to update comment due to network error.", "error");
      console.error("Update comment error:", error);
    }
  };

const handleOutsideClick = (event) => {
  if (formRef.current && !formRef.current.contains(event.target)) {
    setShowForm(false);
    setIsListening(false);
    setEditingComment(null);
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
    new Date(dateStr).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }).toUpperCase();

  return (
    <div className="w-full overflow-x-hidden h-[100vh] shadow rounded bg-[#f8f8f8]">
      <div className="relative mt-10 overflow-hidden transition-all duration-300 w-[100%] lg:w-[90%] xl:w-[95%] mx-auto">
        {/* Header with Search and New Comment Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 sm:px-6 sm:py-4 gap-4">
          <div className="relative flex items-center w-full sm:w-auto">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                transition-all duration-300 ease-in-out
                bg-transparent outline-none text-sm font-medium
                ${isSearchOpen ? 'w-full px-4 py-2 opacity-100' : 'w-0 px-0 py-0 opacity-0'}
              `}
            />
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors
                ${isSearchOpen ? 'text-blue-900' : ''}
              `}
              aria-label="Toggle search bar"
            >
              <Search size={18} />
            </button>
          </div>
          <button
            onClick={handleNewCommentClick}
            className="bg-blue-900 shadow-md shadow-blue-900 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700 transition duration-150 ease-in-out flex-shrink-0 text-sm sm:text-base"
          >
            + New Comment
          </button>
        </div>

        {/* Comments List */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          {filteredComments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm sm:text-base py-8">No comments found.</p>
          ) : (
            currentComments.map((comment) => (
              <div
                key={comment.icomment_id}
                className="border border-gray-200 rounded-2xl shadow-xl sm:rounded-3xl p-6 sm:p-5 bg-white hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-gray-900 text-xl sm:text-md ">{comment.name}</span>
                  {userId && userId === comment.iuser_id && (
                    <button
                      onClick={() => handleEditClick(comment)}
                      className="text-gray-700 hover:text-blue-500 transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-gray-800 text-sm leading-relaxed">
                  <p>{comment.ccomment_content}</p>
                  <p className="italic font-semibold text-gray-700">
                    {comment.imodify_dt
                      ? `Edited by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.imodify_dt)}`
                      : `Posted by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.icreate_dt)}`}
                  </p>
                </div>
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
  <div
    className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity flex justify-center items-center"
    onClick={handleOutsideClick} //  Use function
  >
    <div
      ref={formRef}
      className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-md sm:max-w-lg md:max-w-xl p-6 transition-all duration-300"
      onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-xl text-gray-800">
          {editingComment ? "Edit Comment" : "Add Comment"}
        </h3>
        <button
          onClick={() => {
            setShowForm(false);
            setIsListening(false);
            setEditingComment(null);
          }}
          className="text-2xl text-gray-500 hover:text-red-500"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={editingComment ? handleEditSubmission : handleFormSubmission}
        className="flex flex-col gap-4"
      >
        <textarea
          name="comments"
          onChange={handleChange}
          value={formData.comments}
          className="w-full border rounded-xl p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          placeholder="Write your comment..."
        />

        <div className="flex justify-between items-center">
          {mic && (
            <button
              type="button"
              onClick={() => setIsListening((prev) => !prev)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-300 text-black"
              }`}
            >
              {isListening ? "🎙️ Stop" : "🎤 Start"}
            </button>
          )}

          <button
            type="submit"
            className="bg-indigo-700 text-white px-5 py-2 rounded-full hover:bg-indigo-800 text-base"
          >
            {editingComment ? "Update" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default Comments;