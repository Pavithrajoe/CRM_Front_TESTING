import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function KPIStats(data) {
  // console.log("KPIStats data:", data);
  const [hotCount, setHotCount] = useState(0);
  const [warmCount, setWarmCount] = useState(0);
  const [coldCount, setColdCount] = useState(0);
  const [wonCount, setWonCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0); 
  const [lostCount, setLostCount] = useState(0);
  const [websiteLeadCount, setWebsiteLeadCount] = useState(0);
  const [lead,setLead] = useState(0);


  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let extractedUserId = null;
    let tokenFromStorage = null;

    try {
      tokenFromStorage = localStorage.getItem('token');
      if (tokenFromStorage) {
        const decodedToken = jwtDecode(tokenFromStorage);
        extractedUserId = decodedToken.user_id;
        if (!extractedUserId) {
          throw new Error("User ID not found in token.");
        }
      } 
      else {
        throw new Error("Authentication token not found in local storage.");
      }
    } catch (e) {
      console.error("Error retrieving or decoding token:", e);
      setError(`Authentication error: ${e.message}. Please log in again.`);
      setLoading(false);
      return;
    }

    if (extractedUserId && tokenFromStorage) {
      setCurrentUserId(extractedUserId);
      setCurrentToken(tokenFromStorage);
      setLoading(false);
    } 
    else {
      setError("User ID or authentication token is missing after processing.");
      setLoading(false);
    }
  }, []);

  const leads = data?.data?.leads || [];

  useEffect(() => {
  const fetchLeads = async () => {
    const response = await fetchLeadsAPI();
    const leadsData = await response.json();
    setLeads(leadsData); 

    
    let websiteLeadCount = 0;
    leadsData.forEach((lead) => {
      if (
        lead.bisConverted === false &&
        lead.website_lead === true &&
        lead.bactive === false
      ) {
        websiteLeadCount++;
      }
    });

    setWebsiteLeadCount(websiteLeadCount); 
  };

  fetchLeads();
}, []);


  useEffect(() => {
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let won = 0;
    let lost = 0;
    let active = 0;

    leads.forEach((lead) => {
      if (lead.bactive === false) {
        // A lead is lost if bactive is false
        lost++;
      } else {
        // These are active leads (bactive === true)
        active++;

        // Check for 'Won' leads
        if (lead.bisConverted === true) {
          won++;
        }

        // Check for Hot, Warm, Cold only if not converted yet and active
        // Assuming 'Won' leads are not also 'Hot/Warm/Cold' in the same context
        if (lead.bisConverted === false) {
          const potential = lead.lead_potential?.clead_name;
          if (potential === "HOT") {
            hot++;
          } else if (potential === "WARM") {
            warm++;
          } else if (potential === "COLD") {
            cold++;
          }
        }
      }
    });

    setHotCount(hot);
    setWarmCount(warm);
    setColdCount(cold);
    setWonCount(won);
    setActiveCount(active);
    setLostCount(lost);
  }, [leads]);

  const kpiData = [
    {
      title: "Hot",
      value: hotCount,
      color: "text-red-500",
      bg: "/illustrations/hot.svg",
    },
    {
      title: "Warm",
      value: warmCount,
      color: "text-orange-500",
      bg: "/illustrations/warm.svg",
    },
    {
      title: "Cold",
      value: coldCount,
      color: "text-blue-500",
      bg: "/illustrations/cold.svg",
    },
    {
      title: "Total Won",
      value: wonCount,
      color: "text-green-600",
      bg: "/illustrations/win.svg",
    },
  ];

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8 text-lg font-medium">
        Loading...
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

  const handleTotalLeadsClick = () => {
    navigate('/leadcardview', { state: { activeTab: 'leads' } });
  };

  const handleTotalLostClick = () => {
    navigate('/leadcardview', { state: { activeTab: 'lost' } });
  };

  return (
    <div className="px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-6">



          <div
          className="bg-white/60 border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer"
        >
          <h3 className="text-xs font-bold text-gray-600 mb-1 tracking-tight">
            Total Leads
          </h3>
          <p className="text-2xl font-bold text-gray-900">{activeCount + lostCount + wonCount}</p>
        </div>





          <div
            className="bg-white/60 border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer"
            onClick={handleTotalLeadsClick}
          >
            <h3 className="text-xs font-bold text-gray-600 mb-1 tracking-tight">
               Active Leads
            </h3>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>


          <div
            className="bg-white/60 border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer"
          >
            <h3 className="text-xs font-bold text-gray-600 mb-1 tracking-tight">
              Website Leads
            </h3>
            <p className="text-2xl font-bold text-gray-900">{websiteLeadCount}</p>
          </div>

          <div
            className="bg-white/60 border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer"
            onClick={handleTotalLostClick}
          >
            <h3 className="text-xs font-bold text-gray-600 mb-1 tracking-tight">
              Total Lost
            </h3>
            <p className="text-2xl font-bold text-gray-900">{lostCount}</p>
          </div>
        </div>

        {/* Other KPI cards */}
        <div className="grid grid-cols-2 grid-rows-2 gap-6">
          {kpiData.map((kpi, index) => (
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