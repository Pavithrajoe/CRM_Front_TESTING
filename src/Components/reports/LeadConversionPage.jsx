import React, { useEffect, useState, useCallback, useContext } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints"; // Make sure this path is correct
import { UserContext } from "../../context/UserContext"; // Make sure this path is correct
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

// Chart registration - Essential for Chart.js to work
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const LeadConversionPage = () => {
  // State for fetching and displaying data
  const [data, setData] = useState(null); // Initial state is null, as data is an object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Context and token for API authentication
  const { companyId } = useContext(UserContext); // Assuming companyId is correctly provided by context
  const token = localStorage.getItem("token");

  // State for date filtering
  const [dateFilterFrom, setDateFilterFrom] = useState("");
  const [dateFilterTo, setDateFilterTo] = useState("");
  // State to control when to show the "current month" default notification
  const [showDefaultMonthNotification, setShowDefaultMonthNotification] = useState(false);

  // Pagination states for "Lost Opportunity Breakdown" table
  const [lostLeadsCurrentPage, setLostLeadsCurrentPage] = useState(1);
  const lostLeadsPerPage = 10; // Number of lost leads to show per page

  // Helper function to format a Date object to "YYYY-MM-DD" string for input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Effect to set the default date range to the current month on initial component mount
  useEffect(() => {
    const today = new Date();
    // Get the first day of the current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Get the last day of the current month
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Format dates and set state
    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setShowDefaultMonthNotification(true);
  }, []); // Empty dependency array means this runs only once on mount

  // Memoized function to fetch conversion data from the API
  const fetchConversionData = useCallback(async (fromDate, toDate) => {
    setLoading(true);
    setError(null);

    // Ensure we have token and companyId before making API call
    if (!token || !companyId) {
      setError("Authentication error: Missing token or company ID. Please log in.");
      setLoading(false);
      return;
    }

    try {
      // Build the params object. Only include dates if they are not empty strings.
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      // Log the parameters and the base URL for debugging
      console.log("Fetching conversion data with params:", params);
      // console.log("Base Request URL:", `${ENDPOINTS.LEAD_CONVERSION}/${companyId}`);

      const response = await axios.get(`${ENDPOINTS.LEAD_CONVERSION}/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params, // Axios will append these as ?fromDate=...&toDate=...
      });

      // Check if response.data exists and has content
      if (response.data) {
        setData(response.data);
      } else {
        // If response.data is empty but no error, set a specific message
        setError("API response was empty or did not contain expected data.");
        setData(null); // Clear previous data if response is empty
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      // More specific error message for 404
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 404) {
          setError(`API Endpoint Not Found (404): ${err.config.url}. Please check backend route.`);
        } else {
          setError(`Error fetching data: ${err.response.status} - ${err.response.statusText || err.message}`);
        }
      } else {
        setError(`Error fetching data: ${err.message || "An unknown error occurred"}`);
      }
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [token, companyId]); // Dependencies for useCallback: refetch if token or companyId changes

  // Effect to trigger data fetch whenever the date filters change or on initial mount
  useEffect(() => {
    // Only fetch data if date filters are set (initial default or user input)
    // OR if both are explicitly cleared for "View All"
    if (dateFilterFrom || dateFilterTo || (!dateFilterFrom && !dateFilterTo)) {
        fetchConversionData(dateFilterFrom, dateFilterTo);
    }
  }, [dateFilterFrom, dateFilterTo, fetchConversionData]); // Dependencies for useEffect

  // --- Render Logic with Robust Checks ---
  if (loading) return <div className="p-10 text-center text-gray-600">Loading conversion data...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;

  // IMPORTANT: Guard against `data` being null or missing expected properties
  // before attempting to destructure or map over arrays.
  if (!data || typeof data !== 'object' || !data.metrics || !data.data) {
    console.warn("Data structure incomplete or missing:", data);
    return <div className="p-10 text-center text-gray-600">No complete conversion data available to display.</div>;
  }

  // Destructure data safely, providing empty object/array defaults
  const { metrics, data: apiData = {} } = data;
  const { dealConversion = [], lostLeads = [] } = apiData; // Default to empty arrays if missing

  // `displayLostLeads` is now guaranteed to be an array due to default assignment
  const displayLostLeads = lostLeads;

  // --- Pagination Logic for Lost Leads Table ---
  const indexOfLastLostLead = lostLeadsCurrentPage * lostLeadsPerPage;
  const indexOfFirstLostLead = indexOfLastLostLead - lostLeadsPerPage;
  const paginatedLostLeads = displayLostLeads.slice(indexOfFirstLostLead, indexOfLastLostLead);
  const totalLostLeadsPages = Math.ceil(displayLostLeads.length / lostLeadsPerPage);

  const paginateLostLeads = (pageNumber) => {
    setLostLeadsCurrentPage(pageNumber);
    // Optional: scroll to the top of the table when changing pages
    // This requires a ref or a specific class name on the table's scrollable container
    const tableDiv = document.querySelector('.lost-leads-table-container');
    if (tableDiv) tableDiv.scrollTop = 0;
  };

  const renderLostLeadsPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Max number of page buttons to show

    let startPage = Math.max(1, lostLeadsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalLostLeadsPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if not enough pages after current to fill maxVisiblePages
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

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
        <button
          onClick={() => paginateLostLeads(lostLeadsCurrentPage + 1)}
          disabled={lostLeadsCurrentPage === totalLostLeadsPages}
          className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Next
        </button>
        {/* Display current range of leads and total filtered leads */}
        {displayLostLeads.length > 0 && (
            <span className="text-sm text-gray-600">
                {`${indexOfFirstLostLead + 1}-${indexOfLastLostLead > displayLostLeads.length ? displayLostLeads.length : indexOfLastLostLead} of ${displayLostLeads.length}`}
            </span>
        )}
      </div>
    );
  };

  // --- Chart Data (Using sample data for now, bind with actual API response later) ---
  const barChartData = {
    labels: ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Conversion Rate",
        backgroundColor: "#9FE11D",
        data: [90, 50, 75, 75, 25, 45, 80],
      },
      {
        label: "Win Rate",
        backgroundColor: "#CD37CC",
        data: [60, 65, 88, 70, 50, 0, 80],
      },
    ],
  };

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
          text: '(Hrs)',
          align: 'end',
        },
        ticks: {
          stepSize: 5,
          max: 24,
        },
      },
      x: {
        title: {
          display: true,
          text: '(Lead Vol)',
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
              label += context.parsed.y + ' Hrs';
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
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
        }
      }
    }
  };

  return (
    <div className="p-6 space-y-10 bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
      <h1 className="font-semibold text-xl ms-2">Lead Conversion Analysis</h1>

      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-5">
        <Card
          title="Avg Lead Conversion Time"
          value={`${metrics.averageDaysToConvert || 0} Days`}
          change="0.08%"
          isPositive={true}
        />
        <Card
          title="Fastest Conversion Time"
          value={`${metrics.fastestConversion || 0} Days`}
          change="0.03%"
          isPositive={false}
        />
        <Card
          title="Slowest Conversion Time"
          value={`${metrics.slowestConversion || 0} Days`}
          change="1.25%"
          isPositive={true}
        />
        <Card
          title="Conversion SLA %"
          value={`${metrics.slaPercentage || 0}%`}
          change="4.66%"
          isPositive={false}
        />
      </div>

      {/* Lost Opportunity Table Section */}
      {/* Removed fixed height and overflow-y-scroll from this div */}
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
            {/* "View All" Button */}
            {/* <button
              onClick={() => {
                setDateFilterFrom('');
                setDateFilterTo('');
                setShowDefaultMonthNotification(false);
                setLostLeadsCurrentPage(1); // Reset to the first page when viewing all
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
            >
              View All
            </button> */}
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
                {["S.No", "Lead Name", "Owner", "Source", "Created", "Priority", "Lost At", "Time to Lose"].map((head, i) => (
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
                    const diffTime = Math.abs(lostAt.getTime() - createdAt.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    timeToLose = `${diffDays} D`;
                  }

                  return (
                    <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                      {/* Corrected S.No for pagination */}
                      <td className="px-4 py-2">{indexOfFirstLostLead + i + 1}</td>
                      <td className="px-4 py-2">{lostLead.clead_name || "-"}</td>
                      <td className="px-4 py-2">{lostLead.user?.cFull_name || "-"}</td>
                      <td className="px-4 py-2">{lostLead.lead_source_id === 1 ? "Website" : "Referral"}</td>
                      <td className="px-4 py-2">{createdAt ? createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "-"}</td>
                      <td className="px-4 py-2">
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">High</span>
                      </td>
                      <td className="px-4 py-2">{lostAt ? lostAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "-"}</td>
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
              <h2 className="font-semibold mt-5 text-gray-800">Conversion Rate vs Win Rate</h2>
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
      <span className="mr-1">{isPositive ? "▲" : "▼"}</span>
      {change} from last Month {/* This 'change' value is static; ideally comes from API */}
    </div>
  </div>
);

export default LeadConversionPage;