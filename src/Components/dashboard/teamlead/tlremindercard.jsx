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
  {
    id: 3,
    name: "Kamalesh",
    time: "12:30 PM",
    remaining: "3 hrs Left",
    avatar: "/public/images/dashboard/grl.png",
  },
];

export default function RemindersCard() {
  return (
    <div className="bg-white rounded-md p-4 w-[550px]">
      <h2 className="text-lg font-semibold mb-4">Reminders</h2>
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="flex items-center justify-between bg-gray-100 rounded-md p-3 mb-3"
        >
          <div className="flex items-center gap-3">
            <img
              src={reminder.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <div className="font-semibold">{reminder.name}</div>
              <div className="text-xs text-gray-600">
                🕒 Meeting Starts on {reminder.time}
              </div>
            </div>
          </div>
          <div className="bg-gray-200 px-3 py-1 text-sm rounded-md font-medium flex items-center gap-1">
            ⏳ {reminder.remaining}
          </div>
        </div>
      ))}
    </div>
  );
}
