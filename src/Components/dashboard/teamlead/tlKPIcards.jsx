import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ENDPOINTS } from "../../../api/constraints";

const TARGET_COMPANY_ID = Number(import.meta.env.VITE_XCODEFIX_FLOW);

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

export default function KPIStats() {
  const [wonCount, setWonCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [websiteLeadCount, setWebsiteLeadCount] = useState(0);
  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [dynamicPotentials, setDynamicPotentials] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Token check and decode
  useEffect(() => {
    try {
      const tokenFromStorage = localStorage.getItem("token");
      if (tokenFromStorage) {
        const decodedToken = jwtDecode(tokenFromStorage);
        setCurrentUserId(decodedToken.user_id);
        setCompanyId(Number(decodedToken.company_id)); 
        setCurrentToken(tokenFromStorage);
      } else {
        navigate("/");
      }
    } catch (e) {
      setError(`Authentication error: ${e.message}`);
      setLoading(false);
    }
  }, [navigate]);

  // Fetch KPI Data
  useEffect(() => {
    if (!currentToken || !currentUserId) return;

    const fetchKPIStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${ENDPOINTS.LEADS_COUNT_BY_USER_ID}${currentUserId}`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const jsonRes = await response.json();
        if (!response.ok) throw new Error(jsonRes.message || "API Error");

        const data = jsonRes.details;
        setTotalLeadCount(data.totalLeads || 0);
        setWonCount(data.totalWon || 0);
        setLostCount(data.totalLost || 0);
        setActiveCount(data.totalActiveLeads || 0);
        setWebsiteLeadCount(data.totalWebsiteLeads || 0);

        const potentials = [data.dynamic_poten_1, data.dynamic_poten_2, data.dynamic_poten_3].filter((p) => p && p.name);
        setDynamicPotentials(potentials);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIStats();
  }, [currentToken, currentUserId]);

  // Navigation Helper
  const handleNavigation = (activeTab) => {
    const targetRoute = companyId === TARGET_COMPANY_ID 
      ? "/xcodefix_leadcardview" 
      : "/leadcardview";
      
    navigate(targetRoute, { state: { activeTab } });
  };

  const coreKpiData = [
    { title: "Total Leads", value: totalLeadCount, clickHandler: () => handleNavigation("all") },
    { title: "Active Leads", value: activeCount, clickHandler: () => handleNavigation("leads") },
    { title: "Website Leads", value: websiteLeadCount, clickHandler: () => handleNavigation("websiteLeads") },
    { title: "Total Lost", value: lostCount, clickHandler: () => handleNavigation("lost") },
  ];

  const potentialKpiData = dynamicPotentials.map((p, index) => {
    const colorStyle = getPotentialColor(index);
    return { title: p.name, value: p.count, bg: colorStyle.image };
  });

  const wonKpiData = { title: "Total Won", value: wonCount, bg: "/illustrations/win.svg", clickHandler: () => navigate("/customers") };
  const secondRowKpiData = [...potentialKpiData, wonKpiData].slice(0, 4);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {coreKpiData.map((kpi, index) => (
            <div key={index} className="bg-white/60 border rounded-xl p-4 shadow-sm cursor-pointer" onClick={kpi.clickHandler}>
              <h3 className="text-xs font-bold text-gray-600 mb-1">{kpi.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-6">
          {secondRowKpiData.map((kpi, index) => (
            <div
              key={index}
              onClick={kpi.clickHandler}
              className="relative min-h-[160px] bg-white/60 border shadow-sm rounded-2xl p-5"
              style={{
                backgroundImage: `url(${kpi.bg})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right bottom",
                backgroundSize: "clamp(90px, 25vw, 150px)",
              }}
            >
              <h3 className="text-xs font-semibold text-gray-600 mb-1">{kpi.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}