import React, { useState, useEffect } from "react";
import { ENDPOINTS } from "../../api/constraints";
import { useNavigate } from "react-router-dom";

const TaskSameDay = ({ onTasksFetched }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!storedUser) throw new Error("User not found in localStorage");
        if (!token) throw new Error("No authentication token found");

        const userObj = JSON.parse(storedUser);

        const response = await fetch(ENDPOINTS.DAILY_TASK, {
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
  }, [onTasksFetched]);

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
      <h1 className="text-2xl text-gray-800 mb-4">Today's Tasks</h1>

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
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.itask_id}
                onClick={() => navigate(`/leaddetailview/${task.ilead_id}`)}
                className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {task.ctitle}
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
            <p className="text-center text-gray-600">
              No tasks found for today.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskSameDay;
