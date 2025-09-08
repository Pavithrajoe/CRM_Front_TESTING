import React, { useEffect, useState } from "react";
import { ENDPOINTS } from "../../api/constraints";
import ProfileHeader from "@/Components/common/ProfileHeader";
import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
import LeadsTable from "@/Components/dashboard/teamlead/tlLeadcard";
import DealsTable from "@/Components/dashboard/teamlead/tlDealcard";

const ActiveLeadTab = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const userObj = JSON.parse(storedUser);
    setUser(userObj);

    // Show popup only if not already shown
    const hasSeenIntro = localStorage.getItem("hasSeenDashboardIntro");
    if (!hasSeenIntro) {
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

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);
       // console.log("✅ Dashboard Data:", data);
      } catch (error) {
        // console.error("❌ Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex mt-[-80px]">
      {/* Main Content */}
      <main className="w-full flex-1 p-6 mt-[80px] min-h-screen">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <TeamleadHeader />
          <ProfileHeader />
        </div>

        {/* Show Logged In User Info */}
        {/* {user && (
          <div className="mb-6 text-gray-800 text-lg font-medium">
            Welcome,{user.name}
            <span className="font-bold">{user.name || user.email}</span>!
            <br />
            <span className="text-sm text-gray-600">
              Role: {user.role || "N/A"}
            </span>
          </div>
        )} */}

        {/* Dashboard Content */}
        <div className="grid grid-cols-2 gap-6 ">
         
          <LeadsTable data={dashboardData?.details?.leads} />
          <DealsTable data={dashboardData?.details?.deals} />
          
        </div>

        {/* <div className="w-full mt6">
                  
                  <DealsTable data={dashboardData?.details?.deals} />
                </div> */}
      </main>

    </div>
  );
};

export default ActiveLeadTab;
