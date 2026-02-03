import React, { useEffect, useState, useMemo } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import { ENDPOINTS } from "../../api/constraints";
import ProfileHeader from "@/Components/common/ProfileHeader";
import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
import KPIStats from "@/Components/dashboard/teamlead/tlKPIcards";
import RemindersCard from "@/Components/dashboard/teamlead/tlremindercard";
import TaskSameDay from "@/Components/common/taskSameDay";
import MyTargetSection from "./LoginUserTargetSection";
const LeadsDashboard = () => {
  const XCODEFIX_FLOW = Number(import.meta.env.VITE_XCODEFIX_FLOW);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [activeTab, setActiveTab] = useState("");
  const [activeTab, setActiveTab] = useState("TASKS");
  const [reminderFilter, setReminderFilter] = useState("Today");
  const [taskFilter, setTaskFilter] = useState("Today");
  
  const [statusFilter, setStatusFilter] = useState("All");


  const user_attributes = useMemo( () => JSON.parse(localStorage.getItem("user_attributes")) || [], []);
 

  const allowedTabs = useMemo(() => {
    const required = ["REMINDERS", "TASKS", "Missed task"];
    return user_attributes.filter(
      a => a.bactive && required.includes(a.attribute_name)
    );
  }, [user_attributes]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) return;
    const userObj = JSON.parse(storedUser);
    setUser(userObj);

    if (!activeTab && allowedTabs.length) {
      setActiveTab(allowedTabs[0].attribute_name);
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const dashRes = await fetch(`${ENDPOINTS.DASHBOARD_USER}/${userObj.iUser_id}`,
          { headers }
        );
        const dashData = await dashRes.json();
        setDashboardData(dashData);

        const taskRes = await fetch(`${ENDPOINTS.GET_FILTER_TASK}/${userObj.iUser_id}`,
          { headers }
        );
        const taskData = await taskRes.json();

        const sorted = (taskData?.data || []).sort(
          (a, b) => new Date(b.task_date) - new Date(a.task_date)
        );
        setAllTasks(sorted);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allowedTabs]);

  

  /* DATE RANGE FILTER  */
  const filterByDate = (items, dateKey, filter) => {
    const startDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const endDay   = d => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

    const today = new Date();

    const todayStart = startDay(today);
    const todayEnd = endDay(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStart = startDay(yesterday);
    const yEnd = endDay(yesterday);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tStart = startDay(tomorrow);
    const tEnd = endDay(tomorrow);

    const weekStart = new Date(today);
    const day = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - day + 1);
    weekStart.setHours(0,0,0,0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    const nextWeekStart = new Date(weekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    nextWeekStart.setHours(0,0,0,0);

    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23,59,59,999);

    return items.filter(i => {
      if (!i[dateKey]) return false;
      const d = new Date(i[dateKey]);

      switch (filter) {
        case "Today": return d >= todayStart && d <= todayEnd;
        case "Yesterday": return d >= yStart && d <= yEnd;
        case "Tomorrow": return d >= tStart && d <= tEnd;
        case "This Week": return d >= weekStart && d <= weekEnd;
        case "Next Week": return d >= nextWeekStart && d <= nextWeekEnd;
        case "All": return true;
        default: return true;
      }
    });
  };

  /* FILTERED DATA */
  const reminders = dashboardData?.details?.reminders || [];
  const filteredReminders = useMemo(
    () => filterByDate(reminders, "dremainder_dt", reminderFilter),
    [reminders, reminderFilter]
  );

  const missedTasks = allTasks.filter(t => t.istatus_id === 1);
  const regularTasks = allTasks.filter(t => t.istatus_id !== 1);

  // const filteredTasks = useMemo(
  //   () => filterByDate(regularTasks, "task_date", taskFilter),
  //   [regularTasks, taskFilter]
  // );
  const filteredTasks = useMemo(() => {
  let result = filterByDate(regularTasks, "task_date", taskFilter);
  const now = new Date();

  if (statusFilter === "Expired") {
    result = result.filter(
      (t) =>
        t.task_progress === "In_progress" &&
        new Date(t.task_date) < now
    );
  } else if (statusFilter !== "All") {
    result = result.filter(
      (t) => t.task_progress === statusFilter
    );
  }

  return result;
}, [regularTasks, taskFilter, statusFilter]);


  const getTabUI = (name) => {
    const isSpecial = user?.iCompany_id === XCODEFIX_FLOW;
    if (name === "REMINDERS") return { label: "Reminders", count: filteredReminders.length };
    if (name === "TASKS") return { label: isSpecial ? "Follow up" : "Tasks", count: filteredTasks.length };
    if (name === "Missed task") return { label: isSpecial ? "Missed Follow up" : "Missed Tasks", count: missedTasks.length, color: "#d32f2f" };
    return {};
  };

  return (
    <div className="flex mt-[-80px]">
      <main className="w-full flex-1 p-6 mt-[80px]">
        <div className="flex justify-between items-center mb-6 w-full relative z-50">
          <div className=""> <TeamleadHeader /> 
           {/* <MyTargetSection /> */}
           
           </div>
          <div className="shrink-0 ml-4"> <ProfileHeader /> </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Box sx={{ bgcolor: "white", p: 2, borderRadius: 2 }}> <KPIStats data={dashboardData?.details} /> </Box>

          <Box sx={{ 
            bgcolor: "white", 
            borderRadius: 4, 
            height: '650px',      
            display: 'flex',     
            flexDirection: 'column', 
            overflow: 'hidden' 
          }}>
            
           
            <Tabs 
              value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth" 
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                
                '& .MuiTabs-flexContainer': {
                  minHeight: '48px', 
                }
              }}
            >
              {allowedTabs.map((t) => {
                const ui = getTabUI(t.attribute_name);
                return (
                  <Tab
                    key={t.attribute_name} value={t.attribute_name}
                    label={`${ui.label} (${ui.count || 0})`}
                    sx={{
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "16px",
                      maxWidth: "none", 
                      flex: 1,
                      px: { xs: 1, sm: 2 } 
                    }}
                  />
                );
              })}
            </Tabs>

            <Box p={2} sx={{  flexGrow: 1, overflowY: 'auto' }}>
              {activeTab === "REMINDERS" && (
                <RemindersCard
                  reminder_data={filteredReminders}
                  filter={reminderFilter}
                  setFilter={setReminderFilter}
                />
              )}

              {activeTab === "TASKS" && (
                <TaskSameDay
                  tasks={filteredTasks}
                  filter={taskFilter}
                  setFilter={setTaskFilter}
                  loading={loading}
                  isMissed={false}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
              )}

              {activeTab === "Missed task" && (
                <TaskSameDay
                  tasks={missedTasks}
                  loading={loading}
                  isMissed={true}
                />
              )}
            </Box>
          </Box>
        </div>
      </main>
    </div>
  );
};

