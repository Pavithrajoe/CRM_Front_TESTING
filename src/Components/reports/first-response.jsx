import axios from 'axios';
import React, { useState, useEffect } from 'react';
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

const FirstResponseTimeReport = () => {
  const [firstResponseTime, setFirstResponseTime] = useState([]);
  const [showAll, setShowAll] = useState(false);

  // Fetching data
  useEffect(() => {
    const fetchData = async () => {
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

        const response = await axios.get(
          `${ENDPOINTS.FIRST_RESPONSE_FOR_LEAD}/${company_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setFirstResponseTime(response.data);
      } catch (err) {
        console.error('Error fetching first response report:', err);
      }
    };

    fetchData();
  }, []);

  if (!firstResponseTime) return <p>Loading...</p>;

  // Pie Chart Labels
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
    const displayPercent = (percent * 100);

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

  const metrics = firstResponseTime.metrics || {};

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
      value: metrics.averageFirstResponseTime,
      change: '+0.47%',
    },
    {
      title: 'Fastest First Response',
      value: metrics.fastestResponseTime,
      change: '-1.25%',
    },
    {
      title: 'Slowest First Response',
      value: metrics.slowestResponseTime,
      change: '+2.10%',
    },
    {
      title: 'First Resp. SLA Rate',
      value: metrics.slaRate ?? '0%',
      change: '-0.65%',
    },
  ];

  // Sort & Slice Leads
  const sortedLeads = [...(firstResponseTime?.result || [])].sort(
    (a, b) => new Date(b.dcreated_dt) - new Date(a.dcreated_dt)
  );
  const leadsToShow = showAll ? sortedLeads : sortedLeads.slice(0, 5);

  return (
 <div className="p-6 bg-gray-100 min-h-screen">
  <h1 className='text-2xl font-bold p-2'> First Response Time for Opportunity</h1>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-10">
    
    {/* Cards on the left (1/3 width) */}
    <div className="grid grid-cols-1 h-full sm:grid-cols-2 gap-4 lg:col-span-1">
      {cardData.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl shadow-sm p-4 flex flex-col "
        >
          <p className="text-sm font-medium  mb-1">{card.title}</p>
          <h2 className="text-3xl text-center mt-5 font-bold text-black">{card.value}</h2>
          {/* <p
            className={`text-sm font-semibold mt-2 ${
              card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {card.change} than last Month
          </p> */}
        </div>
      ))}
    </div>

    {/* Chart on the right (2/3 width) */}
    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4 h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Response Time Vs Win Rate</h2>
        <div className="bg-gray-200 px-3 py-1 rounded-md text-sm font-medium">
          This Month
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


  {/* Bottom Two-Column Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Table */}
  <div className="bg-white rounded-xl shadow-sm p-4 overflow-auto">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">Response Time Metrics</h2>
      <button
        onClick={() => setShowAll((prev) => !prev)}
        className="text-sm text-blue-600 hover:underline"
      >
        {showAll ? 'Show Less' : 'View All'}
      </button>
    </div>
    <div
  className={`w-full overflow-x-auto ${
    showAll ? 'max-h-[400px] overflow-y-auto' : ''
  }`}
>
      <table className="w-full text-sm text-left table-auto">
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
          {leadsToShow.map((lead, idx) => (
            <tr key={idx} className="border-t hover:bg-gray-50 transition">
              <td className="py-2 px-3 break-words">{idx + 1}</td>
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
          ))}
        </tbody>
      </table>
    </div>
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
            {bucketData.map((_, index) => (
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
