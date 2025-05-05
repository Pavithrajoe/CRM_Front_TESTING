import React from "react";
import ProgressBar from "../Components/common/ProgressBar";
import TabsBar from "../Components/common/TabsBar";
import ProfileHeader from "../Components/common/ProfileHeader";
import RemainderForm from "@/components/RemainderForm";
import ProfileWithHistoryCard from "@/components/common/ProfileWithHistoryCard"; 


const RemainderPage = () => {
  return (
    <>
     <ProfileHeader />
     
     <div className="ms-[-670px]">
      <ProgressBar />
      </div>
      <div className="ms-[30px]">
      <TabsBar />
      </div>
      <div className="flex px-2 gap-4">
        {/* LEFT: Profile + History */}
        <div className="w-[550px] h-100vh mt-[20px]">
          <ProfileWithHistoryCard />
        </div>
    <div className="w-[1300px] h-100vh ms-5 mt-[40px] shadow rounded bg-white">
      <RemainderForm />
    </div>
    </div>
    </>
  );
};

export default RemainderPage;
