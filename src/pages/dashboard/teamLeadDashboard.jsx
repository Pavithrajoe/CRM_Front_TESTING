import React from "react";
import Sidebar from "@/components/common/sidebar";
import ProfileHeader from "@/components/common/ProfileHeader"; 
import TeamleadHeader from "@/components/dashboard/teamlead/tlHeader"; 
import KPIStats from "@/components/dashboard/teamlead/tlKPIcards";
import RemindersCard from "@/components/dashboard/teamlead/tlremindercard";
import LeadsTable from "@/components/dashboard/teamlead/tlLeadcard";
import DealsTable from "@/components/dashboard/teamlead/tlDealcard";
import OrganizationTable from "@/components/dashboard/teamlead/tlorgancard";
import ContactsTable from "@/components/dashboard/teamlead/tlcontactscard";

const LeadsDashboard = () => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <TeamleadHeader /> {/* My Profile / Team buttons */}
          <ProfileHeader />   {/* Bell icon and user profile */}
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-2 gap-6">
          <KPIStats />
          <RemindersCard />
          <LeadsTable />
          <DealsTable />
          <OrganizationTable />
          <ContactsTable />
        </div>
      </main>
    </div>
  );
};

export default LeadsDashboard;
