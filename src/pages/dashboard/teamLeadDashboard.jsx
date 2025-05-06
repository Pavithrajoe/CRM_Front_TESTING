import React, { useEffect, useState } from "react";
import ProfileHeader from "@/components/common/ProfileHeader";
import TeamleadHeader from "@/components/dashboard/teamlead/tlHeader";
import KPIStats from "@/components/dashboard/teamlead/tlKPIcards";
import RemindersCard from "@/components/dashboard/teamlead/tlremindercard";
import LeadsTable from "@/components/dashboard/teamlead/tlLeadcard";
import DealsTable from "@/components/dashboard/teamlead/tlDealcard";
import OrganizationTable from "@/components/dashboard/teamlead/tlorgancard";
import ContactsTable from "@/components/dashboard/teamlead/tlcontactscard";

const LeadsDashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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
          <KPIStats />
          <RemindersCard />
          <LeadsTable />
          <DealsTable />
          {/* <OrganizationTable />
          <ContactsTable /> */}
        </div>
      </main>
    </div>
  );
};

export default LeadsDashboard;
