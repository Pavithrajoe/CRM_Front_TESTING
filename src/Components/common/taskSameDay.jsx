import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const TaskSameDay = ({ tasks, filter, setFilter, isMissed, loading }) => {
  const navigate = useNavigate();
  const now = new Date();

  //  Get User Data and check for Special Company
  const { userName, isSpecialCompany } = useMemo(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const XCODEFIX_FLOW = Number(import.meta.env.VITE_XCODEFIX_FLOW);
    
    return {
      userName: user?.cUser_name || user?.username || "User",
      isSpecialCompany: user?.iCompany_id === XCODEFIX_FLOW
    };
  }, []);

  //  Determine Labels based on Company ID
  const displayLabel = useMemo(() => {
    if (isMissed) {
      return isSpecialCompany ? "Missed Follow up" : "Missed Tasks";
    } else {
      return isSpecialCompany ? "Follow up" : "Tasks";
    }
  }, [isMissed, isSpecialCompany]);

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {displayLabel}
        </h1>

        {!isMissed && (
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border px-2 py-1 text-sm rounded outline-none bg-white" >
            <option>Today</option>
            <option>Yesterday</option>
            <option>Tomorrow</option>
            <option>This Week</option>
            <option>Next Week</option>
            <option>All</option>
          </select>
        )}
      </div>

      {/* BODY */}
      {!loading && (
        tasks && tasks.length ? (
          tasks.map(t => {
            const dueDate = new Date(t.task_date);
            const isExpired = dueDate < now;

            return (
              <div
                key={t.itask_id}
                onClick={() => navigate(`/leaddetailview/${t.ilead_id}`)}
                className="p-3 border rounded mb-2 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
              >
               <h2 className="font-semibold text-gray-800">{t.ctitle} - <span className="text-blue-700 font-bold"> {t.crm_lead?.clead_name || "No Lead"}</span> </h2>

                {/* TITLE */}
                <h2 className="font-semibold text-gray-800">{t.ctitle}</h2>

                {/* CONTENT */}
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {t.ctask_content}
                </p>

                {/* DUE DATE + BY */}
                <div className="flex justify-between items-center mt-2 text-sm">
                  <p
                    className={`${
                      isExpired
                        ? "text-red-600 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    Due:{" "}
                    {dueDate.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })}
                    {isExpired && " (Expired)"}
                  </p>

                  <p className="text-gray-900 font-medium">
                    By:{" "}
                    <span className="font-normal text-gray-600">
                      {userName}
                    </span>
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
             <p className="text-gray-400">
                No items found for {filter}
             </p>
          </div>
        )
      )}
    </div>
  );
};

export default TaskSameDay;


// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { ENDPOINTS } from "../../api/constraints";

// const TaskSameDay = ({tasks, loading, error}) => {
//   const [filter, setFilter] = useState("Today");
//   const [filteredTasks, setFilteredTasks] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // console.log("The tasks are :", tasks)
//     if (!tasks.length) {
//       setFilteredTasks([]);
//       return;
//     }

//     // Get current date without time
//     const now = new Date();
//     now.setHours(0, 0, 0, 0);

//     // Today's range
//     const todayStart = new Date(now);
//     const todayEnd = new Date(now);
//     todayEnd.setHours(23, 59, 59, 999);

//     // Tomorrow's range
//     const tomorrow = new Date(now);
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     const tomorrowStart = new Date(tomorrow);
//     const tomorrowEnd = new Date(tomorrow);
//     tomorrowEnd.setHours(23, 59, 59, 999);

//     // Next Week range (Monday to Sunday of next week)
//     const nextMonday = new Date(now);
//     // Get next Monday (if today is Monday, get next Monday)
//     const dayOfWeek = nextMonday.getDay(); // 0 = Sunday, 1 = Monday, etc.
//     const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
//     nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
//     nextMonday.setHours(0, 0, 0, 0);

//     const nextSunday = new Date(nextMonday);
//     nextSunday.setDate(nextMonday.getDate() + 6);
//     nextSunday.setHours(23, 59, 59, 999);

//     const yesterday = new Date(now);
//     yesterday.setDate(yesterday.getDate() - 1);

//     const thisWeekStart = new Date(now);
//     const currentDow = thisWeekStart.getDay(); // Sunday = 0
//     // Week starts Monday, so adjust
//     const daysSinceMonday = currentDow === 0 ? 6 : currentDow - 1;
//     thisWeekStart.setDate(thisWeekStart.getDate() - daysSinceMonday);
//     thisWeekStart.setHours(0, 0, 0, 0);

//     const thisWeekEnd = new Date(thisWeekStart);
//     thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
//     thisWeekEnd.setHours(23, 59, 59, 999);

//     const filtered = tasks.filter((task) => {
//       if (!task.task_date) return false;

//       const taskDate = new Date(task.task_date);
//       taskDate.setHours(0, 0, 0, 0); // Normalize task date for comparison

//       switch (filter) {
//         case "Today":
//           return taskDate.getTime() === now.getTime();
//         case "Yesterday":
//           return taskDate.getTime() === yesterday.getTime();
//         case "Tomorrow":
//           return taskDate.getTime() === tomorrow.getTime();
//         case "This Week":
//           return taskDate >= thisWeekStart && taskDate <= thisWeekEnd;
//         case "Next Week":
//           return taskDate >= nextMonday && taskDate <= nextSunday;
//         default:
//           return true;
//       }
//     });

    
//     setFilteredTasks(filtered);
//   }, [tasks, filter]);

//   const formatDate = (dateString) => {
//     if (!dateString) return "-";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   };

//   const formatDateTime = (dateString) => {
//     if (!dateString) return "-";
//     const date = new Date(dateString);
    
//     return date.toLocaleString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true
//     });
//   };

//   // Helper function to display date ranges for debugging
// const getDateRangeInfo = () => {
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);

//   // Calculate yesterday
//   const yesterday = new Date(now);
//   yesterday.setDate(yesterday.getDate() - 1);

//   // Calculate tomorrow
//   const tomorrow = new Date(now);
//   tomorrow.setDate(tomorrow.getDate() + 1);

//   // Calculate next week range
//   const nextMonday = new Date(now);
//   const dayOfWeek = nextMonday.getDay();
//   const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
//   nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);

//   const nextSunday = new Date(nextMonday);
//   nextSunday.setDate(nextMonday.getDate() + 6);

//   // Calculate this week range (Monday - Sunday)
//   const thisWeekStart = new Date(now);
//   const currentDow = thisWeekStart.getDay();
//   const daysSinceMonday = currentDow === 0 ? 6 : currentDow - 1;
//   thisWeekStart.setDate(thisWeekStart.getDate() - daysSinceMonday);
//   thisWeekStart.setHours(0, 0, 0, 0);

//   const thisWeekEnd = new Date(thisWeekStart);
//   thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
//   thisWeekEnd.setHours(23, 59, 59, 999);

//   return {
//     today: now.toLocaleDateString('en-IN'),
//     yesterday: yesterday.toLocaleDateString('en-IN'),
//     tomorrow: tomorrow.toLocaleDateString('en-IN'),
//     nextWeekStart: nextMonday.toLocaleDateString('en-IN'),
//     nextWeekEnd: nextSunday.toLocaleDateString('en-IN'),
//     thisWeekStart: thisWeekStart.toLocaleDateString('en-IN'),
//     thisWeekEnd: thisWeekEnd.toLocaleDateString('en-IN'),
//   };
// };

//   const dateRanges = getDateRangeInfo();

//   return (
//     <div className="p-2">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl text-gray-800">Tasks</h1>
//         <select
//           value={filter}
//           onChange={e => setFilter(e.target.value)}
//           className="border rounded-md p-1 text-sm"
//         >
//           <option value="Today">Today</option>
//           <option value="Yesterday">Yesterday</option>
//           <option value="Tomorrow">Tomorrow</option>
//           <option value="This Week">This Week</option>
//           <option value="Next Week">Next Week</option>
//         </select>

//       </div>

//       {/* Debug information - you can remove this in production */}
//       <div className="text-xs text-gray-500 mb-2">
//         {filter === "Today" && `Showing tasks for: ${dateRanges.today}`}
//         {filter === "Tomorrow" && `Showing tasks for: ${dateRanges.tomorrow}`}
//         {filter === "Next Week" && `Showing tasks from: ${dateRanges.nextWeekStart} to ${dateRanges.nextWeekEnd}`}
//         {filter === "Yesterday" && `Showing tasks for: ${dateRanges.yesterday}`}
//         {filter === "This Week" && `Showing tasks from: ${dateRanges.thisWeekStart} to ${dateRanges.thisWeekEnd}`}

//       </div>

//       {!loading && !error && tasks.length === 0 && (
//         <div className="text-center text-red-500 p-4">
//           <button
//             onClick={() => window.location.reload()}
//             className="ml-2 text-gray-400"
//           >
//             No task for the day!!!!!
//           </button>
//         </div>
//       )}

//       {!loading && !error && (
//         <div className="grid gap-4">
//           {filteredTasks.length > 0 ? (
//             filteredTasks.map((task) => (
//               <div
//                 key={task.itask_id}
//                 onClick={() => task.ilead_id && navigate(`/leaddetailview/${task.ilead_id}`)}
//                 className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition"
//               >
//                 <div className="flex justify-between items-center mb-2">
//                   <h2 className="text-lg font-bold text-gray-800">
//                     {task.ctitle}
//                   </h2>
//                   <h2 className="text-sm text-blue-900 italic">
//                     Lead Name: {task.crm_lead?.clead_name || "-"}
//                   </h2>
//                 </div>

//                 <p className="text-sm text-gray-500 mb-2">
//                   <span className="font-semibold">Created by: </span>
//                   {task.user_task_icreated_byTouser?.cFull_name || "Unknown"}
//                 </p>
//                 <p className="text-gray-600 mb-3">{task.ctask_content}</p>
//                 <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-200">
//                   <p>
//                     <span className="font-semibold">Assigned to: </span>
//                     {task.user_task_iassigned_toTouser?.cFull_name || "Unknown"}
//                   </p>
//                   <p>
//                     <span className="font-semibold">Due Date: </span>
//                     <span className="bg-yellow-100 text-yellow-800 font-semibold px-2 py-1 rounded-md">
//                       {formatDateTime(task.task_date)}
//                     </span>
//                   </p>
//                   <p>{formatDate(task.dcreate_dt)}</p>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-gray-600">No tasks found for the selected period.</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default TaskSameDay;