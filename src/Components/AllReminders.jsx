import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar } from 'react-icons/fi';
/*import axios from 'axios';    */

const AllReminders = () => {
  const [reminders, setReminders] = useState([]);
  const navigate = useNavigate();

  // Profile image array
  const profileImages = [
    '/images/nav/group.png',
    '/images/nav/group.png',
    '/images/nav/group.png',
    '/profile4.png',
    '/profile5.png',
    ""
  ];

  useEffect(() => {
    // ✅ Uncomment this block when your API is ready
    /*
    axios.get('/api/reminders')
      .then((response) => {
        setReminders(response.data);
      })
      .catch((error) => {
        console.error('Error fetching reminders:', error);
      });
    */

    // 🧪 Fallback dummy data for now
    const dummyReminders = [
      {
        id: 1,
        assignedTo: 'Shivakumar',
        title: 'Project Title',
        description:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        date: '2025-03-22',
        time: '12:30 PM',
      },
      {
        id: 2,
        assignedTo: 'Meena',
        title: 'Design Brief',
        description: 'Prepare and review the wireframes for the new app screens.',
        date: '2025-03-25',
        time: '10:00 AM',
      },
      {
        id: 3,
        assignedTo: 'Ravi',
        title: 'Client Meeting',
        description:
          'Discuss project updates and deliverables with the client team.',
        date: '2025-03-26',
        time: '03:00 PM',
      },
    ];
    setReminders(dummyReminders);
  }, []);

  const handleViewEvent = (reminder) => {
    navigate(`/calendar?date=${reminder.date}`);
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6 text-center sm:text-left">All Reminders</h2>

      {reminders.map((r, index) => {
        const profileImg = profileImages[index % profileImages.length];
        return (
          <div
            key={r.id}
            className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm mb-6 space-y-4"
          >
            {/* Top Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={profileImg}
                  alt={`${r.assignedTo} avatar`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-base font-medium text-gray-900">{r.assignedTo}</span>
              </div>
              <button
                onClick={() => handleViewEvent(r)}
                className="flex items-center gap-2 bg-black text-white text-sm px-4 py-1.5 rounded hover:bg-gray-800 transition"
              >
                <FiCalendar className="text-base" />
                View Event
              </button>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 text-lg font-semibold text-gray-800">
              <img
                src="/images/nav/text.png"
                alt="Title icon"
                className="w-6 h-6 rounded-full object-cover"
              />
              {r.title}
            </div>

            {/* Description */}
            <div className="flex items-start gap-3 text-gray-700 text-sm leading-relaxed">
              <img
                src="/images/nav/notees.png"
                alt="Description icon"
                className="w-6 h-6 rounded-full object-cover mt-1"
              />
              <p>{r.description}</p>
            </div>

            {/* Date & Time */}
            <div className="text-right text-sm font-bold text-gray-900">
              {r.time},{' '}
              {new Date(r.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AllReminders;
