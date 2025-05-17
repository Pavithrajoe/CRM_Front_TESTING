import React from "react";
import { Users } from "lucide-react"; // optional icon from lucide-react



export default function KPIStats(data) {

// In future cases convert this into an function to fetch data from service class
console.log("KPI Data:", data);  // Log the data prop to check its value
const leads = data?.data?.leads || [];
const follow_ups = data?.data?.reminders || [];
const follow_ups_count = follow_ups?.length || 0;

let hotCount = 0;
let coldCount = 0;
leads?.forEach(lead => {
  const potential = lead.lead_potential?.clead_name;

  if (potential === 'HOT') { //Change to hot 
    hotCount++;
  } else if (potential === 'COLD') { //Change to cold
    coldCount++;
  }
}) || 0;


const kpiData = [
  {
    title: "Hot Leads",
    value: hotCount,
    color: "text-orange-500", 
  },
  {
    title: "Cold Leads",
    value: coldCount,
    color: "text-yellow-500",
  },
  {
    title: "Follow- Up",
    value:  follow_ups_count,
    color: "text-sky-500",
  },
  {
    title: "",  
    value: "",
    change: "",
    changeNote: "",
    color: "",
  },
];


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className="bg-white border rounded-md p-4 shadow-sm min-h-[120px] flex flex-col justify-between"
        >
          {kpi.title ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    {kpiData[index].title}
                  </h3>
                  <p className="text-xl font-bold mt-1">{kpiData[index].value}</p>
                </div>
                <div className={`text-2xl ${kpi.color}`}>
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="text-sm mt-4 flex items-center gap-1">
                <span
                  className={`${
                    kpi.isPositive ? "text-green-600" : "text-red-500"
                  } font-semibold`}
                >
                  {kpi.change}
                </span>
                <span className="text-gray-500">{kpi.changeNote}</span>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              {/* Empty Card */}
              No data
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
