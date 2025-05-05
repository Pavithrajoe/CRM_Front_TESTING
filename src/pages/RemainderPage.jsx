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

      {/* Progress Bar */}
      <div className="ms-[-670px]">
        <ProgressBar />
      </div>

      {/* Tabs Bar */}
      <div className="ms-[30px]">
        <TabsBar />
      </div>

      {/* Main Content Section */}
      <div className="flex px-2 gap-4">
        {/* LEFT: Profile + History */}
        <div className="w-[550px] min-h-screen mt-[20px]">
          <ProfileWithHistoryCard />
        </div>
<<<<<<< HEAD
    <div className="w-[1300px] ms-5 mt-[40px] shadow rounded bg-white">
      <RemainderForm />
    </div>
    </div>
=======

        {/* RIGHT: Remainder Form */}
        <div className="w-full mx-auto ms-10 mr-10 mt-[40px] shadow rounded bg-white">
          <RemainderForm />
        </div>
      </div>
>>>>>>> c92930d46b706056d6fdf486f7bf59c6dcdb1c08
    </>
  );
};

export default RemainderPage;
