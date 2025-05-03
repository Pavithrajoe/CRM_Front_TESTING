import React, { useState } from 'react';

const MeetFormDrawer = ({ open, onClose, selectedDate, onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    time: '',
    leadId: '',
    employeeId: ''
  });

  const [loading, setLoading] = useState(false);  // Loading state for form submission
  const [error, setError] = useState(null);       // Error state for handling API issues

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);  // Start loading state

    try {
      const date = selectedDate.toISOString().split('T')[0];
      const startTime = new Date(`${date}T${form.time}`);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes duration

      // Step 1: Create Google Meet
      const meetRes = await fetch('/api/createMeet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startTime,
          endTime
        })
      });

      if (!meetRes.ok) {
        throw new Error('Failed to create Google Meet');
      }

      const { meetLink } = await meetRes.json();
      console.log('Google Meet created:', meetLink);

      // Step 2: Create Reminder with Meet link
      const reminderRes = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          date,
          time: form.time,
          meetLink
        })
      });

      if (!reminderRes.ok) {
        throw new Error('Failed to create reminder');
      }

      const reminderData = await reminderRes.json();
      console.log('Reminder created:', reminderData);

      // Close the drawer and notify the parent component to refresh reminders
      onCreated(selectedDate);
      onClose();
    } catch (error) {
      console.error('Error during meet and reminder creation:', error);
      setError(error.message);  // Set error message in state
    } finally {
      setLoading(false);  // Stop loading state
    }
  };

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl p-6 z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Create Google Meet</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-red-500 text-2xl font-bold">×</button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-600 p-2 rounded mb-4">
          {error} {/* Display error if there's any */}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="time"
          type="time"
          value={form.time}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="leadId"
          placeholder="Lead ID"
          value={form.leadId}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="employeeId"
          placeholder="Employee ID"
          value={form.employeeId}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Meet'}
        </button>
      </form>
    </div>
  );
};

export default MeetFormDrawer;
