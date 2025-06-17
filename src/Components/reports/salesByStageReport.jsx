import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { ENDPOINTS } from "../../api/constraints";

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
  return <div className="bg-white rounded-xl shadow p-4 m-2">{children}</div>;
}

function CardContent({ children }) {
  return <div className="py-2">{children}</div>;
}

export default function SalesByStageReport() {
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [error, setError] = useState(null);

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
        console.log("This is stage response data:", data);

        // Transform API data into table format
        const stages = [
          "New",
          "Contacted",
          "Qualification",
          "Follow-up",
          "Negotiation",
          "Won"
        ]; // Define stage order
        const transformedData = stages.map((stage) => {
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
            deal: stageData.totalLeads > 0 ? Math.round(stageData.totalValue / stageData.totalLeads) : 0, // Avg Deal Size
            days: stageData.avgDays,
            conv: stage === "Won" ? 100 : Math.round((stageData.totalLeads / (data.New?.totalLeads || 1)) * 100), // Placeholder: Conversion rate based on New leads
            win: stage === "Won" ? 100 : Math.round((stageData.totalLeads / (data.New?.totalLeads || 1)) * 50) // Placeholder: Win rate (50% of conversion for non-Won)
          };
        });

        setTableData(transformedData);

        // Prepare chart data (average days per stage)
        setChartData({
          labels: transformedData.map(row => row.stage),
          datasets: [
            {
              label: "Average Days in Stage",
              data: transformedData.map(row => row.days),
              borderColor: "#3b82f6",
              backgroundColor: "#3b82f655",
              fill: false,
              tension: 0.3 // Smooth lines
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

  // Calculate dynamic values for cards
  const totalOpportunities = tableData.reduce((a, c) => a + c.opp, 0);
  const totalValue = tableData.reduce((a, c) => a + c.val, 0);
  const winRate = tableData.length > 0
    ? Math.round(
        (tableData.find(row => row.stage === "Won")?.opp || 0) /
        (totalOpportunities || 1) * 100
      )
    : 0;
  const weightedPipelineValue = Math.round(totalValue * (winRate / 100)); // Placeholder: Weighted value
  const conversionNext = 85; // Placeholder: Requires API data or logic
  const lostOpportunities = totalOpportunities - (tableData.find(row => row.stage === "Won")?.opp || 0); // Placeholder

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

    {/* Main Content */}
    <div className="flex-1 p-8">
      <h2 className="text-3xl font-semibold text-gray-900 mb-6">
        Opportunity Summary by Sales Stage
      </h2>
   
      {/* Top Section: Cards and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Cards in 2 rows x 3 column s */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
<Card className="rounded-xl bg-blue-100 text-blue-900 shadow hover:shadow-md transition duration-200">
  <CardContent className="p-4 space-y-1">
    <p className="text-xs font-medium text-blue-800 mb-2">No Of Opportunities</p>
    <h3 className="text-xl font-bold">{totalOpportunities}</h3>
  </CardContent>
</Card>

  <Card className="rounded-xl bg-green-100 text-green-900 shadow hover:shadow-md transition duration-200">
    <CardContent className="p-4 space-y-1">
      <p className="text-xs font-medium text-green-800 mb-2">Total Lead Value</p>
      <h3 className="text-xl font-bold">₹{totalValue.toLocaleString()}</h3>
    </CardContent>
  </Card>

  <Card className="rounded-xl bg-yellow-100 text-yellow-900 shadow hover:shadow-md transition duration-200">
    <CardContent className="p-4 space-y-1">
      <p className="text-xs font-medium text-yellow-800 mb-2">Pipeline Value</p>
      <h3 className="text-xl font-bold">₹{weightedPipelineValue.toLocaleString()}</h3>
    </CardContent>
  </Card>

  <Card className="rounded-xl bg-purple-100 text-purple-900 shadow hover:shadow-md transition duration-200">
    <CardContent className="p-4 space-y-1">
      <p className="text-xs font-medium text-purple-800 mb-2">Win Rate</p>
      <h3 className="text-xl font-bold">{winRate}%</h3>
    </CardContent>
  </Card>

 


<Card className="rounded-xl bg-red-100 text-red-900 shadow hover:shadow-md transition duration-200">
  <CardContent className="py-2 px-4 space-y-1">
    <p className="text-xs font-medium text-red-800 leading-tight">Lost Opportunities</p>
    <h3 className="text-lg font-bold leading-tight">{lostOpportunities}</h3>
  </CardContent>
</Card>

  
</div>


        {/* Line Chart */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">
    Average Age in Stage
  </h3>

  <div className="relative h-[300px]">
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
              color: "#374151", // gray-700
              font: { size: 13 },
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
              font: { size: 14 },
            },
            ticks: {
              color: "#4B5563",
              font: { size: 12 },
            },
            grid: {
              display: true, // no Y grid lines
            },
          },
          x: {
            title: {
              display: true,
              text: "Sales Stage",
              color: "#6B7280",
              font: { size: 14 },
            },
            ticks: {
              color: "#4B5563",
              font: { size: 12 },
            },
            grid: {
              display: false, // no X grid lines
            },
          },
        },
        elements: {
          line: {
            tension: 0.4,
            borderWidth: 2,
            borderColor: "#3B82F6", // blue-500
          },
          point: {
            radius: 3,
            backgroundColor: "#fff",
            borderColor: "#3B82F6",
            borderWidth: 1,
            hoverRadius: 5,
            hoverBorderColor: "#1D4ED8",
            hoverBorderWidth: 2,
          },
        },
      }}
    />
  </div>
</div>

      </div>

      {/* Table Section */}
      <div className="mt-10 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Sales Pipeline Performance by Stage
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b">
                <th className="px-4 py-3 font-medium">S.No</th>
                <th className="px-4 py-3 font-medium">Sales Stage</th>
                <th className="px-4 py-3 font-medium">No. of Opportunities</th>
                <th className="px-4 py-3 font-medium">Total Value</th>
                <th className="px-4 py-3 font-medium">Avg. Deal Size</th>
                <th className="px-4 py-3 font-medium">Avg Days</th>
                <th className="px-4 py-3 font-medium">Conversion Rate</th>
                <th className="px-4 py-3 font-medium">Win (%)</th>
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
                  <td className="px-4 py-2">{row.conv}%</td>
                  <td className="px-4 py-2">{row.win}%</td>
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