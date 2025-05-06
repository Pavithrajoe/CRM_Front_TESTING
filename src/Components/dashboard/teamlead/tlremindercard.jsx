import React from "react";

const reminders = [
  {
    id: 1,
    name: "Kamalesh",
    time: "12:30 PM",
    remaining: "3 hrs Left",
    avatar: "/public/images/dashboard/grl.png", // Replace with actual image path
  },
  {
    id: 2,
    name: "Kamalesh",
    time: "12:30 PM",
    remaining: "3 hrs Left",
    avatar: "/public/images/dashboard/grl.png",
  },
  // Add more reminders or leave empty
];

export default function RemindersCard() {
  return (
    <div className="bg-white rounded-2xl p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">Reminders</h2>

      {/* fixed-height scroll container */}
      {reminders.length > 0 ? (
        <div className="space-y-4 max-h-[calc(4*4rem+3*1rem)] overflow-y-auto">
          {reminders.map(({ id, name, time, remaining, avatar }) => (
            <div
              key={id}
              className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-gray-50 hover:bg-gray-100 transition p-4 rounded-lg space-y-2 sm:space-y-0"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <img
                  src={avatar}
                  alt={`${name} avatar`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800 truncate max-w-xs">
                    {name}
                  </span>
                  <div className="text-sm text-gray-500 flex items-center gap-1 truncate max-w-xs">
                    <span role="img" aria-label="clock">
                      🕒
                    </span>
                    Meeting starts at {time}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-gray-200 px-3 py-1 rounded-full font-medium text-sm text-gray-700 flex-shrink-0">
                <span role="img" aria-label="hourglass">
                  ⏳
                </span>
                {remaining}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">No reminders for the day</div>
      )}
    </div>
  );
}
