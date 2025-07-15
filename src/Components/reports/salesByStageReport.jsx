import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { ENDPOINTS } from "../../api/constraints";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FiUsers, FiTrendingUp } from "react-icons/fi";


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

function Card({ children }) {
  return <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition">{children}</div>;
}

export default function SalesByStageReport() {
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState(null);
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
        const transformedData = Object.keys(data).map((stage) => {
          const stageData = data[stage] || {
            totalLeads: 0,
            totalValue: 0,
            avgDays: 0,
            leads: []
          };
          return {
            stage,
            opp: stageData.totalLeads,
            val: stageData.totalValue,
            deal: stageData.totalLeads > 0 ? Math.round(stageData.totalValue / stageData.totalLeads) : 0,
            days: stageData.avgDays,
            leads: stageData.leads
          };
        });

        setTableData(transformedData);
        setChartData({
          labels: transformedData.map(row => row.stage),
          datasets: [
            {
              label: "Average Days in Stage",
              data: transformedData.map(row => row.days),
              borderColor: "#3b82f6",
              backgroundColor: "#3b82f655",
              fill: false,
              tension: 0.3
            }
          ]
        });
      } catch (error) {
        console.error("Error fetching report data:", error);
        setError("Failed to load sales stage data. Please try again later.");
      }
    };

    fetchData();
  }, []);

  const totalOpportunities = tableData.reduce((a, c) => a + c.opp, 0);
  const totalValue = tableData.reduce((a, c) => a + c.val, 0);

  if (error) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Opportunity Summary by Sales Stage</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Total Company Lead */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-md">
                <div className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-md">
  <FiUsers className="w-5 h-5" />
</div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Company Lead</span>
                <span className="text-xl font-bold text-gray-900">{totalOpportunities}</span>
                <span className="text-xs text-gray-400">Generated across all stages</span>
              </div>
            </div>
          </Card>

          {/* Total Value */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 w-10 h-10 flex items-center justify-center rounded-md">
                <div className="bg-green-100 text-green-600 w-10 h-10 flex items-center justify-center rounded-md">
  <FiTrendingUp className="w-5 h-5" />
</div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Value</span>
                <span className="text-xl font-extrabold text-gray-900">₹{totalValue.toLocaleString()}</span>
                <span className="text-xs text-gray-400">Combined deal worth</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Full Width Chart */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Average Age in Stage</h3>
          <div className="relative h-[300px] w-full">
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
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Average Days",
                      color: "#6B7280",
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
                      maxRotation: 30,
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Sales Pipeline Performance by Stage
          </h3>
          <div className="overflow-x-auto overflow-y-scroll h-[50vh]">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b">
                  <th className="px-4 py-3 font-medium">S.No</th>
                  <th className="px-4 py-3 font-medium">Sales Stage</th>
                  <th className="px-4 py-3 font-medium">No. of Leads</th>
                  <th className="px-4 py-3 font-medium">Total Value</th>
                  <th className="px-4 py-3 font-medium">Avg. Deal Size</th>
                  <th className="px-4 py-3 font-medium">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{row.stage}</td>
                    <td className="px-4 py-2">{row.opp}</td>
                    <td className="px-4 py-2">₹{row.val.toLocaleString()}</td>
                    <td className="px-4 py-2">₹{row.deal.toLocaleString()}</td>
                    <td className="px-4 py-2">{row.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
