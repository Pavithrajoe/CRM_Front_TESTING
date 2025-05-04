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
     
     <div className="ms-[-700px]">
      <ProgressBar />
      </div>
      <div className="">
      <TabsBar />
      </div>
      <div className="flex px-2 gap-4">
        {/* LEFT: Profile + History */}
        <div className="w-[550px]  min-h-screen">
          <ProfileWithHistoryCard />
        </div>
        <div className="w-full h-100vh mx-auto ms-10 mr-10 mt-[40px] shadow rounded bg-white">
          <RemainderForm />
        </div>
      </div>
    </>
  );
};

export default RemainderPage;
