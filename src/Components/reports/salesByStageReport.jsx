import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { ENDPOINTS } from "../../api/constraints";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FiUsers, FiTrendingUp, FiClock, FiPieChart } from "react-icons/fi";
import * as XLSX from 'xlsx'; // Import xlsx library
import { saveAs } from 'file-saver'; // Import saveAs from file-saver
import { HiDownload } from "react-icons/hi";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Card({ icon, title, value, description, color }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition ${color}`}>
      <div className="flex items-center gap-4">
        <div className={`${color.split(' ')[0]} text-${color.split(' ')[1].split('-')[1]} w-10 h-10 flex items-center justify-center rounded-md`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
          <span className="text-xl font-bold text-gray-900">{value}</span>
          <span className="text-xs text-gray-400">{description}</span>
        </div>
      </div>
    </div>
  );
}

export default function SalesByStageReport() {
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    totalValue: 0,
    avgDealSize: 0,
    avgDays: 0
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${ENDPOINTS.STAGE_LEADS}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Can't fetch stage leads data: ${response.status}`);
        }

        const { data } = await response.json();

        // Calculate total opportunities and total value first for conversion rate
        const allOpportunities = Object.values(data).reduce((sum, stage) => sum + (stage?.totalLeads || 0), 0);
        const allValue = Object.values(data).reduce((sum, stage) => sum + (stage?.totalValue || 0), 0);


        // Transform data
        const transformedData = Object.keys(data).map((stage) => {
          const stageData = data[stage] || {
            totalLeads: 0,
            totalValue: 0,
            avgDays: 0,
            leads: []
          };

          const avgDealSize = stageData.totalLeads > 0
            ? Math.round(stageData.totalValue / stageData.totalLeads)
            : 0;

          // Conversion rate logic: only for "Won" stage, relative to total opportunities
          const conversionRate = stage === "Won" && allOpportunities > 0
            ? (stageData.totalLeads / allOpportunities * 100).toFixed(1)
            : null;

          return {
            stage,
            opportunities: stageData.totalLeads,
            totalValue: stageData.totalValue,
            avgDealSize,
            avgDays: stageData.avgDays, // Assuming avgDays is a number
            conversionRate, // Will be null for non-"Won" stages
            leads: stageData.leads // Keep this if you plan to drill down later
          };
        });

        // Calculate overall stats from the transformed data
        const totalOpportunities = transformedData.reduce((sum, stage) => sum + stage.opportunities, 0);
        const totalValue = transformedData.reduce((sum, stage) => sum + stage.totalValue, 0);
        const avgDealSize = totalOpportunities > 0
          ? Math.round(totalValue / totalOpportunities)
          : 0;

        // Calculate overall average days: sum of avgDays weighted by opportunities
        const totalWeightedDays = transformedData.reduce((sum, stage) => sum + (stage.avgDays * stage.opportunities), 0);
        const overallAvgDays = totalOpportunities > 0 ? (totalWeightedDays / totalOpportunities).toFixed(1) : 0;


        setTableData(transformedData);
        setStats({
          totalOpportunities,
          totalValue,
          avgDealSize,
          avgDays: overallAvgDays // Use the weighted average here
        });

        // Set chart data
        setChartData({
          labels: transformedData.map(row => row.stage),
          datasets: [
            {
              label: "Average Days in Stage",
              data: transformedData.map(row => row.avgDays),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.3)", // Lighter fill for area
              fill: true,
              tension: 0.3,
              yAxisID: 'y1', // Assign to a specific Y-axis
            },
            {
              label: "Number of Opportunities",
              data: transformedData.map(row => row.opportunities),
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.3)", // Lighter fill for area
              fill: true,
              tension: 0.3,
              yAxisID: 'y2', // Assign to a specific Y-axis
            }
          ]
        });

      } catch (error) {
        console.error("Error fetching report data:", error);
        setError("Failed to load sales stage data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle Excel export
  const handleExport = () => {
    if (tableData.length === 0) {
      alert("No data to export.");
      return;
    }

    // Prepare data for export, including conversion rate for "Won" stage
    const dataToExport = tableData.map(row => ({
      'Stage': row.stage,
      'Opportunities': row.opportunities,
      'Total Value (INR)': row.totalValue,
      'Avg. Deal Size (INR)': row.avgDealSize,
      'Avg Days in Stage': row.avgDays,
      'Conversion Rate (%)': row.conversionRate !== null ? parseFloat(row.conversionRate) : '-', // Handle null
    }));

    // Add totals row
    dataToExport.push({
      'Stage': 'Total',
      'Opportunities': stats.totalOpportunities,
      'Total Value (INR)': stats.totalValue,
      'Avg. Deal Size (INR)': stats.avgDealSize,
      'Avg Days in Stage': stats.avgDays,
      'Conversion Rate (%)': '-', // N/A for total row
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SalesByStageReport");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'SalesByStageReport.xlsx');
  };


  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Opportunity Summary by Sales Stage</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-Montserrat">
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/reportpage")}
            className="text-gray-500 hover:bg-gray-200 p-2 rounded-full mr-4"
            aria-label="Back to reports"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-3xl font-semibold text-gray-900">
            Opportunity Summary by Sales Stage
          </h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card
            icon={<FiUsers className="w-5 h-5" />}
            title="Total Opportunities"
            value={stats.totalOpportunities.toLocaleString()}
            description="Across all stages"
            color="bg-blue-100 text-blue-600"
          />

          <Card
            icon={<FiTrendingUp  className="w-5 h-5" />}
            title="Total Pipeline Value"
            value={`₹${stats.totalValue.toLocaleString()}`}
            description="Combined deal worth"
            color="bg-green-100 text-green-600"
          />

          <Card
            icon={<FiPieChart className="w-5 h-5" />}
            title="Avg. Deal Size"
            value={`₹${stats.avgDealSize.toLocaleString()}`}
            description="Average opportunity value"
            color="bg-purple-100 text-purple-600"
          />

          <Card
            icon={<FiClock className="w-5 h-5" />}
            title="Avg. Days in Stage"
            value={`${stats.avgDays} days`}
            description="Average across all stages"
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Full Width Chart */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Stage Metrics</h3>
          <div className="relative h-[400px] w-full">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      boxWidth: 10,
                      color: "#374151",
                      font: { size: 12 },
                    },
                  },
                  tooltip: {
                    backgroundColor: "#111827",
                    titleColor: "#fff",
                    bodyColor: "#d1d5db",
                    padding: 10,
                    borderColor: "#4B5563",
                    borderWidth: 1,
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.dataset.yAxisID === 'y1') { // Avg Days
                          label += context.raw + ' days';
                        } else { // Opportunities
                          label += context.raw.toLocaleString();
                        }
                        return label;
                      }
                    }
                  },
                },
                scales: {
                  y1: { // Y-axis for Average Days
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Average Days",
                      color: "#3b82f6",
                      font: { size: 12 },
                    },
                    ticks: {
                      color: "#4B5563",
                      font: { size: 11 },
                    },
                    grid: {
                      display: true,
                      color: "#E5E7EB",
                      borderDash: [4, 4],
                    },
                  },
                  y2: { // Y-axis for Opportunities
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Opportunities",
                      color: "#10b981",
                      font: { size: 12 },
                    },
                    ticks: {
                      color: "#4B5563",
                      font: { size: 11 },
                    },
                    grid: {
                      display: false, // Hide grid for second Y-axis
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: "Sales Stage",
                      color: "#6B7280",
                      font: { size: 12 },
                    },
                    ticks: {
                      color: "#4B5563",
                      font: { size: 11 },
                      maxRotation: 45,
                      minRotation: 0,
                      autoSkip: true,
                    },
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-xl font-semibold text-gray-800">
              Sales Pipeline Performance by Stage
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {tableData.length} stages • Last updated: {new Date().toLocaleString()}
              </span>
              {/* Export to Excel Button */}
              <button
                onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-colors text-sm font-semibold"
              >
 <HiDownload size={16} className="mr-2" /> Export to Excel              </button>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-scroll h-[50vh] border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="text-gray-600 border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">S.No</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium text-right">Opportunities</th>
                  <th className="px-4 py-3 font-medium text-right">Total Value (₹)</th>
                  <th className="px-4 py-3 font-medium text-right">Avg. Deal Size (₹)</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Days</th>
                  {/* <th className="px-4 py-3 font-medium text-right">Conversion Rate (%)</th> New column */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData
                  .sort((a, b) => b.totalValue - a.totalValue) // Still sort by value
                  .map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{row.stage}</td>
                      <td className="px-4 py-3 text-right">{row.opportunities.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">₹{row.totalValue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">₹{row.avgDealSize.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.avgDays > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {row.avgDays} days
                        </span>
                      </td>
                      {/* <td className="px-4 py-3 text-right">
                        {row.conversionRate !== null ? `${row.conversionRate}%` : '-'}
                      </td> */}
                    </tr>
                  ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 text-center text-gray-500">No data available for sales stages.</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 bg-gray-50 font-semibold border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3" colSpan="2">Total</td>
                  <td className="px-4 py-3 text-right">{stats.totalOpportunities.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{stats.totalValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{stats.avgDealSize.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{stats.avgDays} days</td>
                  <td className="px-4 py-3 text-right">-</td> {/* Conversion rate for total is not applicable here */}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}