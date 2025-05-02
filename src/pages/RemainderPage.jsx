import React from "react";
import ProgressBar from "../Components/common/ProgressBar";
import TabsBar from "../Components/common/TabsBar";
import ProfileHeader from "../Components/common/ProfileHeader";
import RemainderForm from "@/components/RemainderForm";

const RemainderPage = () => {
  return (
    <>
     <ProfileHeader />
     <div className="fixed top-[70px] ms-[-550px] right-0">
      <ProgressBar />
      </div>
      <div className=" fixed top-[150px] ms-[-570px] right-0">
      <TabsBar />
      </div>
   
    <div className="w-full max-w-4xl mx-auto mt-[180px] mr-10 shadow rounded bg-white">
      <RemainderForm />
    </div>
    </>
  );
};

export default RemainderPage;
