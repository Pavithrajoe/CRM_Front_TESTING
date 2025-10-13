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
import { jwtDecode } from 'jwt-decode';

const COMPANY_ID = import.meta.env.VITE_XCODEFIX_FLOW;

const LeadsDashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [missedTasks, setMissedTasks] = useState([]);
  const [taskMissedStatus, setTaskMissedStatus] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leadsError, setLeadsError] = useState(null);


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);
    if (!storedUser || !token) return;

    const userObj = JSON.parse(storedUser);
    setUser(userObj);

    // Decode token 
    const decoded = jwtDecode(token);
    console.log("Decoded JWT:", decoded);
    const companyId = decoded.company_id;
    console.log("Company ID from token:", companyId);
    const userId = decoded.user_id;
    console.log("User ID from token:", userId);

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
        // console.error("Error fetching dashboard data:", error); // Console clear
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

    const fetchCompanyAndMissedTasks = async () => {
      try {
        const companyRes = await fetch(`${ENDPOINTS.COMPANY}/${userObj.iCompany_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const companyData = await companyRes.json();
        console.log("Company data fetched for missed tasks:", companyData);
        const statusId = companyData?.result?.companySettings?.task_missed_status;
        setTaskMissedStatus(statusId);

        const taskRes = await fetch(
           `${ENDPOINTS.GET_FILTER_TASK}/${userObj.iUser_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const taskData = await taskRes.json();
        console.log("All tasks fetched for missed tasks filtering:", taskData);
        const missed = taskData?.filter(
          (task) => task.istatus_id === statusId
        ) || [];
        setMissedTasks(missed);
      } catch (error) {
        // console.error("Error fetching missed tasks:", error); // Console clear
      }
    };

    const fetchLeads = async (userId, token) => {
      if (!userId) {
        setLoadingLeads(false);
        setLeadsError("User ID is required to fetch specific KPI data.");
        return;
      }

      setLoadingLeads(true);
      setLeadsError(null);
      try {
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await fetch(`${ENDPOINTS.LEAD}${userId}?page=1&limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const jsonRes = await response.json();
        if (!response.ok) throw new Error(jsonRes.message || "API error");

        setLeads(jsonRes.details || []);
      } catch (e) {
        setLeadsError(e.message);
        // console.error("Error fetching leads:", e); // Console clear
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchDashboardData();
    fetchTasks();
    fetchCompanyAndMissedTasks();
    fetchLeads(userId, token); 
  }, []); 

  const reminders = dashboardData?.details?.reminders || [];
  const companyId = user?.iCompany_id;

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

  const isTaskExpired = (task) => {
    if (!task.task_date) return false;
    const taskDate = new Date(task.task_date);
    const istTaskDate = new Date(taskDate.getTime() + 5.5 * 60 * 60 * 1000);
    return istTaskDate < todayStart;
  };

  // Filter same-day reminders count
  const todayRemindersCount = reminders.filter((reminder) => {
    if (!reminder.dremainder_dt) return false;
    const reminderDate = new Date(reminder.dremainder_dt);
    const istReminderDate = new Date(
      reminderDate.getTime() + 5.5 * 60 * 60 * 1000
    );
    return istReminderDate >= todayStart && istReminderDate <= todayEnd;
  }).length;

  // Filter today's tasks
  const todayTasks = tasks.filter((task) => {
    if (!task.task_date) return false;
    const taskDate = new Date(task.task_date);
    const istTaskDate = new Date(taskDate.getTime() + 5.5 * 60 * 60 * 1000);
    return istTaskDate >= todayStart && istTaskDate <= todayEnd;
  });

  const todayTasksCount = todayTasks.length;

  // Filter expired tasks
  const expiredTasks = tasks.filter(isTaskExpired);
  const expiredTasksCount = expiredTasks.length;

  // Tabs visibility logic
  const showRemindersTab = companyId !== Number(COMPANY_ID); 
  console.log("Company ID:", companyId, "Show Reminders Tab:", showRemindersTab);
  const showExpiredTasksTab = companyId == Number(COMPANY_ID);
  console.log("Company ID:", companyId, "Show Expired Tasks Tab:", showExpiredTasksTab);
  // const showRemindersTab = companyId !== 15; 
  // const showExpiredTasksTab = companyId == 15;

  const tabIndices = {};
  let currentTabIndex = 0;
  if (showRemindersTab) tabIndices.Reminders = currentTabIndex++;
  tabIndices.Tasks = currentTabIndex++;
  if (showExpiredTasksTab) tabIndices.ExpiredTasks = currentTabIndex++;

  // Helper to render tab content
  const TabPanel = ({ index, children }) => (
    <div role="tabpanel" hidden={activeTab !== index}>
      {activeTab === index && <Box sx={{ py: 1 }}>{children}</Box>}
    </div>
  );

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
            <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              {loadingLeads ? 'Loading Leads...' : leadsError ? `Leads Error: ${leadsError}` : `Total Leads Fetched: ${leads.length}`}
            </Typography>
          </Box>

          {/* Reminders + Tasks + Missed Tasks */}
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
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: "#f8f9fb",
                borderRadius: 2,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="fullWidth"
              >
                {showRemindersTab && (
                  <Tab
                    label={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderRadius: 2,
                        }}
                      >
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
                )}

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

                {/* Missed Tasks Tab */}
                {showExpiredTasksTab && (
                  <Tab
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        Missed Tasks
                        {missedTasks.length > 0 && (
                          <Box
                            sx={{
                              bgcolor: "orange",
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
                            {missedTasks.length}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                )}
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box
              sx={{
                overflowY: "auto",
                flexGrow: 1,
                px: 2,
                py: 1,
                height: "60vh",
                overflow: "scroll",
              }}
            >
              {tabIndices.Reminders !== undefined && (
                <TabPanel index={tabIndices.Reminders}>
                  <p className="text-gray-300 text-center w-full mt-10">
                    Reminders are displayed based on a 24-hour validation period from
                    the time they were created.
                  </p>
                  {todayRemindersCount > 0 ? (
                    <RemindersCard reminder_data={reminders} />
                  ) : (
                    <Typography
                      textAlign="center"
                      mt={4}
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      No reminders for today 🎉
                    </Typography>
                  )}
                </TabPanel>
              )}

              <TabPanel index={tabIndices.Tasks}>
                <p className="text-gray-300 text-center w-full mt-10">
                  Tasks are shown for 24 hours from their creation time.
                </p>
                {loadingTasks ? (
                  <Typography textAlign="center" mt={4}>
                    Loading tasks...
                  </Typography>
                ) : taskError ? (
                  <Typography textAlign="center" color="error">
                    {taskError}
                  </Typography>
                ) : (
                  <TaskSameDay tasks={todayTasks} />
                )}
              </TabPanel>

              {/* Missed Tasks Tab Content */}
              {tabIndices.ExpiredTasks !== undefined && (
                <TabPanel index={tabIndices.ExpiredTasks}>
                  <p className="text-gray-300 text-center w-full mt-10">
                    These are the missed tasks (based on company settings).
                  </p>
                  {loadingTasks ? (
                    <Typography textAlign="center" mt={4}>
                      Loading missed tasks...
                    </Typography>
                  ) : taskError ? (
                    <Typography textAlign="center" color="error">
                      {taskError}
                    </Typography>
                  ) : missedTasks.length > 0 ? (
                    <TaskSameDay tasks={missedTasks} isMissedView={true} />
                  ) : (
                    <Typography
                      textAlign="center"
                      mt={4}
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      No missed tasks found for the selected status 🎉
                    </Typography>
                  )}
                </TabPanel>
              )}
            </Box>
          </Box>
        </div>
      </main>
    </div>
  );
};

export default LeadsDashboard;

