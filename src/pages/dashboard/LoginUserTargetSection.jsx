import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";

const MyTargetSection = () => {
  const [targets, setTargets] = useState([]);
  const [achievement, setAchievement] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [tRes, achRes] = await Promise.all([
        axios.get(ENDPOINTS.USER_TARGET, { headers }),
        axios.get(ENDPOINTS.USER_ACHIVEMENT, { headers }),
      ]);

      setTargets(tRes.data?.data || []);
      setAchievement(Number(achRes.data?.achieved_value || 0));
    } catch (err) {
      console.error("My target load error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="mt-6 text-gray-500">Loading target progress...</p>;
  }

  //  Total target
  const totalTarget = targets.reduce(
    (sum, t) => sum + Number(t.bsales_value || 0),
    0
  );

  if (totalTarget <= 0) {
  return null;
}

  const progressPercent =
    totalTarget > 0 ? Math.min((achievement / totalTarget) * 100, 100) : 0;

 

  //  Date 
  const displayDate = new Date().toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  

  return (
    <div className="mt-6 p-5 bg-white rounded-lg shadow-sm">

      {/* PROGRESS BAR */}
      <div className="relative group">
        <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden">
          <div
  className="h-full transition-all duration-700
             bg-gradient-to-b
             from-violet-500 via-violet-400 to-violet-200"
  style={{ width: `${progressPercent}%` }}
/>

        </div>

        {/*  HOVER TOOLTIP */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2
                        hidden group-hover:block
                        bg-black text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
          {progressPercent.toFixed(1)}% | {achievement} / {totalTarget}
        </div>
      </div>

      {/*  BOTTOM INFO ROW */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        {/* Left */}
        <span>
          <strong>Target:</strong> {totalTarget}
        </span>

        {/* Center */}
        <span className="text-gray-500">
          {displayDate}
        </span>

        {/* Right */}
        <span>
          <strong>Achieved:</strong> {achievement}
        </span>
      </div>

    </div>
  );
};

export default MyTargetSection;



