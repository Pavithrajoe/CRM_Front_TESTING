import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
} from "@mui/material";

import { ENDPOINTS } from "../../api/constraints";
import ProfileHeader from "@/Components/common/ProfileHeader";
import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
import KPIStats from "@/Components/dashboard/teamlead/tlKPIcards";
import RemindersCard from "@/Components/dashboard/teamlead/tlremindercard";
import TaskSameDay from "@/Components/common/taskSameDay";

const LeadsDashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]); 
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) return;

    const userObj = JSON.parse(storedUser);
    setUser(userObj);

    if (!localStorage.getItem("hasSeenDashboardIntro")) {
      setShowPopup(true);
      localStorage.setItem("hasSeenDashboardIntro", "true");
    }

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          `${ENDPOINTS.DASHBOARD_USER}/${userObj.iUser_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userObj.jwtToken}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    const fetchTasks = async () => {
      try {
        const response = await fetch(ENDPOINTS.DAILY_TASK, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(data?.data || data || []);
      } catch (error) {
        setTaskError(error.message);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchDashboardData();
    fetchTasks();
  }, []);

  const reminders = dashboardData?.details?.reminders || [];

  // IST date helpers
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

  // Filter same-day reminders count
  const todayRemindersCount = reminders.filter((reminder) => {
    if (!reminder.dremainder_dt) return false;
    const reminderDate = new Date(reminder.dremainder_dt);
    const istReminderDate = new Date(reminderDate.getTime() + 5.5 * 60 * 60 * 1000);
    return istReminderDate >= todayStart && istReminderDate <= todayEnd;
  }).length;

  // // Filter same-day tasks count
  // const todayTasksCount = tasks.filter((task) => {
  // //   if (!task.task_date) return false;
  // //   const taskDate = new Date(task.task_date);
  // //   const istTaskDate = new Date(taskDate.getTime() + 5.5 * 60 * 60 * 1000);
  // //   return istTaskDate >= todayStart && istTaskDate <= todayEnd;
  // // }).length;
  const todayTasks = tasks.filter((task) => {
  if (!task.task_date) return false;
  const taskDate = new Date(task.task_date);
  const istTaskDate = new Date(taskDate.getTime() + 5.5 * 60 * 1000 * 60); // shift to IST
  return istTaskDate >= todayStart && istTaskDate <= todayEnd;
});

const todayTasksCount = todayTasks.length;

  return (
    <div className="flex mt-[-80px]">
      <main className="w-full flex-1 p-6 mt-[80px] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <TeamleadHeader />
          <ProfileHeader />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* KPI Stats Card */}
          <Box
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
              p: 2,
              minHeight: "400px",
              overflowY: "auto",
            }}
          >
            <KPIStats data={dashboardData?.details} />
          </Box>

          {/* Reminders + Tasks */}
          <Box
            sx={{
              width: "100%",
              minHeight: "400px",
              bgcolor: "background.paper",
              borderRadius: 4,
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Tabs Header */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8f9fb", borderRadius: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="fullWidth"
              >
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderRadius: 2 }}>
                      Reminders
                      {todayRemindersCount > 0 && (
                        <Box
                          sx={{
                            bgcolor: "#1976d2",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            minWidth: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                          }}
                        >
                          {todayRemindersCount}
                        </Box>
                      )}
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      Tasks
                      {todayTasksCount > 0 && (
                        <Box
                          sx={{
                            bgcolor: "#d32f2f",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            minWidth: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                          }}
                        >
                          {todayTasksCount}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
<Box sx={{ overflowY: "auto", flexGrow: 1, px: 2, py: 1, height:"60vh", overflow: scroll }}>

  {/* Reminders Tab */}
  {activeTab === 0 && (
    <>
      <p className="text-gray-300 text-center w-full mt-10">
        Reminders are displayed based on a 24-hour validation period from the time they were created.
      </p>

      {todayRemindersCount > 0 ? (
        <RemindersCard reminder_data={reminders} />
      ) : (
        <Typography textAlign="center" mt={4} color="text.secondary" fontStyle="italic">
          No reminders for today 🎉
        </Typography>
      )}
    </>
  )}

  {/* Tasks Tab */}
  {activeTab === 1 && (
    <>
      <p className="text-gray-300 text-center w-full mt-10">
        Tasks are shown for 24 hours from their creation time.
      </p>

      {loadingTasks ? (
        <Typography textAlign="center" mt={4}>Loading tasks...</Typography>
      ) : taskError ? (
        <Typography textAlign="center" color="error">{taskError}</Typography>
      ) : (
        <TaskSameDay tasks={tasks.filter((task) => {
  if (!task.task_date) return false;
  const taskDate = new Date(task.task_date);
  const istTaskDate = new Date(taskDate.getTime() + 5.5 * 60 * 60 * 1000);
  return istTaskDate >= todayStart && istTaskDate <= todayEnd;
})} />

      )}
    </>
  )}

</Box>

          </Box>
        </div>
      </main>

      {/* Popup unchanged */}
      <Dialog open={showPopup} onClose={() => setShowPopup(false)}> {/* ... */} </Dialog>
    </div>
  );
};

export default LeadsDashboard;