export default LeadsDashboard;




// import React, { useEffect, useState, useMemo } from "react";
// import { Tabs, Tab, Box, Typography } from "@mui/material";
// import { ENDPOINTS } from "../../api/constraints";
// import ProfileHeader from "@/Components/common/ProfileHeader";
// import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
// import KPIStats from "@/Components/dashboard/teamlead/tlKPIcards";
// import RemindersCard from "@/Components/dashboard/teamlead/tlremindercard";
// import TaskSameDay from "@/Components/common/taskSameDay";
// import MyTargetSection from "./LoginUserTargetSection";

// const LeadsDashboard = () => {
//   const XCODEFIX_FLOW = Number(import.meta.env.VITE_XCODEFIX_FLOW);
//   const [user, setUser] = useState(null);
//   const [dashboardData, setDashboardData] = useState(null);
//   const [allTasks, setAllTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   // const [activeTab, setActiveTab] = useState("");
//   const [activeTab, setActiveTab] = useState("TASKS");
//   const [reminderFilter, setReminderFilter] = useState("Today");
//   const [taskFilter, setTaskFilter] = useState("Today");
//   const user_attributes = useMemo( () => JSON.parse(localStorage.getItem("user_attributes")) || [], []);

//   const allowedTabs = useMemo(() => {
//     const required = ["REMINDERS", "TASKS", "Missed task"];
//     return user_attributes.filter(
//       a => a.bactive && required.includes(a.attribute_name)
//     );
//   }, [user_attributes]);

//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     const token = localStorage.getItem("token");
//     if (!storedUser || !token) return;
//     const userObj = JSON.parse(storedUser);
//     setUser(userObj);

//     if (!activeTab && allowedTabs.length) {
//       setActiveTab(allowedTabs[0].attribute_name);
//     }

//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const headers = {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         };

//         const dashRes = await fetch(`${ENDPOINTS.DASHBOARD_USER}/${userObj.iUser_id}`,
//           { headers }
//         );
//         const dashData = await dashRes.json();
//         setDashboardData(dashData);

//         const taskRes = await fetch(`${ENDPOINTS.GET_FILTER_TASK}/${userObj.iUser_id}`,
//           { headers }
//         );
//         const taskData = await taskRes.json();

//         const sorted = (taskData?.data || []).sort(
//           (a, b) => new Date(b.task_date) - new Date(a.task_date)
//         );
//         setAllTasks(sorted);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [allowedTabs]);

//   /* DATE RANGE FILTER  */
//   const filterByDate = (items, dateKey, filter) => {
//     const startDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
//     const endDay   = d => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

//     const today = new Date();

//     const todayStart = startDay(today);
//     const todayEnd = endDay(today);

//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);
//     const yStart = startDay(yesterday);
//     const yEnd = endDay(yesterday);

