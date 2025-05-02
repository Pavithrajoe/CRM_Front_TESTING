// src/pages/LeadsDashboard.js
import React from "react";
import Sidebar from "@/components/common/sidebar";
import ProfileHeader from "@/components/common/ProfileHeader";
import KPIStats from "@/components/teamlead/tlKPIcards";
import RemindersCard from "@/components/teamlead/tlremindercard";
import LeadsTable from "@/components/teamlead/tlLeadcard";
import DealsTable from "@/components/teamlead/tlDealcard";
import OrganizationTable from "@/components/teamlead/tlorgancard";
import ContactsTable from "@/components/teamlead/tlcontactscard";

const LeadsDashboard = () => {
  return (
    <div className="flex ">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        {/* Profile Header */}
        <ProfileHeader />
        {/*  <LeadsTable /> */}

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
