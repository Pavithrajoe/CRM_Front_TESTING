import React from 'react';

const historyData = [
  {
    id: 1,
    action: 'Lead assigned to John Doe',
    timestamp: '2025-06-09 10:32 AM',
  },
  {
    id: 2,
    action: 'New lead created from website form',
    timestamp: '2025-06-08 04:15 PM',
  },
  {
    id: 3,
    action: 'Profile updated by admin',
    timestamp: '2025-06-07 01:22 PM',
  },
];

const HistoryDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Activity History</h2>

        {historyData.length === 0 ? (
          <p className="text-gray-500 text-center">No history available.</p>
        ) : (
          <ul className="space-y-4">
            {historyData.map((item) => (
              <li
                key={item.id}
                className="p-4 border rounded-lg shadow-sm bg-gray-100 hover:bg-gray-200 transition"
              >
                <p className="text-gray-800">{item.action}</p>
                <p className="text-sm text-gray-500">{item.timestamp}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryDashboard;
