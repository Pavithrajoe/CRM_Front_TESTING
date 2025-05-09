import React from "react";
import ProfileHeader from "@/components/common/ProfileHeader"; 
import TeamleadHeader from "@/components/dashboard/teamlead/tlHeader"; 
import { ENDPOINTS  } from "../../api/constraints";
import { useEffect, useState } from "react";
import RemindersCard from "@/components/dashboard/teamlead/tlremindercard";
import LeadsTable from "@/components/dashboard/teamlead/tlLeadcard";
import LeadManagementCard from "@/components/dashboard/teamlead/teamviewbarchart"; 
import TeamKPIStats from "@/components/dashboard/teamlead/teamKPIcard";

const TeamviewDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [reminder, setReminderData] = useState(null);

    useEffect(() => {
      const storedUser = localStorage.getItem("user");
      const userObj = JSON.parse(storedUser);
    
      console.log("Stored User:", userObj);
    
      const fetchDashboardData = async () => {
        try {
          const response = await fetch(`${ENDPOINTS.DASHBOARD_MANAGER}/${userObj.iUser_id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userObj.jwtToken}`,
            },
          });
    
          if (!response.ok) {
            throw new Error("Failed to fetch teams dashboard data");
          }
    
          const data = await response.json();
          console.log("Teams dashboard Data:", data);
          setDashboardData(data);
    
        } catch (error) {
          console.error("Error fetching teams dashboard data:", error);
        }
      };


      const fetchReminders = async () => {
        console.log("Fetching reminders...",ENDPOINTS.REMINDERS);
        try {
          const response = await fetch(`${ENDPOINTS.REMINDERS}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userObj.jwtToken}`,
            },
          });
    
          if (!response.ok) {
            throw new Error("Failed to fetch teams dashboard data");
          }
    
          const data = await response.json();
          console.log("Teams dashboard Data for reminder:", data);
          setReminderData(data);
    
        } catch (error) {
          console.error("Error fetching teams dashboard data:", error);
        }
      };



    
      fetchDashboardData();
      fetchReminders();
    }, []);
    

// console.log("Dashboard Data:", dashboardData);
    if (dashboardData) {
      console.log("✅ Dashboard Data updated:", dashboardData);
    }


    if (reminder) {
      console.log("✅ Reminder Data updated:", reminder.message);
    }



     const leadCount = dashboardData?.details?.filter(item => item.bisConverted === false).length || 0;
     const leadData = dashboardData?.details?.filter(item => item.bisConverted === false) || [];
     const dealCount = dashboardData?.details?.filter(item => item.bisConverted === true).length || 0;


    //  const hotCount = leads.filter(lead => lead.lead_status?.ilead_status_id === 1).length  || 0;
    //  const warmCount = leads.filter(lead => lead.lead_status?.ilead_status_id === 2).length   || 0;
    //  const coldCount = leads.filter(lead => lead.lead_status?.ilead_status_id === 3).length || 0;

      // console.log("🔥 Hot Leads:", hotCount);
      // console.log("🌤️ Warm Leads:", warmCount);
      // console.log("❄️ Cold Leads:", coldCount);
          
     console.log("Lead Count:", leadCount);
     console.log("Deal Count:", dealCount);

  return (
    <main className="w-full flex-1 p-6 bg-gray-50 mt-[0px] min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <TeamleadHeader />
        <ProfileHeader />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-2 gap-6">
        <LeadManagementCard   />
        <TeamKPIStats leadCount={leadCount} dealCount={dealCount} />
        <LeadsTable data={leadData} />
        <RemindersCard reminder_data ={reminder?.message} />
      </div>
    </main>
  );
};

export default TeamviewDashboard;
