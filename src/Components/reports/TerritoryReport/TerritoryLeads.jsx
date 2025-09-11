import React, { useEffect, useState } from "react";
import { ENDPOINTS } from "../../../api/constraints";
import {Chart as ChartJS,BarElement,CategoryScale,LinearScale,Tooltip,Legend,ArcElement,} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { TrendingUp, PieChart, Users, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaRupeeSign, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { HiDownload } from "react-icons/hi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import CityLeadsAnalytics from "./CityLeadsAnalytics";
import CountryLeadsAnalytics from "./CountryLeadsAnalytics";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const TerritoryLeadsAnalytics = () => {
  const [data, setData] = useState(null);
  const [territory, setTerritory] = useState("All Territories");
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;
  const navigate = useNavigate();

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
        if (!response.ok) {
          throw new Error(`Failed to fetch territory leads data: ${response.statusText}`);
        }
        const responseData = await response.json();
        // console.log("Fetched territory leads data:", responseData);
        setData(responseData.data);
      } catch (err) {
        console.error("Error fetching territory leads data:", err);
      }
    };
    fetchData();
  }, []);

  if (!data) {
    return <div className="text-center mt-10 text-gray-500">Loading analytics data...</div>;
  }

  const allTerritories = ["All Territories", ...Object.keys(data.leadsPerTerritory)];

  const getMergedData = () => {
    if (territory !== "All Territories") return null;

    const mergeCounts = (objects) => {
      const merged = {};
      for (const obj of Object.values(objects)) {
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'object' && val !== null && 'count' in val) {
            if (!merged[key]) {
              merged[key] = { count: 0, orderId: val.orderId, isActive: val.isActive };
            }
            merged[key].count += val.count;
          } else {
            merged[key] = (merged[key] || 0) + val;
          }
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
      conversionRate: total > 0 ? ((totalConverted / total) * 100).toFixed(2) + "%" : "0.00%",
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

  const getStatusData = () => {
    return territory === "All Territories" ? merged.status : data.statusPerTerritory[territory];
  };

  const statusData = getStatusData();

  const sourceData =
    territory === "All Territories" ? merged.sources : data.sourceBreakdownPerTerritory[territory];
  const conversionData =
    territory === "All Territories" ? merged : data.conversionPerTerritory[territory];
  const revenue = territory === "All Territories" ? merged.totalRevenue : data.revenuePerTerritory[territory];
  const totalLeads = territory === "All Territories" ? merged.totalLeads : data.leadsPerTerritory[territory];

  const getSortedBarChartData = () => {
    if (!statusData) return { labels: [], data: [], colors: [] };

    const statusesArray = Object.keys(statusData).map(statusName => ({
      name: statusName,
      ...statusData[statusName]
    }));
    
    statusesArray.sort((a, b) => {
      const orderIdComparison = a.orderId - b.orderId;
      if (orderIdComparison !== 0) {
        return orderIdComparison;
      }
      return a.name.localeCompare(b.name);
    });

    const labels = statusesArray.map(item => item.name);
    const chartData = statusesArray.map(item => item.count);
    const colors = statusesArray.map(item => {
      if (item.name.toLowerCase() === 'unknown') {
        return '#FF9500'; // Yellow for "Unknown"
      }
      return item.isActive ? '#34C759' : '#FF2D55'; // Green for active, Red for inactive status
    });

    return { labels, data: chartData, colors };
  };

  const sortedBarData = getSortedBarChartData();

  const barChartData = {
    labels: sortedBarData.labels,
    datasets: [
      {
        label: "Leads",
        data: sortedBarData.data,
        backgroundColor: sortedBarData.colors,
        borderRadius: 5,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(sourceData || {}),
    datasets: [
      {
        label: "Sources",
        data: Object.values(sourceData || {}),
        backgroundColor: [
          "#FF9500", "#34C759", "#FF2D55", "#AF52DE", "#5AC8FA", "#C69C6D", "#8E8E93",
        ],
        hoverOffset: 4,
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

  function getStatusColor(statusName) {
    const statusInfo = statusData?.[statusName];
    if (statusName?.toLowerCase() === 'unknown') {
      return "bg-yellow-100 text-yellow-700";
    }
    if (statusInfo) {
      return statusInfo.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-600";
  }

  const getStatusColorDot = (statusName) => {
    const statusInfo = statusData?.[statusName];
    if (statusName?.toLowerCase() === 'unknown') {
      return 'bg-yellow-500';
    }
    if (statusInfo) {
      return statusInfo.isActive ? 'bg-green-500' : 'bg-red-500';
    }
    return 'bg-gray-400';
  };

  const exportToExcel = () => {
    if (filteredLeads.length === 0) {
      alert("No data to export for the current selection.");
      return;
    }
    const headers = ["S.No", "Lead Name", "Email", "Phone", "Status", "Project Value", "City"];
    const dataForExport = filteredLeads.map((lead, index) => ({
      "S.No": index + 1,
      "Lead Name": lead.lead_name || "-",
      "Email": lead.mail || "-",
      "Phone": lead.phone || "-",
      "Status": lead.lead_status || "-",
      "Project Value": lead.project_value || 0,
      "City": lead.city?.cCity_name || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(dataForExport, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Territory Leads");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `territory_leads_${territory.replace(/\s/g, '_').toLowerCase()}.xlsx`);
  };

  return (
    <div className="p-4 mx-auto font-[system-ui] bg-gray-50 min-h-screen">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/reportpage")}
          className="text-gray-600 hover:text-gray-900 mr-4 text-2xl p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Back to reports"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 text-center">Territory-Based Analytics</h1>
      </div>

      <div className="mb-8 flex justify-center">
        <Listbox
          value={territory}
          onChange={(value) => {
            setTerritory(value);
            setCurrentPage(1);
          }}
        >
          <div className="relative w-64">
            <Listbox.Button className="w-full bg-white border border-gray-300 rounded-full py-2 pl-4 pr-10 text-left shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <span>{territory}</span>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto text-sm focus:outline-none">
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
        <Card icon={<FaRupeeSign size={18} />} title="Revenue" value={`₹${revenue?.toLocaleString() || 0}`} />
        <Card icon={<TrendingUp size={18} />} title="Won" value={conversionData?.converted || 0} />
        <Card icon={<PieChart size={18} />} title="Won Rate" value={conversionData?.conversionRate || "0.00%"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-md p-4 h-[280px] flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Leads by Status</h3>
            <div className="flex gap-2 text-xs text-gray-600">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1"></span> Active
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1"></span> Unknown
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1"></span> Inactive
              </span>
            </div>
          </div>
          <div className="flex-grow w-full h-[200px]">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 h-[280px] flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Lead Source Breakdown</h3>
          <div className="flex-grow w-full h-[200px] flex justify-center items-center">
            <Pie data={pieChartData} options={{ ...chartOptions, scales: {} }} />
          </div>
        </div>
        
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CityLeadsAnalytics />
        <CountryLeadsAnalytics />  
      </div>

      <div className="mt-10 bg-white rounded-3xl border border-gray-200 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h3 className="text-xl font-bold text-gray-900">Lead List: {territory}</h3>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-colors text-sm font-semibold"
          >
            <HiDownload size={16} className="mr-2" /> Export to Excel
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm max-h-[500px]">
          <table className="min-w-full text-sm text-left text-gray-800 font-medium">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300 text-gray-600">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">S.No</th>
                <th className="px-6 py-4 whitespace-nowrap">Lead Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap">Phone</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Project Value</th>
                <th className="px-6 py-4 whitespace-nowrap">City</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentLeads.length > 0 ? (
                currentLeads.map((lead, index) => (
                  <tr key={lead._id || index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3">{indexOfFirstLead + index + 1}</td>
                    <td className="px-6 py-3">{lead.lead_name || "-"}</td>
                    <td className="px-6 py-3">{lead.mail || "-"}</td>
                    <td className="px-6 py-3">{lead.phone || "-"}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold select-none ${getStatusColor(lead.lead_status)}`}>
                        {lead.lead_status || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-3">₹{lead.project_value?.toLocaleString() || 0}</td>
                    <td className="px-6 py-3">{lead.city?.cCity_name || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    No leads found for the selected territory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            {(() => {
              const pageNumbers = [];
              const maxPagesToShow = 5;
              let startPage, endPage;
              if (totalPages <= maxPagesToShow) {
                startPage = 1;
                endPage = totalPages;
              } else {
                const middle = Math.floor(maxPagesToShow / 2);
                startPage = currentPage - middle;
                endPage = currentPage + middle;
                if (startPage < 1) {
                  startPage = 1;
                  endPage = maxPagesToShow;
                }
                if (endPage > totalPages) {
                  endPage = totalPages;
                  startPage = totalPages - maxPagesToShow + 1;
                  if (startPage < 1) {
                    startPage = 1;
                  }
                }
              }
              if (startPage > 1) {
                pageNumbers.push(1);
                if (startPage > 2) {
                  pageNumbers.push("...");
                }
              }
              for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
              }
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pageNumbers.push("...");
                }
                pageNumbers.push(totalPages);
              }
              return pageNumbers.map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-700">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              );
            })()}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Card = ({ icon, title, value }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center transition-all hover:shadow-lg transform hover:-translate-y-1">
    <div className="text-blue-600 mb-1">{icon}</div>
    <h4 className="text-xs text-gray-500">{title}</h4>
    <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

export default TerritoryLeadsAnalytics;