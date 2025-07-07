import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Search, Filter } from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";

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
  const [formErrors, setFormErrors] = useState({});

  const [isListeningContent, setIsListeningContent] = useState(false);
  const [noteContent, setNoteContent] = useState(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    reminderDate: "",
    time: "",
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
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      setForm((prevForm) => ({
        ...prevForm,
        reminderDate: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
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

  const validateForm = () => {
  const errors = {};

  if (!form.title) errors.title = "Title is required";
  if (!form.content) errors.content = "Description is required";
  if (!form.reminderDate) errors.reminderDate = "Date is required";
  if (!form.time) errors.time = "Time is required";
  if (!form.assignt_to) errors.assignt_to = "Assign To is required";

  setFormErrors(errors); // set errors to state

  if (Object.keys(errors).length > 0) {
    toast.error("Please fill in all required fields.");
    return false;
  }

  const selectedDateTime = new Date(`${form.reminderDate}T${form.time}`);
  const now = new Date();
  if (selectedDateTime < now) {
    toast.error("Reminder date and time must be in the future.");
    return false;
  }

  return true;
};

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const data = { ...form, status };
    data.reminderDate = new Date(
      `${form.reminderDate}T${form.time}`
    ).toISOString();
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
        reminderDate: "",
        time: "",
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
      } else {
        toast.error("Failed to fetch reminders");
      }
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
    <div className="relative min-h-screen bg-[#f8f8f8] p-6 font-sans text-base leading-relaxed text-gray-900">
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <Search className="text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterModal(true)}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <Filter size={20} color="white" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-md hover:bg-blue-700 transition"
          >
            + Add Reminder
          </button>
        </div>
      </div>

      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-medium text-gray-800">Filter by Date</h2>
            <label className="block text-sm text-gray-700">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="block text-sm text-gray-700">
              To
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  resetFilters();
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  applyFilters();
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
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
              className="py-5 px-6 hover:bg-gray-50 transition duration-150 rounded-2xl"
            >
              <div className="flex justify-between items-start">
                <div>
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
                <div className="text-right text-sm text-gray-600 whitespace-nowrap">
                  <p className="font-medium text-blue-700">
                    {(() => {
                      const d = new Date(reminder.dremainder_dt);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = d.getFullYear();
                      const hours = String(d.getHours()).padStart(2, "0");
                      const minutes = String(d.getMinutes()).padStart(2, "0");
                      const seconds = String(d.getSeconds()).padStart(2, "0");
                      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
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
          <div className="fixed top-0 right-0 w-full max-w-xl h-full bg-white shadow-xl z-50 transition-transform duration-500 rounded-l-3xl">
            <div className="p-6 h-full overflow-y-auto relative">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-black"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
              <h2 className="font-semibold text-lg mt-5 mb-6">New Reminder</h2>

              <form onSubmit={(e) => handleSubmit(e, "submitted")}>
                <label className="block text-sm mb-2 font-semibold text-gray-700">
                  Title<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mb-6">
                  <input
                    className="flex-grow border border-gray-300 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Enter reminder title"
                  />
                </div>

                <label className="block text-sm mb-2 font-semibold text-gray-700">
                  Description<span className="text-red-500">*</span>
                </label>
                <div className="relative mb-6">
                  <textarea
                    className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition h-28 resize-none pr-14"
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

                <label className="block text-sm mb-2 font-semibold text-gray-700">
                  Priority
                </label>
                <select
                  name="priority"
                  className="w-full border border-gray-300 p-3 mb-6 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700">
                    Assign To
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
                      className="text-sm text-gray-700 cursor-pointer select-none"
                    >
                      Assign to me
                    </label>
                  </div>
                </div>

                <select
                  name="assignt_to"
                  className="w-full border border-gray-300 p-3 mb-6 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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

                <label className="block text-sm mb-2 font-semibold text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 p-3 mb-6 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  name="reminderDate"
                  value={form.reminderDate}
                  onChange={handleChange}
                  required
                />

                <label className="block text-sm mb-4 font-semibold text-gray-700">
                  Time *
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 p-3 mb-8 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                />

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition font-semibold"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Reminder"}
                  </button>
                  {/* <button
                    type="button"
                    onClick={(e) => handleSubmit(e, "draft")}
                    className="bg-gray-300 text-gray-800 px-6 py-3 rounded-full hover:bg-gray-400 transition font-semibold"
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