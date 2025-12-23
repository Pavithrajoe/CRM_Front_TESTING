import React, { useEffect, useState, useCallback } from "react";
import ProfileHeader from "@/Components/common/ProfileHeader";
import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
import RemindersCard from "@/Components/dashboard/teamlead/teamremindercard";
import LeadsTable from "@/Components/dashboard/teamlead/teamleadcard";
import LeadManagementCard from "@/Components/dashboard/teamlead/teamviewbarchart";
import TeamKPIStats from "@/Components/dashboard/teamlead/teamKPIcard";
import { ENDPOINTS } from "../../api/constraints";
import { jwtDecode } from "jwt-decode";


const TeamviewDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [teamDashboardData, setTeamDashboardData] = useState();

  // To fetch the current user id and token
  useEffect(() => {
    try {

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found.");
      const decoded = jwtDecode(token);
      if (!decoded.user_id) throw new Error("User ID missing in token.");
      setCurrentUserId(decoded.user_id);
      setCurrentToken(token);
    } catch (e) {
      setError(`Authentication error: ${e.message}`);
      setLoading(false);
    }
  }, []);

  const fetchTeamDashboardData = useCallback(async () => {
    if (!currentUserId || !currentToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${ENDPOINTS.MANAGER_REMINDER}/${currentUserId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error((await response.json()).message || "API error");

      const result = await response.json();
      console.log("the response data are:", result)

      setTeamDashboardData(result?.details)

    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentToken]);

  useEffect(() => {
    fetchTeamDashboardData();
  }, [fetchTeamDashboardData]);


  const leads = teamDashboardData?.lead || [];
  const teamMembers = teamDashboardData?.subordinates || [];
  const dealData = teamDashboardData?.deal || [];
  const childSubordinates = teamDashboardData?.childSubordinateIds || [];
  const leadData = leads.filter((item) => item.bisConverted === false);
  const userReminders = teamDashboardData?.usersReminder || [];
   const activeReminders = userReminders.filter(
        (reminder) => reminder.bactive === true
      );
  if (loading) {
    return (
      <main className="w-full flex-1 p-6  mt-[0px] min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">Loading dashboard data...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full flex-1 p-6 mt-[0px] min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600">Error: {error}</p>
        <p className="text-sm text-gray-500 mt-2">
          Please try logging in again or contact support if the issue persists.
        </p>
      </main>
    );
  }
  return (
    <main className="w-full flex-1 p-6 mt-[0px] min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <TeamleadHeader />
        <ProfileHeader />
      </div>

      {/* Dashboard Content */}

      {console.log("The dashboard data are:", )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeadManagementCard leads={leadData} team_members={teamMembers}  childSubordinates = {childSubordinates}  loading = {loading} error = {error} />
        <TeamKPIStats
          leadsArray={leads}
          subordinatesArray={teamMembers}
          dealCountForWon={dealData}
        />
        <LeadsTable leadsData={leadData} subordinatesData = {teamMembers} loading = {loading} error = {error}  />
        <RemindersCard remindersData={activeReminders} loading = {loading} error = {error} />
      </div>
    </main>
  );
};

export default TeamviewDashboard;
