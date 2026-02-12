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


// const formatDecimalDaysToDaysHours = (decimalDays) => {
//   const numDays = parseFloat(decimalDays);
//   if (isNaN(numDays) || numDays < 0) return '0 Days';

//   const days = Math.floor(numDays);
//   const fractionalPart = numDays - days;
//   const hours = Math.round(fractionalPart * 24); // Round to nearest hour

//   let result = '';
//   if (days > 0) {
//     result += `${days} Day${days > 1 ? 's' : ''}`;
//   }
//   if (hours > 0) {
//     if (result) result += ' '; // Add space if days exist
//     result += `${hours} Hr${hours > 1 ? 's' : ''}`;
//   }

//   if (days === 0 && hours === 0) {
//     return '0 Days'; // For values like 0.00 or very small fractions
//   }
//   return result.trim(); // Trim any leading/trailing spaces
// };

// Helper function to format date and time to DD/MM/YYYY HH.MM AM/PM
// This is used for displaying dates in a user-friendly format.
// const formatDateTimeForTable = (isoString) => {
//   if (!isoString) return '-';
//   const date = new Date(isoString);

//   // Check for valid date object
//   if (isNaN(date.getTime())) return '-';

//   const pad = (num) => String(num).padStart(2, '0'); // Helper to add leading zero if needed

//   const day = pad(date.getDate());
//   const month = pad(date.getMonth() + 1); // Month is 0-indexed, so add 1
//   const year = date.getFullYear();

//   let hours = date.getHours();
//   const minutes = pad(date.getMinutes());
//   const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM/PM
//   hours = hours % 12; // Convert to 12-hour format
//   hours = hours ? hours : 12; // The hour '0' (midnight) should be '12 AM'

//   return `${day}/${month}/${year} ${pad(hours)}.${minutes} ${ampm}`;
// };

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

  // const formatDateForInput = (date) => {
  //   if (!date) return '';
  //   const d = new Date(date);
  //   const year = d.getFullYear();
  //   const month = String(d.getMonth() + 1).padStart(2, '0');
  //   const day = String(d.getDate()).padStart(2, '0');
  //   return `${year}-${month}-${day}`;
  // };

  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Effect hook to fetch data from the API whenever date filters change
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
      changeType: "positive", 
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

  // Function to prepare data for the Chart.js Bar chart based on the active filter
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
          precision: 0, // Display whole numbers for counts
        },
        title: {
          display: true,
          text: "No. Of Prospects", // Y-axis title
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

    // Transform the data from 'prospectsEngaged.leadEngagementDetails'
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

    // Create a new Excel worksheet from the transformed JSON data.
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Create a new Excel workbook.
    const wb = XLSX.utils.book_new();

    // Append the created worksheet to the workbook with a specified sheet name.
    XLSX.utils.book_append_sheet(wb, ws, "ProspectsEngagedReport");

    // Write the workbook data to an ArrayBuffer, specifying the file type as XLSX.
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // The Blob constructor creates a file-like object from the ArrayBuffer.
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'ProspectsEngagedReport.xlsx');
  };


  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col gap-6">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
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
        <h2 className="text-3xl font-semibold text-gray-800"> Prospects Engaged But Not Converted  </h2>
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

