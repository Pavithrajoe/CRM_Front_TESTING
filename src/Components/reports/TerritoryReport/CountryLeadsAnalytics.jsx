
import React, { useEffect, useState } from "react";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const mockCountryData = {
  "United States": 5000,
  "India": 8500,
  "United Kingdom": 2100,
  "Canada": 1800,
  "Australia": 1500,
};

const CountryLeadsAnalytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(mockCountryData);
    }, 1000);
  }, []);

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center h-[280px]">
        <div className="text-sm text-gray-500">Loading country data...</div>
      </div>
    );
  }

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Leads",
        data: Object.values(data),
        backgroundColor: "#6366F1", // A consistent color for this chart
        borderRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 4,
        padding: 10,
      }
    },
    scales: {
      y: {
        ticks: { precision: 0, font: { size: 11 }, color: '#6B7280' },
        grid: { color: '#E5E7EB' }
      },
      x: {
        ticks: { font: { size: 11 }, color: '#6B7280' },
        grid: { display: false }
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 h-[280px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Leads by Country</h3>
      <div className="flex-grow w-full h-[200px]">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default CountryLeadsAnalytics;

