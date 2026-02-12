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
import { useNavigate } from "react-router-dom"; 
import { FaArrowLeft } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import * as XLSX from 'xlsx'; 
import { saveAs } from 'file-saver'; 
import Pagination from "../../context/Pagination/pagination";
import usePagination from "../../hooks/usePagination.jsx";

// Register Chart.js components that will be used
ChartJS.register(BarElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Main component for Prospects Engaged Report
export default function ProspectsEngagedReport() {
  const [prospectsEngaged, setProspectsEngaged] = useState({
    leadEngagementDetails: [], 
    leadCovertToDeal: [],     
  });
  const [activeChartFilter, setActiveChartFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [isDefaultMonth, setIsDefaultMonth] = useState(true);

  // Hook for programmatic navigation
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); 
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token not found"); 

        // Decode JWT token to get company_id
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

        // Construct query parameters for date filtering
        const queryParams = new URLSearchParams();
        if (dateFilterFrom) {
          queryParams.append("fromDate", new Date(dateFilterFrom).toISOString());
        }
        if (dateFilterTo) {
          const endOfDay = new Date(dateFilterTo);
          endOfDay.setHours(23, 59, 59, 999); 
          queryParams.append("toDate", endOfDay.toISOString());
        }

        // Build the API URL with query parameters
        let apiUrl = `${ENDPOINTS.PROSPECTS_LOST_LEADS}/${company_id}`;
        if (queryParams.toString()) {
          apiUrl += `?${queryParams.toString()}`;
        }

        // Make the API call
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
      } finally {
        setLoading(false); 
      }
    };

    fetchData(); 
  }, [dateFilterFrom, dateFilterTo]); 

  // Calculate counts and percentages for cards
  const convertedCount = prospectsEngaged.leadCovertToDeal?.length ?? 0;
  const lostCount = prospectsEngaged?.totalLostLead ?? 0;
  const totalCount = convertedCount + lostCount;
  const lostPercentage = totalCount > 0 ? (lostCount / totalCount) * 100 : 0;

  // Helper function to format numbers for display
  const formatNumberForDisplay = (num) => {
    if (num === null || num === undefined) return "--";
    const parsedNum = parseFloat(num);
    if (isNaN(parsedNum)) return "--";
    return parsedNum % 1 === 0 ? parsedNum.toString() : parsedNum.toFixed(2);
  };

  // Data for the metric cards displayed at the top of the report
  const cardData = [
    {
      title: "Engaged Not Converted",
      value: formatNumberForDisplay(lostCount),
      changeType: "positive", 
    },
    {
      title: "Avg Engagement Score",
      value: formatNumberForDisplay(prospectsEngaged?.avgEngagementScore),
      changeType: "neutral", 
    },
    {
      title: "Avg No. of Interactions",
      value: formatNumberForDisplay(prospectsEngaged?.avgInteractions),
      changeType: "positive",
    },
    {
      title: "Lost Percentage",
      value: formatNumberForDisplay(lostPercentage) + "%",
      changeType: "positive", // Placeholder for actual change logic
    },
  ];

  // Aggregate data for the bar chart based on lead statuses
  const statusCounts = {};
  prospectsEngaged.leadEngagementDetails?.forEach((lead) => {
    const status = lead.previousActionBeforeLost || "Lost";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  prospectsEngaged.leadCovertToDeal?.forEach((lead) => {
    const status = lead.lead_status?.clead_name || "Converted"; 
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const convertedStatuses = ["Won", "Converted"]; 
  const labels = Object.keys(statusCounts); 

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

    // Populate datasets based on the active chart filter
    if (activeChartFilter === "all") {
      datasets.push({
        label: "Converted",
        data: convertedData,
        backgroundColor: "#4CAF50", // Green for converted
        borderRadius: 8,
        barThickness: 30,
      });
      datasets.push({
        label: "Non-Converted",
        data: nonConvertedData,
        backgroundColor: "#F44336", // Red for non-converted
        borderRadius: 8,
        barThickness: 30,
      });
    } else if (activeChartFilter === "converted") {
      datasets.push({
        label: "Converted",
        data: convertedData,
        backgroundColor: "#4CAF50",
        borderRadius: 8,
        barThickness: 30,
      });
    } else if (activeChartFilter === "nonConverted") {
      datasets.push({
        label: "Non-Converted",
        data: nonConvertedData,
        backgroundColor: "#F44336",
        borderRadius: 8,
        barThickness: 30,
      });
    }

    return {
      labels, // X-axis labels (statuses)
      datasets, // Data series for the bars
    };
  };

  const leadHandlingChartData = getChartData(); 

  // Options for the Chart.js Bar chart
  const leadHandlingChartOptions = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        display: false, 
      },
      tooltip: {
        backgroundColor: "#111827", // Dark background for tooltips
        titleColor: "#fff",
        bodyColor: "#E5E7EB",
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Hide X-axis grid lines
        },
        ticks: {
          color: "#4B5563", // Color for X-axis labels
        },
      },
      y: {
        beginAtZero: true, // Start Y-axis from zero
        grid: {
          color: "#E5E7EB", // Color for Y-axis grid lines
        },
        ticks: {
          color: "#4B5563", // Color for Y-axis labels
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

  // Prepare data for the Prospects Engaged Metrics table
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

  // Function to generate the intimation message for date filters
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

  // Function to handle Excel export for the Prospects Engaged table data
  const handleExport = () => {
    if (prospectsEngaged.leadEngagementDetails.length === 0) {
      alert("No data to export for the current filter.");
      return;
    }

    const dataToExport = prospectsEngaged.leadEngagementDetails.map((lead, index) => {
      return {
        'S.No': index + 1, 
        'Prospect Name': lead.clead_name || "-",
        'Engagement Score': lead.engagementScore || 0,
        'Num of Interactions': lead.interactionCount || 0, 
        'Status': lead.previousActionBeforeLost || "Lost",
        'Disqualification Reason':
          typeof lead.previousActionBeforeLost === "object" &&
          lead.previousActionBeforeLost?.reason
            ? lead.previousActionBeforeLost.reason 
            : "No Reason", 
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ProspectsEngagedReport");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'ProspectsEngagedReport.xlsx');
  };


  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col gap-6">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={() => navigate("/reportpage")}
          style={{
            color: "#6B7280", // Equivalent to text-gray-600
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
          <FaArrowLeft /> {/* Back arrow icon */}
        </button>
        <h2 className="text-3xl font-semibold text-gray-800">
          Prospects Engaged But Not Converted
        </h2>
      </div>

      {/* Cards Section: Displays key metrics */}
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

      {/* Chart Section: Displays lead handling and productivity metrics visually */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Lead Handling & Productivity Metrics
        </h3>
        {/* Chart Filter Buttons: Allow users to filter chart data */}
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

      {/* Table with Pagination Section: Displays detailed prospect data */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-700">
            Prospects Engaged Metrics
          </h3>
          {/* Export to Excel Button for this table */}
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-colors text-sm font-semibold"
          >
           <HiDownload size={16} className="mr-2" /> Export to Excel
          </button>
        </div>

        {/* Date Filters and Intimation Area for Table */}
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

// PaginatedTable Component
function PaginatedTable({ data }) {
  const itemsPerPage = 10; 

  const {
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedData: currentTableData,
} = usePagination(data, itemsPerPage);


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
              "Disqualification Reason", 
            ].map((header) => (
              <th key={header} className="p-4 border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentTableData.length > 0 ? (
            currentTableData.map((row, index) => (
              <tr key={row.sNo} className="hover:bg-gray-50">
                <td className="p-4 border-b">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="p-4 border-b">{row.prospectName}</td>
                <td className="p-4 border-b">{row.engagementScore}</td>
                <td className="p-4 border-b">{row.interactionCount}</td>
                <td className="p-4 border-b">{row.status}</td>
                <td className="p-4 border-b">{row.disqualificationReason}</td> 
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

       <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

    </div>
  );
}