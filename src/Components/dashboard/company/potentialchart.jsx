import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ENDPOINTS } from '../../../api/constraints';

const PotentialChart = () => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#2E8B57', '#FF9800', '#03A9F4', '#FF5722']; 


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
          console.error(`API Error - Status: ${response.status}, Body: ${errorBody}`);
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Extract the main 'data' object from the API result
        const dataFromApi = result?.data || {};

        // Extract lead potential distribution and lost leads counts
        const distribution = dataFromApi?.leadPotentialDistribution || {};
        const hotCount = distribution.hot || 0;
        const warmCount = distribution.warm || 0;
        const coldCount = distribution.cold || 0;
        // lostLeads is directly under dataFromApi, not leadPotentialDistribution
        const lostCount = dataFromApi.lostLeads || 0;

        // Calculate the total count for all categories to determine percentages
        const totalChartableLeads = hotCount + warmCount + coldCount + lostCount;

        // Helper function to calculate percentage for each lead type
        const calculatePercentage = (count) => {
          if (totalChartableLeads === 0) return 0;
          return (count / totalChartableLeads) * 100;
        };

        // Format data for the Recharts PieChart
        const formattedData = [
          {
            name: 'Hot Lead',
            value: calculatePercentage(hotCount),
            count: hotCount,
            percent: `${calculatePercentage(hotCount).toFixed(2)}%`,
          },
          {
            name: 'Warm Lead',
            value: calculatePercentage(warmCount),
            count: warmCount,
            percent: `${calculatePercentage(warmCount).toFixed(2)}%`,
          },
          {
            name: 'Cold Lead',
            value: calculatePercentage(coldCount),
            count: coldCount,
            percent: `${calculatePercentage(coldCount).toFixed(2)}%`,
          },
          {
            name: 'Lost Lead',
            value: calculatePercentage(lostCount),
            count: lostCount,
            percent: `${calculatePercentage(lostCount).toFixed(2)}%`,
          },
        ];

        setChartData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error('API Error during fetch:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once on mount

  // Custom Tooltip component for the Pie Chart
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

  // Display loading state
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border h-[50px] flex items-center justify-center">
        <p>Loading chart data...</p>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border h-full flex items-center justify-center text-red-600">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  // Calculate total leads displayed in the chart for the header
  const totalLeadsDisplayed = chartData.reduce((sum, item) => sum + item.count, 0);

  // Check if there's valid data to display the chart
  const hasValidChartData = chartData.some(item => item.value > 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow border h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Lead Status Distribution</h2>
      <p className="text-sm text-gray-500 mb-4 text-center">
        Total Leads: {totalLeadsDisplayed}
      </p>

     
      <div className="flex-grow flex items-center justify-center">
        {hasValidChartData ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="60%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name,}) =>
                  `${name} `
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No lead potential data available to display chart.</p>
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