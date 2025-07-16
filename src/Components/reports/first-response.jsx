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
  
  return `${day}.${month}.${year} ${hours}:${minutes} ${ampm}`;
};

const PaginatedTableForLeads = ({ initialData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = initialData?.slice(indexOfFirstRow, indexOfLastRow) || [];
  const totalPages = Math.ceil(initialData?.length / rowsPerPage) || 1;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((lead, index) => {
              const responseTime = lead.first_response_time && lead.dcreated_dt 
                ? new Date(lead.first_response_time).getTime() - new Date(lead.dcreated_dt).getTime()
                : 0;
              
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lead.clead_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(lead.first_response_time, true)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.lead_status?.clead_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        
        const response = await axios.get(`${ENDPOINTS.FIRST_RESPONSE_FOR_LEAD}/${company_id}`, {
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
  }, []);

  const { metrics } = useMemo(() => {
    if (!allRawLeads) return { metrics: {} };

    let totalResponseTime = 0;
    let fastestTime = Infinity;
    let slowestTime = 0;
    let respondedLeads = 0;
    let totalLeads = allRawLeads.length;

    const responseBucketCounts = { '<1hr': 0, '1-4hr': 0, '4-24hr': 0, '24+hr': 0 };
    const firstResponseGroupedByDay = {};
    const wonLeadsGroupedByDay = {};

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
      firstResponseGroupedByDay[day] = (firstResponseGroupedByDay[day] || 0) + (lead.first_response_time ? 1 : 0);
      
      if (lead.lead_status?.clead_name === 'Won') {
        wonLeadsGroupedByDay[day] = (wonLeadsGroupedByDay[day] || 0) + 1;
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
        averageFirstResponseTime: formatMsToTime(respondedLeads > 0 ? totalResponseTime / respondedLeads : 0),
        fastestResponseTime: formatMsToTime(fastestTime !== Infinity ? fastestTime : 0),
        slowestResponseTime: formatMsToTime(slowestTime),
        slaRate: `${((respondedLeads / totalLeads) * 100).toFixed(2)}%`,
        responseBucketPercentages,
        firstResponseGroupedByDay,
        wonLeadsGroupedByDay
      }
    };
  }, [allRawLeads]);

  if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading report data...</p></div>;
  if (!allRawLeads || allRawLeads.length === 0) return <div className="flex justify-center items-center h-screen"><p>No data available for this report.</p></div>;

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

  const bucketData = [
    { name: '<1hr', value: metrics.responseBucketPercentages['<1hr'] || 0 },
    { name: '1-4hr', value: metrics.responseBucketPercentages['1-4hr'] || 0 },
    { name: '4-24hr', value: metrics.responseBucketPercentages['4-24hr'] || 0 },
    { name: '24+hr', value: metrics.responseBucketPercentages['24+hr'] || 0 },
  ];

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const responseTimeWinRateData = allDays.map(day => ({
    name: day,
    'Response Time': metrics.firstResponseGroupedByDay[day] || 0,
    'Win Rate': metrics.wonLeadsGroupedByDay[day] || 0,
  }));

  const cardData = [
    { title: 'Avg. First Response Time', value: metrics.averageFirstResponseTime },
    { title: 'Fastest First Response', value: metrics.fastestResponseTime },
    { title: 'Slowest First Response', value: metrics.slowestResponseTime },
    { title: 'First Resp. SLA Rate', value: metrics.slaRate },
  ];

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
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold">Response Time Vs Win Rate</h2>
    <span className="bg-gray-200 px-3 py-1 rounded-md text-sm">All Time Data</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Lead Response Details</h2>
          <PaginatedTableForLeads initialData={allRawLeads} />
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
    </div>
  );
};

export default FirstResponseTimeReport;