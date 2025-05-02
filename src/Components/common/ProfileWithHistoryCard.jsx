import React from "react";
import ProfileCard from "@/components/common/ProfileCard"; // adjust path
import HistoryPage from "@/components/common/HistoryPage"; // adjust path

const ProfileWithHistoryCard = () => {
  return (
    <div className="max-w-[350px] h-[780px] mt-[-150px] mx-auto p-4 bg-white rounded-xl shadow-lg space-y-6">
      <ProfileCard />
      <div className="border-t pt-4">
        <HistoryPage />
      </div>
    </div>
  );
};

export default ProfileWithHistoryCard;