//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     const tStart = startDay(tomorrow);
//     const tEnd = endDay(tomorrow);

//     const weekStart = new Date(today);
//     const day = weekStart.getDay() || 7;
//     weekStart.setDate(weekStart.getDate() - day + 1);
//     weekStart.setHours(0,0,0,0);

//     const weekEnd = new Date(weekStart);
//     weekEnd.setDate(weekStart.getDate() + 6);
//     weekEnd.setHours(23,59,59,999);

//     const nextWeekStart = new Date(weekEnd);
//     nextWeekStart.setDate(nextWeekStart.getDate() + 1);
//     nextWeekStart.setHours(0,0,0,0);

//     const nextWeekEnd = new Date(nextWeekStart);
//     nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
//     nextWeekEnd.setHours(23,59,59,999);

//     return items.filter(i => {
//       if (!i[dateKey]) return false;
//       const d = new Date(i[dateKey]);

//       switch (filter) {
//         case "Today": return d >= todayStart && d <= todayEnd;
//         case "Yesterday": return d >= yStart && d <= yEnd;
//         case "Tomorrow": return d >= tStart && d <= tEnd;
//         case "This Week": return d >= weekStart && d <= weekEnd;
//         case "Next Week": return d >= nextWeekStart && d <= nextWeekEnd;
//         case "All": return true;
//         default: return true;
//       }
//     });
//   };

//   /* FILTERED DATA */
//   const reminders = dashboardData?.details?.reminders || [];
//   const filteredReminders = useMemo(
//     () => filterByDate(reminders, "dremainder_dt", reminderFilter),
//     [reminders, reminderFilter]
//   );

//   const missedTasks = allTasks.filter(t => t.istatus_id === 1);
//   const regularTasks = allTasks.filter(t => t.istatus_id !== 1);

//   const filteredTasks = useMemo(
//     () => filterByDate(regularTasks, "task_date", taskFilter),
//     [regularTasks, taskFilter]
//   );

//   const getTabUI = (name) => {
//     const isSpecial = user?.iCompany_id === XCODEFIX_FLOW;
//     if (name === "REMINDERS") return { label: "Reminders", count: filteredReminders.length };
//     if (name === "TASKS") return { label: isSpecial ? "Follow up" : "Tasks", count: filteredTasks.length };
//     if (name === "Missed task") return { label: isSpecial ? "Missed Follow up" : "Missed Tasks", count: missedTasks.length, color: "#d32f2f" };
//     return {};
//   };

//   return (
//     <div className="flex mt-[-80px]">
//       <main className="w-full flex-1 p-6 mt-[80px]">
//         <div className="flex justify-between items-center mb-6 w-full relative z-50">
//           <div className=""> <TeamleadHeader /> </div>
//           <div className="shrink-0 ml-4"> <ProfileHeader /> </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
//           <Box sx={{ bgcolor: "white", p: 2, borderRadius: 2 }}> <KPIStats data={dashboardData?.details} /> </Box>

//           <Box sx={{ 
//             bgcolor: "white", 
//             borderRadius: 4, 
//             height: '650px',      
//             display: 'flex',     
//             flexDirection: 'column', 
//             overflow: 'hidden' 
//           }}>
//             <Tabs 
//               value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth" 
//               sx={{
//                 borderBottom: 1,
//                 borderColor: 'divider',
                
//                 '& .MuiTabs-flexContainer': {
//                   minHeight: '48px', 
//                 }
//               }}
//             >
//               {allowedTabs.map((t) => {
//                 const ui = getTabUI(t.attribute_name);
//                 return (
//                   <Tab
//                     key={t.attribute_name} value={t.attribute_name}
//                     label={`${ui.label} (${ui.count || 0})`}
//                     sx={{
//                       fontWeight: 700,
//                       textTransform: "none",
//                       fontSize: "16px",
//                       maxWidth: "none", 
//                       flex: 1,
//                       px: { xs: 1, sm: 2 } 
//                     }}
//                   />
//                 );
//               })}
//             </Tabs>

//             <Box p={2} sx={{  flexGrow: 1, overflowY: 'auto' }}>
//               {activeTab === "REMINDERS" && (
//                 <RemindersCard
//                   reminder_data={filteredReminders}
//                   filter={reminderFilter}
//                   setFilter={setReminderFilter}
//                 />
//               )}

//               {activeTab === "TASKS" && (
//                 <TaskSameDay
//                   tasks={filteredTasks}
//                   filter={taskFilter}
//                   setFilter={setTaskFilter}
//                   loading={loading}
//                   isMissed={false}
//                 />
//               )}

//               {activeTab === "Missed task" && (
//                 <TaskSameDay
//                   tasks={missedTasks}
//                   loading={loading}
//                   isMissed={true}
//                 />
//               )}
//             </Box>
//           </Box>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default LeadsDashboard;

