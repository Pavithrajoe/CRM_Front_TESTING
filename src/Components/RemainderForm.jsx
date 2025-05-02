import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const employees = [
  {
    id: 1,
    name: "Shivakumar",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Priya Mehra",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    name: "Rahul Singh",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
  },
  {
    id: 4,
    name: "Sneha Reddy",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
];

const RemainderForm = () => {
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (status) => {
    setForm((prev) => ({ ...prev, status }));

    const data = {
      ...form,
      status,
    };

    // Here you'd call your API
    console.log("Sending data:", data);

    toast.success(status === "submitted" ? "Successfully Submitted" : "Saved as Draft");
  };

  const selectedEmployee = employees.find((e) => e.id === parseInt(form.assignedTo));

  return (
    <div className="p-6 max-w-xl mx-auto">
      <ToastContainer position="top-right" autoClose={2000} />
      <h2 className="font-semibold text-lg mt-5 mb-4">New Remainder</h2>

      <label className="block text-sm mb-5">Project Title</label>
      <input
        className="w-full border p-2 mb-4 rounded bg-[#EEEEEE]"
        placeholder="Enter your project title"
        name="title"
        value={form.title}
        onChange={handleChange}
      />

      <label className="block text-sm mb-5 ">Description</label>
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
          <label className="text-sm block mb-5">Assigned To</label>
          <div className="relative">
            <select
              name="assignedTo"
              className="border p-2 pr-8 mb-5 rounded w-full bg-[#EEEEEE]"
              value={form.assignedTo}
              onChange={handleChange}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>

            <div className="absolute top-2 right-2 pointer-events-none">▼</div>
          </div>
          <div className="flex items-center mb-5 gap-2 mt-2">
            <img
              src={selectedEmployee.avatar}
              alt={selectedEmployee.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm">{selectedEmployee.name}</span>
          </div>
        </div>

        <div>
          <label className="text-sm block mb-5">Date</label>
          <input
            type="date"
            name="date"
            className="border p-2 rounded w-40 bg-[#EEEEEE]"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-sm block mb-5">Time</label>
          <input
            type="time"
            name="time"
            className="border p-2 rounded w-28 bg-[#EEEEEE]"
            value={form.time}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex gap-4 mb-5">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="forMe"
            checked={form.forMe}
            onChange={handleChange}
          />
          For Me
        </label>
        <label className="flex items-center gap-1">
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
          className="bg-white border px-6 py-2 rounded"
          onClick={() => handleSubmit("draft")}
        >
          Save as Draft
        </button>
        <button
          className="bg-black text-white px-6 py-2 rounded"
          onClick={() => handleSubmit("submitted")}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default RemainderForm;
