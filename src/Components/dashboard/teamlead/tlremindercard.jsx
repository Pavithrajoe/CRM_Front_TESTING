import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ENDPOINTS } from "../../../api/constraints";

export default function RemindersCard({ reminder_data }) {
  const [remindersTomorrow, setRemindersTomorrow] = useState([]);
  const [remindersNextWeek, setRemindersNextWeek] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("Today");

  useEffect(() => {
    if (filter !== "Today") {
      const fetchReminders = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem("token");

          if (!token) {
            console.error("Authorization token not found in local storage.");
            setIsLoading(false);
            return;
          }

          const response = await fetch(ENDPOINTS.ALLREMINDER, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const result = await response.json();
          const allReminders = result.data;

          // Helpers to get IST Date at start and end of day
          const toISTDateStart = (date) => {
            const utcDate = new Date(date);
            const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
            istDate.setHours(0, 0, 0, 0);
            return istDate;
          };

          const toISTDateEnd = (date) => {
            const utcDate = new Date(date);
            const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
            istDate.setHours(23, 59, 59, 999);
            return istDate;
          };

          const now = new Date();

          // Tomorrow and ranges
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStart = toISTDateStart(tomorrow.toISOString());
          const tomorrowEnd = toISTDateEnd(tomorrow.toISOString());

          // Day after tomorrow and next week ranges
          const dayAfterTomorrow = new Date(now);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          const sevenDaysLater = new Date(now);
          sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
          const dayAfterTomorrowStart = toISTDateStart(dayAfterTomorrow.toISOString());
          const sevenDaysLaterEnd = toISTDateEnd(sevenDaysLater.toISOString());

          // Filter reminders for Tomorrow (within tomorrow start and end)
          const tomorrowFiltered = allReminders.filter((reminder) => {
            const reminderDate = new Date(reminder.dremainder_dt);
            const istReminderDate = new Date(reminderDate.getTime() + 5.5 * 60 * 60 * 1000);
            return istReminderDate >= tomorrowStart && istReminderDate <= tomorrowEnd;
          });

          // Filter reminders for Next Week (between day after tomorrow and seven days later)
          const nextWeekFiltered = allReminders.filter((reminder) => {
            const reminderDate = new Date(reminder.dremainder_dt);
            const istReminderDate = new Date(reminderDate.getTime() + 5.5 * 60 * 60 * 1000);
            return istReminderDate >= dayAfterTomorrowStart && istReminderDate <= sevenDaysLaterEnd;
          });

          setRemindersTomorrow(tomorrowFiltered);
          setRemindersNextWeek(nextWeekFiltered);
        } catch (error) {
          console.error("Failed to fetch reminders:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReminders();
    }
  }, [filter]);

  // Select reminders based on filter
  let currentReminders = [];
  if (filter === "Today") {
    currentReminders = reminder_data || [];
  } else if (filter === "Tomorrow") {
    currentReminders = remindersTomorrow;
  } else if (filter === "Next Week") {
    currentReminders = remindersNextWeek;
  }

  const now = new Date();
  const remindersToDisplay = currentReminders?.map((reminder) => {
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
    <div className="bg-white rounded-3xl p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reminders</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md p-1 text-sm"
        >
          <option value="Today">Today</option>
          <option value="Tomorrow">Tomorrow</option>
          <option value="Next Week">Next Week</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading reminders...</div>
      ) : remindersToDisplay.length > 0 ? (
        <div className="space-y-4 max-h-[calc(5*4.5rem+3*1rem)] overflow-y-auto">
          {remindersToDisplay.map(({ id, name, time, remaining, avatar, ilead_id }) => (
            <Link key={id} to={`/leaddetailview/${ilead_id}`} className="block transition">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-gray-50 hover:bg-gray-100 p-4 rounded-lg space-y-2 sm:space-y-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <img
                    src={avatar}
                    alt={`${name} avatar`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 truncate max-w-xs">{name}</span>
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
        <div className="py-8 text-center text-gray-500">No reminders for the selected period.</div>
      )}
    </div>
  );
}
