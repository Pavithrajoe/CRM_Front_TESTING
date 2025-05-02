import React, { useEffect, useState } from "react";

// Dummy data
const dummyData = [
  {
    user: "Shivakumar",
    action: "Modified",
    date: "22 December",
    time: "11:00 AM",
    avatar: "https://i.pravatar.cc/40?img=1",
  },
  {
    user: "Priya",
    action: "Updated",
    date: "21 December",
    time: "4:15 PM",
    avatar: "https://i.pravatar.cc/40?img=2",
  },
  {
    user: "Arun",
    action: "Deleted",
    date: "20 December",
    time: "9:30 AM",
    avatar: "https://i.pravatar.cc/40?img=3",
  },
  {
    user: "Meena",
    action: "Created",
    date: "19 December",
    time: "3:00 PM",
    avatar: "https://i.pravatar.cc/40?img=4",
  },
  {
    user: "John",
    action: "Modified",
    date: "18 December",
    time: "2:00 PM",
    avatar: "https://i.pravatar.cc/40?img=5",
  },
];

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHistory(dummyData);
    }, 500);
  }, []);

  const visibleHistory = showAll ? history : history.slice(0, 3);

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">History</h2>
        {history.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showAll ? "Show less" : "Show more"}
          </button>
        )}
      </div>
      <ul className="space-y-4">
        {visibleHistory.map((item, index) => (
          <li key={index} className="flex items-start text-sm text-gray-700">
            <img
              src={item.avatar}
              alt={item.user}
              className="w-8 h-8 rounded-full mr-3"
            />
            <div>
              <span className="font-medium">{item.action}</span>{" "}
              <span className="text-gray-800">{item.user}</span>’s work on{" "}
              <span className="font-medium">{item.date}</span> at{" "}
              <span className="font-medium">{item.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryPage;
