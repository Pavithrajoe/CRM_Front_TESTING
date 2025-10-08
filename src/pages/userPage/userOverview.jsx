import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../api/constraints";

export default function User_Overview_KPIStats({ userId }) { 
  const [leads, setLeads] = useState([]);
  const [hotCount, setHotCount] = useState(0);
  const [warmCount, setWarmCount] = useState(0);
  const [coldCount, setColdCount] = useState(0);
  const [wonCount, setWonCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [websiteLeadCount, setWebsiteLeadCount] = useState(0);
  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchLeads = async () => {
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

        const response = await fetch(`${ENDPOINTS.LEAD}${userId}?page=1&limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const jsonRes = await response.json();
        if (!response.ok) throw new Error(jsonRes.message || "API error");


        setLeads(jsonRes.details || []);
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    fetchLeads();
  }, [userId]); 


  useEffect(() => {
    let total = 0, hot = 0, warm = 0, cold = 0, won = 0, lost = 0, active = 0, website = 0;
    leads.forEach((lead) => {
      total++; 
      if (lead.bactive === true && lead.bisConverted === false) {
        if (lead.lead_potential?.clead_name?.toUpperCase() === "HOT") hot++;
        if (lead.lead_potential?.clead_name?.toUpperCase() === "WARM") warm++;
        if (lead.lead_potential?.clead_name?.toUpperCase() === "COLD") cold++;
      }


      // Won
      if (lead.bisConverted === true && lead.bactive === true) { won++; }
      // Lost: bactive false and bisConverted false
      if (lead.bactive === false && lead.bisConverted === false) lost++;
      // Website Leads: bactive true, bisConverted false, website_lead true
      if (lead.bactive === true && lead.bisConverted === false && lead.website_lead === true) website++;
      // Active Leads (Non-website): bactive true, bisConverted false, website_lead false
      if (lead.bactive === true && lead.bisConverted === false && lead.website_lead !== true) active++;
    });
    setTotalLeadCount(total);
    setHotCount(hot);
    setWarmCount(warm);
    setColdCount(cold);
    setWonCount(won);
    setActiveCount(active);
    setWebsiteLeadCount(website);
    setLostCount(lost);
  }, [leads]);


  const kpiData = [
    { 
      title: "Total Leads", 
      value: totalLeadCount, 
      plain: true 
    },
    { 
      title: "Active Leads", 
      value: activeCount, 
      plain: true 
    },
    { 
      title: "Website Leads", 
      value: websiteLeadCount, 
      plain: true 
    },
    { 
      title: "Total Lost", 
      value: lostCount, 
      plain: true 
    },
    { 
      title: "Hot", 
      value: hotCount, 
      color: "text-red-500", 
      bg: "/illustrations/hot.svg" 
    },
    { 
      title: "Warm", 
      value: warmCount, 
      color: "text-orange-500", 
      bg: "/illustrations/warm.svg" 
    },
    { 
      title: "Cold", 
      value: coldCount, 
      color: "text-blue-500", 
      bg: "/illustrations/cold.svg" 
    },
    { 
      title: "Total Won", 
      value: wonCount, 
      color: "text-green-600", 
      bg: "/illustrations/win.svg" 
    },
  ];


  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8 text-lg font-medium">
        Loading KPI data for user {userId}...
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
        {/* First row: Total, Active, Website, Lost */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6"> 
          {kpiData.slice(0, 4).map((kpi, index) => (
            <div
              key={index}
              className="bg-white/60 border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer"
            >
              <h3 className="text-xs font-bold text-gray-600 mb-1 tracking-tight">
                {kpi.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>


        {/* Second row: Hot, Warm, Cold, Won */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6"> 
          {kpiData.slice(4).map((kpi, index) => (
            <div
              key={index + 4} 
              className="relative min-h-[160px] backdrop-blur-md bg-white/60 border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.05)] rounded-2xl p-5 transition-all hover:shadow-lg overflow-hidden cursor-pointer"
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
                  <p className="text-3xl font-bold text-gray-900">
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