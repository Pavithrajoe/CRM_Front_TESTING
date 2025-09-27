import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ENDPOINTS } from "../../../api/constraints";

export default function RemindersCard({ reminder_data }) {
  const [remindersTomorrow, setRemindersTomorrow] = useState([]);
  const [remindersNextWeek, setRemindersNextWeek] = useState([]);
  const [remindersYesterday, setRemindersYesterday] = useState([]);
const [remindersThisWeek, setRemindersThisWeek] = useState([]);

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

          // Get current date without time for proper comparison
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          // Today's range
          const todayStart = new Date(now);
          const todayEnd = new Date(now);
          todayEnd.setHours(23, 59, 59, 999);
          
          // Tomorrow's range
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStart = new Date(tomorrow);
          const tomorrowEnd = new Date(tomorrow);
          tomorrowEnd.setHours(23, 59, 59, 999);

          //Yesterdays range setup
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          //this week Range Setup

          const thisWeekStart = new Date(now);
          const currentDow = thisWeekStart.getDay(); // Sunday = 0
          const daysSinceMonday = currentDow === 0 ? 6 : currentDow - 1;
          thisWeekStart.setDate(thisWeekStart.getDate() - daysSinceMonday);
          thisWeekStart.setHours(0, 0, 0, 0);

          const thisWeekEnd = new Date(thisWeekStart);
          thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
          thisWeekEnd.setHours(23, 59, 59, 999);

          
          // Next Week range (Monday to Sunday of next week)
          const nextMonday = new Date(now);
          // Get next Monday (if today is Monday, get next Monday)
          const dayOfWeek = nextMonday.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
          nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
          nextMonday.setHours(0, 0, 0, 0);
          
          const nextSunday = new Date(nextMonday);
          nextSunday.setDate(nextMonday.getDate() + 6);
          nextSunday.setHours(23, 59, 59, 999);

          // Filter reminders for Tomorrow (within tomorrow start and end)
          const tomorrowFiltered = allReminders.filter((reminder) => {
            if (!reminder.dremainder_dt) return false;
            const reminderDate = new Date(reminder.dremainder_dt);
            reminderDate.setHours(0, 0, 0, 0); // Normalize for comparison
            return reminderDate.getTime() === tomorrow.getTime();
          });

          // Yesterday
          const yesterdayFiltered = allReminders.filter(reminder => {
            if (!reminder.dremainder_dt) return false;
            const reminderDate = new Date(reminder.dremainder_dt);
            reminderDate.setHours(0, 0, 0, 0);
            return reminderDate.getTime() === yesterday.getTime();
          });

          // This Week (Monday-Sunday this week)
          const thisWeekFiltered = allReminders.filter(reminder => {
            if (!reminder.dremainder_dt) return false;
            const reminderDate = new Date(reminder.dremainder_dt);
            reminderDate.setHours(0, 0, 0, 0);
            return reminderDate >= thisWeekStart && reminderDate <= thisWeekEnd;
          });


          // Filter reminders for Next Week (between next Monday and next Sunday)
          const nextWeekFiltered = allReminders.filter((reminder) => {
            if (!reminder.dremainder_dt) return false;
            const reminderDate = new Date(reminder.dremainder_dt);
            reminderDate.setHours(0, 0, 0, 0); // Normalize for comparison
            return reminderDate >= nextMonday && reminderDate <= nextSunday;
          });

          setRemindersTomorrow(tomorrowFiltered);
          setRemindersNextWeek(nextWeekFiltered);
          setRemindersYesterday(yesterdayFiltered);
          setRemindersThisWeek(thisWeekFiltered);

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
    } else if (filter === "Yesterday") {
      currentReminders = remindersYesterday;
    } else if (filter === "Tomorrow") {
      currentReminders = remindersTomorrow;
    } else if (filter === "This Week") {
      currentReminders = remindersThisWeek;
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
  <option value="Yesterday">Yesterday</option>
  <option value="Tomorrow">Tomorrow</option>
  <option value="This Week">This Week</option>
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