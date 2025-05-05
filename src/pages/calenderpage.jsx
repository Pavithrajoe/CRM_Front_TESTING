import React from "react";
import ProgressBar from "../Components/common/ProgressBar";
import TabsBar from "../Components/common/TabsBar";
import ProfileHeader from "../Components/common/ProfileHeader";
import CalendarView from "@/components/CalendarView";
import GoogleMeet from "@/components/GoogleMeet";

const CalendarPage = () => {
  return (
    <>
      <ProfileHeader />

   

      
        <div className="w-full md:w-[80%] lg:w-[80%] xl:w-[100%] mx-auto mt-[40px]">
          <CalendarView />
        </div>

       
          <GoogleMeet />
        
   
    </>
  );
};

export default CalendarPage;
