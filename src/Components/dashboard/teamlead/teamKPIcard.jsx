import React, { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";
import { ENDPOINTS } from "../../../api/constraints";
import { jwtDecode } from "jwt-decode";

export default function TeamKPIStats() {
  const [leadCount, setLeadCount] = useState(0);
  const [dealCount, setDealCount] = useState(0);
  const [hotLeadCount, setHotLeadCount] = useState(0);
  const [coldLeadCount, setColdLeadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [noData, setNoData] = useState(false); // New state variable for "No data available"

  useEffect(() => {
    let extractedUserId = null;
    let tokenFromStorage = null;

    try {
      tokenFromStorage = localStorage.getItem('token');
      if (tokenFromStorage) {
        const decodedToken = jwtDecode(tokenFromStorage);
        extractedUserId = decodedToken.user_id;

        if (!extractedUserId) {
          throw new Error("User ID (user_id) not found in decoded token payload.");
        }
      } else {
        throw new Error("Authentication token not found in local storage. Please log in.");
      }
    } catch (e) {
      console.error("Error retrieving or decoding token in TeamKPIStats:", e);
      setError(`Authentication error: ${e.message}`);
      setLoading(false);
      return;
    }

    if (extractedUserId && tokenFromStorage) {
      setCurrentUserId(extractedUserId);
      setCurrentToken(tokenFromStorage);
    } else {
      setError("Failed to obtain valid user ID or authentication token.");
      setLoading(false);
    }
  }, []); 

  const fetchTeamKPIs = useCallback(async () => {
    if (!currentUserId || !currentToken) {
      setLoading(false);
      return;
    }

    const apiUrl = `${ENDPOINTS.TEAM_KPI}/${currentUserId}`;

    try {
      setLoading(true);
      setError(null); 
      setNoData(false); // Reset noData state

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(`HTTP error! status: ${response.status}, Details: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      const leadsArray = data.details?.lead;
      const subordinatesArray = data.details?.subordinates;

      // Check if data is present and correctly structured
      if (Array.isArray(leadsArray) && Array.isArray(subordinatesArray)) {
        if (leadsArray.length === 0 && subordinatesArray.length === 0) {
          // If arrays are empty, set noData to true
          setNoData(true);
          setLeadCount(0);
          setDealCount(0);
          setHotLeadCount(0);
          setColdLeadCount(0);
        } else {
          // Process data if arrays are not empty
          const activeSubordinateIds = new Set(
            subordinatesArray
              .filter(sub => sub.bactive === true)
              .map(sub => sub.iUser_id)
          );

          const filteredLeads = leadsArray.filter(lead =>
            lead.bactive === true &&
            activeSubordinateIds.has(lead.clead_owner)
          );

          const totalLeadsCount = filteredLeads.length;
          const convertedDealsCount = filteredLeads.filter(
            (lead) => lead.bisConverted === true
          ).length;
          const hotLeadsCount = filteredLeads.filter(
            (lead) =>
              lead.lead_potential &&
              lead.lead_potential.clead_name === "HOT" &&
              lead.bisConverted === false
          ).length;
          const coldLeadsCount = filteredLeads.filter(
            (lead) =>
              lead.lead_potential &&
              lead.lead_potential.clead_name === "COLD" &&
              lead.bisConverted === false
          ).length;

          setLeadCount(totalLeadsCount);
          setDealCount(convertedDealsCount);
          setHotLeadCount(hotLeadsCount);
          setColdLeadCount(coldLeadsCount);
          setError(null);
        }
      } else {
        // If the structure is missing required arrays (lead or subordinates)
        setNoData(true);
        setLeadCount(0);
        setDealCount(0);
        setHotLeadCount(0);
        setColdLeadCount(0);
      }
    } catch (err) {
      console.error("Error fetching team KPIs:", err);
      setError(`Failed to fetch data: ${err.message}`);
      setLeadCount(0);
      setDealCount(0);
      setHotLeadCount(0);
      setColdLeadCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentToken]);


  useEffect(() => {
    if (currentUserId && currentToken) {
      fetchTeamKPIs();
    }
  }, [currentUserId, currentToken, fetchTeamKPIs]);

  const kpiData = [
    {
      title: "Active Leads",
      value: leadCount,
      colorStart: "#6CCF00",
      colorEnd: "#3CB043",
      iconBg: "bg-green-500",
    },
    {
      title: "Deals",
      value: dealCount,
      colorStart: "#8E24AA",
      colorEnd: "#9C27B0",
      iconBg: "bg-purple-500",
    },
    {
      title: "Hot Leads (Active)",
      value: hotLeadCount,
      colorStart: "#FF7043",
      colorEnd: "#FF5722",
      iconBg: "bg-orange-500",
    },
    {
      title: "Cold Leads (Active)",
      value: coldLeadCount,
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

  // Display "No data available" if noData is true
  if (noData) {
    return <div className="text-center p-4 text-gray-500">No data available.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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