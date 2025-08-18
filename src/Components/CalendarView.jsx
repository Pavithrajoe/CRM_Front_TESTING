import React, { useState, useEffect, useRef } from 'react';
import { FaCheckSquare, FaRegSquare, FaUserAlt, FaClock, FaPlus, FaChevronLeft, FaChevronRight, FaMicrophone } from 'react-icons/fa';
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
      setSnackbar({
        open: true,
        message: `Speech recognition error: ${event.error}`,
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

  // Add the missing handleSubmit function
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
        <div className={`fixed top-0 right-0 h-full w-[50%] sm:w-[400px] md:w-[360px] bg-white rounded-l-2xl shadow-2xl z-50 transition-all duration-500 ease-in-out transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
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
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date<span className="text-red-500">*</span></label>
                <DateTimePicker
                  value={formData.devent_end}
                  onChange={(newValue) => setFormData({ ...formData, devent_end: newValue })}
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
                      className: 'w-full',
                    },
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Recurring Task</label>
                <select
                  name="recurring_task"
                  value={formData.recurring_task ?? ""}
                  onChange={(e) => setFormData({ ...formData, recurring_task: e.target.value === "" ? null : e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">None</option>
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
  const [msg, setMsg] = useState('');
  const [reminderList, setReminderList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [activeTab, setActiveTab] = useState('reminders');
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showEnded, setShowEnded] = useState(false);

  useEffect(() => {
    const user_data = localStorage.getItem("user");
    if (user_data) {
      try {
        const user_data_parsed = JSON.parse(user_data);
        setLoggedInUserName(user_data_parsed.cUser_Name);
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
      }
    }
  }, []);

  const fetchRemindersAndEventsForSelectedDate = async (date = selectedDate) => {
    const user_data = localStorage.getItem("user");
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
    } catch (e) {
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

  const filterAndSortItems = (items, dateKey, contentKey, endTimeKey = null, showEndedState, applyDateFilters) => {
    const now = new Date();

    const filtered = items.filter((item) => {
      const searchMatch =
        (item?.[contentKey]?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item?.created_by?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item?.assigned_to?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item?.lead_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item?.ctitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item?.cdescription?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item?.recurring_task?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const itemStartDateTime = new Date(item[dateKey]);
      const itemEndDateTime = endTimeKey && item[endTimeKey] ? new Date(item[endTimeKey]) : itemStartDateTime;

      let dateRangeMatch = true;
      let timeStatusMatch = true;

      if (applyDateFilters) {
        const from = fromDate ? getStartOfDayInLocalTime(fromDate) : null;
        const to = toDate ? getEndOfDayInLocalTime(toDate) : null;

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

  const currentTabItems = activeTab === 'reminders'
    ? filterAndSortItems(reminderList, 'dremainder_dt', 'cremainder_content', null, showEnded, true)
    : filterAndSortItems(calendarEvents, 'devent_startdt', 'ctitle', 'devent_end', false, false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedCurrentItems = currentTabItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentTabItems.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleItemCreated = () => {
    fetchRemindersAndEventsForSelectedDate();
    fetchAllUserReminders();
  };

  useEffect(() => {
    fetchRemindersAndEventsForSelectedDate();
  }, [selectedDate]);

  useEffect(() => {
    fetchAllUserReminders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, showEnded, searchTerm, fromDate, toDate, reminderList, calendarEvents]);

  return (
    <div>
      <div className="flex w-full p-8 rounded-3xl bg-white/80 backdrop-blur-md shadow-xl shadow-black/10 hover:scale-[1.01] transition-transform duration-300">
        <div className="w-1/2 flex flex-col mb-1 mr-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 transition-transform duration-300 hover:scale-[1.01]">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              className="border-none w-full"
              navigationLabel={({ date, view, label }) => (
                <div className="flex items-center justify-between px-6 mb-2">
                  <FaChevronLeft
                    className="text-gray-600 hover:text-black cursor-pointer transition"
                    onClick={() => setSelectedDate(prevDate => {
                      const newDate = new Date(prevDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      return newDate;
                    })}
                  />
                  <span className="text-xl font-semibold text-gray-800">
                    {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
                  </span>
                  <FaChevronRight
                    className="text-gray-600 hover:text-black cursor-pointer transition"
                    onClick={() => setSelectedDate(prevDate => {
                      const newDate = new Date(prevDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      return newDate;
                    })}
                  />
                </div>
              )}
              prevLabel={null}
              nextLabel={null}
              tileClassName={({ date }) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selected = new Date(selectedDate);
                selected.setHours(0, 0, 0, 0);

                const tile = new Date(date);
                tile.setHours(0, 0, 0, 0);

                if (tile.getTime() === selected.getTime()) {
                  return 'bg-black text-white rounded-full';
                } else if (tile.getTime() === today.getTime()) {
                  return 'text-blue-600 font-bold';
                }
                return 'hover:bg-gray-200 transition rounded-full';
              }}
            />

            <div className="flex gap-4 mt-6 justify-center">
              <button
                onClick={() => setOpenDrawer(true)}
                className="w-[180px] bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-xl flex items-center justify-center shadow-md transition"
              >
                <FaPlus className="mr-2" />
                Calendar Event
              </button>

              <button
                onClick={() => window.open("https://meet.google.com/landing", "_blank")}
                className="w-[200px] bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-xl flex items-center justify-center shadow-md transition"
              >
                <b className="text-white font-bold mr-1">G</b>
                <span>Create Meet</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[395px] overflow-y-auto bg-white rounded-2xl shadow-lg p-6 space-y-6 pr-2 w-1/2 transition-transform duration-300 hover:scale-[1.01]">
          <h2 className="text-xl font-bold text-gray-800">Reminders for {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</h2>
          <div className="flex gap-6 text-sm mb-4 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Reminder
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Calendar Event
            </div>
          </div>

          {reminders.length > 0 ? (
            reminders.map(reminder => (
              <div key={reminder.iremainder_id} className="border-b pb-4 last:border-0 transition-all">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleReminder(reminder.iremainder_id)}
                    className="text-gray-400 hover:text-black transition mt-1"
                  >
                    {reminder.bactive ? (
                      <FaCheckSquare className="text-black text-lg" />
                    ) : (
                      <FaRegSquare className="text-lg" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <h3 className="text-md font-semibold text-gray-800">{reminder.cremainder_title}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUserAlt className="mr-2 text-xs" />
                      Assigned To: <span className="font-medium">{reminder.assigned_to}</span>
                    </div>
                    <p className="text-sm text-gray-600">{reminder.cremainder_content}</p>
                    <div
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold
                      ${reminder.priority === 'High'
                          ? 'bg-red-100 text-red-800'
                          : reminder.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                    >
                      Priority: {reminder.priority}
                    </div>
                  </div>

                  <div className="text-xs text-black bg-yellow-400 px-3 py-1 rounded-full flex items-center">
                    <FaClock className="mr-1" />
                    {new Date(reminder.dremainder_dt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reminders found for this date.</p>
          )}

          <h2 className="text-xl font-bold text-gray-800 pt-2">Calendar Events for {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</h2>
          {calendarEvents.length > 0 ? (
            calendarEvents.map(event => (
              <div key={event.icalender_event} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">{event.ctitle}</h3>
                    <p className="text-sm text-gray-600">{event.cdescription}</p>
                  </div>
                  <div className="text-xs text-white bg-blue-600 px-3 py-1 rounded-full flex items-center">
                    <FaClock className="mr-1" />
                    {new Date(event.devent_startdt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }).toUpperCase()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No calendar events for this date.</p>
          )}
        </div>

        <MeetFormDrawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          selectedDate={selectedDate}
          setSnackbar={setSnackbar}
          onCreated={handleItemCreated}
        />
      </div>

      <div className="w-full rounded-xl p-5 bg-white shadow-sm border border-gray-200 mt-10">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 text-lg font-semibold ${activeTab === 'reminders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
              } transition-colors duration-200`}
            onClick={() => {
              setActiveTab('reminders');
            }}
          >
            📅 All Reminders
          </button>
          <button
            className={`py-3 px-6 text-lg font-semibold ${activeTab === 'calendarEvents' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
              } transition-colors duration-200`}
            onClick={() => {
              setActiveTab('calendarEvents');
            }}
          >
            🗓️ All Calendar Events
          </button>
        </div>

        {activeTab === 'reminders' && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-5">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label htmlFor="search" className="text-gray-700 font-medium text-sm">
                Search:
              </label>
              <input
                type="search"
                id="search"
                className="w-full md:w-60 px-3 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder-gray-400 text-gray-900 transition duration-150 shadow-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <label className="text-gray-700 font-medium text-sm">From:</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />

              <label className="text-gray-700 font-medium text-sm">To:</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
                value={toDate || ''}
                onChange={(e) => {
                  const newToDate = e.target.value;
                  if (fromDate && new Date(newToDate) < new Date(fromDate)) {
                    setSnackbar({
                      open: true,
                      message: 'To date should be after From date',
                      severity: 'error',
                    });
                    setToDate('');
                    return;
                  }
                  setToDate(newToDate);
                }}
              />

              <button
                className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                title="Clear Dates"
              >
                Clear
              </button>

              <button
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                onClick={() => setShowEnded(!showEnded)}
              >
                {showEnded ? 'Show Upcoming' : 'Show Ended'}
              </button>
            </div>
          </div>
        )}

        {(fromDate || toDate) && activeTab === 'reminders' && (
          <p className="text-xs text-blue-600 mb-4 font-medium tracking-wide">
            Filter:{' '}
            {fromDate && <strong>{new Date(fromDate).toLocaleDateString('en-GB')}</strong>}
            {fromDate && toDate && ' to '}
            {toDate && <strong>{new Date(toDate).toLocaleDateString('en-GB')}</strong>}
          </p>
        )}

        {paginatedCurrentItems.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-xs">
            <table className="min-w-full text-sm text-gray-800 table-auto">
              <thead className="bg-gray-50 uppercase text-xs font-semibold tracking-wide">
                <tr>
                  <th className="px-4 py-3 border-b text-center w-[60px]">S.no</th>
                  {activeTab === 'reminders' ? (
                    <>
                      <th className="px-4 py-3 border-b text-left w-[25%]">Reminder</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Created by</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Assigned to</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Lead</th>
                      <th className="px-4 py-3 border-b text-left w-[20%] whitespace-nowrap">Date</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 border-b text-left w-[20%]">Event Title</th>
                      <th className="px-4 py-3 border-b text-left w-[30%]">Description</th>
                      <th className="px-4 py-3 border-b text-left w-[15%]">Recurring Task</th>
                      <th className="px-4 py-3 border-b text-left w-[15%] whitespace-nowrap">Start Date</th>
                      <th className="px-4 py-3 border-b text-left w-[15%] whitespace-nowrap">End Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedCurrentItems.map((item, index) => (
                  <tr
                    key={activeTab === 'reminders' ? item.iremainder_id : item.icalender_event}
                    className="bg-white hover:bg-blue-50 transition duration-150 ease-in-out"
                  >
                    <td className="px-4 py-3 border-b text-center font-medium align-top">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    {activeTab === 'reminders' ? (
                      <>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.cremainder_content}
                        </td>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.created_by}
                        </td>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.assigned_to}
                        </td>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.lead_name}
                        </td>
                        <td className="px-4 py-3 border-b align-top whitespace-nowrap">
                          {new Date(item.dremainder_dt).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.ctitle}
                        </td>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.cdescription || 'N/A'}
                        </td>
                        <td className="px-4 py-3 border-b align-top break-words">
                          {item.recurring_task || 'None'}
                        </td>
                        <td className="px-4 py-3 border-b align-top whitespace-nowrap">
                          {new Date(item.devent_startdt).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 border-b align-top whitespace-nowrap">
                          {new Date(item.devent_end).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex justify-end p-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 mx-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 mx-1 rounded-md ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 mx-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[180px] flex items-center justify-center text-gray-400 text-base font-medium">
            <p>No {showEnded && activeTab === 'reminders' ? 'ended' : 'upcoming'} {activeTab === 'reminders' ? 'reminders' : 'calendar events'} found.</p>
          </div>
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