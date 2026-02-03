import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const TaskSameDay = ({ tasks, filter, statusFilter,setStatusFilter, setFilter, isMissed, loading }) => {
  const navigate = useNavigate();
  const now = new Date();

  //  Get User Data and check for Special Company
  const { userName, isSpecialCompany } = useMemo(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const XCODEFIX_FLOW = Number(import.meta.env.VITE_XCODEFIX_FLOW);
    
    return {
      userName: user?.cUser_name || user?.username || "User",
      // If user's company matches the Env ID, it's a special company
      isSpecialCompany: user?.iCompany_id === XCODEFIX_FLOW
    };
  }, []);

  // Determine Labels based on Company ID
  const displayLabel = useMemo(() => {
    if (isMissed) {
      return isSpecialCompany ? "Missed Follow up" : "Missed Tasks";
    } else {
      return isSpecialCompany ? "Follow up" : "Tasks";
    }
  }, [isMissed, isSpecialCompany]);

  return (
    <div>
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {displayLabel}
        </h1>

        {/* FILTERS – ONLY FOR NON-MISSED */}
        {!isMissed && (
          <div className="flex gap-2">
            {/* DATE FILTER */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border px-2 py-1 text-sm rounded outline-none bg-white"
            >
              <option>Today</option>
              <option>Yesterday</option>
              <option>Tomorrow</option>
              <option>This Week</option>
              <option>Next Week</option>
              <option>All</option>
            </select>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border px-2 py-1 text-sm rounded outline-none bg-white"
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="In_progress">In Progress</option>
              <option value="On_hold">On Hold</option>
                <option value="Expired">Expired</option> 
            </select>
          </div>
        )}
      </div>

      {/* BODY */}
      {!loading && (
        tasks && tasks.length ? (
          tasks.map(t => {
            const dueDate = new Date(t.task_date);
            // const isExpired = dueDate < now;
            const isExpired =  t.task_progress === "In_progress" && dueDate < now;

            const statusMap = {
            Completed: {
              label: "Completed",
              className: "text-green-600 font-semibold",
            },
            On_hold: {
              label: "On Hold",
              className: "text-yellow-600 font-semibold",
            },
            In_progress: {
              label: "In Progress",
              className: "text-blue-600 font-semibold",
            },
          };


            return (
              <div key={t.itask_id} onClick={() => navigate(`/leaddetailview/${t.ilead_id}`)}
                className="p-3 border rounded mb-2 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
              >
              
                {/* TITLE */}
                <h2 className="font-semibold text-gray-800">{t.ctitle} -<span className="text-blue-700 font-bold"> {t.crm_lead?.clead_name || "No Lead"}</span>  </h2>

                {/* CONTENT */}
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {t.ctask_content}
                </p>

                {/* DUE DATE + BY */}
                <div className="flex justify-between items-center mt-2 text-sm">
                  
                  <p className="text-sm flex items-center gap-2 flex-wrap">
                    <span
                      className={
                        isExpired ? "text-red-600 font-semibold" : "text-gray-700"
                      }
                    >
                      Due:{" "}
                      {dueDate.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>

                    {isExpired ? (
                      <span className="text-red-600 font-bold">
                        • Expired
                      </span>
                    ) : (
                      <span
                        className={
                          statusMap[t.task_progress]?.className
                        }
                      >
                        • {statusMap[t.task_progress]?.label}
                      </span>
                    )}
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

// import React, { useMemo } from "react";
// import { useNavigate } from "react-router-dom";

// const TaskSameDay = ({ tasks, filter, setFilter, isMissed, loading }) => {
//   const navigate = useNavigate();
//   const now = new Date();

//   // 1. Get User Data and check for Special Company
//   const { userName, isSpecialCompany } = useMemo(() => {
//     const user = JSON.parse(localStorage.getItem("user"));
//     const XCODEFIX_FLOW = Number(import.meta.env.VITE_XCODEFIX_FLOW);
    
//     return {
//       userName: user?.cUser_name || user?.username || "User",
//       // If user's company matches the Env ID, it's a special company
//       isSpecialCompany: user?.iCompany_id === XCODEFIX_FLOW
//     };
//   }, []);

//   // 2. Determine Labels based on Company ID
//   const displayLabel = useMemo(() => {
//     if (isMissed) {
//       return isSpecialCompany ? "Missed Follow up" : "Missed Tasks";
//     } else {
//       return isSpecialCompany ? "Follow up" : "Tasks";
//     }
//   }, [isMissed, isSpecialCompany]);

//   return (
//     <div>
//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-xl font-bold">
//           {displayLabel}
//         </h1>

//         {!isMissed && (
//           <select
//             value={filter}
//             onChange={e => setFilter(e.target.value)}
//             className="border px-2 py-1 text-sm rounded outline-none bg-white"
//           >
//             <option>Today</option>
//             <option>Yesterday</option>
//             <option>Tomorrow</option>
//             <option>This Week</option>
//             <option>Next Week</option>
//             <option>All</option>
//           </select>
//         )}
//       </div>

//       {/* BODY */}
//       {!loading && (
//         tasks && tasks.length ? (
//           tasks.map(t => {
//             const dueDate = new Date(t.task_date);
//             // const isExpired = dueDate < now;

//             const isExpired =
//   t.task_progress === "In_progress" && dueDate < now;

//   const statusMap = {
//   Completed: {
//     label: "Completed",
//     className: "text-green-600 font-semibold",
//   },
//   On_hold: {
//     label: "On Hold",
//     className: "text-yellow-600 font-semibold",
//   },
//   In_progress: {
//     label: "In Progress",
//     className: "text-blue-600 font-semibold",
//   },
// };



//             return (
//               <div
//                 key={t.itask_id}
//                 onClick={() => navigate(`/leaddetailview/${t.ilead_id}`)}
//                 className="p-3 border rounded mb-2 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
//               >
              
            

//                 {/* TITLE */}
//                 <h2 className="font-semibold text-gray-800">{t.ctitle} -<span className="text-blue-700 font-bold"> {t.crm_lead?.clead_name || "No Lead"}</span>
//             </h2>

//                 {/* CONTENT */}
//                 <p className="text-sm text-gray-500 mt-1 line-clamp-2">
//                   {t.ctask_content}
//                 </p>

//                 {/* DUE DATE + BY */}
//                 <div className="flex justify-between items-center mt-2 text-sm">
//                   {/* <p
//                     className={`${
//                       isExpired
//                         ? "text-red-600 font-semibold"
//                         : "text-gray-700"
//                     }`}
//                   >
//                     Due:{" "}
//                     {dueDate.toLocaleString("en-IN", {
//                       day: "2-digit",
//                       month: "2-digit",
//                       year: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit",
//                       hour12: true
//                     })}
//                     {isExpired && " (Expired)"}
//                   </p> */}
//                   <p className="text-sm flex items-center gap-2 flex-wrap">
//   <span
//     className={
//       isExpired ? "text-red-600 font-semibold" : "text-gray-700"
//     }
//   >
//     Due:{" "}
//     {dueDate.toLocaleString("en-IN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     })}
//   </span>

//   {isExpired ? (
//     <span className="text-red-600 font-bold">
//       • Expired
//     </span>
//   ) : (
//     <span
//       className={
//         statusMap[t.task_progress]?.className
//       }
//     >
//       • {statusMap[t.task_progress]?.label}
//     </span>
//   )}
// </p>


//                   <p className="text-gray-900 font-medium">
//                     By:{" "}
//                     <span className="font-normal text-gray-600">
//                       {userName}
//                     </span>
//                   </p>
//                 </div>
//               </div>
//             );
//           })
//         ) : (
//           <div className="flex flex-col items-center justify-center py-10">
//              <p className="text-gray-400">
//                 No items found for {filter}
//              </p>
//           </div>
//         )
//       )}
//     </div>
//   );
// };

// export default TaskSameDay;
