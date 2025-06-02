import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ENDPOINTS } from '../../../api/constraints';

const PotentialChart = () => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCompanyIdAndToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return { token, companyId: payload.company_id };
    } catch (err) {
      console.error('Invalid token format:', err);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const auth = getCompanyIdAndToken();
      if (!auth) {
        setError('Login required.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${ENDPOINTS.COMPANY_GET}`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`API error: ${response.status} - ${errorBody}`);
        }

        const result = await response.json();
        const distribution = result?.data?.leadPotentialDistribution || {};

        const parsePercent = (val) => {
          if (typeof val === 'string') return parseFloat(val.replace('%', '')) || 0;
          if (typeof val === 'number') return val;
          return 0;
        };

        const hotCount = distribution.hot || 0;
        const warmCount = distribution.warm || 0;
        const coldCount = distribution.cold || 0;
        const lostCount = distribution.lostLeads || 0;

        const percentages = distribution.percentages || {};

        const formattedData = [
          {
            name: 'Hot Lead',
            value: parsePercent(percentages.hot),
            count: hotCount,
            percent: typeof percentages.hot === 'string' ? percentages.hot : `${parsePercent(percentages.hot)}%`,
          },
          {
            name: 'Warm Lead',
            value: parsePercent(percentages.warm),
            count: warmCount,
            percent: typeof percentages.warm === 'string' ? percentages.warm : `${parsePercent(percentages.warm)}%`,
          },
          {
            name: 'Cold Lead',
            value: parsePercent(percentages.cold),
            count: coldCount,
            percent: typeof percentages.cold === 'string' ? percentages.cold : `${parsePercent(percentages.cold)}%`,
          },
          {
            name: 'Lost Lead',
            value: parsePercent(percentages.lostLeads),
            count: lostCount,
            percent: typeof percentages.lostLeads === 'string' ? percentages.lostLeads : `${parsePercent(percentages.lostLeads)}%`,
          },
        ];

        setChartData(formattedData);
      } catch (err) {
        console.error('Data fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#FF5722', '#FF9800', '#03A9F4', '#9E9E9E'];

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

  const totalLeads = chartData.reduce((sum, item) => sum + (item.count || 0), 0);
  const hasValidData = chartData.some(item => item.value > 0);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border flex justify-center items-center h-64">
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border text-red-600 flex justify-center items-center h-64">
        <p>Error loading chart: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-2 text-center">Potential Card</h2>
      <p className="text-sm text-gray-500 text-center mb-4">Total Leads: {totalLeads}</p>

      <div className="flex-grow flex items-center justify-center">
        {hasValidData ? (
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
                labelLine={false}
                label={({ name }) => name}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No data available to render chart.</p>
        )}
      </div>

      <div className="flex justify-center flex-wrap gap-4 mt-4">
        {chartData.map((entry, idx) => (
          <div key={entry.name} className="flex items-center space-x-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            ></span>
            <span className="text-sm text-gray-700">
              {entry.name} ({entry.count} | {entry.percent})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PotentialChart;
