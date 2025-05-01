import React from "react";
import ProgressBar from "../Components/common/ProgressBar";
import TabsBar from "../Components/common/TabsBar";
import ProfileHeader from "../Components/common/ProfileHeader";
import RemainderForm from "@/components/RemainderForm";

const RemainderPage = () => {
  return (
    <>
     <ProfileHeader />
      <ProgressBar />
      <TabsBar />
   
    <div className="w-full max-w-3xl mx-auto mt-10 mr-10 shadow rounded bg-white">
      <RemainderForm />
    </div>
    </>
  );
};

export default RemainderPage;
