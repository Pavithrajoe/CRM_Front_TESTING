import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../api/constraints';

const TaskSameDay = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Get user data from localStorage
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");


        if (!storedUser) {
          throw new Error("User not found in localStorage");
        }
        
        const userObj = JSON.parse(storedUser);
        
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        console.log("Token being sent:", token); 
        
        const response = await fetch(ENDPOINTS.DAILY_TASK, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Task API Response:", response);
        
        if (response.status === 401) {
          throw new Error("Authentication failed. Token may be invalid or expired.");
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data) {
          setTasks(data.data);
        } else if (Array.isArray(data)) {
          setTasks(data);
        } else {
          setTasks([]);
        }
      } catch (e) {
        console.error("Failed to fetch tasks:", e);
        setError(e.message || "Failed to load tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const formatDateTime = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);

  // Get day and month with leading zeros
  const day = String(date.getDate()).padStart(2, '0');           // DD
  const month = String(date.getMonth() + 1).padStart(2, '0');    // MM
  const year = date.getFullYear();                               // YYYY

  // Hours and minutes for 12-hour format
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // AM/PM determination
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // [12 AM or PM case]

  const formattedTime = `${hours}:${minutes} ${ampm}`;

  return `${day}/${month}/${year} ${formattedTime}`;
};


  return (
    <div className="p-4">
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 mt-[-50px] text-center">
          Today's Tasks
        </h1>

        {loading && (
          <p className="text-center text-gray-600">Loading tasks...</p>
        )}

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
                  className="bg-white  rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-gray-800">
                      {task.ctitle}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-semibold">Created by: </span>
                    {task.user_task_icreated_byTouser?.cFull_name || 'Unknown'}
                  </p>
                  <p className="text-gray-600 mb-3">
                    {task.ctask_content}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-200">
                    <p>
                      <span className="font-semibold">Assigned to: </span>
                      {task.user_task_iassigned_toTouser?.cFull_name || 'Unknown'}
                    </p>
                     <p>
  <span className="font-semibold">Due Date: </span>
  {formatDateTime(task.task_date)}
</p>
                    
                    <p>
                      {new Date(task.dcreate_dt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">No tasks found for today.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSameDay;