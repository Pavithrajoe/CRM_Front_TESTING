import React, { useEffect, useState } from "react";
import { ENDPOINTS } from "../../api/constraints";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { TrendingUp, PieChart, Users, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaRupeeSign, FaArrowLeft } from "react-icons/fa"; // Import FaArrowLeft
import { useNavigate } from "react-router-dom"; // Import useNavigate

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const TerritoryLeadsAnalytics = () => {
  const [data, setData] = useState(null);
  const [territory, setTerritory] = useState("All Territories");
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(ENDPOINTS.TERRITORY_LEADS, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch territory leads data");

        const responseData = await response.json();
        setData(responseData.data);
      } catch (err) {
        console.error("Error fetching territory leads data:", err);
      }
    };

    fetchData();
  }, []);

  if (!data) return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  const allTerritories = ["All Territories", ...Object.keys(data.leadsPerTerritory)];

  const getMergedData = () => {
    if (territory !== "All Territories") return null;

    const mergeCounts = (objects) => {
      const merged = {};
      for (const obj of Object.values(objects)) {
        for (const [key, val] of Object.entries(obj)) {
          merged[key] = (merged[key] || 0) + val;
        }
      }
      return merged;
    };

    const totalLeads = Object.values(data.leadsPerTerritory).reduce((a, b) => a + b, 0);
    const totalRevenue = Object.values(data.revenuePerTerritory).reduce((a, b) => a + b, 0);
    const totalConverted = Object.values(data.conversionPerTerritory).reduce(
      (sum, t) => sum + t.converted,
      0
    );
    const total = Object.values(data.conversionPerTerritory).reduce((sum, t) => sum + t.total, 0);

    return {
      totalLeads,
      totalRevenue,
      converted: totalConverted,
      conversionRate: ((totalConverted / total) * 100).toFixed(2) + "%",
      status: mergeCounts(data.statusPerTerritory),
      sources: mergeCounts(data.sourceBreakdownPerTerritory),
    };
  };

  const merged = getMergedData();
  const leadList = data.lead_list || [];

  const filteredLeads =
    territory === "All Territories"
      ? leadList
      : leadList.filter((lead) => lead.city?.cCity_name === territory);

  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const statusData = territory === "All Territories" ? merged.status : data.statusPerTerritory[territory];
  const sourceData =
    territory === "All Territories" ? merged.sources : data.sourceBreakdownPerTerritory[territory];
  const conversionData =
    territory === "All Territories" ? merged : data.conversionPerTerritory[territory];
  const revenue = territory === "All Territories" ? merged.totalRevenue : data.revenuePerTerritory[territory];
  const totalLeads = territory === "All Territories" ? merged.totalLeads : data.leadsPerTerritory[territory];

  const barChartData = {
    labels: Object.keys(statusData),
    datasets: [
      {
        label: "Leads",
        data: Object.values(statusData),
        backgroundColor: "#007AFF",
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(sourceData),
    datasets: [
      {
        label: "Sources",
        data: Object.values(sourceData),
        backgroundColor: ["#34C759", "#FF9500", "#FF2D55", "#AF52DE", "#5AC8FA"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { ticks: { precision: 0, font: { size: 11 } } },
      x: { ticks: { font: { size: 11 } } },
    },
  };

  function getStatusColor(status) {
    switch (status.toLowerCase()) {
      case "new": return "bg-blue-100 text-blue-700";
      case "contacted": return "bg-yellow-100 text-yellow-700";
      case "qualified": return "bg-green-100 text-green-700";
      case "lost": return "bg-red-100 text-red-700";
      case "converted": return "bg-purple-100 text-purple-700";
      case "won": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div className="p-4  mx-auto font-[system-ui]">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/reportpage")} // Navigate to /reportpage
          className="text-gray-600 hover:text-gray-900 mr-4 text-2xl p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Back to reports"
        >
          <FaArrowLeft /> {/* Back arrow icon */}
        </button>
        <h1 className="text-2xl font-bold text-gray-900 text-center">Territory-Based Analytics</h1>
      </div>

      <div className="mb-8 flex justify-center">
        <Listbox value={territory} onChange={(value) => {
          setTerritory(value);
          setCurrentPage(1);
        }}>
          <div className="relative w-64">
            <Listbox.Button className="w-full bg-white border border-gray-300 rounded-full py-2 pl-4 pr-10 text-left shadow-md text-sm focus:outline-none">
              <span>{territory}</span>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto text-sm">
              {allTerritories.map((t) => (
                <Listbox.Option
                  key={t}
                  value={t}
                  className={({ active }) =>
                    `cursor-pointer select-none relative py-2 px-4 ${
                      active ? "bg-blue-100 text-blue-700" : "text-gray-800"
                    }`
                  }
                >
                  {({ selected }) => (
                    <span className={`${selected ? "font-semibold" : "font-normal"}`}>{t}</span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card icon={<Users size={18} />} title="Total Leads" value={totalLeads} />
        <Card icon={<FaRupeeSign size={18} />} title="Revenue" value={`₹${revenue.toLocaleString()}`} />
        <Card icon={<TrendingUp size={18} />} title="Converted" value={conversionData.converted} />
        <Card icon={<PieChart size={18} />} title="Conversion Rate" value={conversionData.conversionRate} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-md p-4 h-[260px]">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Leads by Status</h3>
          <div className="w-full h-[200px]">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 h-[260px]">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Lead Source Breakdown</h3>
          <div className="w-full h-[200px]">
            <Pie data={pieChartData} options={{ ...chartOptions, scales: {} }} />
          </div>
        </div>
      </div>

      <div className="mt-10 bg-white rounded-3xl border border-gray-200 p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Lead List: {territory}</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm max-h-[500px]">
          <table className="min-w-full text-sm text-left text-gray-800 font-medium">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300 text-gray-600">
              <tr>
                <th className="px-6 py-4">S.No</th>
                <th className="px-6 py-4">Lead Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Project Value</th>
                <th className="px-6 py-4">City</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentLeads.map((lead, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3">{indexOfFirstLead + index + 1}</td>
                  <td className="px-6 py-3">{lead.lead_name}</td>
                  <td className="px-6 py-3">{lead.mail}</td>
                  <td className="px-6 py-3">{lead.phone}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold select-none ${getStatusColor(lead.lead_status)}`}>
                      {lead.lead_status}
                    </span>
                  </td>
                  <td className="px-6 py-3">₹{lead.project_value?.toLocaleString() || 0}</td>
                  <td className="px-6 py-3">{lead.city?.cCity_name || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center space-x-3 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const Card = ({ icon, title, value }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center transition-all hover:shadow-lg">
    <div className="text-blue-600 mb-1">{icon}</div>
    <h4 className="text-xs text-gray-500">{title}</h4>
    <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

export default TerritoryLeadsAnalytics;