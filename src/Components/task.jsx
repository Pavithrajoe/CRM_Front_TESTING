import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import axios from "axios";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { isAfter, isPast, parseISO } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { ENDPOINTS } from "../api/constraints";
import { Search, X } from "lucide-react";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = SpeechRecognition ? new SpeechRecognition() : null;

if (mic) {
  mic.continuous = true;
  mic.interimResults = false;
  mic.lang = "en-US";
}

const Tasks = () => {
  const { leadId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [companyId, setCompanyId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [saving, setSaving] = useState(false);
  const [assignToMe, setAssignToMe] = useState(true);
  const formRef = useRef(null);
  const searchInputRef = useRef(null);

  // const COMPANY_ID = process.env.VITE_XCODEFIX_FLOW;
  const COMPANY_ID = import.meta.env.VITE_XCODEFIX_FLOW;

  const [formData, setFormData] = useState({
    ctitle: "",
    ctask_content: "",
    iassigned_to: null,
    inotify_to: null,
    task_date: new Date(),
  });

  const tasksPerPage = 10;
  const token = localStorage.getItem("token");
  const { showPopup } = usePopup();

  // Decode token function
  const decodeToken = (t) => {
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Set user and company IDs from token
  useEffect(() => {
    if (token) {
      const tokenPayload = decodeToken(token);
      const userId = tokenPayload?.user_id || tokenPayload?.iUser_id || null;
      const userName = tokenPayload?.cFull_name || "Current Login User";
      
      setUserId(userId);
      setUserName(userName);
      setCompanyId(tokenPayload?.company_id || tokenPayload?.iCompany_id || null);
      
      // Set the current user as the default assignee
      if (userId) {
        setFormData(prev => ({
          ...prev,
          iassigned_to: userId,
        }));
      }
    }
  }, [token]);

  // Fetch company users
  const fetchUsers = useCallback(async () => {
    if (!companyId || !token) return;

    setLoadingUsers(true);
    try {
      const response = await axios.get(ENDPOINTS.USER_GET, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = response.data?.result || response.data?.data || response.data || [];
      const activeCompanyUsers = usersData.filter(user =>
        user.iCompany_id === companyId &&
        (user.bactive === true || user.bactive === 1 || user.bactive === "true")
      );
      setCompanyUsers(activeCompanyUsers);

    } catch (error) {
      console.error("Failed to fetch users:", {
        error: error.message,
        response: error.response?.data,
        config: error.config
      });
      showPopup("Error", "Failed to load user list. Please refresh the page.", "error");
    } finally {
      setLoadingUsers(false);
    }
  }, [companyId, token, showPopup]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!token || !leadId) return;

    setLoadingTasks(true);
    try {
      const response = await axios.get(`${ENDPOINTS.TASK_LEAD}/${leadId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (response.data.success) {
        const sortedTasks = response.data.data.sort(
          (a, b) => new Date(b.dcreate_dt) - new Date(a.dcreate_dt)
        );
        setTasks(sortedTasks);
      } else {
        showPopup("Error", response.data.message || "Failed to fetch tasks.", "error");
      }
    } catch (error) {
      showPopup(
        "Error",
        error.response?.data?.message || error.message || "Failed to fetch tasks.",
        "error"
      );
      console.error("Fetch tasks error:", error);
    } finally {
      setLoadingTasks(false);
    }
  }, [token, leadId, showPopup]);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await fetchTasks();
    };
    loadData();
  }, [fetchUsers, fetchTasks]);

  // Speech recognition effect
  useEffect(() => {
    if (!mic) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    mic.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          setFormData(prev => ({
            ...prev,
            ctask_content:
              prev.ctask_content +
              (prev.ctask_content ? " " : "") +
              transcript
          }));
        }
      }
    };

    if (isListening) {
      mic.start();
    } else {
      mic.stop();
    }

    return () => {
      if (mic) {
        mic.stop();
        mic.onresult = null;
      }
    };
  }, [isListening]);

const handleOutsideClick = (event) => {
  if (formRef.current && !formRef.current.contains(event.target)) {
    setShowForm(false);
    setIsListening(false);
    setEditingComment(null);
  }
};


  // Close form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showForm && formRef.current && !formRef.current.contains(event.target)) {
        console.log("Click outside detected, closing form.");
        setShowForm(false);
        setEditingTask(null);
        setIsListening(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showForm]);


  // Form handlers
  const handleNewTaskClick = () => {
    setFormData({
      ctitle: "",
      ctask_content: "",
      iassigned_to: userId,
      inotify_to: null,
      task_date: new Date(),
    });
    setAssignToMe(true);
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    const isAssignedToMe = task.iassigned_to === userId;
    setAssignToMe(isAssignedToMe);
    
    setFormData({
      ctitle: task.ctitle,
      ctask_content: task.ctask_content,
      iassigned_to: task.iassigned_to,
      inotify_to: task.inotify_to,
      task_date: new Date(task.task_date),
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    if (name === "iassigned_to" || name === "inotify_to") {
    
      updatedValue = value === "" ? null : Number(value);
      
      if (name === "iassigned_to" && Number(value) !== userId) {
        setAssignToMe(false);
      }
    } else if (name === "ctitle") {
      if (value.length > 100) {
        showPopup("Warning", "Title cannot exceed 100 characters.", "warning");
        return;
      }
      updatedValue = value.charAt(0).toUpperCase() + value.slice(1);
    } else if (name === "ctask_content") {
      if (value.length > 500) {
        showPopup("Warning", "Description cannot exceed 500 characters.", "warning"); // Corrected to 500 from 70
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: updatedValue }));
  };

  const handleAssignToMeChange = (e) => {
    const checked = e.target.checked;
    setAssignToMe(checked);
    if (checked && userId) {
      setFormData(prev => ({
        ...prev,
        iassigned_to: userId, 
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        iassigned_to: null,
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, task_date: date }));
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();

    if (formData.ctitle.trim().length < 3) {
      showPopup("Warning", "Title must be at least 3 characters long.", "warning");
      return;
    }

    if (formData.ctask_content.trim().length < 5) {
      showPopup("Warning", "Description must be at least 5 characters long.", "warning");
      return;
    }
    
    if (editingTask && !canEditTask(editingTask)) {
        showPopup("Error", "This task can no longer be edited.", "error");
        setEditingTask(null); 
        setShowForm(false);
        return;
    }

    const payload = {
      ...formData,
      ilead_id: Number(leadId),
      task_date: formData.task_date.toISOString(),
      inotify_to: formData.inotify_to,
    };

    setSaving(true);

    try {
      let response;

      if (editingTask) {
        response = await axios.put(
          `${ENDPOINTS.TASK}/${editingTask.itask_id}`,
          {
            ...payload,
            iupdated_by: userId,
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        response = await axios.post(
          ENDPOINTS.TASK,
          {
            ...payload,
            icreated_by: userId
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
          }
        );
      }

      if (response.data.success || response.data.message === "Task Added Successfully") {
        if (mic && isListening) {
          mic.stop();
        }
        setIsListening(false);

        // Show success message
        showPopup("Success", "🎉 Task saved successfully!", "success");
        
        setShowForm(false);
        setEditingTask(null); // Clear editing state after successful save
        await fetchTasks();
      } else {
        showPopup("Error", response.data.message || "Failed to save task.", "error");
      }
    } catch (error) {
      showPopup(
        "Error",
        error.response?.data?.message || error.message || "Failed to save task.",
        "error"
      );
      console.error("Task submission error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await axios.delete(`${ENDPOINTS.TASK}/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        showPopup("Success", "Task deleted successfully.", "success");
        await fetchTasks();
      } else {
        showPopup("Error", response.data.message || "Failed to delete task.", "error");
      }
    } catch (error) {
      showPopup(
        "Error",
        error.response?.data?.message || error.message || "Failed to delete task.",
        "error"
      );
      console.error("Delete task error:", error);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.ctask_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.ctitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };


    /**
     * Checks if a task is the most recently created one.
     * @param {object} task The task object to check.
     * @param {array} allTasks The array of all tasks (must be sorted by dcreate_dt DESC).
     * @returns {boolean} True if the task is the most recent, false otherwise.
     */
    const isMostRecentTask = useCallback((task, allTasks) => {
        if (!allTasks || allTasks.length === 0) return true; 
        const mostRecentTask = allTasks[0];
        return task.itask_id === mostRecentTask.itask_id;
    }, []);

    /**
     * Determines if the current user can edit the task based on the restrictions.
     * @param {object} task The task object.
     * @returns {boolean} True if editable, false otherwise.
     */
    const canEditTask = useCallback((task) => {
        const isCreator = userId === task.icreated_by;
        if (!isCreator) return false;

        const dueDate = task.task_date ? parseISO(task.task_date) : null;
        if (dueDate && isPast(dueDate)) {
            return false; 
        }
        
        if (companyId && Number(companyId) === COMPANY_ID) {
            return isMostRecentTask(task, tasks); 
        }

        return true; 
    }, [userId, companyId, tasks, isMostRecentTask]);


    /**
     * Determines if the current user can delete the task based on the restrictions.
     * @param {object} task The task object.
     * @returns {boolean} True if deletable, false otherwise.
     */

    const canDeleteTask = useCallback((task) => {
    const isCreator = userId === task.icreated_by;
    const isDeleteHiddenCompany = companyId && (Number(companyId) === Number(COMPANY_ID));
    const dueDate = task.task_date ? parseISO(task.task_date) : null;

    // Disable delete if not creator, or company restriction applies, or task is expired
    if (!isCreator || isDeleteHiddenCompany || (dueDate && isPast(dueDate))) {
        return false;
    }

    return true;
    }, [userId, companyId]);


//   const canDeleteTask = useCallback((task) => {
//     const isCreator = userId === task.icreated_by;
//     const isDeleteHiddenCompany = companyId && (Number(companyId) === Number(COMPANY_ID)); 
//     return isCreator && !isDeleteHiddenCompany;
//   }, [userId, companyId]);

  // Focus the search input when it opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <div className="w-full overflow-x-hidden h-[100vh] shadow rounded bg-[#f8f8f8]">
      <div className="relative bg-white mt-10 border rounded-2xl overflow-hidden transition-all duration-300 w-[100%] lg:w-[90%] xl:w-[95%] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 sm:px-6 sm:py-4 border-b bg-gray-50 rounded-t-2xl gap-4">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-full w-full sm:w-auto">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
            onClick={handleNewTaskClick}
            className="bg-blue-900 shadow-md shadow-blue-900 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700 transition duration-150 ease-in-out flex-shrink-0 text-sm sm:text-base"
          >
            + New Task
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {loadingTasks ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <p className="text-center text-gray-400 text-sm sm:text-base py-8">
              {searchQuery ? "No matching tasks found." : "No tasks created yet."}
            </p>
          ) : (
            currentTasks.map((task) => {
                const canEdit = canEditTask(task);
                const canDelete = canDeleteTask(task);

                return (
              <div
                key={task.itask_id}
                className="border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out relative"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-lg sm:text-xl text-gray-900">
                    {task.ctitle}
                  </span>
                  {(canEdit || canDelete) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => canEdit ? handleEditClick(task) : null}
                        className={`
                            text-gray-400 hover:text-blue-500 transition-colors duration-200
                            ${canEdit ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed hover:text-gray-400'}
                        `}
                        title={canEdit ? "Edit task" : "Cannot edit: Expired or not the most recent task"}
                        disabled={!canEdit}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                      </button>
                      {canDelete && ( 
                        <button
                          onClick={() => handleDeleteTask(task.itask_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                          title="Delete task"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap=" round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-gray-700 text-sm mt-2 leading-normal sm:leading-relaxed">
                  {task.ctask_content}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-3 text-xs text-gray-500">
                  <p>
                    <span className="font-medium text-gray-700">Assigned to:</span>{" "}
                    {task.user_task_iassigned_toTouser?.cFull_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Notified to:</span>{" "}
                    {task.user_task_inotify_toTouser?.cFull_name || "N/A"}
                  </p>
                </div>
                <p className={`text-xs mt-2 italic ${task.task_date && isPast(parseISO(task.task_date)) ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                  Due on: {formatDateTime(task.task_date)} {task.task_date && isPast(parseISO(task.task_date)) && '(EXPIRED)'}
                </p>
                <p className="text-xs text-gray-900 mt-1 italic">
                  {task.dmodified_dt
                    ? `Edited by ${task.user_task_iassigned_toTouser?.cFull_name || "Unknown"} • ${formatDateTime(task.dmodified_dt)}`
                    : `Posted by ${task.user_task_iassigned_toTouser?.cFull_name || "Unknown"} • ${formatDateTime(task.dcreate_dt)}`}
                </p>
              </div>
            )})
          )}

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

        {showForm && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity" onClick={handleOutsideClick}></div>
           <div
              ref={formRef}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/4 -translate-y-1/2 w-[95%] max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 z-50 transition-all duration-300"
            onClick={(e) => e.stopPropagation}>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="font-medium text-lg sm:text-xl text-gray-800">
                  {editingTask ? "Edit Task" : "Add Task"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setIsListening(false);
                        setEditingTask(null); 
                  }}
                  className="text-xl sm:text-2xl text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleFormSubmission} className="flex flex-col h-full space-y-4">
                <input
                  type="text"
                  name="ctitle"
                  onChange={handleChange}
                  value={formData.ctitle}
                  className="w-full border rounded-lg sm:rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                  placeholder="Task Title *"
                  required
                />

                <textarea
                  name="ctask_content"
                  onChange={handleChange}
                  value={formData.ctask_content}
                  className="w-full border rounded-lg sm:rounded-xl p-3 h-28 sm:h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                  placeholder="Task Description *"
                  required
                />

                <div className="flex justify-between items-center mt-3 sm:mt-4">
                  {mic && (
                    <button
                      type="button"
                      onClick={() => setIsListening((prev) => !prev)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      {isListening ? "🎙️ Stop" : "🎤 Start Voice Input"}
                    </button>
                  )}
                </div>

                {/* Add Assign to me checkbox like in ReminderForm */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="assignToMe"
                      checked={assignToMe}
                      onChange={handleAssignToMeChange}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="assignToMe"
                      className="text-sm sm:text-base text-gray-700 cursor-pointer select-none"
                    >
                      Assign to me ({userName})
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned to <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="iassigned_to"
                      value={formData.iassigned_to || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 p-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl"
                      required
                      disabled={loadingUsers || assignToMe}
                    >
                      <option value="">{loadingUsers ? "Loading users..." : "Select User"}</option>
                      {companyUsers.map((user) => (
                        <option key={user.iUser_id} value={user.iUser_id}>
                          {user.cFull_name || user.cUser_name || `User ${user.iUser_id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notify to
                    </label>
                    <select
                      name="inotify_to"
                      value={formData.inotify_to || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 p-3 pr-10 py-2 rounded-xl text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      disabled={loadingUsers}
                    >
                      <option value="">Optional</option>
                      {companyUsers.map((user) => (
                        <option key={user.iUser_id} value={user.iUser_id}>
                          {user.cFull_name || user.cUser_name || `User ${user.iUser_id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date <span className="text-red-600">*</span>
                  </label>

                  <DateTimePicker
                    value={formData.task_date}
                    onChange={handleDateChange}
                    format="dd/MM/yyyy HH:mm aa" 
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                      seconds: renderTimeViewClock,
                    }}
                    slotProps={{
                       popper: {
                         sx: { zIndex: 9999 } 
                        },
                      textField: {
                        className:
                          "pr-10 py-2 p-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md",
                      },
                    }}
                    required
                  />
                  
                </div>
                </LocalizationProvider>
                <button
                  type="submit"
                  className="w-full bg-indigo-700 text-white justify-center items-center px-4 py-2 rounded-full hover:bg-indigo-800 text-sm sm:text-base mt-4"
                  disabled={loadingUsers || saving || (editingTask && !canEditTask(editingTask))}
                >
                  {saving ? (
                    <svg 
                      className="animate-spin h-5 w-5 mr-3 text-white inline-block" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  ) : null}
                  {editingTask ? (canEditTask(editingTask) ? "Update Task" : "Edit Disabled") : "Add Task"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Tasks;
