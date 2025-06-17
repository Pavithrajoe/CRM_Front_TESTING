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
          `${ENDPOINTS.PROSPECTS_LOST_LEADS}${company_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          console.error("API failed", res);
        }

        const result = await res.json();
        setProspectsEngaged(result);
        console.log("API response for prospects:", result);
      } catch (err) {
        console.error("API error:", err.message);
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
      changeType: "negative",
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
    const status = lead.previousActionBeforeLost || "Lost";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  prospectsEngaged.leadCovertToDeal?.forEach((lead) => {
    const status = lead.lead_status?.clead_name || "Converted";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const convertedStatuses = ["Won"];
  const convertedData = [];
  const nonConvertedData = [];
  const labels = Object.keys(statusCounts);

  labels.forEach((status) => {
    if (convertedStatuses.includes(status)) {
      convertedData.push(statusCounts[status]);
      nonConvertedData.push(0);
    } else {
      nonConvertedData.push(statusCounts[status]);
      convertedData.push(0);
    }
  });

  const leadHandlingChartData = {
    labels,
    datasets: [
      {
        label: "Converted",
        data: convertedData,
        backgroundColor: "#BBD816",
        borderRadius: 5,
      },
      {
        label: "Non-Converted",
        data: nonConvertedData,
        backgroundColor: "#C200A2",
        borderRadius: 5,
      },
    ],
  };

  const leadHandlingChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "No. Of Prospects",
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
      typeof lead.previousActionBeforeLost === "object"
        ? lead.previousActionBeforeLost || "No Reason"
        : "No Reason",
  }));

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-gray-800 border-l-4 pl-4 border-lime-500">
        Prospects Engaged But Not Converted
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cardData.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-gray-500 text-sm">{card.title}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.change && (
              <div
                className={`text-xs mt-1 ${
                  card.changeType === "positive" ? "text-green-500" : "text-red-500"
                }`}
              >
                {card.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-2">Lead Handling & Productivity Metrics</h3>
        <Bar data={leadHandlingChartData} options={leadHandlingChartOptions} />
      </div>

      {/* Table with Pagination */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-2">Prospects Engaged Metrics</h3>
        <PaginatedTable data={tableData} />
      </div>
    </div>
  );
}

// Pagination Table as a subcomponent
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
      <table className="w-full border-collapse text-left shadow-md">
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
              <th key={header} className="p-4 border-b border-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr key={row.sNo} className="hover:bg-gray-50 transition-all">
              <td className="p-4 border-b">{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
