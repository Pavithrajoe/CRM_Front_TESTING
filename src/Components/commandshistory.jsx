import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const apiEndPoint = import.meta.env.VITE_API_URL;

const Comments = () => {
  const { leadId } = useParams();
  const [comments, setComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState(false);
  const [editText, setEditText] = useState({ comments: "", iuser_id: "", ilead_id: leadId });
  const [formData, setFormData] = useState({ comments: "", LeadId: leadId });
  const [editingId, setEditingId] = useState(null);
  const [deletMsg, setDeleteMsg] = useState(false);
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 4;
  const token = localStorage.getItem("token");

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
    } else {
      console.error("Invalid or missing JWT token");
    }
  }, [token]);

  const handleNewCommentClick = async () => {
    if (comments.length === 0) {
      await fetchComments();
    }
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();
    if (!formData.comments.trim()) {
      alert("😓 Comment cannot be empty!");
      return;
    }
    try {
      const response = await fetch(`${apiEndPoint}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, LeadId: Number(leadId) }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(`😓 Couldn't add comment: ${data.e}`);
        return;
      }
      alert("🎉 Comment added successfully!");
      setFormData({ comments: "", LeadId: leadId }); // ✅ Fixed hardcoded ID
      setShowForm(false);
      fetchComments();
    } catch (error) {
      console.info("Submission error", error);
      setErr(true);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${apiEndPoint}/comments/allcomment/${leadId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const sortedComments = data.result.sort(
          (a, b) => new Date(b.icreate_dt) - new Date(a.icreate_dt)
        );
        setComments(sortedComments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await fetch(`${apiEndPoint}/comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editText),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(`😓 Couldn't update comment: ${data}`);
        return;
      }
      alert("✅ Comment updated successfully!");
      setEditingId(null);
      fetchComments();
    } catch (error) {
      console.error("Error updating comment", error);
    }
  };

  const deleteCommand = async (commadnId, status) => {
    const confirmDelete = confirm("🗑️ Are you sure you want to delete this comment?");
    if (!confirmDelete) return;
    try {
      const response = await fetch(`${apiEndPoint}/comments/${commadnId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bactive: status }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(`😓 Couldn't delete comment: ${data}`);
        return;
      }
      setDeleteMsg(true);
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment", error);
    }
  };

  useEffect(() => {
    if (deletMsg) {
      const timer = setTimeout(() => setDeleteMsg(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [deletMsg]);

  useEffect(() => {
    fetchComments();
  }, []);

  const activeComments = comments.filter((comment) => comment.bactive === true);
  const filteredComments = activeComments.filter((comment) =>
    comment.ccomment_content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);

  const formatDateTime = (dateStr) =>
    new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="relative rounded-md shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">All Comments</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 border rounded text-sm"
          />
          <button
            onClick={handleNewCommentClick}
            className="bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-black"
          >
            New Comment
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4 bg-white">
        {deletMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm animate-shake">
            <p className="text-sm font-semibold">✅ Comment deleted successfully.</p>
          </div>
        )}

        {filteredComments.length === 0 ? (
          <p className="text-center text-gray-500">No comments found.</p>
        ) : (
          currentComments.map((comment) => (
            <div key={comment.icomment_id} className="border rounded-md p-4 shadow-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">{comment.name}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(comment.icomment_id);
                      setEditText({
                        comments: comment.ccomment_content,
                        iuser_id: userId,
                        ilead_id: leadId,
                      });
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteCommand(comment.icomment_id, false)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              {editingId === comment.icomment_id ? (
                <div className="mt-2">
                  <textarea
                    value={editText.comments}
                    onChange={(e) => setEditText((prev) => ({ ...prev, comments: e.target.value }))}
                    className="w-full border rounded-md p-2 text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => handleSaveEdit(comment.icomment_id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-300 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mt-2">{comment.ccomment_content}</p>
                  <p className="text-xs text-gray-400 italic mt-1">
                    {comment.imodify_dt
                      ? `Edited on ${formatDateTime(comment.imodify_dt)}`
                      : `Posted on ${formatDateTime(comment.icreate_dt)}`}
                  </p>
                </>
              )}
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-white text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right-side comment form drawer */}
      <div
        className={`fixed top-[150px] right-0 h-full mt-10 w-96 bg-white shadow-lg border-l transform transition-transform duration-300 ${
          showForm ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">Add Comment</h3>
          <button onClick={() => setShowForm(false)}>❌</button>
        </div>
        <div className="p-4">
          <form onSubmit={handleFormSubmission}>
            <textarea
              name="comments"
              onChange={handleChange}
              value={formData.comments}
              className="w-full border rounded p-2 mb-4"
              placeholder="Write your comment..."
            />
            <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-2xl">
              Submit
            </button>
          </form>
        </div>
      </div>

      {err && (
        <div className="p-4 bg-red-100 text-red-700 text-sm font-semibold text-center">
          Failed to add comment.
        </div>
      )}
    </div>
  );
};

export default Comments;
