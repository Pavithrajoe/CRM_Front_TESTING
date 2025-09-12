import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../api/constraints";

const TaskSameDay = ({ onTasksFetched }) => {
  const [filter, setFilter] = useState("Today");
  const [userId, setUserId] = useState();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const userJson = localStorage.getItem("user"); 
        let userId = null;
        if (userJson) {
          const userObj = JSON.parse(userJson);
          userId = userObj.iUser_id; 
        }

        if (!userId) {
          throw new Error("User ID not found in local storage");
        }
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${ENDPOINTS.GET_FILTER_TASK}/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401)
          throw new Error("Authentication failed. Token may be invalid.");

        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const tasksData = data.data || (Array.isArray(data) ? data : []);

        setTasks(tasksData);

        if (onTasksFetched) onTasksFetched(tasksData);
      } catch (e) {
        console.error("Failed to fetch tasks:", e);
        setError(e.message || "Failed to load tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId, onTasksFetched]);

  useEffect(() => {
    if (!tasks.length) {
      setFilteredTasks([]);
      return;
    }

    // Get current date without time
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

    const filtered = tasks.filter((task) => {
      if (!task.task_date) return false;
      
      const taskDate = new Date(task.task_date);
      taskDate.setHours(0, 0, 0, 0); // Normalize task date for comparison
      
      switch (filter) {
        case "Today":
          return taskDate.getTime() === now.getTime();
        case "Tomorrow":
          return taskDate.getTime() === tomorrow.getTime();
        case "Next Week":
          return taskDate >= nextMonday && taskDate <= nextSunday;
        default:
          return true;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, filter]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to display date ranges for debugging
  const getDateRangeInfo = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextMonday = new Date(now);
    const dayOfWeek = nextMonday.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    
    return {
      today: now.toLocaleDateString('en-IN'),
      tomorrow: tomorrow.toLocaleDateString('en-IN'),
      nextWeekStart: nextMonday.toLocaleDateString('en-IN'),
      nextWeekEnd: nextSunday.toLocaleDateString('en-IN')
    };
  };

  const dateRanges = getDateRangeInfo();

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-gray-800">Tasks</h1>
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

      {/* Debug information - you can remove this in production */}
      <div className="text-xs text-gray-500 mb-2">
        {filter === "Today" && `Showing tasks for: ${dateRanges.today}`}
        {filter === "Tomorrow" && `Showing tasks for: ${dateRanges.tomorrow}`}
        {filter === "Next Week" && `Showing tasks from: ${dateRanges.nextWeekStart} to ${dateRanges.nextWeekEnd}`}
      </div>

      {loading && <p className="text-center text-gray-600">Loading tasks...</p>}

      {error && (
        <div className="text-center text-red-500 p-4 bg-red-50 rounded-md">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-2 text-blue-500 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.itask_id}
                onClick={() => task.ilead_id && navigate(`/leaddetailview/${task.ilead_id}`)}
                className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {task.ctitle}
                  </h2>
                  <h2 className="text-sm text-blue-900 italic">
                    Lead Name: {task.crm_lead?.clead_name || "N/A"}
                  </h2>
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  <span className="font-semibold">Created by: </span>
                  {task.user_task_icreated_byTouser?.cFull_name || "Unknown"}
                </p>
                <p className="text-gray-600 mb-3">{task.ctask_content}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-200">
                  <p>
                    <span className="font-semibold">Assigned to: </span>
                    {task.user_task_iassigned_toTouser?.cFull_name || "Unknown"}
                  </p>
                  <p>
                    <span className="font-semibold">Due Date: </span>
                    <span className="bg-yellow-100 text-yellow-800 font-semibold px-2 py-1 rounded-md">
                      {formatDateTime(task.task_date)}
                    </span>
                  </p>
                  <p>{formatDate(task.dcreate_dt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">No tasks found for the selected period.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskSameDay;