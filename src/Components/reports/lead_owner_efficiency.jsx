import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import * as XLSX from 'xlsx'; // Import xlsx
import { saveAs } from 'file-saver'; // Import file-saver

// Helper function to format hours (e.g., 2.5) into "2h 30m"
const formatHoursToHHMM = (decimalHours) => {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) {
    return '-';
  }

  const totalMinutes = Math.round(decimalHours * 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Handle durations below 1 minute
  if (totalHours === 0 && minutes === 0 && decimalHours !== 0) {
    return '< 1m';
  }

  // Handle exactly 0 hours
  if (totalHours === 0 && minutes === 0 && decimalHours === 0) {
    return '0h 0m';
  }

  let result = '';

  // Show as days if totalHours >= 24
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    result += `${days} Day${days > 1 ? 's' : ''}`;
    if (remainingHours > 0) result += ` ${remainingHours}h`;
    if (minutes > 0) result += ` ${minutes}m`;
  } else {
    if (totalHours > 0) result += `${totalHours}h`;
    if (minutes > 0) {
      if (result) result += ' ';
      result += `${minutes}m`;
    }
  }

  return result.trim();
};



// Helper function to format ISO date strings (like createdAtUTC) to "DD/MM/YYYY"
// or to handle already formatted IST strings
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // fallback

  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timePart = date
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/am|pm/i, (match) => match.toUpperCase());

  return `${datePart}, ${timePart}`;
};


export default function LeadOwnerEfficiency() {
  const [leadOwnerEfficiency, setLeadOwnerEfficiency] = useState({});
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  // --- Date Filtering States ---
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [showDefaultMonthNotification, setShowDefaultMonthNotification] = useState(false);

  // --- Pagination States for Table ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page

  // Helper to format date for input[type="date"]
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Effect to set default date range to current month on initial mount
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setShowDefaultMonthNotification(true);
  }, []);

  // Memoized function to fetch data based on filters
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token not found');

      // Decode token to get company_id
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

      const params = {};
      if (dateFilterFrom) params.fromDate = dateFilterFrom;
      if (dateFilterTo) params.toDate = dateFilterTo;

      const response = await axios.get(
        `${ENDPOINTS.LEAD_OWNER_FIRST_RES}/${company_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        }
      );

      setLeadOwnerEfficiency(response.data);

      const summary = response.data.leadOwnerSummary || {};
      const formattedChartData = Object.values(summary).map((item) => ({
        name: item.ownerName,
        value: item.averageConversionHours, // Assuming this is in hours and will be formatted by tickFormatter
        avatar: '👤',
      }));

      setChartData(formattedChartData);
      setCurrentPage(1); // Reset to first page on new data fetch
    } catch (err) {
      console.error('Error fetching first response report:', err.message);
      // Handle error state if necessary (e.g., show a message to the user)
    }
  }, [dateFilterFrom, dateFilterTo]); // Dependencies for useCallback

  // Effect to trigger data fetch when date filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depend on fetchData memoized function

  const metrics = leadOwnerEfficiency.overallMetrics || {};
  const leads = leadOwnerEfficiency?.individualLeadData || [];

  // --- Card Data with more robust checks ---
  const cardData = [
    {
      title: 'Avg. 1st Resp. Time / Owner',
      value: metrics?.overallAverageFirstResponseHours !== undefined && metrics.overallAverageFirstResponseHours !== null
        ? formatHoursToHHMM(metrics.overallAverageFirstResponseHours)
        : '0h 0m',
      change: '+0.47%', // Static, consider making dynamic
    },
    {
      title: 'Avg. Conv. Time / Owner',
      value: metrics?.overallDealConversionPercentage !== undefined && metrics.overallDealConversionPercentage !== null
        ? `${metrics.overallDealConversionPercentage.toFixed(2)}%`
        : '0%',
      change: '-1.25%', // Static, consider making dynamic
    },
    {
      title: 'Lead Response',
      value: metrics?.firstResponseSla?.slaHours !== undefined && metrics.firstResponseSla.slaHours !== null
        ? formatHoursToHHMM(metrics.firstResponseSla.slaHours)
        : '0h 0m',
      change: '+2.10%', // Static, consider making dynamic
    },
    {
      title: 'Achieved Lead Response SLA %',
      value: metrics?.firstResponseSla?.percentageMet !== undefined && metrics.firstResponseSla.percentageMet !== null
        ? `${metrics.firstResponseSla.percentageMet.toFixed(2)}%`
        : '0%',
      change: '-0.65%', // Static, consider making dynamic
    },
    {
      title: 'Lead Conv ',
      value: metrics?.dealConversionSla?.slaHours !== undefined && metrics.dealConversionSla.slaHours !== null
        ? formatHoursToHHMM(metrics.dealConversionSla.slaHours)
        : '0h 0m',
      change: '-0.65%', // Static, consider making dynamic
    },
    {
      title: 'Achieved Lead Conv SLA %',
      value: metrics?.dealConversionSla?.percentageMet !== undefined && metrics.dealConversionSla.percentageMet !== null
        ? `${metrics.dealConversionSla.percentageMet.toFixed(2)}%`
        : '0%',
      change: '-0.65%', // Static, consider making dynamic
    },
  ];


  const renderCustomBarLabel = (props) => {
    const { x, y, width, index } = props;
    const emoji = chartData[index]?.avatar || '👤';
    return (
      <text x={x + width / 2} y={y + 1} textAnchor="middle" fontSize={22}>
        {emoji}
      </text>
    );
  };

  // --- Pagination Logic for Table ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leads.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Optional: scroll to the top of the table after pagination
    const tableDiv = document.querySelector('.lead-table-container');
    if (tableDiv) tableDiv.scrollTop = 0;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null; // Don't show pagination if only one page

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Prev
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => paginate(1)}
              className={`px-3 py-1 border rounded-lg ${
                currentPage === 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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
            onClick={() => paginate(number)}
            className={`px-3 py-1 border rounded-lg ${
              currentPage === number ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {number}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-600">...</span>}
            <button
              onClick={() => paginate(totalPages)}
              className={`px-3 py-1 border rounded-lg ${
                currentPage === totalPages ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Next
        </button>
        {leads.length > 0 && (
            <span className="text-sm text-gray-600 ms-4">
                {`${indexOfFirstItem + 1}-${indexOfLastItem > leads.length ? leads.length : indexOfLastItem} of ${leads.length}`}
            </span>
        )}
      </div>
    );
  };

  // --- Excel Export Function ---
  const handleExport = () => {
    if (leads.length === 0) {
      alert("No data to export.");
      return;
    }

    const dataToExport = leads.map(item => ({
      'S.No': item.sNo, // Assuming 'sNo' exists or add it during mapping
      'Lead Owner': item.ownerName || "Unknown",
      'Created At': formatDateForDisplay(item.createdAtIST || "-"),
      'First Responded At':formatDateForDisplay(item.firstInteractionTimeIST || "-"),
      'Hours to First Response': formatHoursToHHMM(item.hoursToFirstInteraction),
      // 'Converted At': item.conversionTimeHours ? formatDateForDisplay(item.conversionTimeHours) : "Didn't convert",
      'Note': item.note || "No notes found",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LeadOwnerEfficiency");
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'LeadOwnerEfficiency.xlsx');
  };


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
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
        <h1 className='text-2xl font-bold p-2'>Lead Owner Efficiency</h1>
      </div>

      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4 items-start mb-10">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col justify-between items-center text-center h-full"
          >
            <p className="text-sm font-medium mb-1 text-gray-700">{card.title}</p>
            <h2 className="text-3xl font-bold text-black my-auto">
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Average Conversion Time Per Owner</h2>
          <div className="bg-gray-200 px-3 py-1 rounded-md text-sm font-medium">
            This Month
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}> {/* Increased height slightly */}
          <BarChart data={chartData}>
            <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={80} style={{ fontSize: '0.75rem' }} />
            <YAxis
              domain={[0, 'dataMax + 60']} // Adjust domain to allow space for labels
              tickFormatter={(tick) => `${tick} min`}
              ticks={[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300]} // More granular ticks
              width={80} // Give more room for Y-axis labels
            />
            <Tooltip formatter={(value) => `${formatHoursToHHMM(value / 60)}`} /> {/* Tooltip shows HHh MMm */}
            <Bar
              dataKey="value"
              fill="#8884d8" // A more standard bar color, you can change this
              barSize={40}
              label={renderCustomBarLabel}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table Section */}
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Lead Handling & Productivity Metrics
          </h2>
          <div className="flex gap-4 items-center flex-wrap">
            {/* Date Filters */}
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
            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setDateFilterFrom('');
                setDateFilterTo('');
                setShowDefaultMonthNotification(false);
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
            >
              Clear Filters
            </button>
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
            Showing all available data. Use date filters above to narrow results.
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto lead-table-container">
          <table className="min-w-full text-sm text-black">
            <thead>
              <tr className="bg-gray-100 text-left text-lg h-16">
                <th className="px-4 py-2 font-semibold whitespace-nowrap">S.No</th>
                <th className="px-4 py-2 text-center font-semibold whitespace-nowrap">Lead Owner</th>
                <th className="px-4 py-2 text-center  font-semibold whitespace-nowrap">Created at</th>
                <th className="px-4 py-2 text-center  font-semibold whitespace-nowrap">First Responded at</th>
                <th className="px-4 py-2 text-center  font-semibold whitespace-nowrap">Hours to First response</th>
                {/* <th className="px-4 py-2 font-semibold whitespace-nowrap">Converted at</th> */}
                <th className="px-4 py-2 text-center font-semibold whitespace-nowrap">Note</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((metric, index) => (
                  <tr key={index} className="border-b  hover:bg-gray-50">
                    <td className="px-4 py-2 text-center h-16">{indexOfFirstItem + index + 1}</td>
                    <td className="px-4 py-2 text-center h-16">{metric.ownerName || "Unknown"}</td>
                    {/* Directly use IST fields which are already formatted */}
                    <td className="px-4 py-2 h-16 text-center whitespace-nowrap">{formatDateForDisplay(metric.createdAtIST || "-")}</td>
                    <td className="px-4 py-2 h-16 text-center whitespace-nowrap">{formatDateForDisplay(metric.firstInteractionTimeIST || "-")}</td>
                    {/* Format hours using the new helper */}
                    <td className="px-4 py-2 h-16 text-center whitespace-nowrap">{formatHoursToHHMM(metric.hoursToFirstInteraction)}</td>
                    {/* <td className="px-4 py-2 h-16 whitespace-nowrap"> */}
                      {/* Assuming conversionTimeHours is a date string from API, if it's hours, adjust formatting */}
                      {/* {metric.conversionTimeHours ? formatDateForDisplay(metric.conversionTimeHours) : "Didn't convert"} */}
                    {/* </td> */}
                    <td className="px-4 py-2 text-center h-16">{metric.note || "No notes found"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                    No lead data available for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {renderPagination()}
      </div>
    </div>
  );
}