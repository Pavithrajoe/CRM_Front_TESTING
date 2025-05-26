import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";

export default function KPIStats(data) {
  console.log("KPI Data:", data);

  const [hotCount, setHotCount] = useState(0);
  const [warmCount, setWarmCount] = useState(0);
  const [coldCount, setColdCount] = useState(0);
  const [wonCount, setWonCount] = useState(0);

  const leads = data?.data?.leads || [];

  useEffect(() => {
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let won = 0;

    leads.forEach(lead => {
      const potential = lead.lead_potential?.clead_name;
      const status = lead.lead_status?.clead_name;

      if (potential === "HOT") {
        hot++;
      } else if (potential === "WARM") {
        warm++;
      } else if (potential === "COLD") {
        cold++;
      }

      if (status === "Won") {
        won++;
      }
    });

    setHotCount(hot);
    setWarmCount(warm);
    setColdCount(cold);
    setWonCount(won);
  }, [leads]); // Changed from [data] to [leads]

  const kpiData = [
    {
      title: "Hot Leads",
      value: hotCount,
      color: "text-red-500",
    },
    {
      title: "Warm Leads",
      value: warmCount,
      color: "text-orange-500",
    },
    {
      title: "Cold Leads",
      value: coldCount,
      color: "text-blue-500",
    },
    {
      title: "Total Won",
      value: wonCount,
      color: "text-green-600",
    },
  ];

  if (leads.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-lg">
        No data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className="bg-white border rounded-md p-4 shadow-sm min-h-[120px] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                {kpi.title}
              </h3>
              <p className="text-xl font-bold mt-1">{kpi.value}</p>
            </div>
            <div className={`text-2xl ${kpi.color}`}>
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}