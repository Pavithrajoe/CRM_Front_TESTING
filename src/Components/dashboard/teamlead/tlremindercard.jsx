import React from "react";
import { Link } from "react-router-dom";

export default function RemindersCard({ reminder_data }) {
  const now = new Date();

  //console.log("Reminder Data:", reminder_data);

  const reminders = reminder_data?.map((reminder) => {
    const target = new Date(reminder.dremainder_dt);
    const timeRemainingMs = target - now;

    let remainingText = "Reminder time passed";

    if (timeRemainingMs > 0) {
      const diffSec = Math.floor(timeRemainingMs / 1000);
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      remainingText = `Time left: ${hours}h ${minutes}m ${seconds}s`;
    }

    return {
      id: reminder.iremainder_id,
      name: reminder.cremainder_title || "Untitled Reminder",
      time: new Date(reminder.dremainder_dt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      remaining: remainingText,
      ilead_id: reminder.ilead_id,
      avatar: "/images/dashboard/grl.png", 
    };
  }) || [];

  return (
    <div className="bg-white rounded-3xl p-6 w-full ">
      <h2 className="text-xl font-semibold mb-4">Reminders</h2>

      {reminders.length > 0 ? (

        <div className="space-y-4 max-h-[calc(5*4.5rem+3*1rem)] overflow-y-auto">
  {reminders.map(({ id, name, time, remaining, avatar, ilead_id }) => (
    <Link
      key={id}
      to={`/leaddetailview/${ilead_id}`}
      className="block transition"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-gray-50 hover:bg-gray-100 p-4 rounded-lg space-y-2 sm:space-y-0">
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
    </Link>
  ))}
</div>
      ) : (
        <div className="py-8 text-center text-gray-500">No reminders for the day</div>
      )}
    </div>
  );
}
