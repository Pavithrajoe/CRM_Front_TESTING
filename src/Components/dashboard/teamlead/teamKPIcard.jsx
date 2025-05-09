import React from "react";
import { Users } from "lucide-react";


export default function TeamKPIStats({ leadCount, dealCount, hotLeadCount, coldLeadCount }) {

  const kpiData = [
    { 
      title: "Leads Count",
      value: leadCount ,
      colorStart: "#6CCF00", // darker green
      colorEnd: "#3CB043",
      iconBg: "bg-green-500",
    },
    {
      title: "Deals Count",
      value: dealCount,
      colorStart:  "#8E24AA", // darker purple
      colorEnd: "#9C27B0",
      iconBg: "bg-purple-500",
    },
    {
      title: "Hot Leads",
      value: hotLeadCount,
      colorStart: "#FF7043", // darker orange,
      colorEnd: "#FF5722",
      iconBg: "bg-orange-500",
    },
    {
      title: "Cold Leads",
      value: coldLeadCount,
      colorStart: "#1E88E5", // darker blue
      colorEnd: "#2196F3",
      iconBg: "bg-sky-500",
    },
  ];

  

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className="relative bg-white rounded-xl border shadow-sm p-4 overflow-hidden h-[160px]"
        >
          {/* Top Content */}
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h3 className="text-sm text-gray-600">{kpi.title}</h3>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </div>
            <div className={`rounded-full p-2 ${kpi.iconBg}`}>
              <Users className="text-white w-5 h-5" />
            </div>
          </div>

          {/* Stylish Wave */}
          <div className="absolute bottom-0 left-0 w-full h-[80px] z-0">
            <svg
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={kpi.colorStart} stopOpacity="1" />
                  <stop offset="100%" stopColor={kpi.colorEnd} stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M0,40 C120,80 180,0 300,40 C380,70 420,10 500,40 L500,150 L0,150 Z"
                fill={`url(#grad-${index})`}
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}