import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { ENDPOINTS } from "../../api/constraints";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function LostLeadReports() {
  const [listData, setListData] = useState({});
  const [loading, setLoading] = useState(true);
  const [barData, setBarData] = useState(null);

  // States for date filtering
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [isDefaultMonth, setIsDefaultMonth] = useState(true); // Tracks if current month is active

  const navigate = useNavigate();

  // Helper function to format date to YYYY-MM-DD for input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Effect to set default current month dates on initial load
  useEffect(() => {
    const today = new Date(); // Current date
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setIsDefaultMonth(true); // Set to true as it's the default load
  }, []); // Run only once on mount

  // Effect to fetch data based on date filters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      // Only append if dates are actually set (not empty strings from reset)
      if (dateFilterFrom) {
        queryParams.append("fromDate", new Date(dateFilterFrom).toISOString());
      }
      if (dateFilterTo) {
        // To ensure the whole day is included, set time to end of day
        const endOfDay = new Date(dateFilterTo);
        endOfDay.setHours(23, 59, 59, 999);
        queryParams.append("toDate", endOfDay.toISOString());
      }

      let apiUrl = `${ENDPOINTS.REPORT_LOST}`;
      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Can't fetch lost leads data", response);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const allLeads = data.data;

        setListData(allLeads);

        const wonDetailsForChart = allLeads.won_details || [];
        const lostDetailsForChart = allLeads.lead_details || [];

        const getMonthName = (dateStr) => {
          const date = new Date(dateStr);
          return date.toLocaleString("default", { month: "short" });
        };

        const wonByMonth = {};
        const lostByMonth = {};

        for (const won of wonDetailsForChart) {
          if (won.created_at) {
            const month = getMonthName(won.created_at);
            wonByMonth[month] = (wonByMonth[month] || 0) + won.value;
          }
        }

        for (const lost of lostDetailsForChart) {
          if (lost.created_at) {
            const month = getMonthName(lost.created_at);
            lostByMonth[month] = (lostByMonth[month] || 0) + lost.value;
          }
        }

        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const allMonths = Array.from(
          new Set([...Object.keys(wonByMonth), ...Object.keys(lostByMonth)])
        ).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

        const chartData = {
          labels: allMonths,
          datasets: [
            {
              label: "Lost Leads Amount",
              data: allMonths.map((month) => lostByMonth[month] || 0),
              backgroundColor: "#ff3b30",
            },
            {
              label: "Won Leads Amount",
              data: allMonths.map((month) => wonByMonth[month] || 0),
              backgroundColor: "#34c759",
            },
          ],
        };

        setBarData(chartData);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilterFrom, dateFilterTo]); // Re-fetch data when date filters change

  const cardData = [
    { title: "Total Counts", value: `${listData.totalCount || 0}` },
    { title: "Lost Percentage", value: `${listData.lostPercentage || 0} %` },
    { title: "Lost from Leads", value: `${listData.lostFromLeads || 0}` },
    { title: "Lost from Deals", value: `${listData.lostFromDeals || 0}` },
  ];

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { stacked: false },
      y: { beginAtZero: true },
    },
  };

  const lead_details = listData.lead_details || [];

  const getIntimationMessage = () => {
    const fromDateObj = dateFilterFrom ? new Date(dateFilterFrom) : null;
    const toDateObj = dateFilterTo ? new Date(dateFilterTo) : null;

    if (isDefaultMonth && fromDateObj && toDateObj) {
      return `💡 Showing leads for the **current month**: **${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.`;
    } else if (fromDateObj && toDateObj) {
      return `🗓️ Filtering leads from **${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.`;
    } else {
      return `📊 Showing **all available leads** (no date filter applied).`;
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "linear-gradient(to bottom right, #f4f5f7, #e9ecf3)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Header with Back Button and Title */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={() => navigate("/reportpage")}
          style={{
            color: "#6B7280",
            padding: "8px",
            borderRadius: "9999px",
            marginRight: "16px",
            fontSize: "24px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="Back to reports"
        >
          <FaArrowLeft />
        </button>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1c1c1e" }}>
          Lost Lead Reports
        </h2>
      </div>

      {/* Cards and Chart Side-by-Side */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Left Side - Card Container Box */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {cardData.map((card, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(12px)",
                borderRadius: 16,
                padding: "20px 16px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 100,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#333",
                  opacity: 0.75,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#111",
                  marginTop: 6,
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Right Side - Bar Chart */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            padding: 24,
            minWidth: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {barData ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <p>Loading Chart...</p>
          )}
        </div>
      </div>

      {/* Lost Leads Table */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          padding: 24,
        }}
      >
        <h3
          style={{ marginBottom: 16, fontSize: 24, fontWeight: 600, color: "#1c1c1e", fontFamily: "serif" }}
        >
          Lost Leads
        </h3>

        {/* Date Filters and Message Display */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap", 
          gap: "15px", 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 16, color: "#555", fontWeight: "bold" }}>From:</label>
            <input
              type="date"
              value={dateFilterFrom}
              onChange={(e) => {
                setDateFilterFrom(e.target.value);
                setIsDefaultMonth(false); 
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            />
            <label style={{ fontSize: 16, color: "#555", fontWeight: "bold" }}>To:</label>
            <input
              type="date"
              value={dateFilterTo}
              onChange={(e) => {
                setDateFilterTo(e.target.value);
                setIsDefaultMonth(false); 
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            />
            <button
              onClick={() => {
            
                setDateFilterFrom('');
                setDateFilterTo('');
                setIsDefaultMonth(false); 
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #ccc",
                backgroundColor: "#f0f0f0",
                color: "#333",
                cursor: "pointer",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              Reset
            </button>
          </div>
          {/* Enhanced Intimation Area */}
          <div style={{
            flex: 1,
            minWidth: "250px",
            padding: "10px 18px",
            borderRadius: 12, 
            fontSize: 15,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)", 
            background: isDefaultMonth && dateFilterFrom ? "linear-gradient(to right, #e6ffe6, #d0ffe0)" :
                        (dateFilterFrom && dateFilterTo ? "linear-gradient(to right, #e0f7fa, #c2eff5)" :
                        "linear-gradient(to right, #f8f8f8, #f0f0f0)"),
            color: isDefaultMonth && dateFilterFrom ? "#1b5e20" :
                   (dateFilterFrom && dateFilterTo ? "#006064" : "#424242"),
            border: isDefaultMonth && dateFilterFrom ? "1px solid #a5d6a7" :
                    (dateFilterFrom && dateFilterTo ? "1px solid #80deea" : "1px solid #e0e0e0"),
          }}>
            {getIntimationMessage()}
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ overflowX: "auto", overflowY: "scroll", height: "60vh" }}>
            <table className="w-full border-collapse text-xl text-gray-800  font-serif">
              <thead>
                <tr style={{ backgroundColor: "#f2f2f7", fontSize: 20, fontWeight: 600 }}>
                  {[
                    "Lead Name",
                    "Lead Owner",
                    "Service",
                    "Value",
                    "Reason",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 font-semibold text-center"
                      style={{ wordBreak: "break-word" }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lead_details.length > 0 ? (
                  lead_details.map((lead, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #ececec",
                        transition: "background 0.3s",
                      }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-lg text-center">{lead.lead_name}</td>
                      <td className="px-4 py-3 text-lg text-center">{lead.lead_owner}</td>
                      <td className="px-4 py-3 text-lg  text-center">{lead.service}</td>
                      <td className="px-4 py-3 text-lg  text-center font-semibold text-blue-600">
                        ₹{lead.value}
                      </td>
                      <td className="px-4 py-3 text-lg  text-center text-red-500 font-medium">
                        {lead.reason}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center  text-gray-500">
                      No lost leads found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}