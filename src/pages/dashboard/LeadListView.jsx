import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/common/sidebar";
import ProfileHeader from "@/components/common/ProfileHeader";
import LeadToolbar from "@/Components/dashboard/LeadToolbar";
import { Plus, ListFilter, SlidersHorizontal, LayoutGrid } from "lucide-react";

const LeadListViewPage = () => {
  const [leads, setLeads] = useState([]);

    // Replace this with an API call later
    

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-gray-50 min-h-screen p-6">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold mt-[-20px] text-gray-800">Lead Management</h1>
          </div>
          <div className="ml-auto">
            <ProfileHeader />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center mt-[-30px] gap-4 mb-4">
          <LeadToolbar />
        </div>

      </main>
    </div>
  );
};

export default LeadListViewPage;
