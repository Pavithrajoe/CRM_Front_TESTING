
import React, {  } from "react";
import ProfileHeader from "../../Components/common/ProfileHeader"; 
import CompanyKPICards from "../../Components/dashboard/company/companyKPIcards";
import PotentialChart from "../../Components/dashboard/company/potentialchart";
import LeadStatusChart from "../../Components/dashboard/company/leadStatus";

export default function CompanyDashboard() {
//   const [dashboardData, setDashboardData] = useState(null);

  return (
    <div className="flex mt-[-80px]">
      <main className="w-full flex-1 p-6 mt-[80px] min-h-screen">
        <ProfileHeader />

        <div className="space-y-4 p-4 min-h-screen">
          {/* Top Grid: Cards and Potential Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <CompanyKPICards />
            </div>

            <PotentialChart />
          </div>

          <LeadStatusChart />
        </div>
      </main>
    </div>
  );
}