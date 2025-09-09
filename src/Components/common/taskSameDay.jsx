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
    // if (!) {
    //   setError("User ID is required");
    //   setLoading(false);
    //   return;
    // }`

 const fetchTasks = async () => {
  setLoading(true);
  setError(null);
  try {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user"); // or your key holding user object
    let userId = null;
    if (userJson) {
      const userObj = JSON.parse(userJson);
      userId = userObj.iUser_id; // important: match your key here exactly
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
    const todayStart = toISTDateStart(now.toISOString());
    const todayEnd = toISTDateEnd(now.toISOString());

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = toISTDateStart(tomorrow.toISOString());
    const tomorrowEnd = toISTDateEnd(tomorrow.toISOString());

    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const dayAfterTomorrowStart = toISTDateStart(dayAfterTomorrow.toISOString());
    const sevenDaysLaterEnd = toISTDateEnd(sevenDaysLater.toISOString());

    const filtered = tasks.filter((task) => {
      if (!task.task_date) return false; // skip tasks without task_date
      const taskDate = new Date(task.task_date);
      const istTaskDate = new Date(taskDate.getTime() + 5.5 * 60 * 60 * 1000);

      switch (filter) {
        case "Today":
          return istTaskDate >= todayStart && istTaskDate <= todayEnd;
        case "Tomorrow":
          return istTaskDate >= tomorrowStart && istTaskDate <= tomorrowEnd;
        case "Next Week":
          return istTaskDate >= dayAfterTomorrowStart && istTaskDate <= sevenDaysLaterEnd;
        default:
          return true;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, filter]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

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
                onClick={() => navigate(`/leaddetailview/${task.ilead_id}`)}
                className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-gray-800">{task.ctitle}</h2>
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
