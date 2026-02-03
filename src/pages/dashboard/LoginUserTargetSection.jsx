import React, { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";

const MyTargetSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMyTarget();
  }, []);

  const fetchMyTarget = async () => {
    try {
      setLoading(true);

      const headers = { Authorization: `Bearer ${token}` };
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const res = await axios.get( `${ENDPOINTS.USER_TARGET_ACHIEVEMENT}?month=${month}&year=${year}`,
        { headers }
      );


      setData(res.data?.data ?? null);
    } catch (err) {
      console.error("My target load error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="mt-6 text-gray-500">Loading target progress...</p>;

  if (!data || data.targetAssigned === false) {
    return <p className="mt-6 text-gray-500"></p>;
  }

  const displayDate = new Date(data.year, data.month - 1).toLocaleDateString(
    "en-IN",
    { month: "short", year: "numeric" }
  );

  return (
    <div className="mt-6 p-5 bg-white rounded-lg shadow-sm">
      {/* Progress bar */}
      <div className="relative group">
        <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-b from-violet-500 via-violet-400 to-violet-200 transition-all duration-700"
            style={{ width: `${Math.min(data.achievementPercent, 100)}%` }}
          />
        </div>

        <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block
                        bg-black text-white text-xs px-3 py-1 rounded-md shadow-lg">
          {data.achievementPercent}% | {data.achievedAmount} / {data.targetAmount}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span><strong>Target:</strong> {data.targetAmount}</span>
        <span className="text-gray-500">{displayDate}</span>
        <span><strong>Achieved:</strong> {data.achievedAmount}</span>
      </div>
    </div>
  );
};
export default MyTargetSection;