import React from "react";
import ProgressBar from "../Components/common/ProgressBar";
import TabsBar from "../Components/common/TabsBar";
import ProfileHeader from "../Components/common/ProfileHeader";
import CalendarView from "@/components/CalendarView";
import GoogleMeet from "@/components/GoogleMeet";



const RemainderPage = () => {
  return (
    <>
     <ProfileHeader />
     
     <div className="ms-[-900px]">
      <ProgressBar />
      </div>
      <div className=" ms-[-200px]">
      <TabsBar />
      </div>
      <div className="flex px-2 gap-4">
    
    <div className="w-full h-100vh mx-auto mr-10 mt-[40px] shadow rounded bg-white">
      <CalendarView />
      <GoogleMeet />
    </div>
    </div>
    </>
  );
};

export default RemainderPage;
