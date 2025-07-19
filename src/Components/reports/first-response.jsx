import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { HiDownload } from "react-icons/hi";


const COLORS = ['#A3E635', '#6366F1', '#3B82F6', '#E879F9'];

// Helper function to format milliseconds into human-readable time
const formatMsToTime = (ms) => {
  if (ms <= 0 || isNaN(ms) || ms === Infinity) return '0s';

  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};

// Helper function to format date to DD.MM.YYYY with optional time
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (!includeTime) return `${day}.${month}.${year}`;

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const PaginatedTableForLeads = ({ initialData, tableFilters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Apply table filters to the data
  const filteredData = useMemo(() => {
    if (!initialData) return [];
    
    return initialData.filter(lead => {
      // Filter by lead name
      if (tableFilters.leadName && 
          !lead.clead_name?.toLowerCase().includes(tableFilters.leadName.toLowerCase())) {
        return false;
      }
      
      // Filter by user name
      if (tableFilters.userName && 
          !lead.user?.cFull_name?.toLowerCase().includes(tableFilters.userName.toLowerCase())) {
        return false;
      }
      
      // Filter by status
      if (tableFilters.status && 
          !lead.lead_status?.clead_name?.toLowerCase().includes(tableFilters.status.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [initialData, tableFilters]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData?.slice(indexOfFirstRow, indexOfLastRow) || [];
  const totalPages = Math.ceil(filteredData?.length / rowsPerPage) || 1;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                S.No
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Lead Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                User Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Created Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((lead, index) => {
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {indexOfFirstRow + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {lead.clead_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lead.user?.cFull_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(lead.first_response_time, true)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lead.lead_status?.clead_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(lead.dcreated_dt, true)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const FirstResponseTimeReport = () => {
  const [allRawLeads, setAllRawLeads] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [isDefaultMonth, setIsDefaultMonth] = useState(true);
  
  // Table-specific filters
  const [tableFilters, setTableFilters] = useState({
    leadName: '',
    userName: '',
    status: ''
  });

  // Helper function to format a Date object to "YYYY-MM-DD" string for input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set default date range to current month on component mount
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setIsDefaultMonth(true);
  }, []);

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

        let apiUrl = `${ENDPOINTS.FIRST_RESPONSE_FOR_LEAD}/${company_id}`;
        if (queryParams.toString()) {
          apiUrl += `?${queryParams.toString()}`;
        }

        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllRawLeads(response.data.result || []);
      } catch (err) {
        console.error('Error fetching report:', err);
        setAllRawLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilterFrom, dateFilterTo]);

  // Function to generate the intimation message for date filters
  const getIntimationMessage = () => {
    const fromDateObj = dateFilterFrom ? new Date(dateFilterFrom) : null;
    const toDateObj = dateFilterTo ? new Date(dateFilterTo) : null;

    if (isDefaultMonth && fromDateObj && toDateObj) {
      return `💡 Showing leads for the current month: ${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} to ${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.`;
    } else if (fromDateObj && toDateObj) {
      return `🗓️ Filtering leads from ${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} to ${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.`;
    } else {
      return `📊 Showing all available leads (no date filter applied).`;
    }
  };

  // Function to handle Excel export
  const handleExport = () => {
    if (!allRawLeads || allRawLeads.length === 0) {
      alert("No data to export for the current filter.");
      return;
    }

    // Transform the data for export
    const dataToExport = allRawLeads.map((lead, index) => {
      // Calculate response time in milliseconds if both dates are available
      let responseTimeMs = 0;
      if (lead.first_response_time && lead.dcreated_dt) {
        const createdTime = new Date(lead.dcreated_dt).getTime();
        const responseTime = new Date(lead.first_response_time).getTime();
        responseTimeMs = responseTime - createdTime;
      }

      return {
        'S.No': index + 1,
        'Lead Name': lead.clead_name || "-",
        'User Name': lead.user?.cFull_name || "-",
        'Response Time': formatDate(lead.first_response_time, true),
        'Response Time (Duration)': formatMsToTime(responseTimeMs),
        'Status': lead.lead_status?.clead_name || "-",
        'Created Date': formatDate(lead.dcreated_dt, true),
      };
    });

    // Create a new Excel worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Create a new Excel workbook
    const wb = XLSX.utils.book_new();

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "FirstResponseTimeReport");

    // Generate Excel file and trigger download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'FirstResponseTimeReport.xlsx');
  };

  const { metrics } = useMemo(() => {
    // Initialize default metrics structure
    const defaultMetrics = {
      averageFirstResponseTime: '0s',
      fastestResponseTime: '0s',
      slowestResponseTime: '0s',
      slaRate: '0%',
      responseBucketPercentages: {
        '<1hr': 0,
        '1-4hr': 0,
        '4-24hr': 0,
        '24+hr': 0
      },
      firstResponseGroupedByDay: {},
      wonLeadsGroupedByDay: {}
    };

    if (!allRawLeads) return { metrics: defaultMetrics };

    // Initialize all days of the week to 0 for consistent chart display
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    daysOfWeek.forEach(day => {
      defaultMetrics.firstResponseGroupedByDay[day] = 0;
      defaultMetrics.wonLeadsGroupedByDay[day] = 0;
    });

    let totalResponseTime = 0;
    let fastestTime = Infinity;
    let slowestTime = 0;
    let respondedLeads = 0;
    let totalLeads = allRawLeads.length;

    const responseBucketCounts = { '<1hr': 0, '1-4hr': 0, '4-24hr': 0, '24+hr': 0 };

    allRawLeads.forEach(lead => {
      if (lead.first_response_time && lead.dcreated_dt) {
        const createdTime = new Date(lead.dcreated_dt).getTime();
        const responseTime = new Date(lead.first_response_time).getTime();
        const diffMs = responseTime - createdTime;

        if (diffMs > 0) {
          totalResponseTime += diffMs;
          respondedLeads++;

          if (diffMs < fastestTime) fastestTime = diffMs;
          if (diffMs > slowestTime) slowestTime = diffMs;

          const diffHours = diffMs / (1000 * 60 * 60);
          if (diffHours < 1) responseBucketCounts['<1hr']++;
          else if (diffHours <= 4) responseBucketCounts['1-4hr']++;
          else if (diffHours <= 24) responseBucketCounts['4-24hr']++;
          else responseBucketCounts['24+hr']++;
        }
      }

      const day = new Date(lead.dcreated_dt).toLocaleString('en-US', { weekday: 'long' });
      if (defaultMetrics.firstResponseGroupedByDay[day] !== undefined) {
        defaultMetrics.firstResponseGroupedByDay[day] += (lead.first_response_time ? 1 : 0);
      }

      if (lead.lead_status?.clead_name === 'Won') {
        if (defaultMetrics.wonLeadsGroupedByDay[day] !== undefined) {
          defaultMetrics.wonLeadsGroupedByDay[day] += 1;
        }
      }
    });

    const responseBucketPercentages = {};
    const totalResponded = Object.values(responseBucketCounts).reduce((sum, count) => sum + count, 0);
    Object.keys(responseBucketCounts).forEach(key => {
      responseBucketPercentages[key] = totalResponded > 0
        ? parseFloat(((responseBucketCounts[key] / totalResponded) * 100).toFixed(2))
        : 0;
    });

    return {
      metrics: {
        ...defaultMetrics,
        averageFirstResponseTime: formatMsToTime(respondedLeads > 0 ? totalResponseTime / respondedLeads : 0),
        fastestResponseTime: formatMsToTime(fastestTime !== Infinity ? fastestTime : 0),
        slowestResponseTime: formatMsToTime(slowestTime),
        slaRate: `${((respondedLeads / totalLeads) * 100).toFixed(2)}%`,
        responseBucketPercentages,
        firstResponseGroupedByDay: defaultMetrics.firstResponseGroupedByDay,
        wonLeadsGroupedByDay: defaultMetrics.wonLeadsGroupedByDay
      }
    };
  }, [allRawLeads]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Safely create bucketData with fallback values
  const bucketData = [
    { name: '<1hr', value: metrics?.responseBucketPercentages?.['<1hr'] || 0 },
    { name: '1-4hr', value: metrics?.responseBucketPercentages?.['1-4hr'] || 0 },
    { name: '4-24hr', value: metrics?.responseBucketPercentages?.['4-24hr'] || 0 },
    { name: '24+hr', value: metrics?.responseBucketPercentages?.['24+hr'] || 0 },
  ];

  const allDaysForChart = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const responseTimeWinRateData = allDaysForChart.map(day => ({
    name: day,
    'Response Time': metrics?.firstResponseGroupedByDay?.[day] || 0,
    'Win Rate': metrics?.wonLeadsGroupedByDay?.[day] || 0,
  }));

  const cardData = [
    { title: 'Avg. First Response Time', value: metrics?.averageFirstResponseTime || '0s' },
    { title: 'Fastest First Response', value: metrics?.fastestResponseTime || '0s' },
    { title: 'Slowest First Response', value: metrics?.slowestResponseTime || '0s' },
    { title: 'First Resp. SLA Rate', value: metrics?.slaRate || '0%' },
  ];

  if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading report data...</p></div>;
  if (!allRawLeads || allRawLeads.length === 0) return <div className="flex justify-center items-center h-screen"><p>No data available for this report.</p></div>;

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reportpage')}
            className="p-2 rounded-full hover:bg-gray-200 transition"
          >
            <FaArrowLeft className="text-gray-600 text-2xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">First Response Time Report</h1>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateFilterFrom}
              onChange={(e) => {
                setDateFilterFrom(e.target.value);
                setIsDefaultMonth(false);
              }}
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateFilterTo}
              onChange={(e) => {
                setDateFilterTo(e.target.value);
                setIsDefaultMonth(false);
              }}
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={() => {
              setDateFilterFrom('');
              setDateFilterTo('');
              setIsDefaultMonth(false);
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition"
          >
            Reset
          </button>
        </div>
        <div className={`p-3 rounded-lg text-sm ${
          isDefaultMonth && dateFilterFrom ? "bg-green-50 text-green-800 border border-green-200" :
          (dateFilterFrom && dateFilterTo ? "bg-blue-50 text-blue-800 border border-blue-200" :
          "bg-gray-50 text-gray-800 border border-gray-200")
        }`}>
          {getIntimationMessage()}
        </div>
      </div>

      {/* Metric Cards and Pie Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cardData.map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow p-4">
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h2 className="text-3xl font-bold mt-2 text-gray-900">{card.value}</h2>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Response Time Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bucketData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bucketData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <hr className="my-6 border-gray-300" />

      {/* Response Time Vs Win Rate Chart Section */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Response Time Vs Win Rate</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeWinRateData}>
                <XAxis
                  dataKey="name"
                  label={{
                    value: 'Day of Week',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fill: '#666', fontSize: 12 }
                  }}
                />
                <YAxis
                  yAxisId="left"
                  label={{
                    value: 'Response Count',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#FF5722', fontSize: 12 }
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{
                    value: 'Win Count',
                    angle: 90,
                    position: 'insideRight',
                    style: { fill: '#4CAF50', fontSize: 12 }
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Win Rate') return [value, 'Win Count'];
                    if (name === 'Response Time') return [value, 'Response Count'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Response Time"
                  name="Response Count"
                  stroke="#FF5722"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Win Rate"
                  name="Win Count"
                  stroke="#4CAF50"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <hr className="my-6 border-gray-300" />

      {/* Lead Response Details Table Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Lead Response Details</h2>
            <button
              onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-colors text-sm font-semibold"
            >
            <HiDownload size={16} className="mr-2" /> Export to Excel
            </button>
          </div>
          
          {/* Table-specific filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Name</label>
              <input
                type="text"
                placeholder="Filter by lead name"
                value={tableFilters.leadName}
                onChange={(e) => setTableFilters({...tableFilters, leadName: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
              <input
                type="text"
                placeholder="Filter by user name"
                value={tableFilters.userName}
                onChange={(e) => setTableFilters({...tableFilters, userName: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <input
                type="text"
                placeholder="Filter by status"
                value={tableFilters.status}
                onChange={(e) => setTableFilters({...tableFilters, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <PaginatedTableForLeads initialData={allRawLeads} tableFilters={tableFilters} />
        </div>
      </div>
    </div>
  );
};

export default FirstResponseTimeReport;