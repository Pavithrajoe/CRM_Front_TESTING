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
  const [selectedTimeRange, setSelectedTimeRange] = useState('today'); // Still present, but not used for data filtering in this example
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

      // Transform the fetched stage counts into an array suitable for Recharts.
      // Sort by orderId if available, otherwise by name.
      const transformedData = Object.entries(stageCounts)
        .map(([stage, details]) => ({
          name: stage.trim(), // Use .trim() to remove leading/trailing whitespace
          "Lead Status": details.count,
          orderId: details.orderId // Keep orderId for sorting
        }))
        // Sort the data by orderId. If orderId is the same, sort by name.
        .sort((a, b) => {
          if (a.orderId && b.orderId) {
            return a.orderId - b.orderId;
          }
          return a.name.localeCompare(b.name); // Fallback to alphabetical if no orderId
        });

      setChartData(transformedData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []); // selectedTimeRange is not in dependency array as it doesn't filter data from this API call

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

  // Custom tick formatter for Y-axis to ensure integer values
  const formatYAxisTick = (tick) => {
    return Math.floor(tick); // Ensure the tick is an integer
  };

  // Loading and Error handling UI
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-[400px] flex items-center justify-center">
        <p>Loading sales pipeline data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-[400px] flex items-center justify-center text-red-600">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 h-[80vh] rounded-lg shadow flex flex-col">
      <div className="flex justify-between items-center ">
        <h2 className="text-lg font-semibold">Sales Pipeline Stages</h2>
        {/* Time Range Dropdown - Logic remains the same, not connected to data fetching here */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions[selectedTimeRange]}
            <span className="ml-2">&#9662;</span> {/* Dropdown arrow */}
          </button>
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
      <div className="flex-grow"> {/* Use flex-grow to take available space */}
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No lead status data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" > {/* Ensure chart fills its parent */}
            <LineChart
              data={chartData}
              margin={{
                top: 20,    // Increased top margin
                right: 40,  // Increased right margin
                left: 30,   // Increased left margin
                bottom: 100, // Significantly increased bottom margin for rotated labels
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                type="category"
                angle={-45} // Rotate labels by -45 degrees
                textAnchor="end" // Anchor text to the end of the tick for better alignment
                height={120} // Give more height to the X-axis to prevent label overlap
                interval={0} // Ensure all labels are shown
                tick={{ fontSize: 12 }} // Adjust font size of X-axis labels
              />
              <YAxis
                label={{
                  value: 'Number of Leads',
                  angle: -90,
                  position: 'insideLeft',
                  dy: 50, // Adjust vertical position of Y-axis label
                  style: { textAnchor: 'middle', fontSize: '14px' } // Style Y-axis label
                }}
                tickFormatter={formatYAxisTick}
                allowDecimals={false}
                domain={[0, (dataMax) => Math.max(dataMax, 1)]} // Ensure Y-axis starts from 0 and handles single-item data
                tick={{ fontSize: 12 }} // Adjust font size of Y-axis labels
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} /> {/* Adjust legend position for more chart space */}
              <Line
                type="linear"
                dataKey="Lead Status"
                stroke="#164CA1"
                strokeWidth={2} // Slightly thicker line
                dot={{ r: 4 }} // Smaller dots
                activeDot={{ r: 6, stroke: '#164CA3', strokeWidth: 2 }} // Active dot size
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LeadStatusChart;