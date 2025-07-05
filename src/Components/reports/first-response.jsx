
// Helper function to format date to YYYY-MM-DD for input type="date"
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function PaginatedTableForLeads({ initialData }) {
    const [tableFilterStatus, setTableFilterStatus] = useState('all'); // 'all', 'responded', 'notResponded'
    const [showAll, setShowAll] = useState(false); // For "Show Less / View All"
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Items per page for pagination

    // States for date filtering within the table
    const [tableDateFilterFrom, setTableDateFilterFrom] = useState('');
    const [tableDateFilterTo, setTableDateFilterTo] = useState('');
    const [isTableDefaultMonth, setIsTableDefaultMonth] = useState(true);

    // Effect to set default current month dates for table on initial load
    useEffect(() => {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const formattedFirstDay = formatDateForInput(firstDayOfMonth);
        const formattedLastDay = formatDateForInput(lastDayOfMonth);

        setTableDateFilterFrom(formattedFirstDay);
        setTableDateFilterTo(formattedLastDay);
        setIsTableDefaultMonth(true);
    }, []); // Runs once on mount

    // Memoized filtered data based on both date and status filters
    const filteredLeads = useMemo(() => {
        let currentFiltered = initialData;

        // 1. Apply Date Filter
        const fromDate = tableDateFilterFrom ? new Date(tableDateFilterFrom) : null;
        const toDate = tableDateFilterTo ? new Date(tableDateFilterTo) : null;
        if (toDate) toDate.setHours(23, 59, 59, 999); // Set to end of day for accurate range

        currentFiltered = currentFiltered.filter(lead => {
            const createdDt = new Date(lead.dcreated_dt);
            if (fromDate && createdDt < fromDate) return false;
            if (toDate && createdDt > toDate) return false;
            return true;
        });

        // 2. Apply Status Filter
        if (tableFilterStatus === 'responded') {
            currentFiltered = currentFiltered.filter(lead => !!lead.first_response_time);
        } else if (tableFilterStatus === 'notResponded') {
            currentFiltered = currentFiltered.filter(lead => !lead.first_response_time);
        }

        // Always sort by created date (most recent first) after all filters
        return currentFiltered.sort((a, b) => new Date(b.dcreated_dt) - new Date(a.dcreated_dt));

    }, [initialData, tableDateFilterFrom, tableDateFilterTo, tableFilterStatus]);


    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

    // Determine leads to display based on showAll and pagination
    const paginatedData = showAll ? filteredLeads : filteredLeads.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    // Reset current page if filters change or data changes
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (filteredLeads.length === 0) {
            setCurrentPage(1);
        }
    }, [filteredLeads, totalPages, currentPage]);

    const changePage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getTableIntimationMessage = () => {
        let dateMessage = '';
        const fromDateObj = tableDateFilterFrom ? new Date(tableDateFilterFrom) : null;
        const toDateObj = tableDateFilterTo ? new Date(tableDateFilterTo) : null;

        if (isTableDefaultMonth && fromDateObj && toDateObj) {
            dateMessage = `for the **current month** (${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`;
        } else if (fromDateObj && toDateObj) {
            dateMessage = `from **${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**`;
        } else {
            dateMessage = `for **all available time**`;
        }

        let statusMessage = '';
        if (tableFilterStatus === 'all') {
            statusMessage = `showing **all leads**`;
        } else if (tableFilterStatus === 'responded') {
            statusMessage = `showing only **responded leads**`;
        } else if (tableFilterStatus === 'notResponded') {
            statusMessage = `showing only **not-responded leads**`;
        }

        return `💡 Table is ${statusMessage} ${dateMessage}.`;
    };

    return (
        <>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Response Time Metrics</h2>
            </div>

            {/* Table Date Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15, flexWrap: "wrap" }}>
                <label style={{ fontSize: 14, color: "#555", fontWeight: "bold" }}>Table From:</label>
                <input
                    type="date"
                    value={tableDateFilterFrom}
                    onChange={(e) => {
                        setTableDateFilterFrom(e.target.value);
                        setIsTableDefaultMonth(false);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
                />
                <label style={{ fontSize: 14, color: "#555", fontWeight: "bold" }}>Table To:</label>
                <input
                    type="date"
                    value={tableDateFilterTo}
                    onChange={(e) => {
                        setTableDateFilterTo(e.target.value);
                        setIsTableDefaultMonth(false);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
                />
                <button
                    onClick={() => {
                        setTableDateFilterFrom('');
                        setTableDateFilterTo('');
                        setIsTableDefaultMonth(false); // Reset also means not default month
                    }}
                    style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        backgroundColor: "#f0f0f0",
                        color: "#333",
                        cursor: "pointer",
                        fontSize: 14,
                    }}
                >
                    Reset Table Date
                </button>
            </div>

            {/* Table Status Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    onClick={() => setTableFilterStatus("all")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                        tableFilterStatus === "all"
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    All Leads
                </button>
                <button
                    onClick={() => setTableFilterStatus("responded")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                        tableFilterStatus === "responded"
                            ? "bg-green-600 text-white shadow-md"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    Responded
                </button>
                <button
                    onClick={() => setTableFilterStatus("notResponded")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                        tableFilterStatus === "notResponded"
                            ? "bg-red-600 text-white shadow-md"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    Not Responded
                </button>
            </div>

            {/* Table Intimation Message */}
            <div className="mb-4 text-sm px-3 py-8 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                {getTableIntimationMessage()}
            </div>

            <div
                className={`w-full overflow-x-auto ${
                    showAll ? 'max-h-[400px] overflow-y-scroll' : ''
                }`}
            >
                <table className="w-full text-sm text-left overflow-y-scroll table-auto">
                    <thead className="text-gray-600 font-semibold whitespace-nowrap">
                        <tr>
                            <th className="py-2 px-3 text-black">S.No</th>
                            <th className="py-2 px-3 text-black">Lead</th>
                            <th className="py-2 px-3 text-black">Sales Rep</th>
                            <th className="py-2 px-3 text-black">Created Date</th>
                            <th className="py-2 px-3 text-black">Responded At</th>
                            <th className="py-2 px-3 text-black">Opportunity Source</th>
                            <th className="py-2 px-3 text-black">Potential</th>
                            <th className="py-2 px-3 text-black">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((lead, idx) => (
                                <tr key={idx} className="border-t hover:bg-gray-50 transition">
                                    <td className="py-2 px-3 break-words">
                                      {(currentPage - 1) * itemsPerPage + idx + 1}
                                    </td>
                                    <td className="py-2 px-3 break-words">{lead.clead_name || '-'}</td>
                                    <td className="py-2 px-3 break-words">{lead.user?.cFull_name || '-'}</td>
                                    <td className="py-2 px-3 break-words">
                                        {lead.dcreated_dt
                                            ? new Date(lead.dcreated_dt).toLocaleString('en-IN', {
                                                  timeZone: 'Asia/Kolkata',
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                              })
                                            : '-'}
                                    </td>
                                    <td className="py-2 px-3 break-words">
                                        {lead.first_response_time
                                            ? new Date(lead.first_response_time).toLocaleString('en-IN', {
                                                  timeZone: 'Asia/Kolkata',
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                              })
                                            : '-'}
                                    </td>
                                    <td className="py-2 px-3 break-words">{lead.lead_sources?.source_name || '-'}</td>
                                    <td className="py-2 px-3 break-words">{lead.lead_potential?.clead_name || '-'}</td>
                                    <td className="py-2 px-3 break-words">{lead.lead_status?.clead_name || ''}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="text-center py-4 text-gray-500">
                                    No leads found matching the current criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination for the table */}
            {totalPages > 1 && !showAll && (
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
            )}
            {/* Show All / Show Less button */}
            {filteredLeads.length > 5 && (
              <div className="text-right mt-2">
                <button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showAll ? 'Show Less' : 'View All'}
                </button>
              </div>
            )}
        </>
    );
}

