import React, { useEffect, useState } from "react";
  import { ENDPOINTS  } from "../../api/constraints";
  import ProfileHeader from "@/components/common/ProfileHeader";
  import TeamleadHeader from "@/components/dashboard/teamlead/tlHeader";
  import KPIStats from "@/components/dashboard/teamlead/tlKPIcards";

  import RemindersCard from "@/components/dashboard/teamlead/tlremindercard";
  import LeadsTable from "@/components/dashboard/teamlead/tlLeadcard";
  import DealsTable from "@/components/dashboard/teamlead/tlDealcard";
 

  const LeadsDashboard = () => {
    const [user, setUser] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);


    useEffect(() => { 
      const storedUser = localStorage.getItem("user");
      const userObj = JSON.parse(storedUser); // convert to JS  



      console.log("Stored User:", userObj);
      // Check if user is logged in
    // Fetch dashboard data

      const fetchDashboardData = async () => {
        try {
          const response = await fetch(`${ENDPOINTS.DASHBOARD_USER}/${userObj.iUser_id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userObj.jwtToken}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch dashboard data");
          }

          const data = await response.json();
          console.log("Dashboard Data:", data);
          setDashboardData(data);
  if (dashboardData) {
    console.log("✅ Dashboard Data updated:", dashboardData);
  }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      }
      fetchDashboardData();

    }, []);


   
    

    return (
      <div className="flex mt-[-80px]">
        {/* Main Content */}
        <main className="w-full flex-1 p-6 bg-gray-50 mt-[80px] min-h-screen">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <TeamleadHeader />
            <ProfileHeader />
          </div>

          {/* Show Logged In User Info */}
          {user && (
            <div className="mb-6 text-gray-800 text-lg font-medium">
              Welcome, <span className="font-bold">{user.name || user.email}</span>!
              <br />
              <span className="text-sm text-gray-600">Role: {user.role || "N/A"}</span>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="grid grid-cols-2 gap-6">
          <KPIStats data={dashboardData?.details} />
            <RemindersCard reminder_data={dashboardData?.details.reminders} />
            <LeadsTable data={dashboardData?.details.leads} />
            <DealsTable  data={dashboardData?.details.deals}/>
            {/* <OrganizationTable />
            <ContactsTable /> */}
          </div>
        </main>
      </div>
    );
  };

  export default LeadsDashboard;