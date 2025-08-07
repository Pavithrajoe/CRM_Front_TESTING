import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

const apiEndPoint = import.meta.env.VITE_API_URL;

// Initialize speech recognition if available
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = SpeechRecognition ? new SpeechRecognition() : null;
if (mic) {
  mic.continuous = true;
  mic.interimResults = true;
  mic.lang = "en-US";
}

const Comments = () => {
  // State management
  const { leadId } = useParams();
  const [state, setState] = useState({
    comments: [],
    showForm: false,
    formData: { comments: "", LeadId: leadId },
    searchQuery: "",
    currentPage: 1,
    isListening: false,
    editingComment: null
  });
  const [user, setUser] = useState({ id: null, role: null, name: null });
  const formRef = useRef(null);
  const { showPopup } = usePopup();
  const token = localStorage.getItem("token");
  const commentsPerPage = 10;

  // Memoized functions
  const fetchComments = useCallback(async () => {
    if (!token || !leadId) return;
    try {
      const response = await fetch(`${apiEndPoint}/comments/allcomment/${leadId}`, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
      });
      const data = await response.json();
      if (response.ok) {
        setState(prev => ({
          ...prev,
          comments: data.result.sort((a, b) => new Date(b.icreate_dt) - new Date(a.icreate_dt))
        }));
      } else {
        showPopup("Error", data.message || "Failed to fetch comments", "error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, [token, leadId, showPopup]);

  // Effects
  useEffect(() => {
    // Decode user from token
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        setUser({
          id: payload.user_id,
          role: payload.role?.toLowerCase(),
          name: payload.name
        });
      } catch (error) {
        console.error("Token decode error:", error);
      }
    }

    // Initialize speech recognition
    if (!mic) return;
    
    const handleMicResult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join("");
      setState(prev => ({ ...prev, formData: { ...prev.formData, comments: transcript } }));
    };

    if (state.isListening) {
      mic.start();
      mic.onend = () => state.isListening && mic.start();
      mic.onresult = handleMicResult;
      mic.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setState(prev => ({ ...prev, isListening: false }));
      };
    }

    return () => {
      if (mic) {
        mic.stop();
        mic.onend = null;
        mic.onresult = null;
        mic.onerror = null;
      }
    };
  }, [token, state.isListening]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { formData, editingComment } = state;
    const content = formData.comments.trim();
    
    if (!content) {
      showPopup("Warning", "Comment cannot be empty", "warning");
      return;
    }

    try {
      const isEdit = !!editingComment;
      const url = isEdit 
        ? `${apiEndPoint}/comments/${editingComment.icomment_id}`
        : `${apiEndPoint}/comments`;
      
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comments: content,
          ilead_id: Number(leadId)
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");

      showPopup("Success", isEdit ? "Comment updated!" : "Comment added!", "success");
      
      setState(prev => ({
        ...prev,
        formData: { comments: "", LeadId: leadId },
        isListening: false,
        showForm: false,
        editingComment: null
      }));
      fetchComments();
    } catch (error) {
      showPopup("Error", error.message || "Operation failed", "error");
      console.error("Submission error:", error);
    }
  };

  const canEdit = (comment) => {
    const superAdminRoles = new Set([
      'admin',
      'administrator',
      'super_admin',
      'superadmin',
      '1' // If using numeric role IDs
    ]);
    return superAdminRoles.has(user.role) || user.id === comment.iuser_id;
  };

  // Derived values
  const activeComments = state.comments.filter(c => c.bactive);
  const filteredComments = activeComments.filter(c =>
    c.ccomment_content?.toLowerCase().includes(state.searchQuery.toLowerCase())
  );
  const paginatedComments = filteredComments.slice(
    (state.currentPage - 1) * commentsPerPage,
    state.currentPage * commentsPerPage
  );

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short"
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between gap-4">
          <input
            type="text"
            placeholder="Search comments..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({
              ...prev,
              searchQuery: e.target.value,
              currentPage: 1
            }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setState(prev => ({
              ...prev,
              editingComment: null,
              formData: { comments: "", LeadId: leadId },
              showForm: true
            }))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + New Comment
          </button>
        </div>

        {/* Comments List */}
        <div className="p-4 sm:p-6 space-y-4">
          {paginatedComments.length ? (
            paginatedComments.map(comment => (
              <div key={comment.icomment_id} className="border rounded-xl p-4 hover:shadow-md transition">
                <div className="flex justify-between">
                  <h4 className="font-medium">{comment.user?.cFull_name || "Unknown"}</h4>
                  {canEdit(comment) && (
                    <button 
                      onClick={() => setState(prev => ({
                        ...prev,
                        editingComment: comment,
                        formData: {
                          comments: comment.ccomment_content,
                          LeadId: comment.ilead_id
                        },
                        showForm: true
                      }))}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-gray-700">{comment.ccomment_content}</p>
                <p className="mt-2 text-sm text-gray-500">
                  {comment.imodify_dt 
                    ? `Edited at ${formatDate(comment.imodify_dt)}`
                    : `Posted at ${formatDate(comment.icreate_dt)}`}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-gray-500">No comments found</p>
          )}
        </div>

        {/* Pagination */}
        {filteredComments.length > commentsPerPage && (
          <div className="p-4 flex justify-center gap-2">
            {Array.from({ length: Math.ceil(filteredComments.length / commentsPerPage) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setState(prev => ({ ...prev, currentPage: i + 1 }))}
                className={`w-10 h-10 rounded-full ${state.currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Comment Form Modal */}
        {state.showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div ref={formRef} className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {state.editingComment ? "Edit Comment" : "Add Comment"}
                </h3>
                <button 
                  onClick={() => setState(prev => ({
                    ...prev,
                    showForm: false,
                    isListening: false,
                    editingComment: null
                  }))}
                  className="text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4">
                <textarea
                  name="comments"
                  value={state.formData.comments}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    formData: { ...prev.formData, comments: e.target.value }
                  }))}
                  className="w-full border rounded-lg p-3 min-h-[150px] focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your comment..."
                  required
                />
                
                <div className="mt-4 flex justify-between">
                  {mic && (
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, isListening: !prev.isListening }))}
                      className={`px-4 py-2 rounded-lg ${state.isListening ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                    >
                      {state.isListening ? "Stop Recording" : "Start Recording"}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {state.editingComment ? "Update" : "Submit"}
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