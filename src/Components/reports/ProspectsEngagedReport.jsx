import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { ENDPOINTS } from "../../api/constraints";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ProspectsEngagedReport() {
  const [prospectsEngaged, setProspectsEngaged] = useState({
    leadEngagementDetails: [],
    leadCovertToDeal: [],
  });
  const [activeChartFilter, setActiveChartFilter] = useState("all"); // 'all', 'converted', 'nonConverted'

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

        const res = await fetch(
          `${ENDPOINTS.PROSPECTS_LOST_LEADS}/${company_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await res.json();
        setProspectsEngaged(result);
      } catch (err) {
        console.error("API error:", err.message);
        // Optionally, set an error state to display to the user
      }
    };

    fetchData();
  }, []);

  const convertedCount = prospectsEngaged.leadCovertToDeal?.length ?? 0;
  const lostCount = prospectsEngaged?.totalLostLead ?? 0;
  const totalCount = convertedCount + lostCount;
  const lostPercentage = totalCount > 0 ? (lostCount / totalCount) * 100 : 0;

  const cardData = [
    {
      title: "Engaged Not Converted",
      value: lostCount,
      changeType: "positive",
    },
    {
      title: "Avg Engagement Score",
      value: prospectsEngaged?.avgEngagementScore ?? "--",
      changeType: "neutral",
    },
    {
      title: "Avg No. of Interactions",
      value: prospectsEngaged?.avgInteractions ?? "--",
      changeType: "positive",
    },
    {
      title: "Lost Percentage",
      value: lostPercentage.toFixed(2) + "%",
      change: "Deal Converted: " + convertedCount,
      changeType: "positive",
    },
  ];

  const statusCounts = {};
  prospectsEngaged.leadEngagementDetails?.forEach((lead) => {
    const status = lead.previousActionBeforeLost || "Lost"; // Default to "Lost" if not specified
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  prospectsEngaged.leadCovertToDeal?.forEach((lead) => {
    const status = lead.lead_status?.clead_name || "Converted"; // Default to "Converted"
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const convertedStatuses = ["Won", "Converted"];
  const labels = Object.keys(statusCounts);

  // Prepare data for Chart based on activeChartFilter
  const getChartData = () => {
    const convertedData = [];
    const nonConvertedData = [];

    labels.forEach((status) => {
      if (convertedStatuses.includes(status)) {
        convertedData.push(statusCounts[status]);
        nonConvertedData.push(0); // Ensure non-converted dataset has correct length
      } else {
        nonConvertedData.push(statusCounts[status]);
        convertedData.push(0); // Ensure converted dataset has correct length
      }
    });

    let datasets = [];

    if (activeChartFilter === "all") {
      datasets.push({
        label: "Converted",
        data: convertedData,
        backgroundColor: "#4CAF50", // Green
        borderRadius: 8,
        barThickness: 30,
      });
      datasets.push({
        label: "Non-Converted",
        data: nonConvertedData,
        backgroundColor: "#F44336", // Red
        borderRadius: 8,
        barThickness: 30,
      });
    } else if (activeChartFilter === "converted") {
      datasets.push({
        label: "Converted",
        data: convertedData,
        backgroundColor: "#4CAF50", // Green
        borderRadius: 8,
        barThickness: 30,
      });
    } else if (activeChartFilter === "nonConverted") {
      datasets.push({
        label: "Non-Converted",
        data: nonConvertedData,
        backgroundColor: "#F44336", // Red
        borderRadius: 8,
        barThickness: 30,
      });
    }

    return {
      labels,
      datasets,
    };
  };

  const leadHandlingChartData = getChartData();

  const leadHandlingChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows the chart to fill the parent container more effectively
    plugins: {
      legend: {
        display: false, // Hide default legend as we're using external buttons
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#fff",
        bodyColor: "#E5E7EB",
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#4B5563",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#E5E7EB",
        },
        ticks: {
          color: "#4B5563",
          precision: 0, // Ensure integer ticks for count
        },
        title: {
          display: true,
          text: "No. Of Prospects",
          color: "#374151",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
    },
  };

  const tableData = prospectsEngaged.leadEngagementDetails.map((lead, index) => ({
    sNo: index + 1,
    prospectName: lead.clead_name,
    engagementScore: lead.engagementScore,
    interactionCount: lead.interactionCount,
    status: lead.previousActionBeforeLost || "Lost",
    disqualificationReason:
      typeof lead.previousActionBeforeLost === "object" && // Check if it's an object before accessing properties
      lead.previousActionBeforeLost?.reason
        ? lead.previousActionBeforeLost.reason
        : "No Reason",
  }));

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col gap-6">
      <h2 className="text-3xl font-semibold text-gray-800">
        Prospects Engaged But Not Converted
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition"
          >
            <div className="text-gray-500 text-sm">{card.title}</div>
            <div className="text-2xl font-bold text-gray-800 mt-2">
              {card.value}
            </div>
            {card.change && (
              <div
                className={`text-xs mt-1 ${
                  card.changeType === "positive"
                    ? "text-green-600"
                    : card.changeType === "neutral"
                    ? "text-gray-500"
                    : "text-red-500"
                }`}
              >
                {card.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Lead Handling & Productivity Metrics
        </h3>
        {/* Chart Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setActiveChartFilter("all")}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
              activeChartFilter === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Leads
          </button>
          <button
            onClick={() => setActiveChartFilter("converted")}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
              activeChartFilter === "converted"
                ? "bg-green-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Converted
          </button>
          <button
            onClick={() => setActiveChartFilter("nonConverted")}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
              activeChartFilter === "nonConverted"
                ? "bg-red-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Non-Converted
          </button>
        </div>
        <div className="relative h-96"> {/* Added a fixed height to the chart container for better responsiveness */}
          <Bar data={leadHandlingChartData} options={leadHandlingChartOptions} />
        </div>
      </div>

      {/* Table with Pagination */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Prospects Engaged Metrics
        </h3>
        <PaginatedTable data={tableData} />
      </div>
    </div>
  );
}

// ✅ Pagination Table
function PaginatedTable({ data }) {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left min-w-[768px]"> {/* Added min-w for better table responsiveness */}
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            {[
              "S.No",
              "Prospect Name",
              "Engagement Score",
              "Num of Interactions",
              "Status",
              "Disqualification Reason",
            ].map((header) => (
              <th key={header} className="p-4 border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr key={row.sNo} className="hover:bg-gray-50">
              <td className="p-4 border-b">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>
              <td className="p-4 border-b">{row.prospectName}</td>
              <td className="p-4 border-b">{row.engagementScore}</td>
              <td className="p-4 border-b">{row.interactionCount}</td>
              <td className="p-4 border-b">{row.status}</td>
              <td className="p-4 border-b">{row.disqualificationReason}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className="flex justify-end items-center gap-2 mt-4">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => changePage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-lime-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}