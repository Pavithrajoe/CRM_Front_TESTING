import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Search, Filter } from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const apiEndPoint = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");

// Speech recognition setup is only needed for content now
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();

mic.continuous = true;
mic.interimResults = true;
mic.lang = "en-US";

const ReminderForm = () => {
  const { leadId } = useParams();
  const [showForm, setShowForm] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [users, setUsers] = useState([]);
  const [reminderList, setReminderList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [assignToMe, setAssignToMe] = useState(false);

  const [isListeningContent, setIsListeningContent] = useState(false);
  const [noteContent, setNoteContent] = useState(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    reminderDateTime: new Date(), // Initialize with current date/time
    priority: "Normal",
    assignt_to: "",
    ilead_id: Number(leadId),
  });

  const contentInputRef = useRef(null);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const userObject = JSON.parse(userString);
        if (userObject && userObject.iUser_id && userObject.cFull_name) {
          setLoggedInUserId(userObject.iUser_id);
          setLoggedInUserName(userObject.cFull_name);
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    }
  }, []);

  // Set current date and time when the form is shown
  useEffect(() => {
    if (showForm) {
      setForm(prevForm => ({
        ...prevForm,
        reminderDateTime: new Date() // Sets to current date/time
      }));
    }
  }, [showForm]);

  useEffect(() => {
    if (isListeningContent) {
      mic.start();
      mic.onend = () => {
        if (isListeningContent) mic.start();
      };
    } else {
      mic.stop();
      mic.onend = () => {};
    }

    mic.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");

      if (isListeningContent) {
        setNoteContent(transcript);
        setForm((prevForm) => ({
          ...prevForm,
          content: transcript,
        }));
      }
    };

    mic.onerror = (event) => {
      toast.error(`Speech recognition error: ${event.error}`);
      setIsListeningContent(false);
    };

    return () => {
      mic.stop();
    };
  }, [isListeningContent]);

  const toggleListening = (field) => {
    if (field === "content") {
      setIsListeningContent((prevState) => !prevState);
    }
  };

  useEffect(() => {
    const newUserFlag = localStorage.getItem("isNewUser");
    setIsNewUser(newUserFlag !== "false");
  }, []);

  useEffect(() => {
    localStorage.setItem("isNewUser", isNewUser ? "true" : "false");
  }, [isNewUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAssignToMeChange = (e) => {
    const checked = e.target.checked;
    setAssignToMe(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        assignt_to: loggedInUserId,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        assignt_to: "",
      }));
    }
  };
  const formatDateTime = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours} ${minutes} ${seconds}`;
  };

  const validateForm = () => {
    if (!form.title || !form.content || !form.reminderDateTime) {
      toast.error("Please fill in all required fields (Title, Description, Date & Time).");
      return false;
    }

    if (form.reminderDateTime < new Date()) {
      toast.error("Reminder date and time must be in the future.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e, status) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    const data = {
      ...form,
      reminderDate: form.reminderDateTime.toISOString(),
      status
    };
    data.assignt_to = Number(form.assignt_to);

    try {
      const response = await fetch(`${apiEndPoint}/reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || (result.data && result.data.error)) {
        toast.error(
          `Error: ${result.data?.error || result.message || "Could not add reminder"}`
        );
        return;
      }

      setForm({
        title: "",
        content: "",
        reminderDateTime: new Date(),
        priority: "Normal",
        assignt_to: "",
        ilead_id: Number(leadId),
      });
      setNoteContent(null);
      setAssignToMe(false);
      toast.success(
        status === "submitted" ? "Reminder submitted" : "Saved as draft"
      );
      getReminder();
      setShowForm(false);
    } catch (err) {
      toast.error("Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getReminder = async () => {
    try {
      const response = await fetch(
        `${apiEndPoint}/reminder/get-reminder/${leadId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setReminderList(data.message);
      }
      // else {
      //   toast.error("Failed to fetch reminders");
      // }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiEndPoint}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    getReminder();
    fetchUsers();
  }, []);

  const applyFilters = useCallback(() => {
    setReminderList((prev) => [...prev]);
  }, []);

  const resetFilters = useCallback(() => {
    setFromDate("");
    setToDate("");
    setReminderList((prev) => [...prev]);
  }, []);

  const filteredReminders = reminderList.filter((reminder) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      reminder.cremainder_title.toLowerCase().includes(lowerCaseSearchTerm) ||
      reminder.cremainder_content.toLowerCase().includes(lowerCaseSearchTerm) ||
      reminder.priority.toLowerCase().includes(lowerCaseSearchTerm) ||
      reminder.assigned_to.toLowerCase().includes(lowerCaseSearchTerm);

    const reminderDate = new Date(reminder.dremainder_dt);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    const matchesDate =
      (!from || reminderDate >= from) && (!to || reminderDate <= to);

    return matchesSearch && matchesDate;
  });


  return (
    <div className="relative min-h-screen bg-[#f8f8f8] p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12 w-full  font-sans text-base leading-relaxed text-gray-900 mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm w-[80%] sm:w-auto flex-grow">
          <Search className="text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowFilterModal(true)}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out flex-shrink-0"
            aria-label="Filter Reminders"
          >
            <Filter size={20} color="white" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full shadow-md hover:bg-blue-700 transition duration-150 ease-in-out flex-shrink-0 text-sm sm:text-base"
          >
            + Add Reminder
          </button>
        </div>
      </div>

      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm sm:max-w-md space-y-4">
            <h2 className="text-lg font-medium text-gray-800">Filter by Date</h2>
            <label className="block text-sm text-gray-700">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              />
            </label>
            <label className="block text-sm text-gray-700">
              To
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              />
            </label>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  resetFilters();
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition duration-150 ease-in-out text-sm"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-150 ease-in-out text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  applyFilters();
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition duration-150 ease-in-out text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder List */}
      <div className="flex flex-col divide-y divide-gray-200 bg-white rounded-3xl shadow-md overflow-hidden">
        {filteredReminders.length === 0 ? (
          <div className="text-center p-6 text-gray-500 font-medium">
            No reminders match your criteria.
          </div>
        ) : (
          filteredReminders.map((reminder) => (
            <div
              key={reminder.iremainder_id}
              className="py-5 px-4 sm:px-6 hover:bg-gray-50 transition duration-150 rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-3 sm:mb-0">
                  <h3 className="text-md font-semibold text-gray-900">
                    📌 {reminder.cremainder_title}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                    {reminder.cremainder_content}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Created by:{" "}
                    <span className="font-semibold">{reminder.created_by}</span>
                  </div>
                  <div className="text-xs mt-1 text-gray-600">
                    Priority:{" "}
                    <span className="font-semibold">
                      {reminder.priority || "Normal"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Assigned to:{" "}
                    <span className="font-semibold">{reminder.assigned_to}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-sm text-gray-600 whitespace-nowrap">
                  <p className="font-medium text-blue-700">
                    {(() => {
                      const d = new Date(reminder.dremainder_dt);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = d.getFullYear();
                      const hours = String(d.getHours()).padStart(2, "0");
                      const minutes = String(d.getMinutes()).padStart(2, "0");
                      const seconds = String(d.getSeconds()).padStart(2, "0");
                      return `${day}/${month}/${year} ${hours} ${minutes} ${seconds}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reminder Form Drawer */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed top-0 right-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/3 2xl:max-w-xl h-[100vh] bg-white shadow-xl z-50 transition-transform duration-500 rounded-l-3xl">
            <div className="p-6 h-[100vh] overflow-y-scroll relative">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-black"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
              <h2 className="font-semibold text-lg sm:text-xl mt-5 mb-6">New Reminder</h2>

              <form onSubmit={(e) => handleSubmit(e, "submitted")}>
                <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mb-6">
                  <input
                    className="flex-grow border border-gray-300 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Enter reminder title"
                  />
                </div>

                <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-6">
                  <textarea
                    className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition h-28 resize-none pr-14 text-sm sm:text-base"
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    required
                    maxLength={300}
                    ref={contentInputRef}
                    placeholder="Enter description"
                  />
                  <button
                    type="button"
                    onClick={() => toggleListening("content")}
                    className={`absolute top-2 right-2 px-3 py-1 rounded-full text-white text-sm select-none ${
                      isListeningContent
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-red-500 hover:bg-blue-900"
                    } transition`}
                    aria-label={
                      isListeningContent
                        ? "Stop listening to description"
                        : "Start listening to description"
                    }
                  >
                    {isListeningContent ? (
                      <>
                        <span className="animate-pulse">🎙️</span> Stop
                      </>
                    ) : (
                      <>
                        <span>🎙️</span>
                      </>
                    )}
                  </button>
                </div>
                {isListeningContent && (
                  <p className="text-gray-600 text-sm italic -mt-4 mb-6 select-none">
                    Listening for description...
                  </p>
                )}

                <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  className="w-full border border-gray-300 p-3 mb-6 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm sm:text-base font-semibold text-gray-700">
                    Assign To <span className="text-red-500">*</span>
                  </label>
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
                      Assign to me
                    </label>
                  </div>
                </div>

                <select
                  name="assignt_to"
                  className="w-full border border-gray-300 p-3 mb-6 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
                  value={form.assignt_to}
                  onChange={handleChange}
                  disabled={assignToMe}
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.iUser_id} value={user.iUser_id}>
                      {user.cFull_name}
                    </option>
                  ))}
                </select>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <div className="mb-6">
                    <label className="block text-sm sm:text-base mb-2 font-semibold text-gray-700">
                      Date & Time <span className="text-red-500">*</span>
                    </label>
                    <DateTimePicker
                      value={form.reminderDateTime}
                      onChange={(newValue) =>
                        setForm(prev => ({ ...prev, reminderDateTime: newValue }))
                      }
                      minDateTime={new Date()}
                      format="dd/MM/yyyy HH mm ss"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          className: 'bg-gray-50 text-sm sm:text-base',
                          inputProps: {
                            className: 'p-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition'
                          }
                        },
                      }}
                      className="w-full"
                    />
                  </div>
                </LocalizationProvider>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition font-semibold w-full sm:w-auto text-sm sm:text-base"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Reminder"}
                  </button>
                  {/* <button
                    type="button"
                    onClick={(e) => handleSubmit(e, "draft")}
                    className="bg-gray-300 text-gray-800 px-6 py-3 rounded-full hover:bg-gray-400 transition font-semibold w-full sm:w-auto text-sm sm:text-base"
                    disabled={submitting}
                  >
                    Save as Draft
                  </button> */}
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReminderForm;