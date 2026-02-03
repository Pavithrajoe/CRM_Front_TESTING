import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import axios from "axios";
import { Search, X, Plus, Filter, Edit3, Trash2 } from "lucide-react";
import { GlobUserContext } from "../context/userContex";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = SpeechRecognition ? new SpeechRecognition() : null;
if (mic) {
  mic.continuous = true;
  mic.interimResults = false;
  mic.lang = "en-US";
}

//  Memoized Reminder Item (EXACT Tasks styling)
const ReminderItem = React.memo(({ reminder, canEdit, canDelete, onEdit, onDelete, formatDateTime }) => {
  const priorityColors = {
    Low: "text-green-600 bg-green-100 border-green-200",
    Normal: "text-blue-600 bg-blue-100 border-blue-200", 
    High: "text-yellow-600 bg-yellow-100 border-yellow-200",
    Critical: "text-red-600 bg-red-100 border-red-200"
  };

  const priorityClass = priorityColors[reminder.priority] || priorityColors.Normal;

  return (
    <div className="border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out relative">
      <div className="flex justify-between items-center gap-3 w-full">
        {/* Left: Title + Priority */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityClass}`}>
              {reminder.priority || "Normal"}
            </span>
            <span className="font-semibold text-base sm:text-lg text-gray-900 truncate">
              {reminder.cremainder_title}
            </span>
          </div>
        </div>
        
        {/* Right: Actions */}
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {canEdit && (
              <button 
                onClick={() => onEdit(reminder)}
                className="text-gray-500 hover:text-blue-500 transition-colors duration-200 p-1.5 rounded-full hover:bg-gray-100"
                title="Edit reminder"
              >
                <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            {canDelete && (
              <button 
                onClick={() => onDelete(reminder.iremainder_id)}
                className="text-gray-500 hover:text-red-500 transition-colors duration-200 p-1.5 rounded-full hover:bg-red-50"
                title="Delete reminder"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-700 text-sm mt-2 leading-normal break-words">
        {reminder.cremainder_content}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 sm:mt-3 text-xs text-gray-500 space-y-1 sm:space-y-0">
        <p className="break-words">
          <span className="font-medium text-gray-700">Assigned:</span> {reminder.assigned_to || "-"}
        </p>
        <p className="break-words">
          <span className="font-semibold text-gray-700">Created:</span> {reminder.created_by || "-"}
        </p>
      </div>

      <p className="text-xs mt-2 italic text-gray-700 flex items-center gap-2 flex-wrap">
        <span>Due: {formatDateTime(reminder.dremainder_dt)}</span>
      </p>
    </div>
  );
});

const ReminderForm = ({ onCountChange }) => {
  const { leadId } = useParams();
  const { user } = useContext(GlobUserContext);
  const { showPopup } = usePopup();

  // State (EXACT Tasks structure)
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [companyId, setCompanyId] = useState(null);
  const [editingReminder, setEditingReminder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assignToMe, setAssignToMe] = useState(true);

  const formRef = useRef(null);
  const searchInputRef = useRef(null);
  const remindersContainerRef = useRef(null);

  const COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    reminderDateTime: new Date(),
    priority: "Normal",
    assignt_to: null,
    ilead_id: Number(leadId),
  });

  const remindersPerPage = 10;
  const isSpecialCompany = useMemo(() => Number(companyId) === COMPANY_ID, [companyId]);

  // Token decode (EXACT Tasks)
  const decodeToken = useCallback((t) => {
    if (!t) return null;
    try {
      return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, []);

  // Effects setup
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (token) {
      const tokenPayload = decodeToken(token);
      setUserId(tokenPayload?.user_id || tokenPayload?.iUser_id);
      setUserName(tokenPayload?.cFull_name || "Current User");
      setCompanyId(tokenPayload?.company_id || tokenPayload?.iCompany_id);
      setFormData(prev => ({ ...prev, assignt_to: tokenPayload?.user_id || tokenPayload?.iUser_id }));
      setAssignToMe(true);
    }
  }, [token, decodeToken]);

  const fetchUsers = useCallback(() => {
    const activeUsers = user.filter(u => u.bactive === true || u.bactive === 1 || u.bactive === "true");
    setCompanyUsers(activeUsers);
  }, [user]);

  //API: Fetch reminders
  const fetchReminders = useCallback(async () => {
    if (!token || !leadId) return;
    setLoadingReminders(true);
    try {
      const response = await axios.get(`${API_BASE}/reminder/get-reminder/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const reminderData = response.data.message || response.data.data || [];
      const sorted = Array.isArray(reminderData) ? reminderData.sort((a, b) => 
        new Date(b.dremainder_dt) - new Date(a.dremainder_dt)
      ) : [];
      setReminders(sorted);
    } catch (error) {
      console.error("Fetch reminders error:", error);
    } finally {
      setLoadingReminders(false);
    }
  }, [token, leadId, API_BASE]);

  useEffect(() => {
    fetchUsers();
    fetchReminders();
  }, [fetchUsers, fetchReminders]);

  useEffect(() => {
    onCountChange?.(reminders.length);
  }, [reminders, onCountChange]);

  // Speech recognition
  useEffect(() => {
    if (!mic) return;
    const handleResult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          setFormData(prev => ({
            ...prev,
            content: prev.content + (prev.content ? " " : "") + transcript
          }));
        }
      }
    };
    mic.onresult = handleResult;
    if (isListening) mic.start();
    else mic.stop();
    return () => {
      mic.stop();
      mic.onresult = null;
    };
  }, [isListening]);

  // Filtering & Pagination
  const filteredReminders = useMemo(() => {
    return reminders.filter(reminder => {
      const matchesSearch = 
        reminder.cremainder_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reminder.cremainder_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reminder.priority || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reminder.assigned_to || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const reminderDate = new Date(reminder.dremainder_dt);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null;
      const matchesDate = (!from || reminderDate >= from) && (!to || reminderDate <= to);
      
      return matchesSearch && matchesDate;
    });
  }, [reminders, searchQuery, fromDate, toDate]);

  const currentReminders = useMemo(() => {
    const indexOfLast = currentPage * remindersPerPage;
    const indexOfFirst = indexOfLast - remindersPerPage;
    return filteredReminders.slice(indexOfFirst, indexOfLast);
  }, [filteredReminders, currentPage]);

  const totalPages = Math.ceil(filteredReminders.length / remindersPerPage);

  const canEditReminder = useCallback((reminder) => {
    return userId === reminder.icreated_by || userId === reminder.assignt_to;
  }, [userId]);

  const canDeleteReminder = useCallback((reminder) => {
    return userId === reminder.icreated_by;
  }, [userId]);

  // Form handlers
  const handleNewReminderClick = useCallback(() => {
    setFormData({
      title: "",
      content: "",
      reminderDateTime: new Date(),
      priority: "Normal",
      assignt_to: userId,
      ilead_id: Number(leadId),
    });
    setAssignToMe(true);
    setEditingReminder(null);
    setShowForm(true);
  }, [userId, leadId]);

  const handleEditClick = useCallback((reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.cremainder_title,
      content: reminder.cremainder_content,
      reminderDateTime: new Date(reminder.dremainder_dt),
      priority: reminder.priority || "Normal",
      assignt_to: reminder.assignt_to,
      ilead_id: Number(leadId),
    });
    setAssignToMe(reminder.assignt_to === userId);
    setShowForm(true);
  }, [userId, leadId]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "title" && value.length > 100) return showPopup("Warning", "Title max 100 chars", "warning");
    if (name === "content" && value.length > 500) return showPopup("Warning", "Content max 500 chars", "warning");
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [showPopup]);

  const handleAssignToMeChange = useCallback((e) => {
    const checked = e.target.checked;
    setAssignToMe(checked);
    setFormData(prev => ({ ...prev, assignt_to: checked ? userId : null }));
  }, [userId]);

  // NATIVE DATETIME PICKER
  const handleDateChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, reminderDateTime: new Date(e.target.value) }));
  }, []);

  // API: Create/Update
  const handleFormSubmission = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.reminderDateTime) {
      showPopup("Error", "Fill all required fields", "error");
      return;
    }
    if (formData.reminderDateTime < new Date()) {
      showPopup("Error", "Date must be in future", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        reminderDate: formData.reminderDateTime.toISOString(),
        assignt_to: Number(formData.assignt_to || 0),
      };

      let response;
      if (editingReminder) {
        response = await axios.put(`${API_BASE}/reminder/${editingReminder.iremainder_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_BASE}/reminder`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      showPopup("Success", "Reminder saved!", "success");
      setIsListening(false);
      await fetchReminders();
      setFormData({
        title: "",
        content: "",
        reminderDateTime: new Date(),
        priority: "Normal",
        assignt_to: userId,
        ilead_id: Number(leadId),
      });
      setEditingReminder(null);
      setAssignToMe(true);
      setShowForm(false);
      setCurrentPage(1);
    } catch (error) {
      showPopup("Error", error.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }, [formData, editingReminder, userId, leadId, token, showPopup, fetchReminders]);

  // Delete
  const handleDeleteReminder = useCallback(async (reminderId) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await axios.delete(`${API_BASE}/reminder/${reminderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showPopup("Success", "Deleted!", "success");
      await fetchReminders();
    } catch (error) {
      showPopup("Error", "Delete failed", "error");
    }
  }, [token, showPopup, fetchReminders]);

  const formatDateTime = useCallback((dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "Invalid date";
    }
  }, []);

  const renderReminderForm = useCallback(() => (
    <div ref={formRef} className={`${
      isSpecialCompany && !isMobile 
        ? 'w-full min-h-[600px] bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/20 border-0 shadow-2xl backdrop-blur-sm p-3 sm:p-4 md:p-5 pb-28 flex flex-col rounded-2xl'
        : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-2xl p-5 bg-white rounded-2xl shadow-2xl max-h-[90vh] z-[1001]"
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg text-gray-800">
          {editingReminder ? "Edit Reminder" : "Add Reminder"}
        </h3>
        {(isMobile || !isSpecialCompany) && (
          <button onClick={() => setShowForm(false)} className="text-2xl text-gray-500 hover:text-red-500">
            ×
          </button>
        )}
      </div>
      <form onSubmit={handleFormSubmission} className="flex flex-col space-y-4 flex-1 overflow-y-auto">
        <input name="title" value={formData.title} onChange={handleChange} 
          className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-400" 
          placeholder="Title *" required maxLength={100} />

        <div className="relative">
          <textarea name="content" value={formData.content} onChange={handleChange} 
            className="w-full border rounded-xl p-3 h-32 resize-none text-sm focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" 
            placeholder="Description *" required maxLength={500} />
          {mic && (
            <button type="button" onClick={() => setIsListening(!isListening)}
              className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-300 text-black"} hover:shadow-md transition-all`}>
              {isListening ? "🎙️ Stop" : "🎤 Voice"}
            </button>
          )}
        </div>

        <select name="priority" value={formData.priority} onChange={handleChange} 
          className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <div className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50">
          <input type="checkbox" id="assignToMe" checked={assignToMe} onChange={handleAssignToMeChange} 
            className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500" />
          <label htmlFor="assignToMe" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
            Assign to me ({userName})
          </label>
        </div>

        <select name="assignt_to" value={formData.assignt_to || ""} onChange={handleChange} 
          className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100" 
          disabled={assignToMe} required>
          <option value="">Select User</option>
          {companyUsers.map(u => (
            <option key={u.iUser_id} value={u.iUser_id}>{u.cFull_name}</option>
          ))}
        </select>

        {/*  NATIVE DATETIME PICKER */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Date & Time <span className="text-red-500">*</span></label>
          <input 
            type="datetime-local" 
            value={formData.reminderDateTime.toISOString().slice(0, 16)}
            onChange={handleDateChange}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition placeholder-gray-400"
            required 
          />
          <p className="text-xs text-gray-500 italic px-1">
            {formData.reminderDateTime.toLocaleString('en-IN', { 
              day: '2-digit', month: '2-digit', year: 'numeric', 
              hour: '2-digit', minute: '2-digit', hour12: true 
            })}
          </p>
        </div>

        <button type="submit" disabled={saving} 
          className="w-full bg-indigo-700 text-white py-3 rounded-full hover:bg-indigo-800 transition-all disabled:opacity-50 font-medium text-sm">
          {saving ? "Saving..." : editingReminder ? "Update Reminder" : "Save Reminder"}
        </button>
      </form>
    </div>
  ), [isSpecialCompany, isMobile, editingReminder, formData, isListening, saving, assignToMe, companyUsers, userName, handleFormSubmission, handleChange, handleAssignToMeChange, handleDateChange]);

  const renderReminderHistory = useCallback(() => (
    <div ref={remindersContainerRef} 
      className="p-3 sm:p-6 space-y-4 flex-1 h-full overflow-y-auto max-h-[calc(100vh-150px)] scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-gray-100 hover:scrollbar-thumb-blue-700 scroll-smooth">
      
      {loadingReminders ? (
        <div className="text-center py-8 animate-pulse text-gray-500">Loading reminders...</div>
      ) : filteredReminders.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No reminders found.</p>
      ) : (
        currentReminders.map(reminder => (
          <ReminderItem
            key={reminder.iremainder_id}
            reminder={reminder}
            canEdit={canEditReminder(reminder)}
            canDelete={canDeleteReminder(reminder)}
            onEdit={handleEditClick}
            onDelete={handleDeleteReminder}
            formatDateTime={formatDateTime}
          />
        ))
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentPage === i + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200"
              } transition-all`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  ), [loadingReminders, filteredReminders, currentReminders, totalPages, currentPage, canEditReminder, canDeleteReminder, handleEditClick, handleDeleteReminder, formatDateTime]);

  const handleClickOutside = useCallback((event) => {
    if (isSpecialCompany && !isMobile) return;
    if (!showForm || !formRef.current) return;
    if (!formRef.current.contains(event.target)) {
      setShowForm(false);
      setEditingReminder(null);
      setIsListening(false);
    }
  }, [showForm, isSpecialCompany, isMobile]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] py-4 px-2 sm:px-4 lg:px-6">
      <div className={`${isSpecialCompany ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-screen overflow-visible' : "relative bg-white border rounded-2xl max-w-7xl shadow-sm"}`}>
        {isSpecialCompany ? (
          <>
            <div className="col-span-1 flex flex-col h-fit bg-white rounded-2xl lg:rounded-r-none border-r border-gray-100">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex-1 relative">
                  <input ref={searchInputRef} type="text" placeholder="Search reminders..." 
                    value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-gray-50 border-0 outline-none text-sm rounded-full px-4 py-2 placeholder-gray-400" />
                </div>
                {isMobile && <button onClick={handleNewReminderClick} className="ml-2 bg-blue-900 text-white p-2 rounded-full shadow-lg"><Plus size={20} /></button>}
                <button onClick={() => setShowFilterModal(true)} className="p-2 rounded-full bg-blue-900 text-white hover:bg-blue-800 transition-all">
                  <Filter size={18} />
                </button>
              </div>
              {renderReminderHistory()}
            </div>
            {!isMobile ? (
              <div className="col-span-1 flex flex-col rounded-r-2xl border-l border-gray-100">
                {renderReminderForm()}
              </div>
            ) : showForm ? (
              <>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]" onClick={() => setShowForm(false)} />
                {renderReminderForm()}
              </>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-2xl gap-4">
              <div className="relative flex items-center bg-white border rounded-full w-full sm:w-72 px-3">
                <Search size={16} className="text-gray-400" />
                <input ref={searchInputRef} type="text" placeholder="Search reminders..." 
                  value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full p-2 outline-none text-sm ml-8 placeholder-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFilterModal(true)} 
                  className="p-2 rounded-full bg-blue-900 text-white hover:bg-blue-800 transition-all">
                  <Filter size={20} />
                </button>
                <button onClick={handleNewReminderClick}
                  className="bg-blue-900 shadow-md shadow-blue-900 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full hover:bg-blue-700 transition-all text-sm sm:text-base whitespace-nowrap flex-shrink-0">
                  + New Reminder
                </button>
              </div>
            </div>
            {renderReminderHistory()}
            {showForm && (
              <>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={handleClickOutside} />
                {renderReminderForm()}
              </>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1002] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-medium text-lg text-gray-800">Filter Reminders</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => { setFromDate(""); setToDate(""); setShowFilterModal(false); }} 
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-xl hover:bg-gray-300 transition-all font-medium">
                Reset
              </button>
              <button onClick={() => setShowFilterModal(false)} 
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-xl hover:bg-indigo-700 transition-all font-medium">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderForm;

// import React, { useState, useEffect, useRef, useCallback ,useContext  } from "react";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { X, Search, Filter } from "lucide-react";
// import axios from "axios";
// import { useParams } from "react-router-dom";
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { format } from 'date-fns';
// import { usePopup } from "../context/PopupContext";
// import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
// import { GlobUserContext } from "../context/userContex";

// const apiEndPoint = import.meta.env.VITE_API_URL;
// const token = localStorage.getItem("token");

// // Speech recognition setup
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// let mic = null;
// const ReminderForm = ({ onCountChange }) => {
//   const { user } = useContext(GlobUserContext)
//   const { leadId } = useParams();
//   const { showPopup } = usePopup();
//   const [showForm, setShowForm] = useState(false);
//   const [users, setUsers] = useState([]);
//   const [reminderList, setReminderList] = useState([]);
//   const [submitting, setSubmitting] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loggedInUserId, setLoggedInUserId] = useState(null);
//   const [loggedInUserName, setLoggedInUserName] = useState("");
//   const [assignToMe, setAssignToMe] = useState(false);
//   const [isListeningContent, setIsListeningContent] = useState(false);
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [isSearchOpen, setIsSearchOpen] = useState(false);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   const [form, setForm] = useState({
//     title: "",
//     content: "",
//     reminderDateTime: new Date(),
//     priority: "Normal",
//     assignt_to: "",
//     ilead_id: Number(leadId),
//   });

//   const contentInputRef = useRef(null);
//   const searchInputRef = useRef(null);

//   // Set logged in user info
//   useEffect(() => {
//     const userString = localStorage.getItem("user");
//     if (userString) {
//       try {
//         const userObject = JSON.parse(userString);
//         if (userObject && userObject.iUser_id && userObject.cFull_name) {
//           setLoggedInUserId(userObject.iUser_id);
//           setLoggedInUserName(userObject.cFull_name);
//         }
//       } catch (error) {
//         console.error("Failed to parse user data from localStorage", error);
//       }
//     }
//   }, []);

//   // Set current date and time when the form is shown
//   useEffect(() => {
//     if (showForm) {
//       setForm(prevForm => ({
//         ...prevForm,
//         reminderDateTime: new Date()
//       }));
//     }
//   }, [showForm]);

//   // Mic Logic
//   useEffect(() => {
//     if (SpeechRecognition) {
//       mic = new SpeechRecognition();
//       mic.continuous = false;
//       mic.interimResults = true;
//       mic.lang = "en-US";
//     } else {
//       console.error("Speech Recognition API is not supported in this browser.");
//       return;
//     }

//     mic.onresult = (event) => {
//       const transcript = Array.from(event.results)
//         .map((result) => result[0].transcript)
//         .join("");
//       setForm((prevForm) => ({
//         ...prevForm,
//         content: transcript,
//       }));
//     };

//     mic.onerror = (event) => {
//       toast.error(`Speech recognition error: ${event.error}`);
//       setIsListeningContent(false);
//     };

//     mic.onend = () => {
//       setIsListeningContent(false);
//     };

//     return () => {
//       mic.stop();
//       mic.onresult = null;
//       mic.onerror = null;
//       mic.onend = null;
//     };
//   }, []);

//   const toggleListening = (field) => {
//     if (field === "content") {
//       setIsListeningContent((prevState) => {
//         if (!prevState) {
//           try {
//             mic.start();
//           } catch (e) {
//             console.error("Failed to start mic:", e);
//           }
//         } else {
//           setForm(prevForm => ({
//             ...prevForm,
//             content: prevForm.content.trim(),
//           }));
//           mic.stop();
//         }
//         return !prevState;
//       });
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleAssignToMeChange = (e) => {
//     const checked = e.target.checked;
//     setAssignToMe(checked);
//     if (checked) {
//       setForm((prev) => ({
//         ...prev,
//         assignt_to: loggedInUserId,
//       }));
//     } else {
//       setForm((prev) => ({
//         ...prev,
//         assignt_to: "",
//       }));
//     }
//   };

//   const validateForm = () => {
//     if (!form.title.trim() || !form.content.trim() || !form.reminderDateTime) {
//       showPopup("Error", "Please fill in all required fields (Title, Description, Date & Time).", "error");
//       return false;
//     }
//     if (form.reminderDateTime < new Date()) {
//       showPopup("Error", "Reminder date and time must be in the future.", "error");
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setSubmitting(true);

//     const data = {
//       ...form,
//       reminderDate: form.reminderDateTime.toISOString(),
//       status: "submitted",
//       assignt_to: Number(form.assignt_to),
//     };

//     try {
//       const response = await fetch(`${apiEndPoint}/reminder`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(data),
//       });

//       let result;
//       try {
//         result = await response.json();
//       } catch {
//         result = {};
//       }

//       if (!response.ok) {
//         const errorMsg =
//           result?.data?.error ||
//           result?.error ||
//           result?.message ||
//           (typeof result === "string" ? result : "Could not add reminder");

//         showPopup("Error", `Error: ${errorMsg}`, "error");
//         return;
//       }
      
//       showPopup("Success", "🎉 Reminder submitted successfully!", "success");
//       if (result?.data?.error) {
//         showPopup("Warning", result.data.error, "warning");
//       }

//       setForm({
//         title: "",
//         content: "",
//         reminderDateTime: new Date(),
//         priority: "Normal",
//         assignt_to: "",
//         ilead_id: Number(leadId),
//       });
//       setAssignToMe(false);
//       getReminder();
//       setShowForm(false);
//     } catch (err) {
//       console.error(err);
//       showPopup("Error", "Submission failed. Try again.", "error");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const getReminder = async () => {
//     try {
//       const response = await fetch(
//         `${apiEndPoint}/reminder/get-reminder/${leadId}`,
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       const data = await response.json();
//       if (response.ok) {
//         setReminderList(data.message);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const fetchUsers = async () => {

//     const FilterUsers= user.filter (user => (user.bactive === true ) || (user.bactive === "true")
//     )
//     // try {
//     //   const res = await axios.get(`${apiEndPoint}/users`, {
//     //     headers: { Authorization: `Bearer ${token}` },
//     //   });
//       setUsers(FilterUsers);
//   //   } catch (err) {
//   //     console.error("Failed to load users", err);
//   //   }
//   }

//   useEffect(() => {
//     getReminder();
//     fetchUsers();
//   }, []);

//   const applyFilters = useCallback(() => {
//     setShowFilterModal(false);
//   }, []);

//   const resetFilters = useCallback(() => {
//     setFromDate("");
//     setToDate("");
//     setSearchTerm("");
//     setShowFilterModal(false);
//   }, []);

//   const filteredReminders = reminderList.filter((reminder) => {
//     const lowerCaseSearchTerm = searchTerm.toLowerCase();
//     const matchesSearch =
//       reminder.cremainder_title.toLowerCase().includes(lowerCaseSearchTerm) ||
//       reminder.cremainder_content.toLowerCase().includes(lowerCaseSearchTerm) ||
//       (reminder.priority && reminder.priority.toLowerCase().includes(lowerCaseSearchTerm)) ||
//       (reminder.assigned_to && reminder.assigned_to.toLowerCase().includes(lowerCaseSearchTerm));

//     const reminderDate = new Date(reminder.dremainder_dt);
//     const from = fromDate ? new Date(fromDate) : null;
//     const to = toDate ? new Date(`${toDate}T23:59:59`) : null;
//     const matchesDate = (!from || reminderDate >= from) && (!to || reminderDate <= to);
//     return matchesSearch && matchesDate;
//   });

//   const formatDisplayDateTime = (dateString) => {
//     if (!dateString) return "-";
//     const date = new Date(dateString);
//     if (isNaN(date)) return "Invalid Date";
//     return format(date, 'dd/MM/yyyy hh:mm a');
//   };

//   useEffect(() => {
//     if (isSearchOpen && searchInputRef.current) {
//       searchInputRef.current.focus();
//     }
//   }, [isSearchOpen]);
//   useEffect(() => {
//   if (typeof onCountChange === "function") {
//     onCountChange(reminderList.length);
//   }
// }, [reminderList, onCountChange]);


//   return (
//     <div className="relative min-h-screen bg-[#f8f8f8] p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full text-base leading-relaxed text-gray-900 mx-auto">
//       <ToastContainer position="top-right" autoClose={10000} />

//       {/* Header with Search and New Reminder Button */}
//       <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 sm:px-6 sm:py-4 gap-4">
//         {/* SEARCH */}
//         <div className="relative flex items-center bg-white border border-gray-200 rounded-full w-full sm:w-72">
//           <input
//             ref={searchInputRef}
//             type="text"
//             placeholder="Search reminders..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//              className={` w-full transition-all duration-300 ease-in-out bg-transparent outline-none text-sm font-medium px-4 py-2 opacity-100 `}
//             // className={`
//             //   w-full
//             //   transition-all duration-300 ease-in-out
//             //   bg-transparent outline-none text-sm font-medium 
//             //    ${isSearchOpen ? 'px-4 py-2 opacity-100' : 'px-0 py-0 opacity-0'}
//             // `}
//           />
//           <button
//             onClick={() => setIsSearchOpen(!isSearchOpen)}
//             className={`
//               p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors
//               ${isSearchOpen ? 'text-blue-900' : ''}
//             `}
//             aria-label="Toggle search bar"
//           >
//             <Search size={18} />
//           </button>
//         </div>

//         {/* RIGHT SIDE BUTTONS */}
//         <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
//           <button
//             onClick={() => setShowFilterModal(true)}
//             className="hidden sm:flex p-2 rounded-full bg-blue-900 hover:bg-blue-700 transition duration-150 ease-in-out flex-shrink-0"
//             aria-label="Filter Reminders"
//           >
//             <Filter size={20} color="white" />
//           </button>

//           <button
//             onClick={() => setShowForm(true)}
//             className="
//               bg-blue-900 shadow-md shadow-blue-900 text-white
//               px-4 py-2 sm:px-5 sm:py-2
//               rounded-full hover:bg-blue-700
//               transition duration-150 ease-in-out
//               flex-shrink-0 text-sm sm:text-base whitespace-nowrap
//               w-full sm:w-auto text-center
//             "
//           >
//             + Add Reminder
//           </button>
//         </div>
//       </div>

//       {/* Filter Modal */}
//       {showFilterModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm sm:max-w-md space-y-4">
//             <h2 className="text-lg font-medium text-gray-800">Filter by Date</h2>
//             <label className="block text-sm text-gray-700">
//               From
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
//               />
//             </label>
//             <label className="block text-sm text-gray-700">
//               To
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
//               />
//             </label>
//             <div className="flex justify-end gap-2 mt-6">
//               <button
//                 onClick={resetFilters}
//                 className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-150 ease-in-out text-sm"
//               >
//                 Reset
//               </button>
//               <button
//                 onClick={applyFilters}
//                 className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition duration-150 ease-in-out text-sm"
//               >
//                 Apply
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//      {/* Reminder List */}
//     <div className="relative bg-white mt-5 border rounded-2xl overflow-hidden transition-all duration-300 w-[100%] lg:w-[90%] xl:w-[95%] mx-auto shadow">
//       <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
//         {filteredReminders.length === 0 ? (
//           <p className="text-center text-gray-400 text-sm sm:text-base py-8">No reminders found.</p>
//         ) : (
//           filteredReminders
//             .sort((a, b) => new Date(b.dremainder_dt) - new Date(a.dremainder_dt))
//             .map((reminder) => (
//               <div
//                 key={reminder.iremainder_id}
//                 className="border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out"
//               >
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
//                   <div className="mb-3 sm:mb-0">
//                     <h3 className="text-md font-semibold text-gray-900">
//                       📌 {reminder.cremainder_title}
//                     </h3>
//                     <p className="text-sm text-gray-700 mt-1 leading-relaxed">
//                       {reminder.cremainder_content}
//                     </p>
//                     <div className="text-xs text-gray-500 mt-2">
//                       Created by:{" "}
//                       <span className="font-semibold">{reminder.created_by}</span>
//                     </div>
//                     <div className="text-xs mt-1 text-gray-600">
//                       Priority:{" "}
//                       <span className="font-semibold">
//                         {reminder.priority || "Normal"}
//                       </span>
//                     </div>
//                     <div className="text-xs text-gray-600">
//                       Assigned to:{" "}
//                       <span className="font-semibold">{reminder.assigned_to}</span>
//                     </div>
//                   </div>
//                   <div className="text-left sm:text-right text-sm text-gray-600 whitespace-nowrap">
//                     <p className="font-medium text-blue-700">
//                       {formatDisplayDateTime(reminder.dremainder_dt)}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             ))
//         )}
//       </div>
//     </div>

//       {/* Reminder Form Drawer */}
//       {showForm && (
//         <>
//           <div
//             className="fixed inset-0 bg-black bg-opacity-40 z-40"
//             onClick={() => setShowForm(false)}
//           />
//           <div className="fixed top-0 right-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/3 2xl:max-w-xl h-[100vh] bg-white shadow-xl z-50 transition-transform duration-500 rounded-l-3xl">
//             <div className="p-6 h-[100vh] overflow-y-scroll relative">
//               <button
//                 className="absolute top-4 right-4 text-gray-600 hover:text-black"
//                 onClick={() => setShowForm(false)}
//                 aria-label="Close"
//               >
//                 <X size={24} />
//               </button>
//               <h2 className="font-semibold text-lg sm:text-xl mt-5 mb-6">New Reminder</h2>

//               <form onSubmit={handleSubmit}>
//                 <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
//                   Title <span className="text-red-500">*</span>
//                 </label>
//                 <div className="flex items-center gap-2 mb-6">
//                   <input
//                     className="flex-grow border border-gray-300 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
//                     name="title"
//                     value={form.title}
//                     onChange={handleChange}
//                     required
//                     maxLength={100}
//                     placeholder="Enter reminder title"
//                   />
//                 </div>

//                 <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
//                   Description <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative mb-6">
//                   <textarea
//                     className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition h-28 resize-none pr-14 text-sm sm:text-base"
//                     name="content"
//                     value={form.content}
//                     onChange={handleChange}
//                     required
//                     maxLength={300}
//                     ref={contentInputRef}
//                     placeholder="Enter description"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => toggleListening("content")}
//                     className={`absolute top-2 right-2 p-2 rounded-full text-white text-sm select-none ${
//                       isListeningContent ? "bg-red-500 hover:bg-red-600" : "bg-gray-100 hover:bg-blue-900"
//                     } transition`}
//                     aria-label={
//                       isListeningContent
//                         ? "Stop listening to description"
//                         : "Start listening to description"
//                     }
//                   >
//                     {isListeningContent ? "🎙️" : "🎤"}
//                   </button>
//                 </div>
//                 {isListeningContent && (
//                   <p className="text-gray-600 text-sm italic -mt-4 mb-6 select-none">
//                     Listening for description...
//                   </p>
//                 )}

//                 <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
//                   Priority <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="priority"
//                   className="w-full border border-gray-300 p-3 mb-6 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
//                   value={form.priority}
//                   onChange={handleChange}
//                 >
//                   <option value="Low">Low</option>
//                   <option value="Normal">Normal</option>
//                   <option value="High">High</option>
//                   <option value="Critical">Critical</option>
//                 </select>

//                 <div className="flex items-center justify-between mb-4">
//                   <label className="text-sm sm:text-base font-semibold text-gray-700">
//                     Assign To <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-center gap-2">
//                     <input
//                       type="checkbox"
//                       id="assignToMe"
//                       checked={assignToMe}
//                       onChange={handleAssignToMeChange}
//                       className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
//                     />
//                     <label
//                       htmlFor="assignToMe"
//                       className="text-sm sm:text-base text-gray-700 cursor-pointer select-none"
//                     >
//                       Assign to me
//                     </label>
//                   </div>
//                 </div>

//                 <select
//                   name="assignt_to"
//                   className="w-full border border-gray-300 p-3 mb-6 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
//                   value={form.assignt_to}
//                   onChange={handleChange}
//                   disabled={assignToMe}
//                 >
//                   <option value="">Select User</option>
//                   {users.map((user) => (
//                     <option key={user.iUser_id} value={user.iUser_id}>
//                       {user.cFull_name}
//                     </option>
//                   ))}
//                 </select>

//                 <LocalizationProvider dateAdapter={AdapterDateFns}>
//                   <div className="mb-6">
//                     <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
//                       Date & Time <span className="text-red-500">*</span>
//                     </label>
//                     <DateTimePicker
//                       value={form.reminderDateTime}
//                       viewRenderers={{
//                         hours: renderTimeViewClock,
//                         minutes: renderTimeViewClock,
//                         seconds: renderTimeViewClock,
//                       }}
//                       onChange={(newValue) =>
//                         setForm(prev => ({ ...prev, reminderDateTime: newValue }))
//                       }
//                       minDateTime={new Date()}
//                       format="dd/MM/yyyy HH:mm:ss"
//                       slotProps={{
//                         textField: {
//                           fullWidth: true,
//                           variant: 'outlined',
//                           className: 'bg-gray-50 text-sm sm:text-base',
//                           inputProps: {
//                             className: 'p-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition'
//                           }
//                         },
//                       }}
//                       className="w-full"
//                     />
//                   </div>
//                 </LocalizationProvider>

//                 <div className="flex flex-col sm:flex-row gap-4">
//                   <button
//                     type="submit"
//                     className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition font-semibold w-full sm:w-auto text-sm sm:text-base"
//                     disabled={submitting}
//                   >
//                     {submitting ? "Submitting..." : "Submit Reminder"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default ReminderForm;

