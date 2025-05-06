// components/ReminderFormDrawer.js
import React from 'react';

const ReminderFormDrawer = ({
  showForm,
  form,
  handleChange,
  handleSubmit,
  submitting,
  employees,
  selectedEmployee,
  onClose
}) => {
  return (
    <div className={`fixed top-0 right-0 w-full max-w-xl h-full bg-white shadow-xl z-50 transition-transform duration-500 ${showForm ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 h-full overflow-y-auto">
        <h2 className="font-semibold text-lg mt-5 mb-4">New Reminder</h2>


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

        <button
          className="absolute top-4 right-4 text-black text-lg"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ReminderFormDrawer;
