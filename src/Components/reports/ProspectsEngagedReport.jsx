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
import { HiDownload } from "react-icons/hi";

import * as XLSX from 'xlsx'; // Import xlsx library for Excel export
import { saveAs } from 'file-saver'; // Import saveAs from file-saver for downloading files

// Register Chart.js components that will be used
ChartJS.register(BarElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Helper function to format decimal days into human-readable days and hours
// This function is not directly used in the ProspectsEngagedReport but is often
// found in related lead management contexts, so it's kept for completeness.
const formatDecimalDaysToDaysHours = (decimalDays) => {
  const numDays = parseFloat(decimalDays);
  if (isNaN(numDays) || numDays < 0) return '0 Days';

  const days = Math.floor(numDays);
  const fractionalPart = numDays - days;
  const hours = Math.round(fractionalPart * 24); // Round to nearest hour

  let result = '';
  if (days > 0) {
    result += `${days} Day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    if (result) result += ' '; // Add space if days exist
    result += `${hours} Hr${hours > 1 ? 's' : ''}`;
  }

  if (days === 0 && hours === 0) {
    return '0 Days'; // For values like 0.00 or very small fractions
  }
  return result.trim(); // Trim any leading/trailing spaces
};

// Helper function to format date and time to DD/MM/YYYY HH.MM AM/PM
// This is used for displaying dates in a user-friendly format.
const formatDateTimeForTable = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);

  // Check for valid date object
  if (isNaN(date.getTime())) return '-';

  const pad = (num) => String(num).padStart(2, '0'); // Helper to add leading zero if needed

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Month is 0-indexed, so add 1
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM/PM
  hours = hours % 12; // Convert to 12-hour format
  hours = hours ? hours : 12; // The hour '0' (midnight) should be '12 AM'

  return `${day}/${month}/${year} ${pad(hours)}.${minutes} ${ampm}`;
};

// Main component for Prospects Engaged Report
export default function ProspectsEngagedReport() {
  // State to store the fetched data from the API
  const [prospectsEngaged, setProspectsEngaged] = useState({
    leadEngagementDetails: [], // Array for detailed lead engagement data
    leadCovertToDeal: [],     // Array for leads converted to deals
  });
  // State to control the active filter for the chart ('all', 'converted', 'nonConverted')
  const [activeChartFilter, setActiveChartFilter] = useState("all");
  // State to manage loading status for data fetching
  const [loading, setLoading] = useState(true);

  // States for date filtering inputs
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  // State to track if the default current month filter is active
  const [isDefaultMonth, setIsDefaultMonth] = useState(true);

  // Helper function to format a Date object to "YYYY-MM-DD" string for input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Effect hook to set the default date range to the current month on initial component mount
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setIsDefaultMonth(true); // Indicate that the default month filter is applied
  }, []); // Empty dependency array ensures this runs only once on mount

  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Effect hook to fetch data from the API whenever date filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true before fetching data
      try {
        const token = localStorage.getItem("token"); // Retrieve authentication token
        if (!token) throw new Error("Token not found"); // Handle missing token

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
        if (!company_id) throw new Error("Company ID missing"); // Handle missing company ID

        // Construct query parameters for date filtering
        const queryParams = new URLSearchParams();
        if (dateFilterFrom) {
          queryParams.append("fromDate", new Date(dateFilterFrom).toISOString());
        }
        if (dateFilterTo) {
          const endOfDay = new Date(dateFilterTo);
          endOfDay.setHours(23, 59, 59, 999); // Set to end of the day for 'toDate' filter
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

        const result = await res.json(); // Parse the JSON response
        setProspectsEngaged(result); // Update state with fetched data
      } catch (err) {
        console.error("API error:", err.message);
        // In a real application, you might set an error state here to display a message to the user.
      } finally {
        setLoading(false); // Set loading to false after data fetching is complete
      }
    };

    fetchData(); // Call the fetchData function
  }, [dateFilterFrom, dateFilterTo]); // Dependencies: re-run effect when date filters change

  // Calculate counts and percentages for cards
  const convertedCount = prospectsEngaged.leadCovertToDeal?.length ?? 0;
  const lostCount = prospectsEngaged?.totalLostLead ?? 0;
  const totalCount = convertedCount + lostCount;
  const lostPercentage = totalCount > 0 ? (lostCount / totalCount) * 100 : 0;

  // Helper function to format numbers for display (removes .00 if whole number)
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
      changeType: "positive", // Placeholder for actual change logic
    },
    {
      title: "Avg Engagement Score",
      value: formatNumberForDisplay(prospectsEngaged?.avgEngagementScore),
      changeType: "neutral", // Placeholder for actual change logic
    },
    {
      title: "Avg No. of Interactions",
      value: formatNumberForDisplay(prospectsEngaged?.avgInteractions),
      changeType: "positive", // Placeholder for actual change logic
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
    const status = lead.previousActionBeforeLost || "Lost"; // Default to "Lost" if not specified
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  prospectsEngaged.leadCovertToDeal?.forEach((lead) => {
    const status = lead.lead_status?.clead_name || "Converted"; // Default to "Converted"
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const convertedStatuses = ["Won", "Converted"]; // Define statuses considered "converted"
  const labels = Object.keys(statusCounts); // Get unique status labels for chart X-axis

  // Function to prepare data for the Chart.js Bar chart based on the active filter
  const getChartData = () => {
    const convertedData = [];
    const nonConvertedData = [];

    labels.forEach((status) => {
      if (convertedStatuses.includes(status)) {
        convertedData.push(statusCounts[status]);
        nonConvertedData.push(0); // Non-converted count is 0 for converted statuses
      } else {
        nonConvertedData.push(statusCounts[status]);
        convertedData.push(0); // Converted count is 0 for non-converted statuses
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

  const leadHandlingChartData = getChartData(); // Get chart data based on current filter

  // Options for the Chart.js Bar chart
  const leadHandlingChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to resize freely
    plugins: {
      legend: {
        display: false, // Hide legend as buttons control visibility
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
    sNo: index + 1, // Serial number
    prospectName: lead.clead_name, // Lead name
    engagementScore: lead.engagementScore, // Engagement score
    interactionCount: lead.interactionCount, // Number of interactions
    status: lead.previousActionBeforeLost || "Lost", // Status (default to "Lost")
    disqualificationReason:
      // Conditional check for disqualification reason
      typeof lead.previousActionBeforeLost === "object" &&
      lead.previousActionBeforeLost?.reason
        ? lead.previousActionBeforeLost.reason
        : "No Reason", // Default reason
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
    // Check if there's any data to export. If not, show an alert and stop.
    if (prospectsEngaged.leadEngagementDetails.length === 0) {
      alert("No data to export for the current filter.");
      return;
    }

    // Transform the data from 'prospectsEngaged.leadEngagementDetails'
    // into a new array of objects, where each object represents a row in the Excel sheet.
    // The keys of these objects will become the column headers in Excel.
    const dataToExport = prospectsEngaged.leadEngagementDetails.map((lead, index) => {
      // Ensure all fields match the table columns and are formatted as desired for the export.
      // 'S.No' is included as a placeholder and will be filled with sequential numbers.
      return {
        'S.No': index + 1, // Assign sequential number directly here
        'Prospect Name': lead.clead_name || "-", // Use 'clead_name' for prospect name, default to "-"
        'Engagement Score': lead.engagementScore || 0, // Default to 0 if not available
        'Num of Interactions': lead.interactionCount || 0, // Default to 0 if not available
        'Status': lead.previousActionBeforeLost || "Lost", // Default to "Lost" if not available
        'Disqualification Reason':
          // Check if 'previousActionBeforeLost' is an object and has a 'reason' property
          typeof lead.previousActionBeforeLost === "object" &&
          lead.previousActionBeforeLost?.reason
            ? lead.previousActionBeforeLost.reason // Use the reason if it exists
            : "No Reason", // Default if no specific reason is found
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

    // Use 'file-saver' to trigger the download of the generated Excel file.
    // The Blob constructor creates a file-like object from the ArrayBuffer.
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'ProspectsEngagedReport.xlsx');
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
            {card.change && ( // Only render if 'change' property exists
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
        <div className="relative h-96"> {/* Chart container with fixed height */}
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

// PaginatedTable Component: Renders a table with pagination controls
function PaginatedTable({ data }) {
  const itemsPerPage = 10; // Number of items to display per page
  const [currentPage, setCurrentPage] = useState(1); // Current active page

  // Calculate total pages and data slice for the current page
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Function to change the current page
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
              "Disqualification Reason", // Added this header to match tableData
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
                <td className="p-4 border-b">{row.disqualificationReason}</td> {/* Display disqualification reason */}
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

      {/* Pagination Controls */}
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