// FirstResponseTimeReport component (unchanged, just showing context for passing data)
import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ENDPOINTS } from '../../api/constraints';

const COLORS = ['#A3E635', '#6366F1', '#3B82F6', '#E879F9']; // lime, indigo, blue, pink

// Helper function to format milliseconds into a human-readable time string
const formatMsToTime = (ms) => {
  if (ms === Infinity || ms === 0) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  // Ensure at least seconds are shown if no larger unit is present
  if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

  return parts.join(' ');
};

// Helper function to format date to YYYY-MM-DD for input type="date"
const formatDateForInputMain = (date) => { // Renamed to avoid conflict
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FirstResponseTimeReport = () => {
  const [allRawLeads, setAllRawLeads] = useState(null); // Stores ALL leads, unfiltered by date initially
  const [loading, setLoading] = useState(true);

  // States for date filtering for the CHARTS/CARDS
  const [chartDateFilterFrom, setChartDateFilterFrom] = useState('');
  const [chartDateFilterTo, setChartDateFilterTo] = useState('');
  const [isChartDefaultMonth, setIsChartDefaultMonth] = useState(true);

  // Effect to set default current month dates for charts on initial load
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInputMain(firstDayOfMonth);
    const formattedLastDay = formatDateForInputMain(lastDayOfMonth);

    setChartDateFilterFrom(formattedFirstDay);
    setChartDateFilterTo(formattedLastDay);
    setIsChartDefaultMonth(true);
  }, []);

  // Effect to fetch ALL data (no date filters here, this runs only once)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token not found');

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const { company_id } = JSON.parse(jsonPayload);
        if (!company_id) throw new Error('Company ID missing');

        // Fetch without date parameters, get all time data
        const apiUrl = `${ENDPOINTS.FIRST_RESPONSE_FOR_LEAD}/${company_id}`;

        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllRawLeads(response.data.result || []); // Store just the results array
      } catch (err) {
        console.error('Error fetching first response report:', err);
        setAllRawLeads([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Memoized filtered data and metrics for charts/cards
  const { metrics } = useMemo(() => {
    if (!allRawLeads) return { filteredChartData: [], metrics: {} };

    const fromDate = chartDateFilterFrom ? new Date(chartDateFilterFrom) : null;
    const toDate = chartDateFilterTo ? new Date(chartDateFilterTo) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999); // Set to end of day

    const dataForCharts = allRawLeads.filter(lead => {
      const createdDt = new Date(lead.dcreated_dt);
      if (fromDate && createdDt < fromDate) return false;
      if (toDate && createdDt > toDate) return false;
      return true;
    });

    // Recalculate metrics based on dataForCharts
    let totalResponseTime = 0;
    let fastestTime = Infinity;
    let slowestTime = 0;
    let respondedLeads = 0;
    let totalLeads = dataForCharts.length;

    const firstResponseGroupedByDay = {};
    const wonLeadsGroupedByDay = {}; // Assuming 'Won' status exists in lead.lead_status?.clead_name
    const responseBucketCounts = { '<1hr': 0, '1-4hr': 0, '4-24hr': 0, '24+hr': 0 };

    dataForCharts.forEach(lead => {
        if (lead.first_response_time && lead.dcreated_dt) {
            const createdTime = new Date(lead.dcreated_dt).getTime();
            const responseTime = new Date(lead.first_response_time).getTime();
            const diffMs = responseTime - createdTime; // Difference in milliseconds

            if (diffMs > 0) { // Only consider positive response times
                totalResponseTime += diffMs;
                respondedLeads++;

                if (diffMs < fastestTime) fastestTime = diffMs;
                if (diffMs > slowestTime) slowestTime = diffMs;

                // Determine bucket
                const diffHours = diffMs / (1000 * 60 * 60);
                if (diffHours < 1) responseBucketCounts['<1hr']++;
                else if (diffHours <= 4) responseBucketCounts['1-4hr']++;
                else if (diffHours <= 24) responseBucketCounts['4-24hr']++;
                else responseBucketCounts['24+hr']++;
            }
        }

        const dayOfWeek = new Date(lead.dcreated_dt).toLocaleString('en-US', { weekday: 'long' });
        firstResponseGroupedByDay[dayOfWeek] = (firstResponseGroupedByDay[dayOfWeek] || 0) + (lead.first_response_time ? 1 : 0);

        if (lead.lead_status?.clead_name === 'Won' || lead.lead_status?.clead_name === 'Converted') {
            wonLeadsGroupedByDay[dayOfWeek] = (wonLeadsGroupedByDay[dayOfWeek] || 0) + 1;
        }
    });

    const averageFirstResponseTimeMs = respondedLeads > 0 ? totalResponseTime / respondedLeads : 0;

    const responseBucketPercentages = {};
    const totalRespondedInBuckets = Object.values(responseBucketCounts).reduce((sum, count) => sum + count, 0);
    for (const key in responseBucketCounts) {
        responseBucketPercentages[key] = totalRespondedInBuckets > 0
            ? (responseBucketCounts[key] / totalRespondedInBuckets) * 100
            : 0;
    }

    const calculatedMetrics = {
        averageFirstResponseTime: formatMsToTime(averageFirstResponseTimeMs),
        fastestResponseTime: formatMsToTime(fastestTime),
        slowestResponseTime: formatMsToTime(slowestTime),
        slaRate: totalLeads > 0 ? `${((respondedLeads / totalLeads) * 100).toFixed(2)}%` : '0%',
        firstResponseGroupedByDay: firstResponseGroupedByDay,
        wonLeadsGroupedByDay: wonLeadsGroupedByDay,
        responseBucketPercentages: responseBucketPercentages,
    };

    return { metrics: calculatedMetrics };
  }, [allRawLeads, chartDateFilterFrom, chartDateFilterTo]);


  if (loading && !allRawLeads) return <p>Loading report data...</p>;
  if (!allRawLeads) return <p>No data available for this report.</p>; // This state should ideally be covered by [] for allRawLeads

  // Pie Chart Labels (moved here as they use `metrics`)
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const displayPercent = (percent * 100).toFixed(0);

    return (
      <g>
        <circle
          cx={x}
          cy={y}
          r={16}
          fill="#ffffff"
          stroke="#ccc"
          strokeWidth={1}
        />
        <text
          x={x}
          y={y}
          fill="#000"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
        >
          {`${displayPercent}%`}
        </text>
      </g>
    );
  };

  const bucketData = [
    { name: '<1hr', value: metrics.responseBucketPercentages?.['<1hr'] ?? 0 },
    { name: '1-4hr', value: metrics.responseBucketPercentages?.['1-4hr'] ?? 0 },
    { name: '4-24hr', value: metrics.responseBucketPercentages?.['4-24hr'] ?? 0 },
    { name: '24+hr', value: metrics.responseBucketPercentages?.['24+hr'] ?? 0 },
  ];

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const responseTimeWinRateData = allDays.map((day) => ({
    name: day,
    'Response Time': metrics.firstResponseGroupedByDay?.[day] || 0,
    'Win Rate': metrics.wonLeadsGroupedByDay?.[day] || 0,
  }));

  const cardData = [
    {
      title: 'Avg. First Response Time',
      value: metrics.averageFirstResponseTime || 'N/A',
    },
    {
      title: 'Fastest First Response',
      value: metrics.fastestResponseTime || 'N/A',
    },
    {
      title: 'Slowest First Response',
      value: metrics.slowestResponseTime || 'N/A',
    },
    {
      title: 'First Resp. SLA Rate',
      value: metrics.slaRate ?? '0%',
    },
  ];

  const getChartIntimationMessage = () => {
    const fromDateObj = chartDateFilterFrom ? new Date(chartDateFilterFrom) : null;
    const toDateObj = chartDateFilterTo ? new Date(chartDateFilterTo) : null;

    if (isChartDefaultMonth && fromDateObj && toDateObj) {
      return `💡 Showing **chart data** for the **current month**: **${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.`;
    } else if (fromDateObj && toDateObj) {
      return `🗓️ **Chart data** filtered from **${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.`;
    } else {
      return `📊 Showing **all available chart data** (no date filter applied).`;
    }
  };


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className='text-2xl font-bold p-2'>First Response Time for Opportunity</h1>

      {/* Date Filters and Intimation Area for the CHARTS/CARDS */}
      <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: "15px",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 16, color: "#555", fontWeight: "bold" }}>Chart From:</label>
          <input
            type="date"
            value={chartDateFilterFrom}
            onChange={(e) => {
              setChartDateFilterFrom(e.target.value);
              setIsChartDefaultMonth(false);
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
          <label style={{ fontSize: 16, color: "#555", fontWeight: "bold" }}>Chart To:</label>
          <input
            type="date"
            value={chartDateFilterTo}
            onChange={(e) => {
              setChartDateFilterTo(e.target.value);
              setIsChartDefaultMonth(false);
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
              setChartDateFilterFrom('');
              setChartDateFilterTo('');
              setIsChartDefaultMonth(false);
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
            Reset Chart Filter
          </button>
        </div>
        {/* Enhanced Intimation Area for charts/cards */}
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
          background: isChartDefaultMonth && chartDateFilterFrom ? "linear-gradient(to right, #e6ffe6, #d0ffe0)" :
                      (chartDateFilterFrom && chartDateFilterTo ? "linear-gradient(to right, #e0f7fa, #c2eff5)" :
                      "linear-gradient(to right, #f8f8f8, #f0f0f0)"),
          color: isChartDefaultMonth && chartDateFilterFrom ? "#1b5e20" :
                 (chartDateFilterFrom && chartDateFilterTo ? "#006064" : "#424242"),
          border: isChartDefaultMonth && chartDateFilterFrom ? "1px solid #a5d6a7" :
                  (chartDateFilterFrom && chartDateFilterTo ? "1px solid #80deea" : "1px solid #e0e0e0"),
        }}>
          {getChartIntimationMessage()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-10">

        {/* Cards on the left */}
        <div className="grid grid-cols-1 h-full sm:grid-cols-2 gap-4 lg:col-span-1">
          {cardData.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm p-4 flex flex-col "
            >
              <p className="text-sm font-medium mb-1">{card.title}</p>
              <h2 className="text-3xl text-center mt-5 font-bold text-black">{card.value}</h2>
            </div>
          ))}
        </div>

        {/* Chart on the right */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4 h-full flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Response Time Vs Win Rate</h2>
            <div className="bg-gray-200 px-3 py-1 rounded-md text-sm font-medium">
              {isChartDefaultMonth && chartDateFilterFrom ? "This Month" : "Custom Period"}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeWinRateData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Response Time"
                stroke="#FF5722"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Win Rate"
                stroke="#4CAF50"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Two-Column Section - Table and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table - now a separate component handling its own filters/pagination */}
        <div className="bg-white rounded-xl shadow-sm p-4">
            {/* Pass allRawLeads directly to the table */}
            <PaginatedTableForLeads initialData={allRawLeads || []} />
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold mb-4 self-start">Response Time Distribution</h2>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={bucketData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {bucketData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstResponseTimeReport;