import React, { useState, useEffect } from "react";
import StatusKanbanTab from "../../Components/dashboard/teamlead/tlStatusKanbanBoard";
// import StatusKanbanTab from "/Components/dashboard/teamlead/tlstatusKanbanBoard";
import TeamleadHeader from "../../Components/dashboard/teamlead/tlHeader";
// import TeamleadHeader from "@/Components/dashboard/teamlead/tlHeader";
// import ProfileHeader from "@/Components/common/ProfileHeader";
import ProfileHeader from "../../Components/common/ProfileHeader";

const StatusKanbanPage = () => {
  const [activeTab, setActiveTab] = useState('status-kanban');
  const [dashboardData, setDashboardData] = useState(null);
  const [phoneActive, setPhoneActive] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setPhoneActive(parsedData?.phone_access === true);
    }
  }, []);

  return (
    <div className="flex mt-[-80px]">
      <main className="w-full flex-1 p-6 bg-gray-50 mt-[80px] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <TeamleadHeader />
          <ProfileHeader />
        </div>

        <div className="mt-4">
          {activeTab === 'status-kanban' && <StatusKanbanTab />}
        </div>
      </main>
    </div>
  );
};

export default StatusKanbanPage;
