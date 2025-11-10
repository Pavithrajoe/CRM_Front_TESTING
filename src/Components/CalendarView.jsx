import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaCheckSquare, FaRegSquare, FaUserAlt, FaClock, FaPlus, FaChevronLeft, FaChevronRight, FaMicrophone,FaSearch  } from 'react-icons/fa';
import { Drawer, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { format } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ENDPOINTS } from "../api/constraints";
import Slide from '@mui/material/Slide';  
import { useNavigate } from "react-router-dom";
import { useUserAccess } from "../context/UserAccessContext"

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const getStartOfDayInLocalTime = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDayInLocalTime = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const MeetFormDrawer = ({ open, onClose, selectedDate, onCreated, setSnackbar }) => {
  const initialFormData = {
    ctitle: '',
    devent_startdt: null,
    cdescription: '',
    icreated_by: '',
    iupdated_by: '',
    devent_end: null,
    dupdated_at: new Date(),
    recurring_task: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);
  const descriptionRef = useRef('');

  useEffect(() => {
    if (open && selectedDate) {
      const now = new Date();
      const initialStartDateTime = new Date(selectedDate);
      
      if (initialStartDateTime.toDateString() === now.toDateString()) {
        initialStartDateTime.setHours(now.getHours() + 1, 0, 0, 0);
      } else {
        initialStartDateTime.setHours(9, 0, 0, 0);
      }

      const endDateTime = new Date(initialStartDateTime.getTime() + 60 * 60 * 1000);

      setFormData(prev => ({
        ...prev,
        devent_startdt: initialStartDateTime,
        devent_end: endDateTime
      }));
    }
  }, [open, selectedDate]);

  // Speech recognition setup (same as before)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSnackbar({
        open: true,
        message: "Speech Recognition not supported by your browser.",
        severity: 'error'
      });
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    let finalTranscript = '';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      const newDescription = (descriptionRef.current + ' ' + interimTranscript).trim();
      setFormData(prev => ({ ...prev, cdescription: newDescription }));
    };

    recognitionRef.current.onend = () => {
      setFormData(prev => {
        const finalDescription = (descriptionRef.current + ' ' + finalTranscript).trim();
        return { ...prev, cdescription: finalDescription };
      });
      descriptionRef.current = finalTranscript;
      finalTranscript = '';
      setIsListening(false);
    };

      recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      let userMessage = 'Speech recognition error. Please try again.';
      if (event.error === 'not-allowed') {
        userMessage = 'Microphone access was denied. Please allow microphone access in your browser settings to use this feature.';
      }

      setSnackbar({
        open: true,
        message: userMessage,
        severity: 'error'
      });
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [setSnackbar]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      setSnackbar({
        open: true,
        message: "Speech Recognition is not available.",
        severity: 'error'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        descriptionRef.current = formData.cdescription;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setSnackbar({
          open: true,
          message: "Error starting voice input. Please ensure microphone access is granted.",
          severity: 'error'
        });
        setIsListening(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const startDate = formData.devent_startdt;
    const endDate = formData.devent_end;

    if (!startDate || !endDate) {
      setSnackbar({
        open: true,
        message: 'Please select both start and end dates',
        severity: 'error'
      });
      return;
    }

    if (endDate < startDate) {
      setSnackbar({
        open: true,
        message: 'End date cannot be before start date',
        severity: 'error'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const user_data_parsed = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    const finalData = {
      ...formData,
      devent_startdt: startDate.toISOString(),
      devent_end: endDate.toISOString(),
      icreated_by: user_data_parsed.iUser_id,
      iupdated_by: user_data_parsed.iUser_id,
      dupdated_at: new Date().toISOString(),
      recurring_task: formData.recurring_task || null
    };

    setLoading(true);
    try {
      const response = await fetch(ENDPOINTS.CREATE_EVENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: `Failed to create calendar event: ${errorData.message || 'Try again!'}`,
          severity: 'error',
        });
        return;
      }

      setSnackbar({
        open: true,
        message: 'Calendar Event created successfully!',
        severity: 'success',
      });
      setFormData(initialFormData);
      onCreated();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      setSnackbar({
        open: true,
        message: 'Something went wrong while creating the event.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Drawer anchor="right" open={open} onClose={onClose}>
        <div className={`fixed top-0 right-0 h-full w-[50%] sm:w-[400px] md:w-[360px] bg-white rounded-l-2xl shadow-xl z-50 transition-all duration-500 ease-in-out transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="relative p-6 h-full overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition duration-200"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Calendar Event</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.ctitle}
                  onChange={(e) => setFormData({ ...formData, ctitle: e.target.value })}
                  placeholder="Calendar Event title"
                  className="w-full px-4 py-2 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <div className="relative">
                  <textarea
                    value={formData.cdescription}
                    onChange={(e) => setFormData({ ...formData, cdescription: e.target.value })}
                    placeholder="Optional details…"
                    className="w-full px-4 py-2 rounded-xl bg-gray-100 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10"
                    maxLength={300}
                  />
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`absolute top-3 right-3 transition ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-blue-600'}`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    <FaMicrophone className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date<span className="text-red-500">*</span></label>
                <DateTimePicker
                  value={formData.devent_startdt}
                  onChange={(newValue) => setFormData({ ...formData, devent_startdt: newValue })}
                  viewRenderers={{
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock,
                    seconds: renderTimeViewClock,
                  }}
                  format="dd/MM/yyyy HH:mm"
                  className="w-full"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      className: 'w-full',
                    },
                    popper: {
                      disablePortal: false,
                      modifiers: [
                        { name: 'flip', enabled: false },
                        { name: 'preventOverflow', enabled: false }
                      ],
                      sx: {
                        position: 'fixed !important',
                        left: '50% !important',
                        top: '50% !important',
                        transform: 'translate(-50%, -50%) !important',
                        zIndex: 1400,          
                        width: 'min(760px, 95vw)', 
                      }
                    }
                  }}
                />

              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date<span className="text-red-500">*</span></label>
                <DateTimePicker
                  value={formData.devent_end}
                  onChange={(newValue) =>
                    setFormData({ ...formData, devent_end: newValue })
                  }
                  minDateTime={formData.devent_startdt}
                  viewRenderers={{
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock,
                    seconds: renderTimeViewClock,
                  }}
                  format="dd/MM/yyyy HH:mm"
                  className="w-full"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      className: "w-full",
                    },
                    popper: {
                      disablePortal: false,
                      modifiers: [
                        { name: "flip", enabled: false },
                        { name: "preventOverflow", enabled: false },
                      ],
                      sx: {
                        position: "fixed !important",
                        left: "50% !important",
                        top: "50% !important",
                        transform: "translate(-50%, -50%) !important",
                        zIndex: 1400,
                        width: "min(760px, 95vw)",
                      },
                    },
                  }}
                />
              </div>

               <div>
                <label className="block text-sm text-gray-600 mb-1">Recurring Task</label>
                <select
                  name="recurring_task"
                  value={formData.recurring_task ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurring_task: e.target.value === "" ? null : e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">None</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarter">Quarter</option>
                  <option value="Half_year">Half-year</option>
                  <option value="Year">Year</option>
                </select>
              </div>
             
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="w-full py-2 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Drawer>
    </LocalizationProvider>
  );
};

const CalendarView = () => {
  const { userModules } = useUserAccess();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [msg, setMsg] = useState('');
  const [reminderList, setReminderList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [activeTab, setActiveTab] = useState('calendarEvents');
  const [tableActiveTab, setTableActiveTab] = useState('calendarEvents')
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [userCalendarEvents, setUserCalendarEvents] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showEnded, setShowEnded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [userTaskError, setUserTaskError] = useState(null);
  const [userTask, setUserTask] =useState([]);

  const token = localStorage.getItem("token");
  let company_id = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      company_id = payload.company_id; 
    } catch (e) {
      console.error("Could not decode token", e);
    }
  }

  const dynamicPermission = useMemo(() => {
    return userModules.filter(
      (attr) => 
        attr.module_id === 2 && 
        attr.bactive && 
        ([16, 17, 26].includes(attr.attribute_id) || 
         ["Reminder", "Task", "Calender Event"].includes(attr.attribute_name))
    );
  }, [userModules]);

  const isReminderAllowed = useMemo(() => 
    dynamicPermission.some(attr => 
      attr.attribute_id === 16 || attr.attribute_name === "Reminder"
    ), [dynamicPermission]);

  const isTaskAllowed = useMemo(() => 
    dynamicPermission.some(attr => 
      attr.attribute_id === 17 || attr.attribute_name === "Task"
    ), [dynamicPermission]);

  const isCalendarEventAllowed = useMemo(() => 
    dynamicPermission.some(attr => 
      attr.attribute_id === 26 || attr.attribute_name === "Calender Event"
    ), [dynamicPermission]);

  // Determine which tabs to show in card view
  const availableCardTabs = useMemo(() => {
    const tabs = [];
    if (isCalendarEventAllowed) tabs.push("calendarEvents");
    if (isTaskAllowed) tabs.push("tasks");
    if (isReminderAllowed && company_id !== 15) tabs.push("reminders");
    return tabs;
  }, [isCalendarEventAllowed, isTaskAllowed, isReminderAllowed, company_id]);

  // Determine which tabs to show in table view
  const availableTableTabs = useMemo(() => {
    const tabs = [];
    if (isCalendarEventAllowed) tabs.push("calendarEvents");
    if (isTaskAllowed) tabs.push("tasks");
    if (isReminderAllowed && company_id !== 15) tabs.push("reminders");
    return tabs;
  }, [isCalendarEventAllowed, isTaskAllowed, isReminderAllowed, company_id]);

  // Set default active tab based on available permissions
  useEffect(() => {
    if (availableCardTabs.length > 0 && !availableCardTabs.includes(activeTab)) {
      setActiveTab(availableCardTabs[0]);
    }
    if (availableTableTabs.length > 0 && !availableTableTabs.includes(tableActiveTab)) {
      setTableActiveTab(availableTableTabs[0]);
    }
  }, [availableCardTabs, availableTableTabs, activeTab, tableActiveTab]);

  // FETCH FUNCTION: It explicitly accepts the date to be passed in the request.
  const fetchTasks = async (date) => {
    setLoadingTasks(true);
    setTaskError(null);
    try {
      const token = localStorage.getItem("token");
      const userJson = localStorage.getItem("user");

      if (!userJson) {
        throw new Error("User not found in localStorage");
      }
      if (!token) {
        throw new Error("Token missing");
      }

      const userObj = JSON.parse(userJson);
      const userId = userObj.iUser_id;

      const formattedDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      const response = await fetch(
        `${ENDPOINTS.GET_FILTER_TASK}/${userId}/date?date=${formattedDate}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTasks(data.data || []);
        setTaskError(null);
      } else {
        setUserTask([]);
        setTaskError(data.message || "No tasks available for this day.");
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTaskError(error.message);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchAllTasks = async (date) => {
    setLoadingTasks(true);
    setUserTaskError(null);
    try {
      const token = localStorage.getItem("token");
      const userJson = localStorage.getItem("user");

      if (!userJson) {
        throw new Error("User not found in localStorage");
      }
      if (!token) {
        throw new Error("Token missing");
      }

      const userObj = JSON.parse(userJson);
      const userId = userObj.iUser_id;

      const response = await fetch(
        `${ENDPOINTS.GET_FILTER_TASK}/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUserTask(data.data || []);
        setUserTaskError(null);
      } else {
        setUserTask([]);
        setUserTaskError(data.message || "No tasks available for this day.");
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setUserTaskError(error.message);
      setUserTask([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchRemindersAndEventsForSelectedDate = async (date = selectedDate) => {
    const user_data = localStorage.getItem("user");
    if (!user_data) return;
    const user_data_parsed = JSON.parse(user_data);
    let dates = new Date(date);
    let utcStartOfDay = new Date(Date.UTC(
      dates.getFullYear(),
      dates.getMonth(),
      dates.getDate(),
      0, 0, 0, 0
    ));
    let formattedDate = utcStartOfDay.toISOString();
    formattedDate = formattedDate.replace('.000', '');
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${ENDPOINTS.FOLLOW_UP}?id=${user_data_parsed.iUser_id}&eventDate=${formattedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      setReminders(data.reminders || []);
      setCalendarEvents(data.calender_event || []);

    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load reminders for selected date',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.TOGGLE_REMINDER}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle reminder status');
      }

      setReminders(prevReminders => prevReminders.map(reminder =>
        reminder.iremainder_id === id ? { ...reminder, bactive: !reminder.bactive } : reminder
      ));
      setReminderList(prevList => prevList.map(reminder =>
        reminder.iremainder_id === id ? { ...reminder, bactive: !reminder.bactive } : reminder
      ));

      setSnackbar({
        open: true,
        message: 'Reminder status updated!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to update reminder: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const fetchAllUserReminders = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.USER_REMINDER}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        setMsg("Error in fetching user reminders");
        return;
      }
      const data = await response.json();
      setReminderList(data.data || []);
    } 
    catch (e) {
      setMsg("Can't fetch user reminders");
      setSnackbar({
        open: true,
        message: 'Failed to load all reminders.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filterAndSortItems = (
    items,
    dateKey,
    contentKey,
    endTimeKey = null,
    showEndedState,
    applyDateFilters
  ) => {
    const now = new Date();

    const filtered = items.filter((item) => {
      const searchTermLower = (searchTerm || "").toLowerCase();
      const searchMatch =
        (item?.[contentKey]?.toLowerCase() || "").includes(searchTermLower) ||
        (item?.user_task_icreated_byTouser?.cFull_name?.toLowerCase() || "").includes(searchTermLower) ||
        (item?.user_task_iassigned_toTouser?.cFull_name?.toLowerCase() || "").includes(searchTermLower) ||
        (item?.crm_lead?.clead_name?.toLowerCase() || "").includes(searchTermLower) ||
        (item?.ctitle?.toLowerCase() || "").includes(searchTermLower) ||
        (item?.cdescription?.toLowerCase() || "").includes(searchTermLower) ||
        (item?.recurring_task?.toLowerCase() || "").includes(searchTermLower);

      const itemStartDateTime = new Date(item[dateKey]);
      const itemEndDateTime =
        endTimeKey && item[endTimeKey] ? new Date(item[endTimeKey]) : itemStartDateTime;

      let dateRangeMatch = true;
      let timeStatusMatch = true;

      if (applyDateFilters) {
        const from = fromDate ? getStartOfDayInLocalTime(new Date(fromDate)) : null;
        const to = toDate ? getEndOfDayInLocalTime(new Date(toDate)) : null;

        dateRangeMatch = (!from || itemEndDateTime >= from) && (!to || itemStartDateTime <= to);
        
        if (showEndedState) {
          timeStatusMatch = itemEndDateTime <= now;
        } else {
          timeStatusMatch = itemEndDateTime > now;
        }
      }

      return searchMatch && dateRangeMatch && timeStatusMatch;
    });

    return filtered.sort((a, b) => {
      const sortDateA = endTimeKey && a[endTimeKey] ? new Date(a[endTimeKey]) : new Date(a[dateKey]);
      const sortDateB = endTimeKey && b[endTimeKey] ? new Date(b[endTimeKey]) : new Date(b[dateKey]);

      if (showEndedState && applyDateFilters) {
        return sortDateB.getTime() - sortDateA.getTime();
      } else {
        return sortDateA.getTime() - sortDateB.getTime();
      }
    });
  };

  const currentTabItems =
    activeTab === 'reminders' ? reminders :
    activeTab === 'calendarEvents' ? calendarEvents :
    activeTab === 'tasks' ? tasks : [];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedCurrentItems = currentTabItems.slice(indexOfFirstItem, indexOfLastItem);
  const navigate = useNavigate();
  
  const totalPages = Math.ceil(currentTabItems.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const fetchUserCalendarEvents = async () => {
    const token = localStorage.getItem("token");
    const user_data = localStorage.getItem("user");

    if (!user_data) return;

    setLoading(true);
    try {
      const user_data_parsed = JSON.parse(user_data);
      const userId = user_data_parsed.iUser_id;

      const response = await fetch(`${ENDPOINTS.USERCALENDEREVENT}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setCalendarEvents(data.data || []);
      setUserCalendarEvents(data || [])
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load calendar events',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemCreated = () => {
    fetchRemindersAndEventsForSelectedDate();
    fetchAllUserReminders();
    if (activeTab === 'calendarEvents') {
      fetchUserCalendarEvents();
    }
    if (activeTab === 'tasks') {
      fetchTasks(selectedDate);
    }
  };

  useEffect(() => {
    if (!selectedDate) return;

    const startOfDay = getStartOfDayInLocalTime(selectedDate);
    const endOfDay = getEndOfDayInLocalTime(selectedDate);

    setFromDate(startOfDay);
    setToDate(endOfDay);

    if (activeTab === 'tasks') {
      fetchTasks(selectedDate);
    }

    fetchRemindersAndEventsForSelectedDate(selectedDate);
  }, [selectedDate, activeTab]);

  useEffect(() => {
    const user_data = localStorage.getItem("user");
    if (user_data) {
      try {
        const user_data_parsed = JSON.parse(user_data);
        setLoggedInUserName(user_data_parsed.cUser_Name);
      } 
      catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserCalendarEvents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, showEnded, searchTerm, fromDate, toDate, reminderList, calendarEvents, tasks]);

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

  // Filter function for TABLE data only
  const filterTableData = (items, type) => {
    if (!searchTerm) return items;
    const searchTermLower = searchTerm.toLowerCase();
    return items.filter(item => {
      switch (type) {
        case 'reminders':
          return (
            (item.cremainder_content?.toLowerCase() || '').includes(searchTermLower) ||
            (item.created_by?.toLowerCase() || '').includes(searchTermLower) ||
            (item.assigned_to?.toLowerCase() || '').includes(searchTermLower) ||
            (item.lead_name?.toLowerCase() || '').includes(searchTermLower)
          );
        
        case 'calendarEvents':
          return (
            (item.ctitle?.toLowerCase() || '').includes(searchTermLower) ||
            (item.cdescription?.toLowerCase() || '').includes(searchTermLower) ||
            (item.recurring_task?.toLowerCase() || '').includes(searchTermLower)
          );
        
        case 'tasks':
          return (
            (item.ctitle?.toLowerCase() || '').includes(searchTermLower) ||
            (item.ctask_content?.toLowerCase() || '').includes(searchTermLower) ||
            (item.user_task_iassigned_toTouser?.cFull_name?.toLowerCase() || '').includes(searchTermLower) ||
            (item.crm_lead?.clead_name?.toLowerCase() || '').includes(searchTermLower)
          );
        
        default:
          return true;
      }
    });
  };

  // Get filtered AND SORTED table data (latest first)
  const getFilteredTableData = () => {
    let filteredData = [];
    
    switch (tableActiveTab) {
      case 'reminders':
        filteredData = filterTableData(reminderList, 'reminders');
        // Sort reminders by dremainder_dt descending (latest first)
        return filteredData.sort((a, b) => new Date(b.dremainder_dt) - new Date(a.dremainder_dt));
      
      case 'calendarEvents':
        filteredData = filterTableData(userCalendarEvents, 'calendarEvents');
        // Sort calendar events by devent_startdt descending (latest first)
        return filteredData.sort((a, b) => new Date(b.devent_startdt) - new Date(a.devent_startdt));
      
      case 'tasks':
        filteredData = filterTableData(userTask, 'tasks');
        // Sort tasks by task_date descending (latest first)
        return filteredData.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
      
      default:
        return [];
    }
  };

  const filteredTableData = getFilteredTableData();

  return (
    <div>
      <div className="flex w-full p-8 rounded-3xl bg-white/80 backdrop-blur-md shadow-sm hover:scale-[1.01] transition-transform duration-300">
        <div className="flex w-full h-[500px] p-4 gap-4">
          {/* LEFT HALF: Calendar */}
          <div className="w-1/2 bg-white rounded-2xl shadow-lg p-6 h-[450px]">
            <Calendar
              className="w-full border border-white [&_.react-calendar__month-view__days__day]:flex [&_.react-calendar__month-view__days__day]:justify-center [&_.react-calendar__month-view__days__day]:items-center"
              onChange={(newDate) => {
                setSelectedDate(newDate);
                fetchTasks(newDate);
              }}
              value={selectedDate}
              prevLabel={null}
              nextLabel={null}
              navigationLabel={({ date }) => (
                <div className="flex items-center justify-between px-6 mb-2">
                  <FaChevronLeft
                    className="cursor-pointer text-gray-600 hover:text-black"
                    onClick={() =>
                      setSelectedDate((d) => {
                        const newDate = new Date(d);
                        newDate.setMonth(newDate.getMonth() - 1);
                        fetchTasks(newDate);
                        return newDate;
                      })
                    }
                  />
                  <span className="text-xl font-semibold text-gray-800">
                    {date.toLocaleString("default", { month: "long" })}{" "}
                    {date.getFullYear()}
                  </span>
                  <FaChevronRight
                    className="cursor-pointer text-gray-600 hover:text-black"
                    onClick={() =>
                      setSelectedDate((d) => {
                        const newDate = new Date(d);
                        newDate.setMonth(newDate.getMonth() + 1);
                        fetchTasks(newDate);
                        return newDate;
                      })
                    }
                  />
                </div>
              )}
            />
            {/* New buttons section */}
            <div className="flex gap-4 mt-6 justify-center">
              <button
                onClick={() => setOpenDrawer(true)}
                className="w-[200px] bg-black mt-[30px] hover:bg-gray-800 text-white py-2 px-4 rounded-xl flex items-center justify-center shadow-md "
              >
                <FaPlus className="mr-2" />
                Calendar Event
              </button>
              <button
                onClick={() => window.open("https://meet.google.com/landing", "_blank")}
                className="w-[200px] bg-black mt-[30px] hover:bg-gray-800 text-white py-2 px-4 rounded-xl flex items-center justify-center shadow-md "
              >
                <b className="text-white font-bold mr-1">G</b>
                <span>Create Meet</span>
              </button>
            </div>
          </div>

          {/* Tab view with cards */}
          <div className="w-1/2 bg-white rounded-2xl shadow-lg p-6 h-[450px] flex flex-col">
            {/* Tabs - DYNAMIC BASED ON PERMISSIONS */}
            <div className="flex border-b border-gray-300 mb-4 select-none">
              {availableCardTabs.map(tab => (
                <button
                  key={tab}
                  className={`flex-1 py-2 font-semibold text-center transition-colors ${
                    activeTab === tab
                      ? "border-b-4 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {tab === "reminders" && "Reminder"}
                  {tab === "calendarEvents" && "Calendar Event"}
                  {tab === "tasks" && "Task"}
                </button>
              ))}
            </div>
            {/* Cards container */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200 space-y-6 pr-2">
              {activeTab === "reminders" && isReminderAllowed && company_id !== 15 && (
                reminders.length > 0 ? (
                  reminders.map(reminder => (
                    <div 
                      key={reminder.iremainder_id}
                      className="pb-4 last:pb-0 border-b border-gray-200 cursor-pointer" 
                      onClick={() => navigate(`/leaddetailview/${reminder.ilead_id}`)}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start bg-white p-5 space-y-4 md:space-y-0 md:space-x-6">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          toggleReminder(reminder.iremainder_id);
                        }}>
                          {reminder.bactive ? <FaCheckSquare className="text-black text-lg" /> : <FaRegSquare className="text-lg" />}
                        </button>
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-gray-800">{reminder.cremainder_title}</h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaUserAlt className="mr-2 text-xs" />
                            Assigned To: <span className="font-semibold ml-1">{reminder.assigned_to}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-600 italic">Message: {reminder.cremainder_content}</p>
                          <p className="text-xs font-bold text-green-700 bg-green-100 w-[130px] py-1 rounded-full text-center items-center">Priority: {reminder.priority}</p>
                        </div>
                        <div className="text-xs text-yellow-700 bg-yellow-200 px-3 py-1 rounded-full flex items-center whitespace-nowrap">
                          <FaClock className="mr-1" />
                          {formatDateTime(reminder.dremainder_dt)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No reminders found for this date.</p>
                )
              )}

              {activeTab === "calendarEvents" && isCalendarEventAllowed && (
                calendarEvents.length > 0 ? (
                  calendarEvents.map(event => (
                    <div key={event.icalender_event} className="pb-4 last:pb-0 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row justify-between items-start bg-white p-5 space-y-4 md:space-y-0 md:space-x-6">
                        <div className="flex-1 space-y-3">
                          <h3 className="font-semibold text-gray-800 text-lg">{event.ctitle}</h3>
                          <p className="text-gray-600 text-sm">Message:<span className="italic font-semibold"> {event.cdescription}</span> </p>
                        </div>
                        <div className="flex-shrink-0 text-xs text-white bg-blue-600 px-3 py-1 rounded-full flex items-center whitespace-nowrap shadow">
                          <FaClock className="mr-1" />
                          {formatDateTime(event.devent_startdt)}
                        </div>
                        {event.recurring_task && (
                          <p className="text-xs text-yellow-800 bg-yellow-100 px-3 py-1 rounded-full flex items-center whitespace-nowrap shadow">
                            Recurring Task: {event.recurring_task || "No Reccuring Applied"} 
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No calendar events for this date.</p>
                )
              )}

              {activeTab === "tasks" && isTaskAllowed && (
                loadingTasks ? (
                  <p className="text-gray-400 text-center">Loading tasks...</p>
                ) : taskError ? (
                  <p className="text-gray-400 text-center"> {taskError}</p>
                ) : tasks.length > 0 ? (
                  tasks.map(task => (
                    <div key={task.itask_id} className="pb-4 last:pb-0 border-b border-gray-200" onClick={() => navigate(`/leaddetailview/${task.ilead_id}`)} > 
                      <div className="bg-white p-5 space-y-4">

                        {/*  header row for Title + Date + Lead */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          {/* Task Title */}
                          <h3 className="font-semibold text-gray-800">{task.ctitle || "No Title"}</h3>

                          <div className="flex items-center gap-3">
                            {/* Date */}
                            <div className="text-xs text-white bg-green-600 px-3 py-1 rounded-full flex items-center whitespace-nowrap">
                              <FaClock className="mr-1" />
                              {formatDateTime(task.task_date)}
                            </div>

                            {/* Lead Name */}
                            <div className="text-xs text-gray-600 bg-yellow-300 px-3 py-1 rounded-full flex items-center whitespace-nowrap">
                              <span className="font-bold text-gray-600">Lead Name:</span>
                              <span className="italic text-gray-600 ml-1">
                                {task.crm_lead?.clead_name || "No Lead Name"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned To + Message */}
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <FaUserAlt className="mr-2 text-xs" />
                            <span className="font-medium">Assigned To:</span>
                            <span className="ml-1 font-semibold">
                              {task.user_task_iassigned_toTouser?.cFull_name || "N/A"}
                            </span>
                          </div>

                          <div>
                            <span className="font-medium">Message:</span>
                            <span className="ml-1 italic font-semibold break-words">
                              {task.ctask_content}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No tasks found for this date.</p>
                )
              )}
            </div>
          </div>
        </div>

        <MeetFormDrawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          selectedDate={selectedDate}
          setSnackbar={setSnackbar}
          onCreated={handleItemCreated}
        />
      </div>

      {/* TABLE SECTION WITH SEARCH */}
      <div className="w-full rounded-xl p-5 bg-white shadow-sm border border-gray-200 mt-10">
        {/* Search Bar for TABLE */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Tabs - DYNAMIC BASED ON PERMISSIONS */}
          <div className="flex border-b border-gray-200">
            {availableTableTabs.map(tab => (
              <button
                key={tab}
                className={`py-3 px-6 text-lg font-semibold ${
                  tableActiveTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                } transition-colors duration-200`}
                onClick={() => {
                  setTableActiveTab(tab);
                  if (tab === "calendarEvents") {
                    fetchUserCalendarEvents();
                  } else if (tab === "tasks") {
                    fetchAllTasks();
                  } else if (tab === "reminders") {
                    fetchAllUserReminders();
                  }
                }}
              >
                {tab === "reminders" && "📅 All Reminders"}
                {tab === "calendarEvents" && "🗓️ All Calendar Events"}
                {tab === "tasks" && "✅ All Tasks"}
              </button>
            ))}
          </div>
        </div>

        {/* Tables */}
        {tableActiveTab === "tasks" && isTaskAllowed && (
          <>
            {userTaskError && (
              <div className="min-h-[180px]  flex items-center justify-center text-gray-400 text-base font-medium">
                <p>{userTaskError}</p>
              </div>
            )}

            {!userTaskError && filteredTableData.length === 0 && (
              <div className="min-h-[180px] flex items-center justify-center text-gray-200 text-base font-medium">
                <p>{searchTerm ? 'No tasks match your search' : 'No tasks found.'}</p>
              </div>
            )}

            {!userTaskError && filteredTableData.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-xs max-h-[400px] overflow-y-auto">
                <table className="min-w-full text-sm text-gray-800 table-auto">
                  <thead className="bg-gray-50 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-4 py-3 border-b text-center w-[60px]">S.no</th>
                      <th className="px-4 py-3 border-b text-left w-[25%]">Task Title</th>
                      <th className="px-4 py-3 border-b text-left w-[35%]">Content</th>
                      <th className="px-4 py-3 border-b text-left w-[20%]">Assigned To</th>
                      <th className="px-4 py-3 border-b text-left w-[20%] whitespace-nowrap">Task Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableData.map((item, index) => (
                      <tr key={item.itask_id} className="bg-white hover:bg-blue-50 transition duration-150 ease-in-out"  onClick={() => navigate(`/leaddetailview/${item.ilead_id}`)} >
                        <td className="px-4 py-3 border-b text-center font-medium align-top">{index + 1}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.ctitle || "No Title"}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.ctask_content}</td>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.user_task_iassigned_toTouser?.cFull_name || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b align-top whitespace-nowrap">{formatDateTime(item.task_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tableActiveTab === "calendarEvents" && isCalendarEventAllowed && (
          <>
            {filteredTableData.length === 0 ? (
              <div className="min-h-[180px] flex items-center justify-center text-gray-400 text-base font-medium">
                <p>{searchTerm ? 'No calendar events match your search' : 'No calendar events found.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-xs h-[400px] max-h-[400px] overflow-y-auto">     
                <table className="min-w-full text-sm text-gray-800 table-auto">
                  <thead className="bg-gray-50 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-4 py-3 border-b text-center w-[60px]">S.no</th>
                      <th className="px-4 py-3 border-b text-left w-[20%]">Event Title</th>
                      <th className="px-4 py-3 border-b text-left w-[30%] ">Description</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Recurring Task</th>
                      <th className="px-4 py-3 border-b text-left w-[15%] whitespace-nowrap">Start Date</th>
                      <th className="px-4 py-3 border-b text-left w-[15%] whitespace-nowrap">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableData.map((item, index) => (
                      <tr key={item.icalender_event} className="bg-white hover:bg-blue-50 transition duration-150 ease-in-out">
                        <td className="px-4 py-3 border-b text-center font-medium align-top">{index + 1}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.ctitle}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.cdescription || "-"}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.recurring_task || "None"}</td>
                        <td className="px-4 py-3 border-b align-top whitespace-nowrap">{formatDateTime(item.devent_startdt)}</td>
                        <td className="px-4 py-3 border-b align-top whitespace-nowrap">{formatDateTime(item.devent_end)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tableActiveTab === "reminders" && isReminderAllowed && company_id !== 15 && (
          <>
            {filteredTableData.length === 0 ? (
              <div className="min-h-[180px] flex items-center justify-center text-gray-400 text-base font-medium">
                <p>{searchTerm ? 'No reminders match your search' : 'No reminders found for this user.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-xs max-h-[400px] overflow-y-auto">     
                <table className="min-w-full text-sm text-gray-800 table-auto">
                  <thead className="bg-gray-50 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-4 py-3 border-b text-center w-[60px]">S.no</th>
                      <th className="px-4 py-3 border-b text-left w-[25%]">Reminder</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Created by</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Assigned to</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Lead</th>
                      <th className="px-4 py-3 border-b text-left w-[20%] whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableData.map((item, index) => (
                      <tr key={item.iremainder_id} className="bg-white hover:bg-blue-50 transition duration-150 ease-in-out"> 
                        <td className="px-4 py-3 border-b text-center font-medium align-top">{index + 1}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.cremainder_content}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.created_by}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.assigned_to}</td>
                        <td className="px-4 py-3 border-b align-top break-words">{item.lead_name}</td>
                        <td className="px-4 py-3 border-b align-top whitespace-nowrap">{formatDateTime(item.dremainder_dt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336',
            color: 'white',
            fontWeight: 600,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CalendarView;