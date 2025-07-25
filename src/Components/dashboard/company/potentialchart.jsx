import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ENDPOINTS } from '../../../api/constraints';

const PotentialChart = () => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#19FFED',
    '#80FF19', '#FF4F19', '#198CFF', '#8019FF', '#CC66FF', '#FF6666', '#66FFCC',
    '#FFCC66', '#66CCFF', '#CCFF66'
  ];

  const getCompanyIdAndToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage.');
      return null;
    }
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

  useEffect(() => {
    const fetchData = async () => {
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
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}. Details: ${errorBody}`);
        }

        const result = await response.json();
        const dataFromApi = result?.data || {};

        const groupedByPotentialName = dataFromApi.groupedByPotentialName || {};
        const groupedByPotentialNamePercentage = dataFromApi.groupedByPotentialNamePercentage || {};

        const formattedData = Object.keys(groupedByPotentialNamePercentage).map(key => ({
          name: key,
          value: parseFloat(groupedByPotentialNamePercentage[key]),
          count: groupedByPotentialName[key] || 0,
          percent: `${parseFloat(groupedByPotentialNamePercentage[key]).toFixed(2)}%`,
        }));

        const filteredData = formattedData.filter(item => item.value > 0);

        setChartData(filteredData);
        setLoading(false);
      } catch (err) {
        console.error('API Error during fetch:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, count, percent } = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-md">
          <p className="font-semibold text-gray-700">{name}</p>
          <p className="text-sm text-gray-600">Count: {count}</p>
          <p className="text-sm text-gray-600">Percentage: {percent}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border h-[300px] flex items-center justify-center">
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border h-full flex items-center justify-center text-red-600">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  const totalLeadsDisplayed = chartData.reduce((sum, item) => sum + item.count, 0);
  const hasValidChartData = chartData.some(item => item.value > 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Lead Potential Distribution</h2>
      <p className="text-sm text-gray-500 mb-4 text-center">
        Total Leads: {totalLeadsDisplayed}
      </p>

      <div className="flex-grow flex items-center justify-center">
        {hasValidChartData ? (
          <ResponsiveContainer width="100%" height={350}> {/* Increased height here */}
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%" // Adjusted center slightly for more room below
                startAngle={180}
                endAngle={-180} // Changed to full circle for better label distribution
                innerRadius={60} // Adjusted inner radius
                outerRadius={120} // Increased outer radius for a bigger chart
                paddingAngle={3} // Slightly reduced padding for tighter fit if many slices
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`} // Display name and percentage
                labelLine={true} // Ensure label lines are shown
                // Added a style to the label to make it larger
                labelStyle={{ fontSize: '14px', fill: '#333' }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No lead potential data available to display the chart.</p>
        )}
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-4">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <span className="text-sm">
              {entry.name} ({entry.count} | {entry.percent})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PotentialChart;