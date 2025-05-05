import React from "react";
import Sidebar from "@/components/common/sidebar";
import ProfileHeader from "@/components/common/ProfileHeader";
import NewComment from "@/components/LeadManage/NewComments";

const LeadsManagePage = () => {
  return (
    <div className="flex">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 bg-gray-50 min-h-screen p-6">
        {/* Header section: Title left, ProfileHeader right */}
        <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mt-0">Lead Management</h1>
            <ProfileHeader />
        </div>

        {/* Additional content goes here */}
        <div>
          {/* Content section */}
          < NewComment />
        </div>
      </main>
    </div>
  );
};

export default LeadsManagePage;
