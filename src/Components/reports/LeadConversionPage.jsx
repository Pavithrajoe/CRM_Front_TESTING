import React, { useEffect, useState, useCallback, useContext } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints"; 
import { useNavigate } from "react-router-dom"; 
import { FaArrowLeft } from "react-icons/fa";
import { UserContext } from "../../context/UserContext"; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import * as XLSX from 'xlsx'; // Import xlsx library
import { HiDownload } from "react-icons/hi";
import { saveAs } from 'file-saver'; // Import saveAs from file-saver
import { Listbox } from "@headlessui/react"; // Import Listbox for dropdown
import { ChevronDown } from "lucide-react"; // Icon for dropdown

// Chart registration - Essential for Chart.js to work
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Helper function to format decimal days into human-readable days and hours
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
    if (result) result += ' '; 
    result += `${hours} Hr${hours > 1 ? 's' : ''}`;
  }

  if (days === 0 && hours === 0) {
    return '0 Days'; 
  }
  return result.trim(); 
};

const formatHoursToHrsMins = (decimalHours) => {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) {
    return '-';
  }

  const totalMinutes = Math.round(decimalHours * 60); 
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0 && decimalHours !== 0) { 
    return '< 1 min';
  }
  if (hours === 0 && minutes === 0 && decimalHours === 0) {
    return '0 hrs 0 mins';
  }

  let result = '';
  if (hours > 0) {
    result += `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    if (result) result += ' '; 
    result += `${minutes} min${minutes > 1 ? 's' : ''}`;
  }

  return result.trim();
};

const formatDateTimeForTable = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);

  // Check for valid date
  if (isNaN(date.getTime())) return '-';

  const pad = (num) => String(num).padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Month is 0-indexed
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' (midnight) should be '12 AM'

  return `${day}/${month}/${year} ${pad(hours)}.${minutes} ${ampm}`;
};

const LeadConversionPage = () => {
  // State for fetching and displaying data
  const [data, setData] = useState(null); // Initial state is null, as data is an object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Context and token for API authentication
  const { companyId } = useContext(UserContext);
  const token = localStorage.getItem("token");

  // State for date filtering
  const [dateFilterFrom, setDateFilterFrom] = useState("");
  const [dateFilterTo, setDateFilterTo] = useState("");
  const [showDefaultMonthNotification, setShowDefaultMonthNotification] = useState(false);

  // Pagination states for "Lost Opportunity Breakdown" table
  const [lostLeadsCurrentPage, setLostLeadsCurrentPage] = useState(1);
  const lostLeadsPerPage = 10; 

  // State for chart granularity (Week or Month)
  const [chartGranularity, setChartGranularity] = useState("week"); 

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Format dates and set state
    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setShowDefaultMonthNotification(true);
  }, []);

  const fetchConversionData = useCallback(async (fromDate, toDate) => {
    setLoading(true);
    setError(null);

    if (!token || !companyId) {
      setError("Authentication error: Missing token or company ID. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await axios.get(`${ENDPOINTS.LEAD_CONVERSION}/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params, 
      });

      if (response.data) {
        setData(response.data);
      } else {
        setError("API response was empty or did not contain expected data.");
        setData(null); 
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 404) {
          setError(`API Endpoint Not Found (404): ${err.config.url}. Please check backend route.`);
        } else {
          setError(`Error fetching data: ${err.response.status} - ${err.response.statusText || err.message}`);
        }
      } else {
        setError(`Error fetching data: ${err.message || "An unknown error occurred"}`);
      }
      setData(null); 
    } finally {
      setLoading(false);
    }
  }, [token, companyId]);
  useEffect(() => {
    if (dateFilterFrom || dateFilterTo || (!dateFilterFrom && !dateFilterTo)) {
        fetchConversionData(dateFilterFrom, dateFilterTo);
    }
    setLostLeadsCurrentPage(1);
  }, [dateFilterFrom, dateFilterTo, fetchConversionData]); 

  if (loading) return <div className="p-10 text-center text-gray-600">Loading conversion data...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;

  if (!data || typeof data !== 'object' || !data.metrics || !data.data) {
    console.warn("Data structure incomplete or missing:", data);
    return <div className="p-10 text-center text-gray-600">No complete conversion data available to display.</div>;
  }

  const { metrics, data: apiData = {} } = data;
  const { dealConversion = [], lostLeads = [] } = apiData; 

  const displayLostLeads = lostLeads; 

  // --- Pagination Logic for Lost Leads Table ---
  const indexOfLastLostLead = lostLeadsCurrentPage * lostLeadsPerPage;
  const indexOfFirstLostLead = indexOfLastLostLead - lostLeadsPerPage;
  const paginatedLostLeads = displayLostLeads.slice(indexOfFirstLostLead, indexOfLastLostLead);
  const totalLostLeadsPages = Math.ceil(displayLostLeads.length / lostLeadsPerPage);

  const paginateLostLeads = (pageNumber) => {
    setLostLeadsCurrentPage(pageNumber);
    const tableDiv = document.querySelector('.lost-leads-table-container');
    if (tableDiv) tableDiv.scrollTop = 0;
  };

  const renderLostLeadsPagination = () => {
    if (totalLostLeadsPages <= 1 && displayLostLeads.length <= lostLeadsPerPage) return null; 

    const pageNumbers = [];
    const maxVisiblePages = 5; 

    let startPage = Math.max(1, lostLeadsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalLostLeadsPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    endPage = Math.max(startPage, endPage);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => paginateLostLeads(lostLeadsCurrentPage - 1)}
          disabled={lostLeadsCurrentPage === 1}
          className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Prev
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => paginateLostLeads(1)}
              className={`px-3 py-1 border rounded-lg ${
                lostLeadsCurrentPage === 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-600">...</span>}
          </>
        )}
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => paginateLostLeads(number)}
            className={`px-3 py-1 border rounded-lg ${
              lostLeadsCurrentPage === number ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {number}
          </button>
        ))}
        {totalLostLeadsPages > endPage && (
          <>
            {totalLostLeadsPages > endPage + 1 && <span className="text-gray-600">...</span>}
            <button
              onClick={() => paginateLostLeads(totalLostLeadsPages)}
              className={`px-3 py-1 border rounded-lg ${
                lostLeadsCurrentPage === totalLostLeadsPages ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {totalLostLeadsPages}
            </button>
          </>
        )}
        <button
          onClick={() => paginateLostLeads(lostLeadsCurrentPage + 1)}
          disabled={lostLeadsCurrentPage === totalLostLeadsPages}
          className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Next
        </button>
        {displayLostLeads.length > 0 && (
            <span className="text-sm text-gray-600 ms-4">
                {`${indexOfFirstLostLead + 1}-${indexOfLastLostLead > displayLostLeads.length ? displayLostLeads.length : indexOfLastLostLead} of ${displayLostLeads.length}`}
            </span>
        )}
      </div>
    );
  };

  const allDaysOfWeekShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; 

  const getBarChartData = () => {
    let labels = [];
    let convertedData = [];
    let wonData = [];

    if (chartGranularity === "week") {
      labels = allDaysOfWeekShort;
      convertedData = allDaysOfWeekShort.map(day => metrics.weekWise?.[day] || 0);
      wonData = allDaysOfWeekShort.map(day => metrics.wonLeadsWeekWise?.[day] || 0);
    } else { 
      const allDates = new Set([
        ...Object.keys(metrics.monthWise || {}),
        ...Object.keys(metrics.wonLeadsMonthWise || {})
      ].sort());

      labels = Array.from(allDates).map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      });

      convertedData = Array.from(allDates).map(date => metrics.monthWise?.[date] || 0);
      wonData = Array.from(allDates).map(date => metrics.wonLeadsMonthWise?.[date] || 0);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: "Converted Leads",
          backgroundColor: "#9FE11D",
          data: convertedData,
        },
        {
          label: "Won Leads",
          backgroundColor: "#CD37CC",
          data: wonData,
        },
      ],
    };
  };

  const barChartData = getBarChartData();

  const lineChartData = {
    labels: [0, 20, 40, 60, 80, 100], 
    datasets: [
      {
        label: "Avg. Conv Time",
        data: [11, 11, 16, 22, 12, 21],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#fff",
        pointHoverRadius: 7,
      },
    ],
  };

 const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (Hrs)',
          align: 'end',
        },
        ticks: {
          stepSize: 5,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Lead Volume',
          align: 'end',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatHoursToHrsMins(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Leads',
        },
        ticks: {
          precision: 0, 
        }
      },
      x: {
        title: {
          display: true,
          text: chartGranularity === "week" ? "Day of Week" : "Date",
        },
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            if (chartGranularity === "month" && context.length > 0) {
              const dateLabel = context[0].label;
              const year = new Date().getFullYear(); 
              return `${dateLabel} ${year}`;
            }
            return context[0].label; 
          }
        }
      }
    }
  };

  const handleExport = () => {
    if (displayLostLeads.length === 0) {
      alert("No data to export for the current filter.");
      return;
    }

    const dataToExport = displayLostLeads.map(lead => {
      const createdAtFormatted = formatDateTimeForTable(lead.dcreated_dt);
      const lostAtFormatted = formatDateTimeForTable(lead.ConvertToLostTime);
      
      let timeToLoseFormatted = "-";
      const createdAtDate = lead.dcreated_dt ? new Date(lead.dcreated_dt) : null;
      const lostAtDate = lead.ConvertToLostTime ? new Date(lead.ConvertToLostTime) : null;

      if (createdAtDate && lostAtDate) {
        const diffTimeMs = Math.abs(lostAtDate.getTime() - createdAtDate.getTime());
        const diffDaysDecimal = diffTimeMs / (1000 * 60 * 60 * 24); 
        timeToLoseFormatted = formatDecimalDaysToDaysHours(diffDaysDecimal);
      }

      return {
        'S.No': '', 
        'Lead Name': lead.clead_name || "-",
        'Owner': lead.user?.cFull_name || "-",
        'Source': lead.lead_source_id === 1 ? "Website" : "Referral",
        'Created Date': createdAtFormatted,
        'Lost At': lostAtFormatted,
        'Time to Lose': timeToLoseFormatted,
      };
    });

    dataToExport.forEach((row, index) => {
        row['S.No'] = index + 1;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "LostLeadsReport"); 

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'LostLeadsReport.xlsx');
  };

  return (
    <div className="p-6 space-y-10 bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
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
                  <FaArrowLeft /> {/* Back arrow icon */}
                </button>
                <h2 className="text-3xl font-semibold text-gray-800">
                  Lead Conversion Analysis
                </h2>
              </div>

      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-5">
        <Card
          title="Avg Lead Conversion Time"
          value={formatDecimalDaysToDaysHours(metrics.averageDaysToConvert)}
          change=""
          isPositive={true}
        />
        <Card
          title="Fastest Conversion Time"
          value={formatDecimalDaysToDaysHours(metrics.fastestConversion)}
          isPositive={false}
        />
        <Card
          title="Slowest Conversion Time"
          value={formatDecimalDaysToDaysHours(metrics.slowestConversion)}
          isPositive={true}
        />
        <Card
          title="Conversion SLA %"
          value={`${metrics.slaPercentage || 0}%`}
          isPositive={false}
        />
      </div>

      {/* Date Filter and Notification Area for Lost Opportunities */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Lost Opportunity Breakdown</h2>
          <div className="flex gap-4 items-center flex-wrap">
            {/* "From" Date Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="fromDate" className="text-sm text-gray-700">From:</label>
              <input
                type="date"
                id="fromDate"
                value={dateFilterFrom}
                onChange={(e) => {
                  setDateFilterFrom(e.target.value);
                  setShowDefaultMonthNotification(false);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
              />
            </div>
            {/* "To" Date Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="toDate" className="text-sm text-gray-700">To:</label>
              <input
                type="date"
                id="toDate"
                value={dateFilterTo}
                onChange={(e) => {
                  setDateFilterTo(e.target.value);
                  setShowDefaultMonthNotification(false);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
              />
            </div>
            {/* Export to Excel Button */}
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-colors text-sm font-semibold"
            >
            <HiDownload size={16} className="mr-2" /> Export to Excel
            </button>
          </div>
        </div>

        {/* Date Filter Notification Area */}
        {showDefaultMonthNotification && dateFilterFrom && dateFilterTo && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-sm">
            💡 Showing data for the **current month**: **{new Date(dateFilterFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **{new Date(dateFilterTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.
          </div>
        )}
        {!showDefaultMonthNotification && dateFilterFrom && dateFilterTo && (
          <div className="mb-4 p-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm">
            Filtering data from **{new Date(dateFilterFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **{new Date(dateFilterTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.
          </div>
        )}
        {!dateFilterFrom && !dateFilterTo && (
            <div className="mb-4 p-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm">
                Showing all available data.
            </div>
        )}

        {/* Table structure - Added class for optional scroll to top */}
        <div className="overflow-x-auto lost-leads-table-container">
          <table className="w-full text-sm text-left table-auto">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                {["S.No", "Lead Name", "Owner", "Source", "Created Date", "Lost At", "Time to Lose"].map((head, i) => (
                  <th key={i} className="px-4 py-2">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Now mapping over paginatedLostLeads */}
              {paginatedLostLeads.length > 0 ? (
                paginatedLostLeads.map((lostLead, i) => {
                  const createdAt = lostLead.dcreated_dt ? new Date(lostLead.dcreated_dt) : null;
                  const lostAt = lostLead.ConvertToLostTime ? new Date(lostLead.ConvertToLostTime) : null;
                  let timeToLose = "-";

                  if (createdAt && lostAt) {
                    const diffTimeMs = Math.abs(lostAt.getTime() - createdAt.getTime());
                    const diffDaysDecimal = diffTimeMs / (1000 * 60 * 60 * 24); // Convert ms to decimal days
                    timeToLose = formatDecimalDaysToDaysHours(diffDaysDecimal); // Format using existing helper
                  }

                  return (
                    <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                      {/* Corrected S.No for pagination */}
                      <td className="px-4 py-2">{indexOfFirstLostLead + i + 1}</td>
                      <td className="px-4 py-2">{lostLead.clead_name || "-"}</td>
                      <td className="px-4 py-2">{lostLead.user?.cFull_name || "-"}</td>
                      <td className="px-4 py-2">{lostLead.lead_source_id === 1 ? "Website" : "Referral"}</td>
                      <td className="px-4 py-2">{formatDateTimeForTable(lostLead.dcreated_dt)}</td> {/* Applied new format */}
                      
                      <td className="px-4 py-2">{formatDateTimeForTable(lostLead.ConvertToLostTime)}</td> {/* Applied new format */}
                      <td className="px-4 py-2">{timeToLose}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-gray-500 py-4">No lost leads data available for the selected date range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls for Lost Leads Table */}
        {renderLostLeadsPagination()}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8"> {/* Added mt-8 for spacing */}
          {/* Bar Chart */}
          <div className="bg-white p-4 rounded-xl shadow h-[350px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-gray-800">Converted Leads vs Won Leads</h2>
              {/* Chart Granularity Dropdown */}
              <Listbox value={chartGranularity} onChange={setChartGranularity}>
                <div className="relative w-36">
                  <Listbox.Button className="w-full bg-gray-100 border border-gray-300 rounded-lg py-1.5 pl-3 pr-8 text-left text-sm cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                    {chartGranularity === "week" ? "Week-wise" : "Month-wise"}
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <Listbox.Option
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                        }`
                      }
                      value="week"
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                          Week-wise
                        </span>
                      )}
                    </Listbox.Option>
                    <Listbox.Option
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                        }`
                      }
                      value="month"
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                          Month-wise
                        </span>
                      )}
                    </Listbox.Option>
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <Bar
              data={barChartData}
              options={barChartOptions}
            />
          </div>

          {/* Line Chart */}
          <div className="bg-white p-4 rounded-xl mb-2 shadow h-[350px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-gray-800">Lead Volume vs Avg. Conv Time</h2>
            </div>
            <Line
              data={lineChartData}
              options={lineChartOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Card component for displaying metrics
const Card = ({ title, value, change, isPositive }) => (
  <div className="bg-white p-6 rounded-sm shadow flex flex-col gap-3 hover:shadow-md transition">
    <h4 className="text-xs text-gray-500">{title}</h4>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
    <div className={`text-xs flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
      {change}
    </div>
  </div>
);

export default LeadConversionPage;