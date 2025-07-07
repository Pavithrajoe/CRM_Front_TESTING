import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { ENDPOINTS } from "../../api/constraints";
import { useNavigate } from "react-router-dom"; // For navigation
import { FaArrowLeft } from "react-icons/fa"; 

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
export default function ProspectsEngagedReport() {
  const [prospectsEngaged, setProspectsEngaged] = useState({
    leadEngagementDetails: [],
    leadCovertToDeal: [],
  });
  const [activeChartFilter, setActiveChartFilter] = useState("all"); // 'all', 'converted', 'nonConverted'
  const [loading, setLoading] = useState(true);

  // States for date filtering
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [isDefaultMonth, setIsDefaultMonth] = useState(true); // Tracks if current month is active

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
    const today = new Date(); // Current date is Friday, July 4, 2025
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setIsDefaultMonth(true); // Set to true as it's the default load
  }, []); // Run only once on mount

  // Effect to fetch data based on date filters
const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token not found");

        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const { company_id } = JSON.parse(jsonPayload);
        if (!company_id) throw new Error("Company ID missing");

        const queryParams = new URLSearchParams();
        if (dateFilterFrom) {
          queryParams.append("fromDate", new Date(dateFilterFrom).toISOString());
        }
        if (dateFilterTo) {
          const endOfDay = new Date(dateFilterTo);
          endOfDay.setHours(23, 59, 59, 999);
          queryParams.append("toDate", endOfDay.toISOString());
        }

        let apiUrl = `${ENDPOINTS.PROSPECTS_LOST_LEADS}/${company_id}`;
        if (queryParams.toString()) {
          apiUrl += `?${queryParams.toString()}`;
        }

        const res = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await res.json();
        setProspectsEngaged(result);
      } catch (err) {
        console.error("API error:", err.message);
        // Optionally, set an error state to display to the user
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilterFrom, dateFilterTo]); // Re-fetch data when date filters change

  const convertedCount = prospectsEngaged.leadCovertToDeal?.length ?? 0;
  const lostCount = prospectsEngaged?.totalLostLead ?? 0;
  const totalCount = convertedCount + lostCount;
  const lostPercentage = totalCount > 0 ? (lostCount / totalCount) * 100 : 0;

  const cardData = [
    {
      title: "Engaged Not Converted",
      value: lostCount,
      changeType: "positive",
    },
    {
      title: "Avg Engagement Score",
      value: prospectsEngaged?.avgEngagementScore ?? "--",
      changeType: "neutral",
    },
    {
      title: "Avg No. of Interactions",
      value: prospectsEngaged?.avgInteractions ?? "--",
      changeType: "positive",
    },
    {
      title: "Lost Percentage",
      value: lostPercentage.toFixed(2) + "%",
      change: "Deal Converted: " + convertedCount,
      changeType: "positive",
    },
  ];

  const statusCounts = {};
  // Aggregate data for chart based on the fetched data
  prospectsEngaged.leadEngagementDetails?.forEach((lead) => {
    const status = lead.previousActionBeforeLost || "Lost"; // Default to "Lost" if not specified
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  prospectsEngaged.leadCovertToDeal?.forEach((lead) => {
    const status = lead.lead_status?.clead_name || "Converted"; // Default to "Converted"
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const convertedStatuses = ["Won", "Converted"];
  const labels = Object.keys(statusCounts);

  // Prepare data for Chart based on activeChartFilter
  const getChartData = () => {
    const convertedData = [];
    const nonConvertedData = [];

    labels.forEach((status) => {
      if (convertedStatuses.includes(status)) {
        convertedData.push(statusCounts[status]);
        nonConvertedData.push(0);
      } else {
        nonConvertedData.push(statusCounts[status]);
        convertedData.push(0);
      }
    });

    let datasets = [];

    if (activeChartFilter === "all") {
      datasets.push({
        label: "Converted",
        data: convertedData,
        backgroundColor: "#4CAF50", // Green
        borderRadius: 8,
        barThickness: 30,
      });
      datasets.push({
        label: "Non-Converted",
        data: nonConvertedData,
        backgroundColor: "#F44336", // Red
        borderRadius: 8,
        barThickness: 30,
      });
    } else if (activeChartFilter === "converted") {
      datasets.push({
        label: "Converted",
        data: convertedData,
        backgroundColor: "#4CAF50", // Green
        borderRadius: 8,
        barThickness: 30,
      });
    } else if (activeChartFilter === "nonConverted") {
      datasets.push({
        label: "Non-Converted",
        data: nonConvertedData,
        backgroundColor: "#F44336", // Red
        borderRadius: 8,
        barThickness: 30,
      });
    }

    return {
      labels,
      datasets,
    };
  };

  const leadHandlingChartData = getChartData();

  const leadHandlingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#fff",
        bodyColor: "#E5E7EB",
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#4B5563",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#E5E7EB",
        },
        ticks: {
          color: "#4B5563",
          precision: 0,
        },
        title: {
          display: true,
          text: "No. Of Prospects",
          color: "#374151",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
    },
  };

  const tableData = prospectsEngaged.leadEngagementDetails.map((lead, index) => ({
    sNo: index + 1,
    prospectName: lead.clead_name,
    engagementScore: lead.engagementScore,
    interactionCount: lead.interactionCount,
    status: lead.previousActionBeforeLost || "Lost",
    disqualificationReason:
      typeof lead.previousActionBeforeLost === "object" &&
      lead.previousActionBeforeLost?.reason
        ? lead.previousActionBeforeLost.reason
        : "No Reason",
  }));

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
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col gap-6">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={() => navigate("/reportpage")} 
          style={{
            color: "#6B7280", // Equivalent to text-gray-600
            padding: "8px", // Equivalent to p-2
            borderRadius: "9999px", 
            marginRight: "16px", 
            fontSize: "24px", 
            cursor: "pointer",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease", // Equivalent to transition-colors
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")} // Equivalent to hover:bg-gray-200
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="Back to reports"
        >
          <FaArrowLeft /> {/* Back arrow icon */}
        </button>
        <h2 className="text-3xl font-semibold text-gray-800">
          Prospects Engaged But Not Converted
        </h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition"
          >
            <div className="text-gray-500 text-sm">{card.title}</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">
              {card.value}
            </div>
            {card.change && (
              <div
                className={`text-xs mt-1 ${
                  card.changeType === "positive"
                    ? "text-green-600"
                    : card.changeType === "neutral"
                    ? "text-gray-500"
                    : "text-red-500"
                }`}
              >
                {card.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Lead Handling & Productivity Metrics
        </h3>
        {/* Chart Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setActiveChartFilter("all")}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
              activeChartFilter === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Leads
          </button>
          <button
            onClick={() => setActiveChartFilter("converted")}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
              activeChartFilter === "converted"
                ? "bg-green-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Converted
          </button>
          <button
            onClick={() => setActiveChartFilter("nonConverted")}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
              activeChartFilter === "nonConverted"
                ? "bg-red-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Non-Converted
          </button>
        </div>
        <div className="relative h-96">
          {loading ? (
            <p className="text-center text-gray-500">Loading chart data...</p>
          ) : (
            <Bar data={leadHandlingChartData} options={leadHandlingChartOptions} />
          )}
        </div>
      </div>

      {/* Table with Pagination */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Prospects Engaged Metrics
        </h3>

        {/* Date Filters and Intimation Area for Table */}
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap", // Allow wrapping on smaller screens
            gap: "15px", // Spacing between items
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 16, color: "#555", fontWeight: "bold" }}>From:</label>
            <input
              type="date"
              value={dateFilterFrom}
              onChange={(e) => {
                setDateFilterFrom(e.target.value);
                setIsDefaultMonth(false); // No longer default month if user changes it
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
                setIsDefaultMonth(false); // No longer default month if user changes it
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
                // Clear date filters to fetch all data
                setDateFilterFrom('');
                setDateFilterTo('');
                setIsDefaultMonth(false); // Not default month when showing all
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
          {/* Enhanced Intimation Area for Table */}
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
          <p className="text-center text-gray-500">Loading table data...</p>
        ) : (
          <PaginatedTable data={tableData} />
        )}
      </div>
    </div>
  );
}

// ✅ Pagination Table (remains the same)
function PaginatedTable({ data }) {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left min-w-[768px]">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            {[
              "S.No",
              "Lead Name",
              "Engagement Score",
              "Num of Interactions",
              "Status",
              // "Disqualification Reason",
            ].map((header) => (
              <th key={header} className="p-4 border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, index) => (
              <tr key={row.sNo} className="hover:bg-gray-50">
                <td className="p-4 border-b">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="p-4 border-b">{row.prospectName}</td>
                <td className="p-4 border-b">{row.engagementScore}</td>
                <td className="p-4 border-b">{row.interactionCount}</td>
                <td className="p-4 border-b">{row.status}</td>
                {/* <td className="p-4 border-b">{row.disqualificationReason}</td> */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-6 text-gray-500">
                No prospects found for the selected period.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end items-center gap-2 mt-4">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => changePage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-lime-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}