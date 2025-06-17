import React from "react";
import ProfileHeader from "@/Components/common/ProfileHeader";
import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
import RemindersCard from "@/Components/dashboard/teamlead/teamremindercard";
import LeadsTable from "@/Components/dashboard/teamlead/teamleadcard";
import LeadManagementCard from "@/Components/dashboard/teamlead/teamviewbarchart";
import TeamKPIStats from "@/Components/dashboard/teamlead/teamKPIcard";

const TeamviewDashboard = ({
  dashboardData,    
  reminders,   
  loading,           
  error          
}) => {

 
  const leads = dashboardData?.details?.leads || [];
  const teamMembers = dashboardData?.details?.subordinateNames || [];

  const leadCount = leads.filter(item => item.bisConverted === false).length;
  const leadData = leads.filter(item => item.bisConverted === false);
  const dealCount = leads.filter(item => item.bisConverted === true).length;
  const hotCount = leads.filter(lead => lead.lead_potential?.clead_name === "HOT").length;
  const coldCount = leads.filter(lead => lead.lead_potential?.clead_name === "COLD").length;
  const reminderMessage = reminders?.message || []; 
  if (loading) {
    return (
      <main className="w-full flex-1 p-6 bg-gray-50 mt-[0px] min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">Loading dashboard data...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full flex-1 p-6 bg-gray-50 mt-[0px] min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600">Error: {error}</p>
        <p className="text-sm text-gray-500 mt-2">Please try logging in again or contact support if the issue persists.</p>
      </main>
    );
  }

  
  return (
    <main className="w-full flex-1 p-6 bg-gray-50 mt-[0px] min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <TeamleadHeader />
        <ProfileHeader />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeadManagementCard leads={leadData} team_members={teamMembers} />
        <TeamKPIStats
          leadCount={leadCount}
          dealCount={dealCount}
          hotLeadCount={hotCount}
          coldLeadCount={coldCount}
        />
        <LeadsTable data={leadData} />
        <RemindersCard reminder_data={reminderMessage} />
      </div>
    </main>
  );
};

export default TeamviewDashboard;