import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { X } from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
const apiEndPoint = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");

const ReminderForm = () => {
  const { leadId } = useParams();
  const [showForm, setShowForm] = useState(false);
  const [reminderList, setReminderList] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    reminderDate: "",
    time: "",
    priority: "",
    assignt_to: "",
    ilead_id: leadId,
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const remindersPerPage = 5; // Limit to 5 reminders per page

  useEffect(() => {
    // Fetch reminders from the API when the component mounts or leadId changes
    getRemainder();
  }, [leadId]);

  useEffect(() => {
    // Fetch users for the "Assign to" field
    fetchUsers();
  }, []);

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiEndPoint}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  // Fetch reminders for the given leadId
  const getRemainder = async () => {
    try {
      const response = await fetch(
        `${apiEndPoint}/reminder/getremainder/${leadId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setReminderList(data.message);
    } catch (error) {
      toast.error("Failed to fetch reminders.");
    }
  };

  // Pagination: Calculate which reminders to show based on the current page
  const indexOfLastReminder = currentPage * remindersPerPage;
  const indexOfFirstReminder = indexOfLastReminder - remindersPerPage;
  const currentReminders = reminderList.slice(
    indexOfFirstReminder,
    indexOfLastReminder
  );

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    // Validation and API call for submitting the reminder
  };

  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          + Add Reminder
        </button>
      </div>

      {/* Reminder Listing */}
      <div className="flex flex-col divide-y divide-gray-200 bg-white rounded-md shadow-sm">
        {currentReminders.length === 0 ? (
          <div>No reminders found</div>
        ) : (
          currentReminders.map((reminder) => (
            <div key={reminder.iremainder_id} className="mb-5">
              <div className="py-4 px-6 hover:bg-gray-50 transition duration-150">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">
                      Title: {reminder.cremainder_title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {reminder.cremainder_content}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      Created by:{" "}
                      <span className="font-medium">{reminder.created_by}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p className="font-medium text-blue-700">{reminder.dremainder}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded-md text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="mx-4 text-sm text-gray-600">
          Page {currentPage} of {Math.ceil(reminderList.length / remindersPerPage)}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === Math.ceil(reminderList.length / remindersPerPage)}
          className="px-4 py-2 bg-gray-300 rounded-md text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setShowForm(false)}
        />
      )}

      {/* Slide-in Form */}
      <div
        className={`fixed top-0 right-0 w-full max-w-xl h-full bg-white shadow-xl z-50 transition-transform duration-500 ${
          showForm ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full overflow-y-auto relative">
          <button
            className="absolute top-4 right-4 text-gray-600 hover:text-black"
            onClick={() => setShowForm(false)}
          >
            <X size={24} />
          </button>

          <h2 className="font-semibold text-lg mt-5 mb-4">New Reminder</h2>
          <form onSubmit={(e) => handleSubmit(e, "submitted")}>
            {/* Form fields */}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              className="bg-white border px-6 py-2 rounded disabled:opacity-50"
              disabled={submitting}
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
              disabled={submitting}
            >
              Submit Reminder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReminderForm;
