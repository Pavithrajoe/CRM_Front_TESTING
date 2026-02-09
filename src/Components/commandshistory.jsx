import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

const Comments = ({ onCountChange, taskId,compact = false }) => {
  const { leadId } = useParams();
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ comments: "", LeadId: leadId, taskId: "" });
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const formRef = useRef(null);
  const searchInputRef = useRef(null);
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

  const fetchComments = useCallback(async () => {
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
  }, [token, leadId, showPopup]);

  const fetchTasksByLead = useCallback(async () => {
    if (!token || !leadId) return;
    try {
      const res = await fetch(`${apiEndPoint}/task/lead/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error("Fetch tasks error", err);
    }
  }, [token, leadId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (taskId) {
      fetchComments();
      setCurrentPage(1);
    }
  }, [taskId, fetchComments]);
  //add feb9
  useEffect(() => {
  if (leadId && token) {
    fetchTasksByLead();
  }
}, [leadId, token, fetchTasksByLead]);


  useEffect(() => {
    if (typeof onCountChange === "function") {
      onCountChange(comments.filter(c => c.bactive === true).length);
    }
  }, [comments, onCountChange]);

  const handleNewCommentClick = useCallback(async () => {
    if (comments.length === 0) {
      await fetchComments();
    }
    await fetchTasksByLead();
    setFormData({ comments: "", LeadId: leadId, taskId: taskId || "" });
    setEditingComment(null);
    setShowForm(true);
  }, [comments.length, leadId, taskId, fetchComments, fetchTasksByLead]);

  const handleEditClick = useCallback(async (comment) => {
    setShowForm(false);
    await fetchTasksByLead();
    setEditingComment(comment);
    setFormData({ 
      comments: comment.ccomment_content, 
      LeadId: leadId, 
      taskId: comment.itask_id || "" 
    });
    setShowForm(true);
  }, [leadId, fetchTasksByLead]);

  const handleChange = useCallback((e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }, [formData]);

  const handleFormSubmission = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const loadingPromise = new Promise(resolve => setTimeout(resolve, 1000));
    const trimmedComment = formData.comments.trim();
    
    if (trimmedComment.length === 0) {
      await loadingPromise;
      showPopup("Warning", "Comment cannot be empty!", "warning");
      setIsSubmitting(false);
      return;
    }

    if (trimmedComment.length < 5) {
      await loadingPromise;
      showPopup("Warning", "Comment must be at least 5 characters long.", "warning");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await Promise.all([
        fetch(`${apiEndPoint}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comments: formData.comments,
            LeadId: Number(leadId),
            taskId: formData.taskId || null,
          }),
        }),
        loadingPromise 
      ]);

      const actualResponse = response[0];
      const data = await actualResponse.json();
      
      if (!actualResponse.ok) {
        showPopup("Error", data.message || "Failed to add comment.", "error");
        setIsSubmitting(false);
        return;
      }

      showPopup("Success", "🎉 Comment added successfully!", "success");
      setFormData({ comments: "", LeadId: leadId, taskId: taskId || "" });
      setIsListening(false);
      setShowForm(false);
      setEditingComment(null);
      setIsSubmitting(false);
      fetchComments();
    } catch (error) {
      showPopup("Error", "Failed to add comment due to network error.", "error");
      setIsSubmitting(false);
      console.error("Add comment error:", error);
    }
  }, [formData, isSubmitting, leadId, taskId, token, showPopup, fetchComments]);

  const handleEditSubmission = useCallback(async (e) => {
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
          comments: formData.comments,
          LeadId: Number(leadId),
          taskId: formData.taskId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showPopup("Error", data.message || "Failed to update comment.", "error");
        return;
      }
      showPopup("Success", "🎉 Comment updated successfully!", "success");
      setEditingComment(null);
      setFormData({ comments: "", LeadId: leadId, taskId: taskId || "" });
      setShowForm(false);
      fetchComments();
    } catch (error) {
      showPopup("Error", "Failed to update comment due to network error.", "error");
      console.error("Update comment error:", error);
    }
  }, [editingComment, formData, leadId, taskId, token, showPopup, fetchComments]);

  const handleOutsideClick = useCallback((event) => {
    if (formRef.current && !formRef.current.contains(event.target)) {
      setShowForm(false);
      setIsListening(false);
      setEditingComment(null);
    }
  }, []);

  // Memoized filtered comments
  const activeComments = useMemo(() => {
    return comments.filter(comment => {
      if (!comment.bactive) return false;
      if (taskId) {
        return Number(comment.itask_id) === Number(taskId);
      }
      return true;
    });
  }, [comments, taskId]);

  const filteredComments = useMemo(() => {
    return activeComments.filter((comment) =>
      comment.ccomment_content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeComments, searchQuery]);

  const currentComments = useMemo(() => {
    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    return filteredComments.slice(indexOfFirstComment, indexOfLastComment);
  }, [filteredComments, currentPage, commentsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredComments.length / commentsPerPage);
  }, [filteredComments, commentsPerPage]);

  // const formatDateTime = useCallback((dateStr) => {
  //   if (!dateStr) return "N/A";
  //   const date = new Date(dateStr);
  //   return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  // }, []);

  const formatDateTime = useCallback((dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 → 12

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()} ${String(hours).padStart(
    2,
    "0"
  )}:${minutes} ${ampm}`;
}, []);


  const taskMap = useMemo(() => {
    const map = {};
    tasks.forEach(task => {
      map[task.itask_id] = task.ctitle;
    });
    return map;
  }, [tasks]);

  return (
   <div className={compact ? "w-full h-full" : "w-full min-h-screen bg-[#f8f8f8] py-4 px-2 sm:px-4 lg:px-6"}>

     <div
  className={
    compact
      ? "w-full h-full" // popup → no card
      : "relative bg-white border rounded-2xl max-w-7xl shadow-sm mx-auto"
  }
>
        {/* Header */}
        {!compact &&(
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-2xl gap-4">
          <div className="relative flex items-center bg-white border rounded-full w-full sm:w-72 px-3">
            <Search size={16} className="text-gray-400" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search comments..." 
              value={searchQuery} 
              onChange={(e) => { 
                setSearchQuery(e.target.value); 
                setCurrentPage(1); 
              }} 
              className="w-full p-2 outline-none text-sm ml-8" 
            />
          </div>
          {!compact && (
          <button 
            onClick={handleNewCommentClick} 
            className="bg-blue-900 shadow-md shadow-blue-900 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700 transition duration-150 ease-in-out text-sm sm:text-base whitespace-nowrap w-full sm:w-auto text-center flex-shrink-0"
          >
            + New Comment
          </button>
          )}
        </div>
)}
        {/* Comments List */}
        <div
          className={`
            p-3 sm:p-6 space-y-4 flex-1 overflow-y-auto
            scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-gray-100
            hover:scrollbar-thumb-blue-700 scroll-smooth
            ${compact ? "h-full max-h-full" : "h-full max-h-[calc(100vh-150px)]"}
          `}
        >

          {filteredComments.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm sm:text-base">No comments found.</p>
          ) : (
            currentComments.map((comment) => (
              <div
                key={comment.icomment_id}
                className="border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out relative"
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <span className="font-semibold text-base sm:text-lg text-gray-900 break-words">
                    {comment.name}
                  </span>
                  {comment.itask_id && taskMap[comment.itask_id] && (
                    <div className="w-full text-left mb-1">
                      <span className="inline-block font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                        Task Name: {taskMap[comment.itask_id]}
                      </span>
                    </div>
                  )}
                  {!compact && userId && userId === comment.iuser_id && (
                    <button
                      onClick={() => handleEditClick(comment)}
                      className="text-gray-400 hover:text-blue-500 transition-colors duration-200 flex-shrink-0"
                      title="Edit comment"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-gray-700 text-sm mt-2 leading-normal break-words font-bold">
                  {comment.ccomment_content}
                </p>
                <p className="text-xs text-gray-900 mt-2 italic break-words">
                  {comment.imodify_dt
                    ? `Edited by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.imodify_dt)}`
                    : `Posted by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.icreate_dt)}`}
                </p>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button 
                  key={i + 1} 
                  onClick={() => setCurrentPage(i + 1)} 
                  className={`px-3 py-1 rounded-full text-xs ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Comment Form Overlay */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleOutsideClick}></div>
            <div 
              ref={formRef}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg p-5 bg-white rounded-2xl shadow-2xl max-h-[85vh] z-[1001] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg text-gray-800">
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
              <form onSubmit={editingComment ? handleEditSubmission : handleFormSubmission} className="flex flex-col space-y-4">
                <select
                  name="taskId"
                  value={formData.taskId || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Select Task (Optional)</option>
                  {tasks.map(task => (
                    <option key={task.itask_id} value={task.itask_id}>
                      {task.ctitle}
                    </option>
                  ))}
                </select>
                <textarea 
                  name="comments" 
                  onChange={handleChange} 
                  value={formData.comments}
                  className="w-full border rounded-xl p-3 h-32 resize-none text-sm focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Write your comment..." 
                  required
                />
                {mic && (
                  <button 
                    type="button" 
                    onClick={() => setIsListening(!isListening)} 
                    className={`px-4 py-2 rounded-full text-xs font-medium ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-300 text-black"}`}
                  >
                    {isListening ? "🎙️ Stop" : "🎤 Voice Input"}
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-indigo-700 text-white py-3 rounded-full hover:bg-indigo-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : editingComment ? "Update" : "Submit"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Comments;


// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { useParams } from "react-router-dom";
// import { usePopup } from "../context/PopupContext";
// import { Search, X } from "lucide-react";

// const apiEndPoint = import.meta.env.VITE_API_URL;
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// const mic = SpeechRecognition ? new SpeechRecognition() : null;

// if (mic) {
//   mic.continuous = true;
//   mic.interimResults = true;
//   mic.lang = "en-US";
// }

// const Comments = ({ onCountChange, taskId,compact = false }) => {
//   const { leadId } = useParams();
//   const [comments, setComments] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [formData, setFormData] = useState({ comments: "", LeadId: leadId, taskId: "" });
//   const [userId, setUserId] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [isListening, setIsListening] = useState(false);
//   const [editingComment, setEditingComment] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [tasks, setTasks] = useState([]);
//   const formRef = useRef(null);
//   const searchInputRef = useRef(null);
//   const commentsPerPage = 10;
//   const token = localStorage.getItem("token");
//   const { showPopup } = usePopup();

//   // Effect to decode user ID from token
//   useEffect(() => {
//     if (token) {
//       try {
//         const base64Url = token.split(".")[1];
//         const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//         const payload = JSON.parse(atob(base64));
//         setUserId(payload.user_id);
//       } catch (error) {
//         console.error("Token decode error:", error);
//       }
//     }
//   }, [token]);

//   // Effect for Speech Recognition
//   useEffect(() => {
//     if (!mic) {
//       console.warn("Speech Recognition API not supported in this browser.");
//       return;
//     }

//     const handleMicListen = () => {
//       if (isListening) {
//         mic.start();
//         mic.onend = () => {
//           if (isListening) mic.start();
//         };
//       } else {
//         mic.stop();
//         mic.onend = () => {};
//       }
//       mic.onresult = (event) => {
//         const transcript = Array.from(event.results)
//           .map((result) => result[0].transcript)
//           .join("");
//         setFormData((prev) => ({ ...prev, comments: transcript }));
//       };
//       mic.onerror = (event) => {
//         console.error("Speech recognition error:", event.error);
//         setIsListening(false);
//       };
//     };

//     handleMicListen();
//     return () => {
//       if (mic) {
//         mic.stop();
//         mic.onend = null;
//         mic.onresult = null;
//         mic.onerror = null;
//       }
//     };
//   }, [isListening]);

//   const fetchComments = useCallback(async () => {
//     if (!token || !leadId) return;
//     try {
//       const response = await fetch(`${apiEndPoint}/comments/allcomment/${leadId}`, {
//         method: "GET",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setComments(data.result.sort((a, b) => new Date(b.icreate_dt) - new Date(a.icreate_dt)));
//       } else {
//         showPopup("Error", data.message || "Failed to fetch comments.", "error");
//       }
//     } catch (error) {
//       console.error("Fetch comments error:", error);
//     }
//   }, [token, leadId, showPopup]);

//   const fetchTasksByLead = useCallback(async () => {
//     if (!token || !leadId) return;
//     try {
//       const res = await fetch(`${apiEndPoint}/task/lead/${leadId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setTasks(data.data || []);
//       }
//     } catch (err) {
//       console.error("Fetch tasks error", err);
//     }
//   }, [token, leadId]);

//   useEffect(() => {
//     fetchComments();
//   }, [fetchComments]);

//   useEffect(() => {
//     if (taskId) {
//       fetchComments();
//       setCurrentPage(1);
//     }
//   }, [taskId, fetchComments]);

//   useEffect(() => {
//     if (typeof onCountChange === "function") {
//       onCountChange(comments.filter(c => c.bactive === true).length);
//     }
//   }, [comments, onCountChange]);

//   const handleNewCommentClick = useCallback(async () => {
//     if (comments.length === 0) {
//       await fetchComments();
//     }
//     await fetchTasksByLead();
//     setFormData({ comments: "", LeadId: leadId, taskId: taskId || "" });
//     setEditingComment(null);
//     setShowForm(true);
//   }, [comments.length, leadId, taskId, fetchComments, fetchTasksByLead]);

//   const handleEditClick = useCallback(async (comment) => {
//     setShowForm(false);
//     await fetchTasksByLead();
//     setEditingComment(comment);
//     setFormData({ 
//       comments: comment.ccomment_content, 
//       LeadId: leadId, 
//       taskId: comment.itask_id || "" 
//     });
//     setShowForm(true);
//   }, [leadId, fetchTasksByLead]);

//   const handleChange = useCallback((e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   }, [formData]);

//   const handleFormSubmission = useCallback(async (e) => {
//     e.preventDefault();
//     if (isSubmitting) return;
//     setIsSubmitting(true);
//     const loadingPromise = new Promise(resolve => setTimeout(resolve, 1000));
//     const trimmedComment = formData.comments.trim();
    
//     if (trimmedComment.length === 0) {
//       await loadingPromise;
//       showPopup("Warning", "Comment cannot be empty!", "warning");
//       setIsSubmitting(false);
//       return;
//     }

//     if (trimmedComment.length < 5) {
//       await loadingPromise;
//       showPopup("Warning", "Comment must be at least 5 characters long.", "warning");
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       const response = await Promise.all([
//         fetch(`${apiEndPoint}/comments`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             comments: formData.comments,
//             LeadId: Number(leadId),
//             taskId: formData.taskId || null,
//           }),
//         }),
//         loadingPromise 
//       ]);

//       const actualResponse = response[0];
//       const data = await actualResponse.json();
      
//       if (!actualResponse.ok) {
//         showPopup("Error", data.message || "Failed to add comment.", "error");
//         setIsSubmitting(false);
//         return;
//       }

//       showPopup("Success", "🎉 Comment added successfully!", "success");
//       setFormData({ comments: "", LeadId: leadId, taskId: taskId || "" });
//       setIsListening(false);
//       setShowForm(false);
//       setEditingComment(null);
//       setIsSubmitting(false);
//       fetchComments();
//     } catch (error) {
//       showPopup("Error", "Failed to add comment due to network error.", "error");
//       setIsSubmitting(false);
//       console.error("Add comment error:", error);
//     }
//   }, [formData, isSubmitting, leadId, taskId, token, showPopup, fetchComments]);

//   const handleEditSubmission = useCallback(async (e) => {
//     e.preventDefault();
//     const trimmedComment = formData.comments.trim();
//     if (trimmedComment.length === 0) {
//       showPopup("Warning", "Comment cannot be empty!", "warning");
//       return;
//     }
//     if (trimmedComment.length < 5) {
//       showPopup("Warning", "Comment must be at least 5 characters long.", "warning");
//       return;
//     }

//     try {
//       const response = await fetch(`${apiEndPoint}/comments/${editingComment.icomment_id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           comments: formData.comments,
//           LeadId: Number(leadId),
//           taskId: formData.taskId || null,
//         }),
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         showPopup("Error", data.message || "Failed to update comment.", "error");
//         return;
//       }
//       showPopup("Success", "🎉 Comment updated successfully!", "success");
//       setEditingComment(null);
//       setFormData({ comments: "", LeadId: leadId, taskId: taskId || "" });
//       setShowForm(false);
//       fetchComments();
//     } catch (error) {
//       showPopup("Error", "Failed to update comment due to network error.", "error");
//       console.error("Update comment error:", error);
//     }
//   }, [editingComment, formData, leadId, taskId, token, showPopup, fetchComments]);

//   const handleOutsideClick = useCallback((event) => {
//     if (formRef.current && !formRef.current.contains(event.target)) {
//       setShowForm(false);
//       setIsListening(false);
//       setEditingComment(null);
//     }
//   }, []);

//   // Memoized filtered comments
//   const activeComments = useMemo(() => {
//     return comments.filter(comment => {
//       if (!comment.bactive) return false;
//       if (taskId) {
//         return Number(comment.itask_id) === Number(taskId);
//       }
//       return true;
//     });
//   }, [comments, taskId]);

//   const filteredComments = useMemo(() => {
//     return activeComments.filter((comment) =>
//       comment.ccomment_content?.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }, [activeComments, searchQuery]);

//   const currentComments = useMemo(() => {
//     const indexOfLastComment = currentPage * commentsPerPage;
//     const indexOfFirstComment = indexOfLastComment - commentsPerPage;
//     return filteredComments.slice(indexOfFirstComment, indexOfLastComment);
//   }, [filteredComments, currentPage, commentsPerPage]);

//   const totalPages = useMemo(() => {
//     return Math.ceil(filteredComments.length / commentsPerPage);
//   }, [filteredComments, commentsPerPage]);

//   // const formatDateTime = useCallback((dateStr) => {
//   //   if (!dateStr) return "N/A";
//   //   const date = new Date(dateStr);
//   //   return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
//   // }, []);

//   const formatDateTime = useCallback((dateStr) => {
//   if (!dateStr) return "-";

//   const date = new Date(dateStr);

//   let hours = date.getHours();
//   const minutes = String(date.getMinutes()).padStart(2, "0");
//   const ampm = hours >= 12 ? "PM" : "AM";

//   hours = hours % 12;
//   hours = hours ? hours : 12; // 0 → 12

//   return `${String(date.getDate()).padStart(2, "0")}/${String(
//     date.getMonth() + 1
//   ).padStart(2, "0")}/${date.getFullYear()} ${String(hours).padStart(
//     2,
//     "0"
//   )}:${minutes} ${ampm}`;
// }, []);


//   const taskMap = useMemo(() => {
//     const map = {};
//     tasks.forEach(task => {
//       map[task.itask_id] = task.ctitle;
//     });
//     return map;
//   }, [tasks]);

//   return (
//    <div className={compact ? "w-full h-full" : "w-full min-h-screen bg-[#f8f8f8] py-4 px-2 sm:px-4 lg:px-6"}>

//      <div
//   className={
//     compact
//       ? "w-full h-full" // popup → no card
//       : "relative bg-white border rounded-2xl max-w-7xl shadow-sm mx-auto"
//   }
// >
//         {/* Header */}
//         {!compact &&(
//         <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-2xl gap-4">
//           <div className="relative flex items-center bg-white border rounded-full w-full sm:w-72 px-3">
//             <Search size={16} className="text-gray-400" />
//             <input 
//               ref={searchInputRef}
//               type="text" 
//               placeholder="Search comments..." 
//               value={searchQuery} 
//               onChange={(e) => { 
//                 setSearchQuery(e.target.value); 
//                 setCurrentPage(1); 
//               }} 
//               className="w-full p-2 outline-none text-sm ml-8" 
//             />
//           </div>
//           {!compact && (
//           <button 
//             onClick={handleNewCommentClick} 
//             className="bg-blue-900 shadow-md shadow-blue-900 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700 transition duration-150 ease-in-out text-sm sm:text-base whitespace-nowrap w-full sm:w-auto text-center flex-shrink-0"
//           >
//             + New Comment
//           </button>
//           )}
//         </div>
// )}
//         {/* Comments List */}
//         <div
//           className={`
//             p-3 sm:p-6 space-y-4 flex-1 overflow-y-auto
//             scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-gray-100
//             hover:scrollbar-thumb-blue-700 scroll-smooth
//             ${compact ? "h-full max-h-full" : "h-full max-h-[calc(100vh-150px)]"}
//           `}
//         >

//           {filteredComments.length === 0 ? (
//             <p className="text-center text-gray-400 py-8 text-sm sm:text-base">No comments found.</p>
//           ) : (
//             currentComments.map((comment) => (
//               <div
//                 key={comment.icomment_id}
//                 className="border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out relative"
//               >
//                 <div className="flex justify-between items-start gap-3 mb-2">
//                   <span className="font-semibold text-base sm:text-lg text-gray-900 break-words">
//                     {comment.name}
//                   </span>
//                   {comment.itask_id && taskMap[comment.itask_id] && (
//                     <div className="w-full text-left mb-1">
//                       <span className="inline-block font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
//                         Task Name: {taskMap[comment.itask_id]}
//                       </span>
//                     </div>
//                   )}
//                   {userId && userId === comment.iuser_id && (
//                     <button
//                       onClick={() => handleEditClick(comment)}
//                       className="text-gray-400 hover:text-blue-500 transition-colors duration-200 flex-shrink-0"
//                       title="Edit comment"
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                       </svg>
//                     </button>
//                   )}
//                 </div>
//                 <p className="text-gray-700 text-sm mt-2 leading-normal break-words font-bold">
//                   {comment.ccomment_content}
//                 </p>
//                 <p className="text-xs text-gray-900 mt-2 italic break-words">
//                   {comment.imodify_dt
//                     ? `Edited by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.imodify_dt)}`
//                     : `Posted by ${comment.user?.cFull_name || "Unknown"} • ${formatDateTime(comment.icreate_dt)}`}
//                 </p>
//               </div>
//             ))
//           )}

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <div className="flex justify-center gap-2 mt-4">
//               {Array.from({ length: totalPages }, (_, i) => (
//                 <button 
//                   key={i + 1} 
//                   onClick={() => setCurrentPage(i + 1)} 
//                   className={`px-3 py-1 rounded-full text-xs ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
//                 >
//                   {i + 1}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Add Comment Form Overlay */}
//         {showForm && (
//           <>
//             <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleOutsideClick}></div>
//             <div 
//               ref={formRef}
//               className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg p-5 bg-white rounded-2xl shadow-2xl max-h-[85vh] z-[1001] overflow-y-auto"
//             >
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="font-medium text-lg text-gray-800">
//                   {editingComment ? "Edit Comment" : "Add Comment"}
//                 </h3>
//                 <button
//                   onClick={() => {
//                     setShowForm(false);
//                     setIsListening(false);
//                     setEditingComment(null);
//                   }}
//                   className="text-2xl text-gray-500 hover:text-red-500"
//                 >
//                   ×
//                 </button>
//               </div>
//               <form onSubmit={editingComment ? handleEditSubmission : handleFormSubmission} className="flex flex-col space-y-4">
//                 <select
//                   name="taskId"
//                   value={formData.taskId || ""}
//                   onChange={handleChange}
//                   className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 text-sm"
//                 >
//                   <option value="">Select Task (Optional)</option>
//                   {tasks.map(task => (
//                     <option key={task.itask_id} value={task.itask_id}>
//                       {task.ctitle}
//                     </option>
//                   ))}
//                 </select>
//                 <textarea 
//                   name="comments" 
//                   onChange={handleChange} 
//                   value={formData.comments}
//                   className="w-full border rounded-xl p-3 h-32 resize-none text-sm focus:ring-2 focus:ring-indigo-500" 
//                   placeholder="Write your comment..." 
//                   required
//                 />
//                 {mic && (
//                   <button 
//                     type="button" 
//                     onClick={() => setIsListening(!isListening)} 
//                     className={`px-4 py-2 rounded-full text-xs font-medium ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-300 text-black"}`}
//                   >
//                     {isListening ? "🎙️ Stop" : "🎤 Voice Input"}
//                   </button>
//                 )}
//                 <button 
//                   type="submit" 
//                   disabled={isSubmitting} 
//                   className="w-full bg-indigo-700 text-white py-3 rounded-full hover:bg-indigo-800 transition disabled:opacity-50"
//                 >
//                   {isSubmitting ? "Submitting..." : editingComment ? "Update" : "Submit"}
//                 </button>
//               </form>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Comments;