// PaginatedTable Component: Renders a table with pagination controls
function PaginatedTable({ data }) {
  const itemsPerPage = 10; // Number of items to display per page
  const { currentPage, setCurrentPage, totalPages, paginatedData: currentTableData, } = usePagination(data, itemsPerPage);

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
                <td className="p-4 border-b"> {(currentPage - 1) * itemsPerPage + index + 1} </td>
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

// import React, { useContext, useEffect, useState, useMemo } from "react";
// import { ENDPOINTS } from "../../api/constraints.js";
// import axios from "axios";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
// } from "recharts";
// import { companyContext } from "../../context/companyContext.jsx";
// import { useNavigate } from "react-router-dom";
// import { FaArrowLeft, FaRupeeSign } from "react-icons/fa";
// import { HiDownload } from "react-icons/hi";
// import { TrendingUp, PieChart as PieIcon, Users, ChevronDown, Filter } from "lucide-react";
// import { Listbox } from "@headlessui/react";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import Pagination from "../../context/Pagination/pagination.jsx";
// import usePagination from "../../hooks/usePagination.jsx";

// const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6B6B", "#4ECDC4"];

// const LeadSourcePerformanceReport = () => {
//   const { companyId } = useContext(companyContext);
//   const navigate = useNavigate();
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [hoveredSource, setHoveredSource] = useState(null);
//   const [salesPersonFilter, setSalesPersonFilter] = useState("All Sales Persons");
//   const [sourceFilter, setSourceFilter] = useState("All Sources");
//   const [subSourceFilter, setSubSourceFilter] = useState("All Sub Sources");
//   const [sourceSubSources, setSourceSubSources] = useState({});
//   const itemsPerPage = 10;
//   const [dateRange, setDateRange] = useState("all");  
//   const [startDate, setStartDate] = useState("");    
//   const [endDate, setEndDate] = useState("");


//   useEffect(() => {
//     if (!companyId) return;

//     const fetchReport = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get( `${ENDPOINTS.LEAD_SOURCE_PERFORM}/${companyId}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         const formattedMainData = res.data.data.map((item) => ({
//           source: item.source,
//           totalActiveLeads: item.totalActiveLeads,
//            firstLeadDate: item.firstLeadDate,     
//            lastLeadDate: item.lastLeadDate,  
//           convertedLeads: item.convertedLeads,
//           totalRevenue: item.totalRevenue,
//           pipelineValue: item.pipelineValue,
//           conversionRate: item.conversionRate,
//           salesPersons: item.salesPersons || [],
//           subSources: (item.subSources || []).filter(sub => 
//             sub.subSource !== "Unknown Sub Source"
//           ),
//         }));

//         setData(formattedMainData);
//       } catch (err) {
//         console.error("Lead source report error", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [companyId]);

//   // Extract unique filter options
//   const allSalesPersons = useMemo(() => {
//     const persons = new Set();
//     data.forEach(source => {
//       source.salesPersons?.forEach(sp => persons.add(sp.userName));
//     });
//     return ["All Sales Persons", ...Array.from(persons).sort()];
//   }, [data]);

//   const allSources = useMemo(() => {
//     const sources = new Set();
//     data.forEach(source => sources.add(source.source));
//     return ["All Sources", ...Array.from(sources).sort()];
//   }, [data]);

//   //  SOURCE → SUB SOURCE DEPENDENCY
//   useEffect(() => {
//     if (sourceFilter === "All Sources") {
//       const subs = new Set();
//       data.forEach(source => {
//         source.subSources?.forEach(ss => subs.add(ss.subSource));
//       });
//       setSourceSubSources({
//         "All Sources": ["All Sub Sources", ...Array.from(subs).sort()]
//       });
//     } else {
//       const selectedSource = data.find(source => source.source === sourceFilter);
//       const subSources = selectedSource?.subSources?.map(ss => ss.subSource) || [];
//       setSourceSubSources({
//         [sourceFilter]: ["All Sub Sources", ...Array.from(new Set(subSources)).sort()]
//       });
//       // Reset sub source when source changes
//       setSubSourceFilter("All Sub Sources");
//     }
//   }, [sourceFilter, data]);

//   const isDateInRange = (dateString, start, end) => {
//     if (!dateString) return true;
//     const date = new Date(dateString);
//     const startDate = start ? new Date(start) : new Date("2025-01-01");
//     const endDate = end ? new Date(end) : new Date("2026-12-31");
//     return date >= startDate && date <= endDate;
//   };

//   // Filter data based on selection
//   const getFilteredData = useMemo(() => {
//     let filtered = data;
//       if (dateRange === "custom" && startDate && endDate) {
//     filtered = filtered.filter(source => 
//       isDateInRange(source.firstLeadDate, startDate, endDate) || 
//       isDateInRange(source.lastLeadDate, startDate, endDate)
//     );
//   }

//     // Filter by Sales Person
//     if (salesPersonFilter !== "All Sales Persons") {
//       filtered = filtered.map(source => {
//         const filteredSPs = source.salesPersons?.filter(sp => sp.userName === salesPersonFilter) || [];
//         return {
//           ...source,
//           salesPersons: filteredSPs,
//           totalActiveLeads: filteredSPs.reduce((sum, sp) => sum + sp.totalActiveLeads, 0),
//           convertedLeads: filteredSPs.reduce((sum, sp) => sum + sp.convertedLeads, 0),
//           totalRevenue: filteredSPs.reduce((sum, sp) => sum + sp.totalRevenue, 0),
//           pipelineValue: filteredSPs.reduce((sum, sp) => sum + sp.pipelineValue, 0),
//         };
//       }).filter(source => source.salesPersons.length > 0);
//     }

//     // Filter by Source
//     if (sourceFilter !== "All Sources") {
//       filtered = filtered.filter(source => source.source === sourceFilter);
//     }

//     // Filter by Sub Source
//     if (subSourceFilter !== "All Sub Sources") {
//       filtered = filtered.map(source => ({
//         ...source,
//         subSources: source.subSources?.filter(ss => ss.subSource === subSourceFilter) || [],
//       })).filter(source => source.subSources.length > 0);
//     }

//     return filtered;
//   }, [data, salesPersonFilter, sourceFilter, subSourceFilter,dateRange,startDate,endDate  ]);

//   // Filtered calculations
//   const totalActiveLeads = getFilteredData.reduce((sum, item) => sum + item.totalActiveLeads, 0);
//   const totalConverted = getFilteredData.reduce((sum, item) => sum + item.convertedLeads, 0);
//   const totalRevenue = getFilteredData.reduce((sum, item) => sum + item.totalRevenue, 0);
//   const avgConversion = getFilteredData.length > 0 
//     ? (getFilteredData.reduce((sum, item) => sum + item.conversionRate, 0) / getFilteredData.length).toFixed(1)
//     : 0;

//   // Pie chart data (filtered)
//   const pieChartData = getFilteredData.map(item => ({
//     name: item.source,
//     converted: item.convertedLeads,
//     active: item.totalActiveLeads - item.convertedLeads,
//     totalActiveLeads: item.totalActiveLeads,
//     totalRevenue: item.totalRevenue,
//     pipelineValue: item.pipelineValue,
//     conversionRate: item.conversionRate,
//     subSources: item.subSources
//   }));

//   // Table data (filtered)
//   const tableData = useMemo(() => {
//     let rows = [];
//     getFilteredData.forEach((sourceItem) => {
//       const sourceName = sourceItem.source;

//       sourceItem.salesPersons?.forEach((sp) => {
//         rows.push({
//           type: "Sales Person",
//           source: sourceName,
//           name: sp.userName,
//           active: sp.totalActiveLeads,
//           converted: sp.convertedLeads,
//           revenue: sp.totalRevenue,
//           pipeline: sp.pipelineValue,
//         });
//       });

//       sourceItem.subSources?.forEach((ss) => {
//         rows.push({
//           type: "Sub Source",
//           source: sourceName,
//           name: ss.subSource,
//           active: ss.totalActiveLeads,
//           converted: ss.convertedLeads,
//           revenue: ss.totalRevenue,
//           pipeline: ss.pipelineValue,
//           rate: ss.conversionRate,
//         });
//       });

//       rows.push({
//         type: "Source",
//         source: sourceName,
//         name: sourceName,
//         active: sourceItem.totalActiveLeads,
//         converted: sourceItem.convertedLeads,
//         revenue: sourceItem.totalRevenue,
//         pipeline: sourceItem.pipelineValue,
//         rate: sourceItem.conversionRate,
//       });
//     });
//     return rows;
//   }, [getFilteredData]);

// const {
//   currentPage,
//   setCurrentPage,
//   totalPages,
//   paginatedData: currentTableData,
// } = usePagination(tableData, itemsPerPage);


//   const filteredSubSources = useMemo(() => 
//     getFilteredData.flatMap(item => 
//       item.subSources.map(ss => ({
//         subSource: ss.subSource,
//         source: item.source,
//         totalActiveLeads: ss.totalActiveLeads,
//         convertedLeads: ss.convertedLeads,
//       }))
//     ), [getFilteredData]);

//   const lineChartData = getFilteredData.map(item => ({
//     source: item.source,
//     revenue: item.totalRevenue,
//     pipeline: item.pipelineValue
//   }));

//   // Reset pagination on filter change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [salesPersonFilter, sourceFilter, subSourceFilter,startDate,endDate,dateRange]);

//   // Excel Export
//   const exportToExcel = () => {
//     if (tableData.length === 0) {
//       alert("No data to export for current filters.");
//       return;
//     }
//     const headers = ["S.No", "Type", "Source", "Name", "Active", "Converted", "Revenue (₹)", "Pipeline (₹)", "Conv %"];
//     const dataForExport = tableData.map((row, index) => ({
//       "S.No": index + 1,
//       Type: row.type,
//       Source: row.source,
//       Name: row.name,
//       Active: row.active,
//       Converted: row.converted,
//       "Revenue (₹)": `₹${row.revenue?.toLocaleString() || 0}`,
//       "Pipeline (₹)": `₹${row.pipeline?.toLocaleString() || 0}`,
//       "Conv %": row.rate ? `${row.rate}%` : "-",
//     }));
//     const ws = XLSX.utils.json_to_sheet(dataForExport, { header: headers });
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Lead Sources");
//     const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 
//       `lead_sources_${salesPersonFilter}_${sourceFilter}.xlsx`);
//   };

//   if (loading) return <div className="text-center mt-10 text-gray-500">Loading Lead Source Report...</div>;

//   return (
//     <div className="p-4 mx-auto font-[system-ui] bg-gray-50 min-h-screen">
//       {/* HEADER */}
//       <div className="flex items-center mb-6">
//         <button
//           onClick={() => navigate("/reportpage")}
//           className="text-gray-600 hover:text-gray-900 mr-4 text-2xl p-2 rounded-full hover:bg-gray-200 transition-colors"
//         >
//           <FaArrowLeft />
//         </button>
//         <h1 className="text-2xl font-bold text-gray-900">Lead Source Performance</h1>
//       </div>

//       {/* SOURCE → SUB SOURCE DEPENDENCY */}
//       <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 p-4 bg-white rounded-2xl shadow-md">
//         <div>
//           <label className="text-xs font-semibold text-gray-600 mb-2 block">Sales Person</label>
//           <Listbox value={salesPersonFilter} onChange={setSalesPersonFilter}>
//             <div className="relative">
//               <Listbox.Button className="w-full bg-gray-50 border border-gray-300 rounded-full py-2 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 <span>{salesPersonFilter}</span>
//                 <Users className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
//               </Listbox.Button>
//               <Listbox.Options className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto text-sm">
//                 {allSalesPersons.map((person) => (
//                   <Listbox.Option key={person} value={person} className={({ active }) =>
//                     `cursor-pointer select-none relative py-2 px-4 ${active ? "bg-blue-100 text-blue-700" : "text-gray-800"}`
//                   }>
//                     {({ selected }) => (
//                       <span className={`${selected ? "font-semibold" : "font-normal"}`}>{person}</span>
//                     )}
//                   </Listbox.Option>
//                 ))}
//               </Listbox.Options>
//             </div>
//           </Listbox>
//         </div>

//         <div>
//           <label className="text-xs font-semibold text-gray-600 mb-2 block">Source</label>
//           <Listbox value={sourceFilter} onChange={(value) => {
//             setSourceFilter(value);
//             setSubSourceFilter("All Sub Sources"); // Reset sub source
//           }}>
//             <div className="relative">
//               <Listbox.Button className="w-full bg-gray-50 border border-gray-300 rounded-full py-2 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 <span>{sourceFilter}</span>
//                 <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
//               </Listbox.Button>
//               <Listbox.Options className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto text-sm">
//                 {allSources.map((source) => (
//                   <Listbox.Option key={source} value={source} className={({ active }) =>
//                     `cursor-pointer select-none relative py-2 px-4 ${active ? "bg-blue-100 text-blue-700" : "text-gray-800"}`
//                   }>
//                     {({ selected }) => (
//                       <span className={`${selected ? "font-semibold" : "font-normal"}`}>{source}</span>
//                     )}
//                   </Listbox.Option>
//                 ))}
//               </Listbox.Options>
//             </div>
//           </Listbox>
//         </div>

//         <div>
//           <label className="text-xs font-semibold text-gray-600 mb-2 block">Sub Source</label>
//           <Listbox value={subSourceFilter} onChange={setSubSourceFilter}>
//             <div className="relative">
//               <Listbox.Button className="w-full bg-gray-50 border border-gray-300 rounded-full py-2 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
//                 <span>{subSourceFilter}</span>
//                 <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
//               </Listbox.Button>
//               <Listbox.Options className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto text-sm">
//                 {sourceSubSources[sourceFilter]?.length > 0 ? (
//                   sourceSubSources[sourceFilter].map((sub) => (
//                     <Listbox.Option 
//                       key={sub} 
//                       value={sub} 
//                       className={({ active }) =>
//                         `cursor-pointer select-none relative py-2 px-4 ${active ? "bg-blue-100 text-blue-700" : "text-gray-800"}`
//                       }
//                     >
//                       {({ selected }) => (
//                         <span className={`${selected ? "font-semibold" : "font-normal"}`}>{sub}</span>
//                       )}
//                     </Listbox.Option>
//                   ))
//                 ) : (
//                   <Listbox.Option 
//                     key="loading" 
//                     value="All Sub Sources" 
//                     className="cursor-pointer select-none relative py-2 px-4 text-gray-500"
//                     disabled
//                   >
//                     No Sub Sources available
//                   </Listbox.Option>
//                 )}
//               </Listbox.Options>
//             </div>
//           </Listbox>
//         </div>
//          <div>
//     <label className="text-xs font-semibold text-gray-600 mb-2 block">Date Range</label>
//     <div className="flex gap-2">
//       <select 
//         value={dateRange} 
//         onChange={(e) => {
//           setDateRange(e.target.value);
//           if (e.target.value !== "custom") {
//             setStartDate(""); setEndDate("");
//           }
//         }}
//         className="flex-1 bg-gray-50 border border-gray-300 rounded-full py-2 px-3 text-sm"
//       >
//         <option value="all">All Time</option>
//         <option value="custom">Custom Range</option>
//       </select>
//       {dateRange === "custom" && (
//         <>
//           <input
//             type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
//             className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
//           />
//           <input
//             type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
//             className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
//           />
//         </>
//       )}
//     </div>
//   </div>
//       </div>

//       {/* SUMMARY CARDS */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//         <Card icon={<Users size={18} />} title="Total Leads" value={totalActiveLeads} />
//         <Card icon={<FaRupeeSign size={18} />} title="Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
//         <Card icon={<TrendingUp size={18} />} title="Converted" value={totalConverted} />
//         <Card icon={<PieIcon size={18} />} title="Avg Conversion" value={`${avgConversion}%`} />
//       </div>

//       {/* FULL-WIDTH PIE CHART */}
//       <div className="bg-white shadow rounded-2xl p-8 mb-8">
//         <h3 className="mb-6 font-semibold text-xl text-center">🎯 Filtered Sources Conversion Overview</h3>
//         <div className="flex flex-col lg:flex-row items-center gap-8">
//           <div className="flex-1 max-w-md mx-auto">
//             <ResponsiveContainer width="100%" height={400}>
//               <PieChart>
//                 <Pie
//                   data={pieChartData}
//                   dataKey="converted"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={140}
//                   label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
//                 >
//                   {pieChartData.map((entry, index) => (
//                     <Cell 
//                       key={`cell-${index}`} 
//                       fill={COLORS[index % COLORS.length]}
//                       onMouseEnter={() => setHoveredSource(entry)}
//                       onMouseLeave={() => setHoveredSource(null)}
//                     />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//           {hoveredSource && (
//             <div className="flex-1 bg-gray-50 p-6 rounded-xl shadow-lg min-w-[320px] max-w-md">
//               <h4 className="text-xl font-bold mb-4 text-gray-800">{hoveredSource.name}</h4>
//               <div className="grid grid-cols-2 gap-4 text-sm mb-6">
//                 <div>
//                   <p className="font-semibold text-gray-700">Active Leads</p>
//                   <p className="text-2xl font-bold text-blue-600">{hoveredSource.totalActiveLeads}</p>
//                 </div>
//                 <div>
//                   <p className="font-semibold text-gray-700">Pipeline</p>
//                   <p className="text-lg font-bold text-orange-600">₹{hoveredSource.pipelineValue.toLocaleString()}</p>
//                 </div>
//                 <div>
//                   <p className="font-semibold text-gray-700">Converted</p>
//                   <p className="text-2xl font-bold text-green-600">{hoveredSource.converted}</p>
//                 </div>
//                 <div>
//                   <p className="font-semibold text-gray-700">Revenue</p>
//                   <p className="text-xl font-bold text-purple-600">₹{hoveredSource.totalRevenue.toLocaleString()}</p>
//                 </div>
                
//                 <div className="col-span-2">
//                   <p className="text-sm font-semibold text-gray-700">Conversion Rate</p>
//                   <p className="text-3xl font-bold text-emerald-600">{hoveredSource.conversionRate}%</p>
//                 </div>
//               </div>
//               {hoveredSource.subSources?.length > 0 && (
//                 <div className="mt-4 pt-4 border-t">
//                   <p className="font-semibold text-sm mb-3">Sub Sources:</p>
//                   <div className="space-y-2 max-h-32 overflow-y-auto">
//                     {hoveredSource.subSources.map((sub, idx) => (
//                       <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border">
//                         <div>
//                           <div className="font-medium text-sm">{sub.subSource}</div>
//                           <div className="text-xs text-gray-500">{sub.convertedLeads}/{sub.totalActiveLeads}</div>
//                         </div>
//                         <div className="text-right">
//                           <p className="text-sm font-bold text-green-600">{sub.conversionRate}%</p>
//                           <p className="text-xs font-semibold text-purple-600">₹{sub.totalRevenue?.toLocaleString() || '0'}</p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Line + Bar Charts SIDE BY SIDE */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
//         <div className="bg-white rounded-2xl shadow-md p-4 h-[350px] flex flex-col">
//           <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 Revenue Trend (Filtered)</h3>
//           <div className="flex-grow">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={lineChartData}>
//                 <XAxis dataKey="source" angle={-45} height={80} />
//                 <YAxis tickFormatter={(v) => `₹${(v/1000000).toFixed(1)}M`} />
//                 <Tooltip />
//                 <Line dataKey="revenue" stroke="#0088FE" strokeWidth={3} />
//                 <Line dataKey="pipeline" stroke="#00C49F" strokeWidth={3} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {filteredSubSources.length > 0 && (
//           <div className="bg-white rounded-2xl shadow-md p-4 h-[350px] flex flex-col">
//             <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 SubSource Performance (Filtered)</h3>
//             <div className="flex-grow">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={filteredSubSources.slice(0, 12)} layout="horizontal">
//                   <XAxis type="number" />
//                   <YAxis dataKey="subSource" type="category" width={150} />
//                   <Tooltip />
//                   <Bar dataKey="totalActiveLeads" fill="#0088FE" />
//                   <Bar dataKey="convertedLeads" fill="#00C49F" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* TABLE WITH PAGINATION & EXPORT */}
//       <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xl">
//         <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
//           <div className="flex items-center gap-3">
//             <h3 className="text-xl font-bold text-gray-900">
//               📋 Lead Source Report ({currentTableData.length} of {tableData.length} rows)
//               {dateRange === "custom" && startDate && endDate && (
//                 <span className="ml-2 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
//                   {startDate} → {endDate}
//                 </span>
//               )}
//             </h3>
//           </div>
//           <button 
//             onClick={exportToExcel} 
//             className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-all text-sm font-semibold"
//           >
//             <HiDownload size={16} className="mr-2" /> Export Excel
//           </button>
//         </div>

//         <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm max-h-[500px]">
//           <table className="min-w-full text-sm text-left text-gray-800 font-medium">
//             <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300 text-gray-600">
//               <tr>
//                 <th className="px-6 py-4 whitespace-nowrap">S.No</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Type</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Source</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Name</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Active</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Pipeline (₹)</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Converted</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Revenue (₹)</th>
//                 <th className="px-6 py-4 whitespace-nowrap">Conv %</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {currentTableData.length > 0 ? (
//                 currentTableData.map((row, index) => {
//                   const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
//                   return (
//                     <tr key={`${row.type}-${row.name}-${index}`} className="hover:bg-gray-50 transition">
//                       <td className="px-6 py-3 text-center text-gray-500 font-semibold">{globalIndex}</td>
//                       <td className="px-6 py-3 font-semibold">{row.type}</td>
//                       <td className="px-6 py-3">{row.source}</td>
//                       <td className="px-6 py-3">{row.name}</td>
//                       <td className="px-6 py-3 text-center">{row.active}</td>
//                       <td className="px-6 py-3 text-right text-orange-600">₹{row.pipeline?.toLocaleString()}</td>
//                       <td className="px-6 py-3 text-center text-green-600 font-semibold">{row.converted}</td>
//                       <td className="px-6 py-3 text-right text-purple-600">₹{row.revenue?.toLocaleString()}</td>
                      
//                       <td className="px-6 py-3 text-center text-emerald-600 font-bold">{row.rate ? `${row.rate}%` : "-"}</td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan="9" className="text-center py-6 text-gray-500">
//                     No data matches current filters. Try adjusting Sales Person/Source/Sub Source filters.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
      
//          <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             setCurrentPage={setCurrentPage}
//           />

//       </div>
//     </div>
//   );
// };

// const Card = ({ icon, title, value }) => (
//   <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center transition-all hover:shadow-lg transform hover:-translate-y-1">
//     <div className="text-blue-600 mb-1">{icon}</div>
//     <h4 className="text-xs text-gray-500">{title}</h4>
//     <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
//   </div>
// );

// export default LeadSourcePerformanceReport;


