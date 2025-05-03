import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import MeetFormDrawer from '@/components/GoogleMeet';
import { FaUserAlt, FaClock, FaFileAlt } from 'react-icons/fa';

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [openDrawer, setOpenDrawer] = useState(false);

  const fetchReminders = async (date = selectedDate) => {
    const res = await fetch(`/api/reminders?date=${date.toISOString().split('T')[0]}`);
    const data = await res.json();
    setReminders(data);
  };

  useEffect(() => {
    fetchReminders();
  }, [selectedDate]);

  return (
    <div className="flex p-4 gap-4">
      {/* Left Panel */}
      <div className="bg-white p-4 rounded shadow w-1/2">
        <Calendar onChange={setSelectedDate} value={selectedDate} />
        <button
          className=" flex ms-[190px] mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 w-[150px]"
          onClick={() => setOpenDrawer(true)}
        >
          + Create Meet
        </button>
      </div>

      {/* Right Panel */}
      <div className="flex-1">
        <h2 className="font-bold mb-4 text-lg">Today's Reminders</h2>
        {reminders.length === 0 ? (
          <p className="text-gray-500">No reminders.</p>
        ) : (
          reminders.map((r, idx) => (
            <div key={idx} className="border rounded p-4 mb-3 bg-white shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.icon}</span>
                  <h3 className="font-semibold text-gray-800">{r.title}</h3>
                </div>
                <div className="flex items-center text-blue-600 font-medium text-sm">
                  <FaClock className="mr-1" />
                  {r.time}
                </div>
              </div>
          
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  {r.userInitials}
                </div>
                <span>{r.user}</span>
              </div>
          
              <div className="flex items-start text-sm text-gray-600">
                <p>{r.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Meet Drawer */}
      <MeetFormDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        selectedDate={selectedDate}
        onCreated={(date) => {
          setOpenDrawer(false);
          fetchReminders(date);
        }}
      />
    </div>
  );
};

export default CalendarView;
