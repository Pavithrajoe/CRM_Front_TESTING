// CalendarView.jsx
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const CalendarView = ({ selectedEvent }) => {
  const [value, setValue] = useState(new Date(selectedEvent?.date || new Date()));

  return (
    <div className="p-4">
      <Calendar value={value} onChange={setValue} />
      {selectedEvent && (
        <div className="mt-4">
          <h3 className="font-bold">{selectedEvent.title}</h3>
          <p>{selectedEvent.description}</p>
          <p>{selectedEvent.time} on {selectedEvent.date}</p>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
