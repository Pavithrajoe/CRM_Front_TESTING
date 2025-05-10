import React from "react";
import ProfileHeader from "../Components/common/ProfileHeader";
import CalendarView from "../../Components/CalendarView";
import GoogleMeet from "../../Components/GoogleMeet";

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
