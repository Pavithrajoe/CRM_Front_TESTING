import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../api/constraints"; 

// 1. New Utility Function to assign colors based on POSITION/INDEX
const getPotentialColor = (index) => {
  switch (index) {
    case 0: // 1st dynamic potential
      return { color: "text-red-600", bgColor: "bg-red-400" };
    case 1: // 2nd dynamic potential
      return { color: "text-orange-600", bgColor: "bg-amber-300" };
    case 2: // 3rd dynamic potential
      return { color: "text-blue-600", bgColor: "bg-blue-400" };
    default:
      // Default colour
      return { color: "text-gray-700", bgColor: "bg-stone-300" };
  }
};

export default function User_Overview_KPIStats({ userId }) { 
  const [wonCount, setWonCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0); 
  const [lostCount, setLostCount] = useState(0);
  const [websiteLeadCount, setWebsiteLeadCount] = useState(0);
  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [dynamicPotentials, setDynamicPotentials] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKPIStats = async () => {
      if (!userId) {
        setLoading(false);
        setError("User ID is required to fetch specific KPI data.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        const response = await fetch(`${ENDPOINTS.LEADS_COUNT_BY_USER_ID}${userId}`, { 
          headers: { Authorization: `Bearer ${token}` },
        });
        const jsonRes = await response.json();
        
        if (!response.ok) {
          // Specific handling for 401 Unauthorized
          if (response.status === 401) {
            navigate("/"); 
            throw new Error("Session expired or unauthorized.");
          }
          throw new Error(jsonRes.message || `API Error: ${response.status}`);
        }

        // BINDING DATA TO STATE
        const data = jsonRes.details;
        // console.log("Binding data: ", data)
        
        setTotalLeadCount(data.totalLeads || 0);
        setWonCount(data.totalWon || 0);
        setLostCount(data.totalLost || 0);
        setActiveCount(data.totalActiveLeads || 0); 
        setWebsiteLeadCount(data.totalWebsiteLeads || 0);
        
        // Extract and set dynamic potentials
        const potentials = [
          data.dynamic_poten_1,
          data.dynamic_poten_2,
          data.dynamic_poten_3,
        ].filter(p => p && p.name); 
        
        setDynamicPotentials(potentials);

        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    fetchKPIStats();
  }, [userId, navigate]); 


  // Static/Core KPI data
  const staticKpiData = [
    { title: "Total Leads", value: totalLeadCount, bgColor: "bg-stone-400" },
    { title: "Active Leads", value: activeCount, bgColor: "bg-pink-300" }, 
    { title: "Website Leads", value: websiteLeadCount, bgColor: "bg-orange-300" }, 
    { title: "Total Lost", value: lostCount, bgColor: "bg-purple-400" },
    { title: "Total Won", value: wonCount, color: "text-green-600", bgColor: "bg-green-400" }, 
  ];

  // Dynamic Potential KPI data 
  const potentialKpiData = dynamicPotentials.map((p, index) => {
    const colorStyle = getPotentialColor(index);     // Assign colors based on the index 
    
    return {
      title: p.name,
      value: p.count,
      color: colorStyle.color,
      bgColor: colorStyle.bgColor
    };
  });

  //  Combine the arrays for the two-row layout (4 + 4)
  const kpiData = [
    staticKpiData[0], // Total Leads
    staticKpiData[1], // Active Leads
    staticKpiData[2], // Website Leads
    staticKpiData[3], // Total Lost
    
    ...potentialKpiData, //  Potentials (1st = Red, 2nd = Orange, 3rd = Blue)
    staticKpiData[4] // Total Won
    
  ].slice(0, 8); 

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8 text-lg font-medium">
        Loading KPI data for user {userId}... 🚀
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-red-500 py-8 text-lg font-medium">
        Error fetching KPI data: {error}
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6"> 
        
        {/* Title for the First Row */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-tight border-b pb-2">
            Core Lead Metrics
        </h2>

        {/* First row: 4 Core KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6"> 
          {kpiData.slice(0, 4).map((kpi, index) => (
            <div
              key={index}
              className={`border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer ${kpi.bgColor}`}
            >
              <h3 className="text-lg text-center font-bold text-gray-900 mb-1 tracking-tight">
                {kpi.title}
              </h3>
              <p className="text-2xl font-bold text-center text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Title for the Second Row */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-tight border-b pb-2 pt-6">
            Lead Potential & Outcomes
        </h2>

        {/* Second row: Potentials + WON card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6"> 
          {kpiData.slice(4).map((kpi, index) => (
            <div
              key={index + 4} 
              className={`border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer ${kpi.bgColor}`}
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-lg text-center font-bold text-gray-900 mb-1 tracking-tight">
                    {kpi.title}
                  </h3>
                  <p className="text-3xl font-bold text-center text-gray-900">
                    {kpi.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


