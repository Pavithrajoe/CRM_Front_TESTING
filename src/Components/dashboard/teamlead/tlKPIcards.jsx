import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ENDPOINTS } from "../../../api/constraints"; 

const getPotentialColor = (index) => {
  switch (index) {
    case 0:
      return { color: "text-red-600", bgColor: "bg-red-400", image: "/illustrations/hot.svg" };
    case 1:
      return { color: "text-orange-600", bgColor: "bg-amber-300", image: "/illustrations/warm.svg" };
    case 2:
      return { color: "text-blue-600", bgColor: "bg-blue-400", image: "/illustrations/cold.svg" };
    default:
      return { color: "text-gray-700", bgColor: "bg-stone-300", image: "/illustrations/default.svg" };
  }
};

export default function KPIStats(data) {  
  const [wonCount, setWonCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0); 
  const [lostCount, setLostCount] = useState(0);
  const [websiteLeadCount, setWebsiteLeadCount] = useState(0);
  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [dynamicPotentials, setDynamicPotentials] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Token check and decode
  useEffect(() => {
    let extractedUserId = null;
    let tokenFromStorage = null;

    try {
      tokenFromStorage = localStorage.getItem("token");
      if (tokenFromStorage) {
        const decodedToken = jwtDecode(tokenFromStorage);
        // console.log("token", decodedToken )
        extractedUserId = decodedToken.user_id;
        if (!extractedUserId) throw new Error("User ID not found in token.");
      } else {
        navigate("/");
        throw new Error("Authentication token not found in local storage.");
      }
    } catch (e) {
      console.error("Error retrieving or decoding token:", e);
      setError(`Authentication error: ${e.message}. Please log in again.`);
      setLoading(false);
      return;
    }

    setCurrentUserId(extractedUserId);
    setCurrentToken(tokenFromStorage);
  }, [navigate]);

  // Fetch KPI Data from API
  useEffect(() => {
    if (!currentToken || !currentUserId) return;

    const fetchKPIStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${ENDPOINTS.LEADS_COUNT_BY_USER_ID}${currentUserId}`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        const jsonRes = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            navigate("/");
            throw new Error("Session expired or unauthorized. Redirecting to login.");
          }
          throw new Error(jsonRes.message || `API Error: ${response.status}`);
        }

        const data = jsonRes.details;

        setTotalLeadCount(data.totalLeads || 0);
        setWonCount(data.totalWon || 0);
        setLostCount(data.totalLost || 0);
        setActiveCount(data.totalActiveLeads || 0);
        setWebsiteLeadCount(data.totalWebsiteLeads || 0);

        // Extract only valid potentials
        const potentials = [
          data.dynamic_poten_1,
          data.dynamic_poten_2,
          data.dynamic_poten_3,
        ].filter((p) => p && p.name);

        setDynamicPotentials(potentials);
        setLoading(false);
      } catch (e) {
        console.error("KPI Fetch Error:", e);
        setError(e.message);
        setLoading(false);
      }
    };

    fetchKPIStats();
  }, [currentToken, currentUserId, navigate]);



  const coreKpiData = [
    {
      title: "Total Leads",
      value: totalLeadCount,
      clickHandler: () => navigate("/leadcardview", { state: { activeTab: "all" } }),
    },
    {
      title: "Active Leads",
      value: activeCount,
      clickHandler: () => navigate("/leadcardview", { state: { activeTab: "leads" } }),
    },
    {
      title: "Website Leads",
      value: websiteLeadCount,
      clickHandler: () => navigate("/leadcardview", { state: { activeTab: "websiteLeads" } }),
    },
    {
      title: "Total Lost",
      value: lostCount,
      clickHandler: () => navigate("/leadcardview", { state: { activeTab: "lost" } }),
    },
  ];

  // Dynamic Potential Cards
  const potentialKpiData = dynamicPotentials.map((p, index) => {
    const colorStyle = getPotentialColor(index);
    return {
      title: p.name,
      value: p.count,
      color: colorStyle.color,
      bgColor: colorStyle.bgColor,
      bg: colorStyle.image, 
    };
  });

  // Total Won 
  const wonKpiData = {
    title: "Total Won",
    value: wonCount,
    color: "text-green-600",
    bgColor: "bg-green-400",
    bg: "/illustrations/win.svg",
  };

  const secondRowKpiData = [...potentialKpiData, wonKpiData].slice(0, 4);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8 text-lg font-medium">
        Loading KPI Stats... 🚀
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8 text-lg font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* First Row */}
        <div className="grid grid-cols-2 gap-6">
          {coreKpiData.map((kpi, index) => (
            <div
              key={index}
              className="bg-white/60 border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer"
              onClick={kpi.clickHandler}
            >
              <h3 className="text-xs font-bold text-gray-600 mb-1 tracking-tight">
                {kpi.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-2 grid-rows-2 gap-6">
          {secondRowKpiData.map((kpi, index) => (
            <div
              key={index}
              className="relative min-h-[160px] backdrop-blur-md bg-white/60 border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.05)] rounded-2xl p-5 transition-all hover:shadow-lg overflow-hidden"
              style={{
                backgroundImage: `url(${kpi.bg})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right bottom",
                backgroundSize: "150px",
              }}
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 mb-1 tracking-tight">
                    {kpi.title}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
