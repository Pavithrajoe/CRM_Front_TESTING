import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

const apiEndPoint = import.meta.env.VITE_API_URL;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();
mic.continuous = true;
mic.interimResults = true;
mic.lang = "en-US";

const Comments = () => {
  const { leadId } = useParams();
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ comments: "", LeadId: leadId });
  const [deletMsg, setDeleteMsg] = useState(false);
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 10;
  const token = localStorage.getItem("token");
  const { showPopup } = usePopup();
  const [isListening, setIsListening] = useState(false);
  const formRef = useRef(null);

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

  useEffect(() => {
    const handleMicListen = () => {
      if (isListening) {
        mic.start();
        mic.onend = () => mic.start();
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
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };
    };

    handleMicListen();
    return () => {
      mic.stop();
      mic.onend = null;
      mic.onresult = null;
      mic.onerror = null;
    };
  }, [isListening]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${apiEndPoint}/comments/allcomment/${leadId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setComments(data.result.sort((a, b) => new Date(b.icreate_dt) - new Date(a.icreate_dt)));
      }
    } catch (error) {
      showPopup("Error", "Network error fetching comments.", "error");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [leadId, token]);

  const handleNewCommentClick = async () => {
    if (!comments.length) await fetchComments();
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
      return showPopup("Warning", "Comment cannot be empty!", "warning");
    }

    if (trimmedComment.length < 5) {
      return showPopup("Warning", "Comment must be at least 5 characters long.", "warning");
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
        return showPopup("Error", data.message || "Failed to add comment.", "error");
      }

      showPopup("Success", "🎉 Comment added successfully!", "success");
      setFormData((prev) => ({ ...prev, comments: "" }));
      setShowForm(false);
      fetchComments();
    } catch (error) {
      showPopup("Error", "Failed to add comment due to network error.", "error");
    }
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showForm && formRef.current && !formRef.current.contains(event.target)) {
        setShowForm(false);
        setIsListening(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showForm]);

  return (
    <div className="relative bg-white border rounded-2xl shadow-md overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
        <input
          type="text"
          placeholder="Search comments..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border rounded-xl text-sm w-1/2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
        <button
          onClick={handleNewCommentClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-700 transition"
        >
          + New Comment
        </button>
      </div>

      <div className="p-6 space-y-5">
        {filteredComments.length === 0 ? (
          <p className="text-center text-gray-400">No comments found.</p>
        ) : (
          currentComments.map((comment) => (
            <div
              key={comment.icomment_id}
              className="border border-gray-200 rounded-3xl p-5 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-900 text-base">{comment.name}</span>
              </div>
              <p className="text-gray-700 text-sm mt-3 leading-relaxed">{comment.ccomment_content}</p>
              <p className="text-xs text-gray-400 mt-2 italic">
                {comment.imodify_dt
                  ? `Edited by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.imodify_dt)}`
                  : `Posted by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.icreate_dt)}`}
              </p>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-1 rounded-full text-sm ${
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

      {showForm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity"></div>
          <div
            ref={formRef}
            className="fixed top-1/2 right-6 transform -translate-y-1/2 w-96 max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-50 transition-all duration-300"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg text-gray-800">Add Comment</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setIsListening(false);
                }}
                className="text-xl text-gray-500 hover:text-red-500"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleFormSubmission} className="flex flex-col h-full">
              <textarea
                name="comments"
                onChange={handleChange}
                value={formData.comments}
                className="w-full border rounded-xl p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Write your comment..."
              />
              <div className="flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsListening((prev) => !prev)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-300 text-black"
                  }`}
                >
                  {isListening ? "🎙️ Stop" : "🎤 Start"}
                </button>
                <button type="submit" className="bg-indigo-700 text-white px-5 py-2 rounded-full hover:bg-indigo-800">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Comments;