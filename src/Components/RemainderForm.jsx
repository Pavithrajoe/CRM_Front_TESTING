import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const employees = [
  { id: 1, name: "Shivakumar", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 2, name: "Priya Mehra", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: 3, name: "Rahul Singh", avatar: "https://randomuser.me/api/portraits/men/12.jpg" },
  { id: 4, name: "Sneha Reddy", avatar: "https://randomuser.me/api/portraits/women/65.jpg" },
];

const ReminderForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    forMe: false,
    followUp: false,
    assignedTo: employees[0].id,
    status: "",
  });

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

  const handleSubmit = async (status) => {
    setSubmitting(true);
    const data = { ...form, status };

    try {
      // Replace this URL with your API endpoint
      const response = await axios.post("https://your-api-url.com/reminders", data);

      if (response.status === 200) {
        toast.success(status === "submitted" ? "Successfully Submitted" : "Saved as Draft");

        setReminders((prev) => [...prev, data]);

        setTimeout(() => {
          setShowForm(false);
          setIsNewUser(false);
          setForm({
            title: "",
            description: "",
            date: "",
            time: "",
            forMe: false,
            followUp: false,
            assignedTo: employees[0].id,
            status: "",
          });
          setSubmitting(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit the form. Please try again.");
      setSubmitting(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === parseInt(form.assignedTo));

  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={2000} />

      {reminders.length === 0 && isNewUser && !showForm ? (
        <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center max-w-xl mx-auto mt-20">
          <img src="/images/nav/calender.png" alt="No reminders" className="mx-auto mb-4 w-12" />
          <p className="text-gray-700 font-medium mb-4">No reminders are<br />present at this time.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center mx-auto hover:bg-gray-800"
          >
            <span className="mr-2 text-xl font-bold">+</span> New Reminder
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowForm(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              + New Reminder
            </button>
          </div>

          <div className="grid gap-4">
            {reminders.map((item, index) => {
              const assigned = employees.find(e => e.id === parseInt(item.assignedTo));
              return (
                <div key={index} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold truncate">{item.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Date: {item.date} | Time: {item.time}
                  </div>
                  <div className="flex items-center mt-2 gap-2 text-xs text-gray-500">
                    <img src={assigned?.avatar} alt={assigned?.name} className="w-6 h-6 rounded-full" />
                    Assigned: {assigned?.name}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Overlay click to close */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setShowForm(false)}
        />
      )}

      {/* Slide-in Form */}
      <div className={`fixed top-0 right-0 w-full max-w-xl h-full bg-white shadow-xl z-50 transition-transform duration-500 ${showForm ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full overflow-y-auto">
          <h2 className="font-semibold text-lg mt-5 mb-4">New Reminder</h2>

          <label className="block text-sm mb-2">Project Title *</label>
          <input
            className="w-full border p-2 mb-4 rounded bg-[#EEEEEE]"
            placeholder="Enter your project title"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={100}
          />

          <label className="block text-sm mb-2">Description *</label>
          <textarea
            className="w-full border p-2 mb-4 rounded h-24 bg-[#EEEEEE]"
            placeholder="Write your description here……"
            name="description"
            maxLength={300}
            value={form.description}
            onChange={handleChange}
          />

          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="text-sm block mb-2">Assigned To</label>
              <select
                name="assignedTo"
                className="border p-2 mb-2 rounded w-full bg-[#EEEEEE]"
                value={form.assignedTo}
                onChange={handleChange}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center mb-4 gap-2">
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm">{selectedEmployee.name}</span>
              </div>
            </div>

            <div>
              <label className="text-sm block mb-2">Date *</label>
              <input
                type="date"
                name="date"
                className="border p-2 rounded w-40 bg-[#EEEEEE]"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm block mb-2">Time *</label>
              <input
                type="time"
                name="time"
                className="border p-2 rounded w-28 bg-[#EEEEEE]"
                value={form.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-4 mb-5">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="forMe"
                checked={form.forMe}
                onChange={handleChange}
              />
              For Me
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="followUp"
                checked={form.followUp}
                onChange={handleChange}
              />
              Follow Up
            </label>
          </div>

          <div className="flex justify-center items-center gap-4">
            <button
              className="bg-white border px-6 py-2 rounded disabled:opacity-50"
              disabled={submitting}
              onClick={() => handleSubmit("draft")}
            >
              Save as Draft
            </button>
            <button
              className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
              disabled={submitting}
              onClick={() => handleSubmit("submitted")}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderForm;
