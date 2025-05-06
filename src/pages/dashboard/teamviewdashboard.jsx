import React from "react";
import ProfileHeader from "@/components/common/ProfileHeader"; 
import TeamleadHeader from "@/components/dashboard/teamlead/tlHeader"; 
import RemindersCard from "@/components/dashboard/teamlead/tlremindercard";
import LeadsTable from "@/components/dashboard/teamlead/tlLeadcard";
import LeadManagementCard from "@/components/dashboard/teamlead/teamviewbarchart"; 
import TeamKPIStats from "@/components/dashboard/teamlead/teamKPIcard";

const TeamviewDashboard = () => {
  return (
    <main className="w-full flex-1 p-6 bg-gray-50 mt-[0px] min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <TeamleadHeader />
        <ProfileHeader />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-2 gap-6">
        <LeadManagementCard />
        <TeamKPIStats />
        <LeadsTable />
        <RemindersCard />
      </div>
    </main>
  );
};

export default TeamviewDashboard;
