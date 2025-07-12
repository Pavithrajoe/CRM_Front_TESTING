import React, { useEffect, useState, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts';
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

  // Function to decode the token and get companyId
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

  // Function to fetch data specific to the company
  const fetchLeadStatusData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const authData = getCompanyIdAndToken();
    if (!authData) {
      setError('Authentication data missing. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${ENDPOINTS.COMPANY_GET}`, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      const stageCounts = result?.data?.stageCounts || {};
      
      // Transform the fetched stage counts and remove leading/trailing whitespace from stage names
      const transformedData = Object.entries(stageCounts).map(([stage, count]) => ({
        name: stage.trim(), // Use .trim() to remove leading/trailing whitespace
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

  // Handlers for time range selection (currently not modifying data fetching but included for UI)
  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
    setDropdownOpen(false);
  };

  // Custom tooltip component for the chart
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

  // Loading and Error handling UI
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-64 flex items-center justify-center">
        <p>Loading sales pipeline data...</p>
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

  // Main component rendering
  return (
    <div className="bg-white p-4 h-[80vh] rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Sales Pipeline Stages</h2>
        {/* Time Range Dropdown */}
        <div className="relative">
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
      <div style={{ width: '100%', height: 500 }}>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No lead status data available for this time range.
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              {/* X-axis for stage names, rotated for readability */}
              <XAxis
                dataKey="name"
                type="category"
                angle={-45} 
                textAnchor="end"
                height={90} 
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
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LeadStatusChart;