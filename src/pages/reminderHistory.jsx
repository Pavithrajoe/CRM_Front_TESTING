import React from "react";
import ProgressBar from "../Components/common/ProgressBar";
import TabsBar from "../Components/common/TabsBar";
import ProfileHeader from "../Components/common/ProfileHeader";
import AllReminders from "../Components/AllReminders";

import ProfileWithHistoryCard from "@/components/common/ProfileWithHistoryCard"; 


const RemainderHistory = () => {
  return (
    <>
     <ProfileHeader />
     
     <div className=" top-[] ms-[-650px] right-0">
      <ProgressBar />
      </div>
      <div className="  top-[] ms-[] right-0">
      <TabsBar />
      </div>
      <div className="flex px-2 gap-4">
        {/* LEFT: Profile + History */}
        <div className="w-[550px] h-100vh">
          <ProfileWithHistoryCard />
        </div>
    <div className="w-full mx-auto mr-10 mt-[40px] shadow rounded bg-white">
      <AllReminders />
    </div>
    </div>
    </>
  );
};

export default RemainderHistory;
