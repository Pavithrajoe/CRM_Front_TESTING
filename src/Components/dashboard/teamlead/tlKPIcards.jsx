import React from "react";
import { Users } from "lucide-react"; // optional icon from lucide-react

const kpiData = [
  {
    title: "Hot Leads",
    value: "2200",
    change: "+1.09%",
    changeNote: "than last Month",
    isPositive: true,
    color: "text-orange-500",
  },
  {
    title: "Cold Leads",
    value: "70.23%",
    change: "0.96%",
    changeNote: "than last month",
    isPositive: true,
    color: "text-yellow-500",
  },
  {
    title: "Follow- Up",
    value: "800",
    change: "-0.2%",
    changeNote: "than last month",
    isPositive: false,
    color: "text-sky-500",
  },
  {
    title: "",
    value: "",
    change: "",
    changeNote: "",
    isPositive: true,
    color: "",
  },
];

export default function KPIStats() {
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
                    {kpi.title}
                  </h3>
                  <p className="text-xl font-bold mt-1">{kpi.value}</p>
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
