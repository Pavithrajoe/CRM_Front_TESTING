import React, { useEffect, useState, useMemo } from "react";
import { Dialog, Tabs, Tab, Box, Typography } from "@mui/material";
import { ENDPOINTS } from "../../api/constraints";
import ProfileHeader from "@/Components/common/ProfileHeader";
import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
import KPIStats from "@/Components/dashboard/teamlead/tlKPIcards";
import RemindersCard from "@/Components/dashboard/teamlead/tlremindercard";
import TaskSameDay from "@/Components/common/taskSameDay";

const LeadsDashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [allTasks, setAllTasks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  const XCODEFIX_FLOW = Number(import.meta.env.VITE_XCODEFIX_FLOW);

  const user_attributes = useMemo(() => {
    return JSON.parse(localStorage.getItem("user_attributes")) || [];
  }, []);

  const allowedTabs = useMemo(() => {
    const requiredAttributes = ["REMINDERS", "TASKS", "Missed task"];
    return user_attributes.filter(
      (attr) => attr.bactive && requiredAttributes.includes(attr.attribute_name)
    );
  }, [user_attributes]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) return;

    const userObj = JSON.parse(storedUser);
    setUser(userObj);

    if (!activeTab && allowedTabs.length > 0) {
      setActiveTab(allowedTabs[0].attribute_name);
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // 1. Fetch Dashboard (KPIs & Reminders)
        const dashRes = await fetch(`${ENDPOINTS.DASHBOARD_USER}/${userObj.iUser_id}`, { headers });
        const dashData = await dashRes.json();
        setDashboardData(dashData);

        // 2. Fetch ALL Tasks from the Single Filter API
        const taskRes = await fetch(`${ENDPOINTS.GET_FILTER_TASK}/${userObj.iUser_id}`, { headers });
        const taskData = await taskRes.json();
        
        // Sort all data latest first immediately
        const sortedData = (taskData?.data || []).sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
        setAllTasks(sortedData);

      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [allowedTabs]);

  // Derived Data:
  // Missed = Status is 1
  const missedTasks = useMemo(() => allTasks.filter(t => t.istatus_id === 1), [allTasks]);
  // Regular Tasks = Status is NOT 1
  const regularTasks = useMemo(() => allTasks.filter(t => t.istatus_id !== 1), [allTasks]);
  const reminders = dashboardData?.details?.reminders || [];
  
  const getTabUI = (attrName) => {
    const isSpecialCompany = user?.iCompany_id === XCODEFIX_FLOW;
    let label = "";
    let count = 0;
    let color = "#1976d2"; 

    if (attrName === "REMINDERS") {
      label = "Reminders";
      count = reminders.length;
    } else if (attrName === "TASKS") {
      label = isSpecialCompany ? "Follow up" : "Tasks";
      count = regularTasks.length; 
    } else if (attrName === "Missed task") {
      label = isSpecialCompany ? "Missed Follow up" : "Missed Tasks";
      count = missedTasks.length;
      color = "#d32f2f";
    }
    return { label, count, color };
  };

  return (
    <div className="flex mt-[-80px]">
      <main className="w-full flex-1 p-6 mt-[80px] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <TeamleadHeader />
          <ProfileHeader />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Box sx={{ bgcolor: "white", borderRadius: 2, p: 2, boxShadow: "0px 2px 8px rgba(0,0,0,0.1)" }}>
            <KPIStats data={dashboardData?.details} />
          </Box>

          <Box sx={{ bgcolor: "white", borderRadius: 4, boxShadow: "0px 2px 8px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", minHeight: "450px" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8f9fb" }}>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
                {allowedTabs.map((tab) => {
                  const ui = getTabUI(tab.attribute_name);
                  return (
                    <Tab key={tab.attribute_name} value={tab.attribute_name} label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <span className="font-semibold text-xs sm:text-sm">{ui.label}</span>
                        {ui.count > 0 && (
                          <Box sx={{ bgcolor: ui.color, color: "white", fontSize: "0.7rem", minWidth: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", px: 0.5 }}>
                            {ui.count}
                          </Box>
                        )}
                      </Box>
                    } />
                  );
                })}
              </Tabs>
            </Box>

            <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto", maxHeight: "65vh" }}>
              {activeTab === "REMINDERS" && (
                reminders.length > 0 ? <RemindersCard reminder_data={reminders} /> : <Typography align="center" mt={10} color="text.secondary">No reminders today.</Typography>
              )}

              {activeTab === "TASKS" && (
                <TaskSameDay tasks={regularTasks} isMissed={false} loading={loading} />
              )}

              {activeTab === "Missed task" && (
                <TaskSameDay tasks={missedTasks} isMissed={true} loading={loading} />
              )}
            </Box>
          </Box>
        </div>
      </main>
    </div>
  );
};

export default LeadsDashboard;

