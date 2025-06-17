import { useState, useEffect } from "react";
import { ENDPOINTS } from "../../api/constraints";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function SalesPipelineAnalysis() {
  const [pipelineData, setPipelineData] = useState(null);
  const [filter, setFilter] = useState("month");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token not found");

        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const { company_id } = JSON.parse(jsonPayload);
        if (!company_id) throw new Error("Company ID missing");

        const res = await fetch(`${ENDPOINTS.SALES_PIPLINE_ANALYSIS}${company_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("API failed");

        const result = await res.json();
        setPipelineData(result);
      } catch (e) {
        console.error("Error in fetching sales pipeline data:", e.message);
      }
    };

    fetchData();
  }, []);

  const getDateLabelsForFilter = (filter) => {
    const labels = [];
    const today = new Date();

    if (filter === "week") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString("en-IN", { weekday: "short" }));
      }
    } else if (filter === "month") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        labels.push(d.toString());
      }
    } else if (filter === "year") {
   labels.push(
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
);

    }

    return labels;
  };

  const generateChartData = () => {
    const leadData = pipelineData?.leadsByDate?.[filter] ?? [];
    const labels = getDateLabelsForFilter(filter);
    const grouped = {};

    labels.forEach((label) => {
      grouped[label] = { label, Added: 0, Moved: 0, Lost: 0 };
    });

    leadData.forEach((lead) => {
      const date = new Date(lead.dcreated_dt);
      let label = "";

      if (filter === "week") {
        label = date.toLocaleDateString("en-IN", { weekday: "short" });
      } else if (filter === "month") {
        label = date.getDate().toString();
      } else if (filter === "year") {
        const monthIdx = date.getMonth();
        label = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][monthIdx];
      }

      if (!grouped[label]) return;

      if (lead.bactive && !lead.bisConverted) grouped[label].Added += 1;
      else if (lead.bisConverted) grouped[label].Moved += 1;
      else if (!lead.bactive) grouped[label].Lost += 1;
    });

    return Object.values(grouped);
  };

  if (!pipelineData) return <div className="p-6 text-gray-500">Loading...</div>;

  const {
    activeUnconvertedLeads,
    avgDealRatio,
    convertionRatio,
    expectedRevenueThisMonth,
    leadsByDate,
  } = pipelineData;

  const cardData = [
    {
      title: "Total Pipeline Value",
      value: `₹${(expectedRevenueThisMonth || 0).toLocaleString("en-IN")}`,

    
    },
    {
      title: "No. Of Open Opportunities",
      value: activeUnconvertedLeads || "--",


    },
    {
      title: "Average Deal Size",
      value: `₹${Math.round(avgDealRatio) || 0}`,
   
     
    },
    {
      title: "Pipeline Coverage Ratio",
      value: `${(convertionRatio || 0).toFixed(2)}%`,
      

    },
  ];

  const chartData = generateChartData();

  const totalProjectValue =
    leadsByDate?.[filter]
      ?.filter((lead) => lead.bactive && !lead.bisConverted)
      .reduce((sum, lead) => sum + (lead.iproject_value ?? 0), 0) || 0;

  const achievedPercentage =
    expectedRevenueThisMonth > 0
      ? Math.min(((totalProjectValue / expectedRevenueThisMonth) * 100).toFixed(2))
      : 0;

  const pieData = [
    { name: "Achieved", value: achievedPercentage },
    { name: "Remaining", value: 100 - achievedPercentage },
  ];
console.log("achieved",achievedPercentage)
console.log("expt:",expectedRevenueThisMonth)
  const COLORS = [ "#D9D9D9","#1B5E20"];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold ">Sales Pipeline Analysis</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6 h-full ">
        {cardData.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-gray-500 text-sm mb-2">{card.title}</div>
            <div className="text-2xl font-bold text-gray-800">{card.value}</div>
            <div className="flex items-center mt-2">
             
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3  gap-6">
        <div className="md:col-span-2 bg-white rounded-xl  h-full p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Sales Pipeline Performance by Stage
            </h2>
            <select
              className="border px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="year">Year </option>
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Added" stackId="a" fill="#0D47A1" />
                <Bar dataKey="Moved" stackId="a" fill="#61AAE5" />
                <Bar dataKey="Lost" stackId="a" fill="#C3D7E7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Expected Revenue</h2>
           
          </div>
          <div className="relative w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center ml-80 justify-center">
              <div className="text-xl font-bold text-gray-800">
                ₹{expectedRevenueThisMonth?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-xs text-green-600">
                Way to go : {achievedPercentage}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                * For this month
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
