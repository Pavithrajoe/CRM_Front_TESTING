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
      // NOTE: Using ENDPOINTS.COMPANY_GET to fetch company data which includes stageCounts
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
      const transformedData = Object.entries(stageCounts)
        .map(([stage, details]) => ({
          name: stage.trim(),
          "Lead Status": details.count,
          orderId: details.orderId
        }))
        // Sort the data exclusively by orderId to ensure pipeline stages are sequential.
        .sort((a, b) => {
          // Handle cases where orderId might be 'Unknown' or not a number
          const orderA = typeof a.orderId === 'number' ? a.orderId : Infinity;
          // FIX: Changed 'b.orderB' to 'b.orderId'
          const orderB = typeof b.orderId === 'number' ? b.orderId : Infinity; 
          return orderA - orderB;
        });

      setChartData(transformedData);
    } catch (err) {
      // Check if err is an Error object or a string
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadStatusData();
  }, [fetchLeadStatusData]);

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Check if value is defined and is a number before displaying 'Leads'
      const value = payload[0].value;
      const displayValue = typeof value === 'number' ? `${value} Leads` : value;

      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-md">
          <p className="font-semibold text-gray-700">{`${label}: ${displayValue}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tick formatter for Y-axis to ensure integer values
  const formatYAxisTick = (tick) => {
    // Only display non-negative integers
    return Math.max(0, Math.floor(tick)); 
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
      </div>
      <div className="flex-grow">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No lead status data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 40,
                left: 30,
                bottom: 100, // Increased bottom margin for rotated X-Axis labels
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                type="category"
                angle={-45}
                textAnchor="end"
                height={120} // Adjusted height to accommodate rotated labels
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{
                  value: 'Number of Leads',
                  angle: -90,
                  position: 'insideLeft',
                  dy: 50,
                  style: { textAnchor: 'middle', fontSize: '14px' }
                }}
                tickFormatter={formatYAxisTick}
                // Allow the Y-Axis to calculate its own domain, but ensure it starts at 0
                domain={[0, 'auto']} 
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="linear"
                dataKey="Lead Status"
                stroke="#164CA1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, stroke: '#164CA3', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LeadStatusChart;