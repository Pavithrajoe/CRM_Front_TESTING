import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceDot, ReferenceLine } from 'recharts';
import { ENDPOINTS } from '../../../api/constraints'; 
const LeadStatusChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const timeRangeOptions = {
    'today': 'Today',
    'this_week': 'This Week',
    'this_month': 'This Month',
    'this_year': 'This Year',
  };

  const getCompanyIdAndToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return { token, companyId: payload.company_id };
    } catch (err) {
      console.error('Error decoding token:', err);
      return null;
    }
  };

  const fetchLeadStatusData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const authData = getCompanyIdAndToken();
    if (!authData) {
      setError('Authentication data missing');
      return;
    }

    try {
      const response = await fetch(`${ENDPOINTS.COMPANY_GET}`, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      const stageCounts = result?.data?.stageCounts || {};

      // Transform to chart-friendly format
      const transformedData = Object.entries(stageCounts).map(([stage, count]) => ({
        name: stage,
        "Lead Status": count
      }));

      setChartData(transformedData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadStatusData();
  }, [fetchLeadStatusData]);

  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
    setDropdownOpen(false);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-md">
          <p className="font-semibold text-gray-700">{`${label}: ${payload[0].value} Leads`}</p>
        </div>
      );
    }
    return null;
  };

  const leadStatusCategories = [
    'New', 'Interested', 'Contacted', 'Qualification', 'Demo', 'Proposal', 'Negotiation', 'Won'
  ];

  const qualificationIndex = leadStatusCategories.indexOf('Qualification');
  const qualificationData = chartData.find(item => item.name === 'Qualification');
  const showAnnotation = qualificationData?.["Lead Status"] === 18 && selectedTimeRange === 'this_week';

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-64 flex items-center justify-center">
        <p>Loading lead status data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-64 flex items-center justify-center text-red-600">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 h-[60vh] rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Sales Pipeline Stages</h2>
        <div className="relative">
          {/* <button
            className="text-sm border px-3 py-1 rounded flex items-center space-x-2 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>📅</span>
            <span>{timeRangeOptions[selectedTimeRange]}</span>
            <span>▼</span>
          </button> */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
              {Object.entries(timeRangeOptions).map(([key, value]) => (
                <button
                  key={key}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleTimeRangeChange(key)}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              type="category"
              interval={0}
            />
            <YAxis label={{ value: 'Number of Leads', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
           <Line
          type="linear"            
            dataKey="Lead Status"
             stroke="#164CA1"
               strokeWidth={1}          
            dot={{ r: 6 }}           
            activeDot={{ r:8, stroke: '#164CA3', strokeWidth: 1 }}    
          />

            {showAnnotation && (
              <>
                <ReferenceLine
                  x="Qualification"
                  stroke="#cccccc"
                  strokeDasharray="3 3"
                />
                <ReferenceDot
                  x="Qualification"
                  y={18}
                  r={8}
                  fill="black"
                />
                <text
                  x={chartData[qualificationIndex]?.x || 0}
                  y={18}
                  dx={0}
                  dy={-20}
                  fill="#000"
                  fontSize={14}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  18
                </text>
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeadStatusChart;