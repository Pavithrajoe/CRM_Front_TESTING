import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from "react";
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
import { Search, X, Plus } from "lucide-react";
import { GlobUserContext } from "../context/userContex";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = SpeechRecognition ? new SpeechRecognition() : null;

if (mic) {
  mic.continuous = true;
  mic.interimResults = false;
  mic.lang = "en-US";
}

// Memoized Task Item Component
const TaskItem = React.memo(({ 
  task, 
  canEdit, 
  canDelete, 
  onEdit, 
  onDelete, 
  formatDateTime 
}) => {
  return (
    <div className="border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out relative">
      <div className="flex justify-between items-start gap-2">
        <span className="font-semibold text-base sm:text-lg md:text-xl text-gray-900 break-words flex-1 min-w-0">
          {task.ctitle}
        </span>
        {(canEdit || canDelete) && (
          <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => canEdit ? onEdit(task) : null}
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
                onClick={() => onDelete(task.itask_id)}
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
      
      <p className="text-gray-700 text-sm mt-2 leading-normal break-words">
        {task.ctask_content}
      </p>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 sm:mt-3 text-xs text-gray-500 space-y-1 sm:space-y-0">
        <p className="break-words">
          <span className="font-medium text-gray-700">Assigned to:</span>{" "}
          {task.user_task_iassigned_toTouser?.cFull_name || "N/A"}
        </p>
        <p className="break-words">
          <span className="font-semibold text-gray-700">Notified to:</span>{" "}
          {task.user_task_inotify_toTouser?.cFull_name || "N/A"}
        </p>
      </div>
      
      <p className={`text-xs mt-2 italic break-words ${task.task_date && isPast(parseISO(task.task_date)) ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
        Due on: {formatDateTime(task.task_date)} {task.task_date && isPast(parseISO(task.task_date)) && '(EXPIRED)'}
      </p>
      
      <p className="text-xs text-gray-900 mt-1 italic break-words">
        {task.dmodified_dt
          ? `Edited by ${task.user_task_iassigned_toTouser?.cFull_name || "Unknown"} • ${formatDateTime(task.dmodified_dt)}`
          : `Posted by ${task.user_task_iassigned_toTouser?.cFull_name || "Unknown"} • ${formatDateTime(task.dcreate_dt)}`}
      </p>
    </div>
  );
});

const Tasks = () => {
  const { leadId } = useParams();
  const { user } = useContext(GlobUserContext);
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const formRef = useRef(null);
  const searchInputRef = useRef(null);
  const tasksContainerRef = useRef(null);

  const COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);
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

  // Screen resize listener to handle mobile vs desktop
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized values
  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.ctask_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.ctitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const currentTasks = useMemo(() => {
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    return filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  }, [filteredTasks, currentPage, tasksPerPage]);

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const isSpecialCompany = Number(companyId) === COMPANY_ID;

  // Decode token function
  const decodeToken = useCallback((t) => {
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, []);

  // Set user and company IDs from token
  useEffect(() => {
    if (token) {
      const tokenPayload = decodeToken(token);
      const userId = tokenPayload?.user_id || tokenPayload?.iUser_id || null;
      const userName = tokenPayload?.cFull_name || "Current Login User";
      
      setUserId(userId);
      setUserName(userName);
      setCompanyId(tokenPayload?.company_id || tokenPayload?.iCompany_id || null);
      
      if (userId) {
        setFormData(prev => ({
          ...prev,
          iassigned_to: userId,
        }));
      }
    }
  }, [token, decodeToken]);

  // Fetch company users
  const fetchUsers = useCallback(async () => {
    const activeCompanyUsers = user.filter(u => 
      (u.bactive === true || u.bactive === 1 || u.bactive === "true")
    );
    setCompanyUsers(activeCompanyUsers);
  }, [user]);

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
      }
    } catch (error) {
      console.error("Fetch tasks error:", error);
    } finally {
      setLoadingTasks(false);
    }
  }, [token, leadId]);

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, [fetchUsers, fetchTasks]);

  // Speech recognition effect
  useEffect(() => {
    if (!mic) return;
    const handleResult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          setFormData(prev => ({
            ...prev,
            ctask_content: prev.ctask_content + (prev.ctask_content ? " " : "") + transcript
          }));
        }
      }
    };
    mic.onresult = handleResult;
    if (isListening) mic.start();
    else mic.stop();
    return () => {
      if (mic) {
        mic.stop();
        mic.onresult = null;
      }
    };
  }, [isListening]);

  // Close form when clicking outside logic
  const handleClickOutside = useCallback((event) => {
    if (isSpecialCompany && !isMobile) return;
    if (!showForm) return;

    const formEl = formRef.current;
    const pickerPopup = document.querySelector('.MuiPopper-root'); 
    const calendarDialog = document.querySelector('.MuiModal-root');

    const clickedInsideForm = formEl?.contains(event.target);
    const clickedInsidePicker = pickerPopup?.contains(event.target) || calendarDialog?.contains(event.target);

    if (!clickedInsideForm && !clickedInsidePicker) {
      setShowForm(false);
      setEditingTask(null);
      setIsListening(false);
    }
  }, [showForm, isSpecialCompany, isMobile]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleNewTaskClick = useCallback(() => {
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
  }, [userId]);

  const handleEditClick = useCallback((task) => {
    setEditingTask(task);
    setAssignToMe(task.iassigned_to === userId);
    setFormData({
      ctitle: task.ctitle,
      ctask_content: task.ctask_content,
      iassigned_to: task.iassigned_to,
      inotify_to: task.inotify_to,
      task_date: new Date(task.task_date),
    });
    setShowForm(true);
  }, [userId]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let updatedValue = value;
    if (name === "iassigned_to" || name === "inotify_to") {
      updatedValue = value === "" ? null : Number(value);
      if (name === "iassigned_to" && Number(value) !== userId) setAssignToMe(false);
    } else if (name === "ctitle") {
      if (value.length > 100) return showPopup("Warning", "Title cannot exceed 100 characters.", "warning");
      updatedValue = value.charAt(0).toUpperCase() + value.slice(1);
    } else if (name === "ctask_content") {
      if (value.length > 500) return showPopup("Warning", "Description cannot exceed 500 characters.", "warning");
    }
    setFormData(prev => ({ ...prev, [name]: updatedValue }));
  }, [userId, showPopup]);

  const handleAssignToMeChange = useCallback((e) => {
    const checked = e.target.checked;
    setAssignToMe(checked);
    setFormData(prev => ({ ...prev, iassigned_to: checked ? userId : null }));
  }, [userId]);

  const handleDateChange = useCallback((date) => {
    setFormData(prev => ({ ...prev, task_date: date }));
  }, []);

  const canEditTask = useCallback((task) => {
    if (userId !== task.icreated_by) return false;
    const dueDate = task.task_date ? parseISO(task.task_date) : null;
    if (dueDate && isPast(dueDate)) return false; 
    if (isSpecialCompany) {
      const mostRecentTask = tasks.length > 0 ? tasks[0] : null;
      return mostRecentTask ? task.itask_id === mostRecentTask.itask_id : true;
    }
    return true; 
  }, [userId, isSpecialCompany, tasks]);

  const canDeleteTask = useCallback((task) => {
    const isCreator = userId === task.icreated_by;
    const dueDate = task.task_date ? parseISO(task.task_date) : null;
    if (!isCreator || isSpecialCompany || (dueDate && isPast(dueDate))) return false;
    return true;
  }, [userId, isSpecialCompany]);

  const handleFormSubmission = useCallback(async (e) => {
    e.preventDefault();
    if (formData.ctitle.trim().length < 3) return showPopup("Warning", "Title must be at least 3 characters long.", "warning");
    if (formData.ctask_content.trim().length < 5) return showPopup("Warning", "Description must be at least 5 characters long.", "warning");
    if (editingTask && !canEditTask(editingTask)) {
      showPopup("Error", "This task can no longer be edited.", "error");
      setShowForm(false);
      return;
    }
    const payload = { ...formData, ilead_id: Number(leadId), task_date: formData.task_date.toISOString() };
    setSaving(true);
    try {
      let response;
      if (editingTask) {
        response = await axios.put(`${ENDPOINTS.TASK}/${editingTask.itask_id}`, { ...payload, iupdated_by: userId }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        response = await axios.post(ENDPOINTS.TASK, { ...payload, icreated_by: userId }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      }
      if (response.data.success || response.data.message === "Task Added Successfully") {
        if (mic && isListening) mic.stop();
        setIsListening(false);
        showPopup("Success", "🎉 Saved successfully!", "success");
        await fetchTasks();
        setShowForm(false);
        setEditingTask(null);
        setCurrentPage(1);
      }
    } catch (error) {
      showPopup("Error", "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  }, [formData, editingTask, leadId, userId, token, isListening, showPopup, fetchTasks, canEditTask]);

  const handleDeleteTask = useCallback(async (taskId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const response = await axios.delete(`${ENDPOINTS.TASK}/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        showPopup("Success", "Deleted.", "success");
        await fetchTasks();
      }
    } catch (error) {
      showPopup("Error", "Failed to delete.", "error");
    }
  }, [token, showPopup, fetchTasks]);

  const formatDateTime = useCallback((dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }, []);

  const renderTaskForm = useCallback(() => (
    <div
      ref={formRef}
      className={`${
        isSpecialCompany && !isMobile
          ? 'w-full min-h-[520px] lg:min-h-[600] bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/20 border-0 shadow-2xl backdrop-blur-sm  p-3 sm:p-4 md:p-5 pb-28  flex flex-col rounded-2xl '
          : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg p-5 bg-white rounded-2xl shadow-2xl max-h-[85vh]  z-[1001]"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg text-gray-800">
          {editingTask ? `Edit ${isSpecialCompany ? 'Follow-up' : 'Task'}` : `Add ${isSpecialCompany ? 'Follow-up' : 'Task'}`}
        </h3>
        {(isMobile || !isSpecialCompany) && (
          <button onClick={() => { setShowForm(false); setEditingTask(null); }} className="text-2xl text-gray-500 hover:text-red-500">×</button>
        )}
      </div>
      <form onSubmit={handleFormSubmission} className="flex flex-col space-y-4">
        <input type="text" name="ctitle" onChange={handleChange} value={formData.ctitle} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Title *" required />
        <textarea name="ctask_content" onChange={handleChange} value={formData.ctask_content} className="w-full border rounded-xl p-3 h-32 resize-none text-sm" placeholder="Description *" required />
        {mic && (
          <button type="button" onClick={() => setIsListening(!isListening)} className={`px-4 py-2 rounded-full text-xs font-medium ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-300 text-black"}`}>
            {isListening ? "🎙️ Stop" : "🎤 Voice Input"}
          </button>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="assignToMe" checked={assignToMe} onChange={handleAssignToMeChange} className="h-5 w-5 text-blue-600" />
          <label htmlFor="assignToMe" className="text-sm text-gray-700">Assign to me ({userName})</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select name="iassigned_to" value={formData.iassigned_to || ""} onChange={handleChange} className="p-2 border rounded-xl text-sm" required disabled={assignToMe}>
            <option value="">Select User</option>
            {companyUsers.map(u => <option key={u.iUser_id} value={u.iUser_id}>{u.cFull_name}</option>)}
          </select>
          <select name="inotify_to" value={formData.inotify_to || ""} onChange={handleChange} className="p-2 border rounded-xl text-sm">
            <option value="">Notify To (Opt)</option>
            {companyUsers.map(u => <option key={u.iUser_id} value={u.iUser_id}>{u.cFull_name}</option>)}
          </select>
        </div>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker label="Date & Time" value={formData.task_date} format="dd/MM/yyyy hh:mm a" onChange={handleDateChange} viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }} slotProps={{ textField: { size: "small", fullWidth: true } }} />
        </LocalizationProvider>
        <button type="submit" disabled={saving} className="w-full bg-indigo-700 text-white py-3 rounded-full hover:bg-indigo-800 transition disabled:opacity-50">
          {saving ? "Saving..." : editingTask ? "Update" : "Save"}
        </button>
      </form>
    </div>
  ), [isSpecialCompany, isMobile, editingTask, formData, assignToMe, companyUsers, userName, saving, isListening, handleFormSubmission, handleChange, handleAssignToMeChange, handleDateChange]);

  const renderTaskHistory = useCallback(() => (
 <div
  ref={tasksContainerRef}
  className="
    p-3 sm:p-6 
    space-y-4 
    flex-1 
     h-full
    overflow-y-auto 
    max-h-[calc(100vh-150px)] 
    /* 2. CUSTOM SCROLLBAR STYLES */
    scrollbar-thin 
    scrollbar-thumb-blue-900 
    scrollbar-track-gray-100 
    hover:scrollbar-thumb-blue-700
   
    scroll-smooth
  "
>

      {loadingTasks ? <div className="text-center py-8 animate-pulse text-gray-500">Loading...</div> : 
        filteredTasks.length === 0 ? <p className="text-center text-gray-400 py-8">No tasks found.</p> :
        currentTasks.map(task => (
          <TaskItem key={task.itask_id} task={task} canEdit={canEditTask(task)} canDelete={canDeleteTask(task)} onEdit={handleEditClick} onDelete={handleDeleteTask} formatDateTime={formatDateTime} />
        ))
      }
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded-full text-xs ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  ), [loadingTasks, filteredTasks, currentTasks, totalPages, currentPage, canEditTask, canDeleteTask, handleEditClick, handleDeleteTask, formatDateTime]);
  


  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] py-4 px-2 sm:px-4 lg:px-6">
      <div className={`${isSpecialCompany ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-screen overflow-visible'
 : "relative bg-white border rounded-2xl max-w-7xl  shadow-sm"}`}>
        {isSpecialCompany ? (
          <>
            {/* Left: Chat/History */}
            <div className="col-span-1 flex flex-col h-fit  bg-white rounded-2xl lg:rounded-r-none border-r border-gray-100">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex-1 relative">
                  <input ref={searchInputRef} type="text" placeholder="Search follow-up..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full bg-gray-50 border-0 outline-none text-sm rounded-full px-4 py-2" />
                </div>
                {/* Show Button ONLY on Mobile */}
                {isMobile && (
                  <button onClick={() => setShowForm(true)} className="ml-2 bg-blue-900 text-white p-2 rounded-full shadow-lg">
                    <Plus size={20} />
                  </button>
                )}
              </div>
              {renderTaskHistory()}
            </div>
            {/* Right: Form - Hidden on mobile unless showForm is true */}
            {!isMobile ? (
              <div className="col-span-1 flex flex-col rounded-r-2xl border-l border-gray-100">
                {renderTaskForm()}
              </div>
            ) : (
              showForm && (
                <>
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] " onClick={() => setShowForm(false)}></div>
                  {renderTaskForm()}
                </>
              )
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-2xl gap-4">
              <div className="relative flex items-center bg-white border rounded-full w-full sm:w-72 px-3">
                <Search size={16} className="text-gray-400" />
                <input ref={searchInputRef} type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full p-2 outline-none text-sm" />
              </div>
              <button onClick={handleNewTaskClick} className=" bg-blue-900 shadow-md shadow-blue-900 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700
               transition duration-150 ease-in-out text-sm sm:text-base whitespace-nowrap w-full sm:w-auto text-center flex-shrink-0 ">+ New Task </button>
            </div>
            {renderTaskHistory()}
            {showForm && (
              <>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClickOutside}></div>
                {renderTaskForm()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Tasks;



// import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from "react";
// import { useParams } from "react-router-dom";
// import { usePopup } from "../context/PopupContext";
// import axios from "axios";
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
// import { isAfter, isPast, parseISO } from 'date-fns';
// import "react-datepicker/dist/react-datepicker.css";
// import { ENDPOINTS } from "../api/constraints";
// import { Search, X } from "lucide-react";
// import { GlobUserContext } from "../context/userContex";

// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// const mic = SpeechRecognition ? new SpeechRecognition() : null;

// if (mic) {
//   mic.continuous = true;
//   mic.interimResults = false;
//   mic.lang = "en-US";
// }

// // Memoized Task Item Component
// const TaskItem = React.memo(({ 
//   task, 
//   canEdit, 
//   canDelete, 
//   onEdit, 
//   onDelete, 
//   formatDateTime 
// }) => {
//   return (
//     <div className="border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out relative">
//       <div className="flex justify-between items-start gap-2">
//         <span className="font-semibold text-base sm:text-lg md:text-xl text-gray-900 break-words flex-1 min-w-0">
//           {task.ctitle}
//         </span>
//         {(canEdit || canDelete) && (
//           <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
//             <button
//               onClick={() => canEdit ? onEdit(task) : null}
//               className={`
//                 text-gray-400 hover:text-blue-500 transition-colors duration-200
//                 ${canEdit ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed hover:text-gray-400'}
//               `}
//               title={canEdit ? "Edit task" : "Cannot edit: Expired or not the most recent task"}
//               disabled={!canEdit}
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//               </svg>
//             </button>
//             {canDelete && ( 
//               <button
//                 onClick={() => onDelete(task.itask_id)}
//                 className="text-gray-400 hover:text-red-500 transition-colors duration-200"
//                 title="Delete task"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap=" round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                 </svg>
//               </button>
//             )}
//           </div>
//         )}
//       </div>
      
//       <p className="text-gray-700 text-sm mt-2 leading-normal break-words">
//         {task.ctask_content}
//       </p>
      
//       <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 sm:mt-3 text-xs text-gray-500 space-y-1 sm:space-y-0">
//         <p className="break-words">
//           <span className="font-medium text-gray-700">Assigned to:</span>{" "}
//           {task.user_task_iassigned_toTouser?.cFull_name || "-"}
//         </p>
//         <p className="break-words">
//           <span className="font-semibold text-gray-700">Notified to:</span>{" "}
//           {task.user_task_inotify_toTouser?.cFull_name || "-"}
//         </p>
//       </div>
      
//       <p className={`text-xs mt-2 italic break-words ${task.task_date && isPast(parseISO(task.task_date)) ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
//         Due on: {formatDateTime(task.task_date)} {task.task_date && isPast(parseISO(task.task_date)) && '(EXPIRED)'}
//       </p>
      
//       <p className="text-xs text-gray-900 mt-1 italic break-words">
//         {task.dmodified_dt
//           ? `Edited by ${task.user_task_iassigned_toTouser?.cFull_name || "Unknown"} • ${formatDateTime(task.dmodified_dt)}`
//           : `Posted by ${task.user_task_iassigned_toTouser?.cFull_name || "Unknown"} • ${formatDateTime(task.dcreate_dt)}`}
//       </p>
//     </div>
//   );
// });

// const Tasks = () => {
//   const { leadId } = useParams();
//   const { user } = useContext(GlobUserContext);
//   const [tasks, setTasks] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [companyUsers, setCompanyUsers] = useState([]);
//   const [userId, setUserId] = useState(null);
//   const [userName, setUserName] = useState("");
//   const [companyId, setCompanyId] = useState(null);
//   const [editingTask, setEditingTask] = useState(null);
//   const [loadingUsers, setLoadingUsers] = useState(false);
//   const [loadingTasks, setLoadingTasks] = useState(false);
//   const [isSearchOpen, setIsSearchOpen] = useState(false); 
//   const [saving, setSaving] = useState(false);
//   const [assignToMe, setAssignToMe] = useState(true);
//   const formRef = useRef(null);
//   const searchInputRef = useRef(null);
//   const tasksContainerRef = useRef(null);

//   const COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);
//   const [formData, setFormData] = useState({
//     ctitle: "",
//     ctask_content: "",
//     iassigned_to: null,
//     inotify_to: null,
//     task_date: new Date(),
//   });

//   const tasksPerPage = 10;
//   const token = localStorage.getItem("token");
//   const { showPopup } = usePopup();

//   // Memoized values
//   const filteredTasks = useMemo(() => {
//     return tasks.filter(task =>
//       task.ctask_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       task.ctitle?.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }, [tasks, searchQuery]);

//   const currentTasks = useMemo(() => {
//     const indexOfLastTask = currentPage * tasksPerPage;
//     const indexOfFirstTask = indexOfLastTask - tasksPerPage;
//     return filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
//   }, [filteredTasks, currentPage, tasksPerPage]);

//   const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
//   const isSpecialCompany = Number(companyId) === COMPANY_ID;

//   // Decode token function
//   const decodeToken = useCallback((t) => {
//     if (!t) return null;
//     try {
//       const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
//       return payload;
//     } catch (error) {
//       console.error("Error decoding token:", error);
//       return null;
//     }
//   }, []);

//   // Set user and company IDs from token
//   useEffect(() => {
//     if (token) {
//       const tokenPayload = decodeToken(token);
//       const userId = tokenPayload?.user_id || tokenPayload?.iUser_id || null;
//       const userName = tokenPayload?.cFull_name || "Current Login User";
      
//       setUserId(userId);
//       setUserName(userName);
//       setCompanyId(tokenPayload?.company_id || tokenPayload?.iCompany_id || null);
      
//       // Set the current user as the default assignee
//       if (userId) {
//         setFormData(prev => ({
//           ...prev,
//           iassigned_to: userId,
//         }));
//       }
//     }
//   }, [token, decodeToken]);

//   // Fetch company users
//   const fetchUsers = useCallback(async () => {
//     const activeCompanyUsers = user.filter(user => 
//       (user.bactive === true || user.bactive === 1 || user.bactive === "true")
//     );
//     setCompanyUsers(activeCompanyUsers);
//   }, [user]);

//   // Fetch tasks
//   const fetchTasks = useCallback(async () => {
//     if (!token || !leadId) return;

//     setLoadingTasks(true);
//     try {
//       const response = await axios.get(`${ENDPOINTS.TASK_LEAD}/${leadId}`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`
//         },
//       });

//       if (response.data.success) {
//         const sortedTasks = response.data.data.sort(
//           (a, b) => new Date(b.dcreate_dt) - new Date(a.dcreate_dt)
//         );
//         setTasks(sortedTasks);
//       }
//     } catch (error) {
//       console.error("Fetch tasks error:", error);
//     } finally {
//       setLoadingTasks(false);
//     }
//   }, [token, leadId]);

//   // Initial data loading
//   useEffect(() => {
//     const loadData = async () => {
//       await fetchUsers();
//       await fetchTasks();
//     };
//     loadData();
//   }, []); // Empty dependency array

//   // Speech recognition effect
//   useEffect(() => {
//     if (!mic) {
//       console.warn("Speech Recognition API not supported in this browser.");
//       return;
//     }

//     const handleResult = (event) => {
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         if (event.results[i].isFinal) {
//           const transcript = event.results[i][0].transcript.trim();
//           setFormData(prev => ({
//             ...prev,
//             ctask_content: prev.ctask_content + (prev.ctask_content ? " " : "") + transcript
//           }));
//         }
//       }
//     };

//     mic.onresult = handleResult;

//     if (isListening) {
//       mic.start();
//     } else {
//       mic.stop();
//     }

//     return () => {
//       if (mic) {
//         mic.stop();
//         mic.onresult = null;
//       }
//     };
//   }, [isListening]);

//   // Close form when clicking outside logic
//   const handleClickOutside = useCallback((event) => {
//     if (!showForm) return;

//     const formEl = formRef.current;
//     const pickerPopup = document.querySelector('.MuiPopper-root'); 
//     const calendarDialog = document.querySelector('.MuiModal-root');

//     const clickedInsideForm = formEl?.contains(event.target);
//     const clickedInsidePicker =
//       pickerPopup?.contains(event.target) || calendarDialog?.contains(event.target);

//     if (!clickedInsideForm && !clickedInsidePicker) {
//       setShowForm(false);
//       setEditingTask(null);
//       setIsListening(false);
//     }
//   }, [showForm]);

//   // Attach outside click listener for modal
//   useEffect(() => {
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [handleClickOutside]);

//   // Form handlers
//   const handleNewTaskClick = useCallback(() => {
//     setFormData({
//       ctitle: "",
//       ctask_content: "",
//       iassigned_to: userId,
//       inotify_to: null,
//       task_date: new Date(),
//     });
//     setAssignToMe(true);
//     setEditingTask(null);
//     setShowForm(true);
//   }, [userId]);

//   const handleEditClick = useCallback((task) => {
//     setEditingTask(task);
//     const isAssignedToMe = task.iassigned_to === userId;
//     setAssignToMe(isAssignedToMe);
    
//     setFormData({
//       ctitle: task.ctitle,
//       ctask_content: task.ctask_content,
//       iassigned_to: task.iassigned_to,
//       inotify_to: task.inotify_to,
//       task_date: new Date(task.task_date),
//     });
//     setShowForm(true);
//   }, [userId]);

//   const handleChange = useCallback((e) => {
//     const { name, value } = e.target;

//     let updatedValue = value;

//     if (name === "iassigned_to" || name === "inotify_to") {
//       updatedValue = value === "" ? null : Number(value);
      
//       if (name === "iassigned_to" && Number(value) !== userId) {
//         setAssignToMe(false);
//       }
//     } else if (name === "ctitle") {
//       if (value.length > 100) {
//         showPopup("Warning", "Title cannot exceed 100 characters.", "warning");
//         return;
//       }
//       updatedValue = value.charAt(0).toUpperCase() + value.slice(1);
//     } else if (name === "ctask_content") {
//       if (value.length > 500) {
//         showPopup("Warning", "Description cannot exceed 500 characters.", "warning");
//         return;
//       }
//     }

//     setFormData(prev => ({ ...prev, [name]: updatedValue }));
//   }, [userId, showPopup]);

//   const handleAssignToMeChange = useCallback((e) => {
//     const checked = e.target.checked;
//     setAssignToMe(checked);
//     if (checked && userId) {
//       setFormData(prev => ({
//         ...prev,
//         iassigned_to: userId, 
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         iassigned_to: null,
//       }));
//     }
//   }, [userId]);

//   const handleDateChange = useCallback((date) => {
//     setFormData(prev => ({ ...prev, task_date: date }));
//   }, []);

//   const handleFormSubmission = useCallback(async (e) => {
//     e.preventDefault();

//     if (formData.ctitle.trim().length < 3) {
//       showPopup("Warning", "Title must be at least 3 characters long.", "warning");
//       return;
//     }

//     if (formData.ctask_content.trim().length < 5) {
//       showPopup("Warning", "Description must be at least 5 characters long.", "warning");
//       return;
//     }

//     if (editingTask && !canEditTask(editingTask)) {
//       showPopup("Error", "This task can no longer be edited.", "error");
//       setEditingTask(null);
//       setShowForm(false);
//       return;
//     }

//     const payload = {
//       ...formData,
//       ilead_id: Number(leadId),
//       task_date: formData.task_date.toISOString(),
//       inotify_to: formData.inotify_to,
//     };

//     setSaving(true);

//     try {
//       let response;

//       if (editingTask) {
//         response = await axios.put(
//           `${ENDPOINTS.TASK}/${editingTask.itask_id}`,
//           { ...payload, iupdated_by: userId },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       } else {
//         response = await axios.post(
//           ENDPOINTS.TASK,
//           { ...payload, icreated_by: userId },
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//       }

//       if (response.data.success || response.data.message === "Task Added Successfully") {
//         if (mic && isListening) mic.stop();
//         setIsListening(false);

//         showPopup("Success", "🎉 Task saved successfully!", "success");

//         await fetchTasks();

//         setFormData({
//           ctitle: "",
//           ctask_content: "",
//           iassigned_to: userId,
//           inotify_to: null,
//           task_date: new Date(),
//         });
//         setShowForm(false);
//         setEditingTask(null);
//         setAssignToMe(true);
//         setCurrentPage(1);
//       } else {
//         showPopup("Error", response.data.message || "Failed to save task.", "error");
//       }
//     } catch (error) {
//       showPopup(
//         "Error",
//         error.response?.data?.message || error.message || "Failed to save task.",
//         "error"
//       );
//       console.error("Task submission error:", error);
//     } finally {
//       setSaving(false);
//     }
//   }, [formData, editingTask, leadId, userId, token, isListening, showPopup, fetchTasks]);

//   const handleDeleteTask = useCallback(async (taskId) => {
//     if (!window.confirm("Are you sure you want to delete this task?")) return;

//     try {
//       const response = await axios.delete(`${ENDPOINTS.TASK}/${taskId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (response.data.success) {
//         showPopup("Success", "Task deleted successfully.", "success");
//         await fetchTasks();
//       } else {
//         showPopup("Error", response.data.message || "Failed to delete task.", "error");
//       }
//     } catch (error) {
//       showPopup(
//         "Error",
//         error.response?.data?.message || error.message || "Failed to delete task.",
//         "error"
//       );
//       console.error("Delete task error:", error);
//     }
//   }, [token, showPopup, fetchTasks]);

//   const formatDateTime = useCallback((dateStr) => {
//     if (!dateStr) return "-";
//     const date = new Date(dateStr);
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = date.getFullYear();
//     const hours = String(date.getHours()).padStart(2, "0");
//     const minutes = String(date.getMinutes()).padStart(2, "0");
//     return `${day}/${month}/${year} ${hours}:${minutes}`;
//   }, []);

//   const isMostRecentTask = useCallback((task, allTasks) => {
//     if (!allTasks || allTasks.length === 0) return true; 
//     const mostRecentTask = allTasks[0];
//     return task.itask_id === mostRecentTask.itask_id;
//   }, []);

//   const canEditTask = useCallback((task) => {
//     const isCreator = userId === task.icreated_by;
//     if (!isCreator) return false;

//     const dueDate = task.task_date ? parseISO(task.task_date) : null;
//     if (dueDate && isPast(dueDate)) {
//       return false; 
//     }
    
//     if (companyId && Number(companyId) === Number(COMPANY_ID)) {
//       const mostRecentTask = tasks.length > 0 ? tasks[0] : null;
//       return mostRecentTask ? task.itask_id === mostRecentTask.itask_id : true;
//     }

//     return true; 
//   }, [userId, companyId, tasks.length]);

//   const canDeleteTask = useCallback((task) => {
//     const isCreator = userId === task.icreated_by;
//     const isDeleteHiddenCompany = companyId && (Number(companyId) === Number(COMPANY_ID));
//     const dueDate = task.task_date ? parseISO(task.task_date) : null;

//     if (!isCreator || isDeleteHiddenCompany || (dueDate && isPast(dueDate))) {
//       return false;
//     }

//     return true;
//   }, [userId, companyId]);

//   // Focus the search input when it opens
//   useEffect(() => {
//     if (isSearchOpen && searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, [isSearchOpen]);

//   // Render form (as modal or side panel)
//   const renderTaskForm = useCallback(() => (
//     <div
//       ref={formRef}
//       className={`${
//         isSpecialCompany 
//           // ? 'w-full bg-white rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[85vh]'
//           // : 'relative w-full max-w-lg animate-in slide-in-from-bottom duration-300 bg-white rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]'
        
//           // isSpecialCompany
//           ? 'bg-white rounded-2xl shadow-2xl max-h-[85vh] p-6'
//           : 'fixed top-1/2 left-1/2 transform -translate-x-[35%] -translate-y-1/2 w-[95vw] max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl p-6 xl:max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto z-50 transition-all duration-300'
//       }`}
//       style={isSpecialCompany ? {} : { zIndex: 1001 }}
//       onClick={isSpecialCompany ? undefined : (e) => e.stopPropagation()}
//     >
//       <div className="flex justify-between items-center mb-3 sm:mb-4">
//         <h3 className="font-medium text-lg sm:text-xl text-gray-800">
//           {isSpecialCompany
//             ? editingTask
//               ? "Edit Follow-up"
//               : "Add Follow-up"
//             : editingTask
//               ? "Edit Task"
//               : "Add Task"}
//         </h3>
//         {!isSpecialCompany && (
//           <button
//             onClick={() => {
//               setShowForm(false);
//               setIsListening(false);
//               setEditingTask(null);
//             }}
//             className="text-xl sm:text-2xl text-gray-500 hover:text-red-500 p-1"
//           >
//             ×
//           </button>
//         )}
//       </div>
//       <form onSubmit={handleFormSubmission} className="flex flex-col space-y-4">
//         <input
//           type="text"
//           name="ctitle"
//           onChange={handleChange}
//           value={formData.ctitle}
//           className="w-full border rounded-lg sm:rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
//           placeholder={!isSpecialCompany ? "Task Title *" : "Follow-up Title "}
//           required
//         />
//         <textarea
//           name="ctask_content"
//           onChange={handleChange}
//           value={formData.ctask_content}
//           className="w-full border rounded-lg sm:rounded-xl p-3 h-28 sm:h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
//           placeholder={!isSpecialCompany ? "Task Description *" : "Follow-up Description * "}
//           required
//         />

//         <div className="flex justify-between items-center">
//           {mic && (
//             <button
//               type="button"
//               onClick={() => setIsListening((prev) => !prev)}
//               className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
//                 isListening
//                   ? "bg-red-500 text-white animate-pulse"
//                   : "bg-gray-300 text-black"
//               }`}
//             >
//               {isListening ? "🎙️ Stop" : "🎤 Start Voice Input"}
//             </button>
//           )}
//         </div>
//         {/* Assign to me checkbox */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               id="assignToMe"
//               checked={assignToMe}
//               onChange={handleAssignToMeChange}
//               className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded focus:ring-blue-500"
//             />
//             <label
//               htmlFor="assignToMe"
//               className="text-sm sm:text-base text-gray-700 cursor-pointer select-none"
//             >
//               Assign to me ({userName})
//             </label>
//           </div>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Assigned to <span className="text-red-600">*</span>
//             </label>
//             <select
//               name="iassigned_to"
//               value={formData.iassigned_to || ""}
//               onChange={handleChange}
//               className="mt-1 block w-full pl-3 p-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl"
//               required
//               disabled={loadingUsers || assignToMe}
//             >
//               <option value="">{loadingUsers ? "Loading users..." : "Select User"}</option>
//               {companyUsers.map((user) => (
//                 <option key={user.iUser_id} value={user.iUser_id}>
//                   {user.cFull_name || user.cUser_name || `User ${user.iUser_id}`}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Notify to
//             </label>
//             <select
//               name="inotify_to"
//               value={formData.inotify_to || ""}
//               onChange={handleChange}
//               className="mt-1 block w-full pl-3 p-3 pr-10 py-2 rounded-xl text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//               disabled={loadingUsers}
//             >
//               <option value="">Optional</option>
//               {companyUsers.map((user) => (
//                 <option key={user.iUser_id} value={user.iUser_id}>
//                   {user.cFull_name || user.cUser_name || `User ${user.iUser_id}`}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Due Date <span className="text-red-600">*</span>
//           </label>
//           <div className="mt-2">
//             <LocalizationProvider dateAdapter={AdapterDateFns}>
//               <DateTimePicker
//                 label="Task Date & Time"
//                 value={formData.task_date}
//                 format="dd/MM/yyyy hh:mm a"
//                 onChange={handleDateChange}
//                 viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock, seconds: renderTimeViewClock }}
//                 slotProps={{
//                   textField: {
//                     size: "small",
//                     fullWidth: true,
//                     InputProps: {
//                       style: { height: "40px", fontSize: "14px" }, 
//                     },
//                   },
//                 }}
//               />
//             </LocalizationProvider>
//           </div>
//         </div>
//         <button
//           type="submit"
//           className="w-full bg-indigo-700 text-white justify-center items-center px-4 py-3 rounded-full hover:bg-indigo-800 text-sm sm:text-base mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
//           disabled={loadingUsers || saving || (editingTask && !canEditTask(editingTask))}
//         >
//           {saving ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 mr-3 text-white inline-block"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                 ></path>
//               </svg>
//               Saving...
//             </>
//           ) : (
//             isSpecialCompany ? (
//               editingTask ? (
//                 canEditTask(editingTask) ? "Update Follow-up" : "Edit Disabled"
//               ) : "Add Follow-up"
//             ) : (
//               editingTask ? (
//                 canEditTask(editingTask) ? "Update Task" : "Edit Disabled"
//               ) : "Add Task"
//             )
//           )}
//         </button>
//       </form>
//     </div>
//   ), [
//     isSpecialCompany, editingTask, formData, assignToMe, loadingUsers, companyUsers, 
//     userName, saving, handleFormSubmission, handleChange, handleAssignToMeChange, 
//     handleDateChange, canEditTask
//   ]);

//   // Render task list component (chat style)
//   const renderTaskHistory = useCallback(() => (
//     <div
//       ref={tasksContainerRef}
//       className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 flex-1"
//     >
//       {loadingTasks ? (
//         <div className="text-center py-8">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//           <p className="mt-2 text-gray-500 text-sm sm:text-base">Loading tasks...</p>
//         </div>
//       ) : filteredTasks.length === 0 ? (
//         <p className="text-center text-gray-400 text-sm sm:text-base py-8">
//           {searchQuery ? "No matching tasks found." : "No tasks created yet."}
//         </p>
//       ) : (
//         currentTasks.map((task) => {
//           const canEdit = canEditTask(task);
//           const canDelete = canDeleteTask(task);

//           return (
//             <TaskItem
//               key={task.itask_id}
//               task={task}
//               canEdit={canEdit}
//               canDelete={canDelete}
//               onEdit={handleEditClick}
//               onDelete={handleDeleteTask}
//               formatDateTime={formatDateTime}
//             />
//           );
//         })
//       )}
//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex justify-center gap-1 sm:gap-2 mt-4 sm:mt-6 flex-wrap">
//           {Array.from({ length: totalPages }, (_, i) => (
//             <button
//               key={i + 1}
//               onClick={() => setCurrentPage(i + 1)}
//               className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
//                 currentPage === i + 1
//                   ? "bg-indigo-600 text-white shadow"
//                   : "bg-gray-100 text-gray-800 hover:bg-gray-200"
//               }`}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   ), [
//     loadingTasks, filteredTasks, searchQuery, currentTasks, totalPages, currentPage,
//     canEditTask, canDeleteTask, handleEditClick, handleDeleteTask, formatDateTime
//   ]);

//   return (
//     <div className="w-full min-h-screen bg-[#f8f8f8] py-4 px-2 sm:px-4 lg:px-6">
//       <div className={`${isSpecialCompany ? "grid grid-cols-1 md:grid-cols-2 gap-6 shadow-none bg-transparent border-0" : "relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 w-full max-w-7xl mx-auto shadow-sm"}`}>
//         {isSpecialCompany ? (
//           <>
//             {/* Left: Chat/History */}
//             <div className="col-span-1 flex flex-col">
//               {/* Search Bar */}
//               <div className="flex items-center gap-2 mb-4">
//                 <input
//                   ref={searchInputRef}
//                   type="text"
//                   placeholder="Search follow-up..."
//                   value={searchQuery}
//                   onChange={(e) => {
//                     setSearchQuery(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   className="transition-all duration-300 ease-in-out bg-white border border-gray-200 outline-none text-sm font-medium rounded-full w-full px-4 py-2"
//                 />
//               </div>
//               {/* Task history */}
//               {renderTaskHistory()}
//             </div>
//             {/* Right: Form always visible */}
//             <div className="col-span-1 flex flex-col">{renderTaskForm()}</div>
//           </>
//         ) : (
//           <>
//             {/* Header Section */}
//             <div className="flex flex-col sm:flex-row justify-between items-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b bg-gray-50 rounded-t-2xl gap-3 sm:gap-4">
//               {/* Search Bar */}
//               <div className="relative flex items-center bg-white border border-gray-200 rounded-full w-full sm:w-auto min-w-[200px]">
//                 <input
//                   ref={searchInputRef}
//                   type="text"
//                   placeholder="Search tasks..."
//                   value={searchQuery}
//                   onChange={(e) => {
//                     setSearchQuery(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   className={`
//                     transition-all duration-300 ease-in-out
//                     bg-transparent outline-none text-sm font-medium
//                     ${isSearchOpen ? 'w-full px-4 py-2 opacity-100' : 'w-0 px-0 py-0 opacity-0 sm:w-full sm:px-4 sm:py-2 sm:opacity-100'}
//                   `}
//                 />
//                 <button
//                   onClick={() => setIsSearchOpen(!isSearchOpen)}
//                   className={`p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors sm:hidden
//                     ${isSearchOpen ? 'text-blue-900' : ''}
//                   `}
//                   aria-label="Toggle search bar"
//                 >
//                   <Search size={18} />
//                 </button>
//               </div>
              
//               {/* New Task Button */}
//               <button
//                 onClick={handleNewTaskClick}
//                 className="bg-blue-900 shadow-md shadow-blue-900 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700 transition duration-150 ease-in-out flex-shrink-0 text-sm sm:text-base whitespace-nowrap w-full sm:w-auto text-center"
//               >
//               {!isSpecialCompany ? " + New Task " : "+ New Follow-up "}
//               </button>
//             </div>
//             {/* Tasks Container with Scroll (history) */}
//             {renderTaskHistory()}
//             {/* Modal Form */}
//             {showForm && (
//               <>
//                 <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity" onClick={handleClickOutside}></div>
//                 {renderTaskForm()}
//               </>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Tasks;