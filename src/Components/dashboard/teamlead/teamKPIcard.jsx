import React, { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";

export default function TeamKPIStats({leadsArray, subordinatesArray, dealCountForWon }) {
  const [leadCount, setLeadCount] = useState(0); // Active Leads
  const [wonLeadCount, setWonLeadCount] = useState(0); // Won Leads
  const [lostLeadCount, setLostLeadCount] = useState(0); // Lost Leads
  const [websiteLeadCount, setWebsiteLeadCount] = useState(0); // Website Leads
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noData, setNoData] = useState(false);

  const fetchTeamKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNoData(false);      

      if (Array.isArray(leadsArray) && Array.isArray(subordinatesArray)) {
        if (leadsArray.length === 0 && subordinatesArray.length === 0) {
          setNoData(true);
          setLeadCount(0);
          setWonLeadCount(0);
          setLostLeadCount(0);
          setWebsiteLeadCount(0);
        } else {
          const activeSubordinateIds = new Set(
            subordinatesArray
              .filter((sub) => sub.bactive === true)
              .map((sub) => sub.iUser_id)
          );

          const filteredLeads = leadsArray.filter((lead) =>
            activeSubordinateIds.has(lead.clead_owner)
          );

          // Active Leads
          const activeLeadsCount = filteredLeads.filter(
            (lead) => lead.bactive === true && lead.bisConverted === false
          ).length;

          // Lost Leads
          const lostLeadsCount = filteredLeads.filter(
            (lead) => lead.bactive === false && lead.bisConverted === false
          ).length;

          // Website Leads
          const websiteLeadsCount = filteredLeads.filter(
            (lead) =>
              lead.bactive === true &&
              lead.website_lead === true &&
              lead.bisConverted === false
          ).length;

          setLeadCount(activeLeadsCount);
          setWonLeadCount(dealCountForWon);
          setLostLeadCount(lostLeadsCount);
          setWebsiteLeadCount(websiteLeadsCount);
        }
      } else {
        setNoData(true);
        setLeadCount(0);
        setWonLeadCount(0);
        setLostLeadCount(0);
        setWebsiteLeadCount(0);
      }
    } catch (err) {
      console.error("Error fetching team KPIs:", err);
      setError(`Failed to fetch data: ${err.message}`);
      setLeadCount(0);
      setWonLeadCount(0);
      setLostLeadCount(0);
      setWebsiteLeadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchTeamKPIs();
  }, [fetchTeamKPIs]);

  const kpiData = [
    {
      title: "Active Leads",
      value: leadCount,
      colorStart: "#6CCF00",
      colorEnd: "#3CB043",
      iconBg: "bg-green-500",
    },
    {
      title: "Won Leads",
      value: wonLeadCount,
      colorStart: "#8E24AA",
      colorEnd: "#9C27B0",
      iconBg: "bg-purple-500",
    },
    {
      title: "Lost Leads",
      value: lostLeadCount,
      colorStart: "#F44336",
      colorEnd: "#E53935",
      iconBg: "bg-red-500",
    },
    {
      title: "Website Leads",
      value: websiteLeadCount,
      colorStart: "#1E88E5",
      colorEnd: "#2196F3",
      iconBg: "bg-sky-500",
    },
  ];

  if (loading) {
    return <div className="text-center p-4 text-gray-700">Loading KPIs...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  if (noData) {
    return <div className="text-center p-4 text-gray-500 bg-white rounded-xl">No data available.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className="relative bg-white rounded-xl border shadow-sm p-4 overflow-hidden h-[160px]"
        >
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h3 className="text-sm text-gray-600">{kpi.title}</h3>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </div>
            <div className={`rounded-full p-2 ${kpi.iconBg}`}>
              <Users className="text-white w-5 h-5" />
            </div>
          </div>

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