import React, { useEffect, useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
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
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Pagination from "../../context/Pagination/pagination";
import usePagination from "../../hooks/usePagination";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function LostLeadReports() {
  // ALL STATES FIRST
  const [allTimeReportData, setAllTimeReportData] = useState({});
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [loadingCardsAndChart, setLoadingCardsAndChart] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [dateFilterFrom, setDateFilterFrom] = useState("");
  const [dateFilterTo, setDateFilterTo] = useState("");
  const [isDefaultMonth, setIsDefaultMonth] = useState(true);
  const [itemsPerPage] = useState(10);
  const [filterOwner, setFilterOwner] = useState("");
  const [filterReason, setFilterReason] = useState("");
  const [filterRemarks, setFilterRemarks] = useState("");

  const navigate = useNavigate();

  //  DROPDOWN OPTIONS
  const ownerOptions = useMemo(() => {
    return Array.from(
      new Set((filteredTableData || []).map((item) => item.lead_owner).filter(Boolean))
    );
  }, [filteredTableData]);

  const reasonOptions = useMemo(() => {
    return Array.from(
      new Set((filteredTableData || []).map((item) => item.reason).filter(Boolean))
    );
  }, [filteredTableData]);

  
  //  FILTERED DATA
  const filteredByOwnerReasonRemarks = useMemo(() => {
    const ownerQ = (filterOwner || "").trim().toLowerCase();
    const reasonQ = (filterReason || "").trim().toLowerCase();
    const remarksQ = (filterRemarks || "").trim().toLowerCase();

    return (filteredTableData || []).filter((lead) => {
      const ownerVal = (lead.lead_owner || "").toLowerCase();
      const reasonVal = (lead.reason || "").toLowerCase();
      const remarksVal = (lead.remarks || "").toLowerCase();

      const ownerMatch = !ownerQ || ownerVal === ownerQ;
      const reasonMatch = !reasonQ || reasonVal === reasonQ;
      const remarksMatch = !remarksQ || remarksVal.includes(remarksQ);

      return ownerMatch && reasonMatch && remarksMatch;
    });
  }, [filteredTableData, filterOwner, filterReason, filterRemarks]);

  const {
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedData: currentItems,
} = usePagination(filteredByOwnerReasonRemarks, itemsPerPage);


  //  CHART DATA
  const filteredDataForCharts = useMemo(() => {
    return filteredByOwnerReasonRemarks.length > 0
      ? filteredByOwnerReasonRemarks
      : filteredTableData;
  }, [filteredByOwnerReasonRemarks, filteredTableData]);

  const filteredPieData = useMemo(() => {
    const lostByReason = {};
    for (const lead of filteredDataForCharts) {
      const reason = lead.reason?.trim() || "Not Specified";
      lostByReason[reason] = (lostByReason[reason] || 0) + 1;
    }

    const colors = Object.keys(lostByReason).map(
      (_, i) => `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
    );

    return {
      labels: Object.keys(lostByReason),
      datasets: [{ data: Object.values(lostByReason), backgroundColor: colors }],
    };
  }, [filteredDataForCharts]);

  const filteredBarData = useMemo(() => {
    const wonDetailsForChart = allTimeReportData.won_details || [];
    const lostDetailsForChart = filteredDataForCharts;

    const getMonthName = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleString("default", { month: "short" });
    };

    const wonByMonth = {};
    const lostByMonth = {};

    for (const won of wonDetailsForChart) {
      if (won.created_at) {
        const month = getMonthName(won.created_at);
        wonByMonth[month] = (wonByMonth[month] || 0) + won.value;
      }
    }

    for (const lost of lostDetailsForChart) {
      if (lost.created_at) {
        const month = getMonthName(lost.created_at);
        lostByMonth[month] = (lostByMonth[month] || 0) + lost.value;
      }
    }

    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const allMonths = Array.from(
      new Set([...Object.keys(wonByMonth), ...Object.keys(lostByMonth)])
    ).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

    return {
      labels: allMonths,
      datasets: [
        {
          label: "Lost Leads Amount",
          data: allMonths.map((month) => lostByMonth[month] || 0),
          backgroundColor: "#ff3b30",
        },
        {
          label: "Won Leads Amount",
          data: allMonths.map((month) => wonByMonth[month] || 0),
          backgroundColor: "#34c759",
        },
      ],
    };
  }, [filteredDataForCharts, allTimeReportData]);

  // FETCH DATA
  const fetchFilteredTableData = async () => {
    setLoadingTable(true);
    setLoadingCardsAndChart(true);

    const token = localStorage.getItem("token");
    const queryParams = new URLSearchParams();

    if (dateFilterFrom)
      queryParams.append("fromDate", new Date(dateFilterFrom).toISOString());
    if (dateFilterTo) {
      const endOfDay = new Date(dateFilterTo);
      endOfDay.setHours(23, 59, 59, 999);
      queryParams.append("toDate", endOfDay.toISOString());
    }

    let apiUrl = `${ENDPOINTS.REPORT_LOST}`;
    if (queryParams.toString()) apiUrl += `?${queryParams.toString()}`;

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Can't fetch filtered table data", response);
        return;
      }

      const data = await response.json();
      const allLeadsData = data.data;

      setAllTimeReportData(allLeadsData);
      setFilteredTableData(allLeadsData.lead_details || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching all-time report data:", error);
    } finally {
      setLoadingTable(false);
      setLoadingCardsAndChart(false);
    }
  };

  useEffect(() => {
    fetchFilteredTableData();
  }, [dateFilterFrom, dateFilterTo]);
  
  useEffect(() => {
  setCurrentPage(1);
}, [filterOwner, filterReason, filterRemarks, dateFilterFrom, dateFilterTo]);


  // CARDS DATA
  const highestValueAmongLostLeads =
    allTimeReportData.lead_details && allTimeReportData.lead_details.length > 0
      ? Math.max(...allTimeReportData.lead_details.map((lead) => lead.value))
      : 0;

  const cardData = [
    { title: "Total Leads ", value: `${allTimeReportData.totalCount || 0}` },
    { title: "Lost Percentage ", value: `${allTimeReportData.lostPercentage || 0} %` },
    {
      title: "Total Lost",
      value: `${(allTimeReportData.lostFromLeads || 0) + (allTimeReportData.lostFromDeals || 0)}`,
    },
    { title: "Highest Lost Lead Value", value: `₹${highestValueAmongLostLeads}` },
  ];

  // EXPORT FUNCTION
  const handleExport = () => {
    if (filteredByOwnerReasonRemarks.length === 0) {
      alert("No data to export for the current filter.");
      return;
    }

    const dataToExport = filteredByOwnerReasonRemarks.map((lead) => ({
      "Lead Name": lead.lead_name,
      "Lead Owner": lead.lead_owner,
      "Created Date": new Date(lead.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      "Value (₹)": lead.value,
      Reason: lead.reason,
      Remarks: lead.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LostLeadsReport");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "LostLeadsReport.xlsx"
    );
  };

  // BAR OPTIONS
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { stacked: false },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return `₹${value}`;
          },
        },
      },
    },
  };

  
  // MOBILE RESPONSIVE
  const isMobile = window.innerWidth < 768;


  const getIntimationMessage = () => {
    const fromDateObj = dateFilterFrom ? new Date(dateFilterFrom) : null;
    const toDateObj = dateFilterTo ? new Date(dateFilterTo) : null;

    if (isDefaultMonth && fromDateObj && toDateObj) {
      return `💡 Showing leads for the **current month**: **${fromDateObj.toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )}** to **${toDateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}**.`;
    } else if (fromDateObj && toDateObj) {
      return `🗓️ Filtering leads from **${fromDateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}** to **${toDateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}**.`;
    } else {
      return `📊 Showing **all available leads** (no date filter applied).`;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "linear-gradient(to bottom right, #f4f5f7, #e9ecf3)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={() => navigate("/reportpage")}
          style={{
            color: "#6B7280",
            padding: "8px",
            borderRadius: "9999px",
            marginRight: "16px",
            fontSize: "24px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <FaArrowLeft />
        </button>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1c1c1e" }}>
          Lost Lead Reports Overview
        </h2>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {loadingCardsAndChart ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Loading Cards...
          </div>
        ) : (
          cardData.map((card, idx) => (
            <div
              key={idx}
              style={{
                background: "white",
                borderRadius: 16,
                padding: "24px 20px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 120,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                {card.title}
              </div>
              <div
                style={{ fontSize: 32, fontWeight: 700, color: "#1c1c1e" }}
              >
                {card.value}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts - MOBILE RESPONSIVE */}
      <div
        style={{
          display: isMobile ? "block" : "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 24,
        }}
      >
        {/* Pie Chart */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            padding: 20,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            height: isMobile ? "auto" : 420,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
              color: "#1c1c1e",
            }}
          >
            Lost Leads by Reason
          </h3>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexDirection: isMobile ? "column" : "row",
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Chart */}
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {filteredPieData.labels?.length > 0 ? (
                <div
                  style={{
                    width: isMobile ? 200 : 180,
                    height: isMobile ? 200 : 180,
                  }}
                >
                  <Pie
                    data={filteredPieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 180,
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #e5e7eb",
                    borderRadius: "50%",
                    color: "#999",
                    fontSize: 14,
                  }}
                >
                  No data
                </div>
              )}
            </div>

            {/* Legend */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingTop: 8,
              }}
            >
              {filteredPieData.labels?.map((label, index) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor:
                        filteredPieData.datasets[0].backgroundColor[index],
                    }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      flex: 1,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {filteredPieData.datasets[0].data[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            padding: 24,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            height: isMobile ? "auto" : 420,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 16,
              color: "#1c1c1e",
            }}
          >
            Lead Trends
          </h3>
          {loadingCardsAndChart ? (
            <p style={{ textAlign: "center", color: "#999", margin: "auto" }}>
              Loading Chart...
            </p>
          ) : filteredBarData ? (
            <div style={{ flex: 1, display: "flex" }}>
              <Bar data={filteredBarData} options={barOptions} />
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#999", margin: "auto" }}>
              No chart data available.
            </p>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div
        style={{
          background: "white",
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          padding: 24,
          border: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <h3
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#1c1c1e",
              margin: 0,
            }}
          >
            Lost Leads Table
          </h3>

          <button
            onClick={handleExport}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              transition: "background-color 0.2s ease",
              boxShadow: "0 2px 6px rgba(40, 167, 69, 0.3)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#218838")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}
          >
            <HiDownload size={16} style={{ marginRight: 8 }} /> Export to Excel
          </button>
        </div>

        {/* Filters Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: "15px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {/* Owner Dropdown */}
            <select
              value={filterOwner}
              onChange={(e) => {
                setFilterOwner(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 14,
                minWidth: 200,
                backgroundColor: "white",
              }}
            >
              <option value="">All Lead Owners</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            {/* Reason Dropdown */}
            <select
              value={filterReason}
              onChange={(e) => {
                setFilterReason(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 14,
                minWidth: 200,
                backgroundColor: "white",
              }}
            >
              <option value="">All Reasons</option>
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            {/* Remarks Dropdown */}
           
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <label
              style={{ fontSize: 14, color: "#333", fontWeight: 600 }}
            >
              From:
            </label>
            <input
              type="date"
              value={dateFilterFrom}
              onChange={(e) => {
                setDateFilterFrom(e.target.value);
                setIsDefaultMonth(false);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                fontSize: 14,
                backgroundColor: "white",
              }}
            />

            <label
              style={{ fontSize: 14, color: "#333", fontWeight: 600 }}
            >
              To:
            </label>
            <input
              type="date"
              value={dateFilterTo}
              onChange={(e) => {
                setDateFilterTo(e.target.value);
                setIsDefaultMonth(false);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
                fontSize: 14,
                backgroundColor: "white",
              }}
            />

            <button
              onClick={() => {
                setDateFilterFrom("");
                setDateFilterTo("");
                setIsDefaultMonth(false);
                setFilterOwner("");
                setFilterReason("");
                setFilterRemarks("");
                setCurrentPage(1);
              }}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px solid #ddd",
                backgroundColor: "white",
                color: "#333",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              Reset
            </button>
          </div>

          <div
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "10px 18px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              background:
                isDefaultMonth && dateFilterFrom
                  ? "linear-gradient(to right, #e6ffe6, #d0ffe0)"
                  : dateFilterFrom && dateFilterTo
                  ? "linear-gradient(to right, #e0f7fa, #c2eff5)"
                  : "linear-gradient(to right, #f8f8f8, #f0f0f0)",
              color:
                isDefaultMonth && dateFilterFrom
                  ? "#1b5e20"
                  : dateFilterFrom && dateFilterTo
                  ? "#006064"
                  : "#424242",
              border:
                isDefaultMonth && dateFilterFrom
                  ? "1px solid #a5d6a7"
                  : dateFilterFrom && dateFilterTo
                  ? "1px solid #80deea"
                  : "1px solid #e0e0e0",
            }}
          >
            {getIntimationMessage()}
          </div>
        </div>

        {/* Table */}
        {loadingTable ? (
          <p
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#999",
            }}
          >
            Loading table data...
          </p>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "60vh",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th
                      style={{
                        padding: "16px 12px",
                        fontWeight: 600,
                        fontSize: 13,
                        textAlign: "center",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#f9fafb",
                        zIndex: 10,
                      }}
                    >
                      S.No.
                    </th>
                    {["Lead Name", "Lead Owner", "Created Date", "Value", "Reason", "Remarks"].map(
                      (header) => (
                        <th
                          key={header}
                          style={{
                            padding: "16px 12px",
                            fontWeight: 600,
                            fontSize: 13,
                            textAlign: "center",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                            position: "sticky",
                            top: 0,
                            backgroundColor: "#f9fafb",
                            zIndex: 10,
                          }}
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((lead, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "white")
                        }
                      >
                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#6b7280",
                            fontWeight: 500,
                          }}
                        >
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#1f2937",
                            fontWeight: 500,
                          }}
                        >
                          {lead.lead_name}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#4b5563",
                          }}
                        >
                          {lead.lead_owner}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#6b7280",
                            fontSize: 13,
                          }}
                        >
                          {new Date(lead.created_at)
                            .toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(",", "")
                            .toUpperCase()}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            fontWeight: 600,
                            color: "#2563eb",
                          }}
                        >
                          ₹{lead.value}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#dc2626",
                            fontWeight: 500,
                          }}
                        >
                          {lead.reason}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#4b5563",
                          }}
                        >
                          {lead.remarks || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: "40px",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: 15,
                        }}
                      >
                        No lost leads found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            
             <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />

          </>
        )}
      </div>
    </div>
  );
}

// import React, { useEffect, useMemo, useState } from "react";
// import { Bar, Pie } from "react-chartjs-2";
// import { ENDPOINTS } from "../../api/constraints";
// import {
//   Chart as ChartJS,
//   BarElement,
//   CategoryScale,
//   LinearScale,
//   Tooltip,
//   Legend,
//   ArcElement,
// } from "chart.js";
// import { useNavigate } from "react-router-dom";
// import { FaArrowLeft } from "react-icons/fa";
// import { HiDownload } from "react-icons/hi";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import Pagination from "../../context/Pagination/pagination";

// ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// export default function LostLeadReports() {
//   // ALL STATES FIRST
//   const [allTimeReportData, setAllTimeReportData] = useState({});
//   const [filteredTableData, setFilteredTableData] = useState([]);
//   const [loadingCardsAndChart, setLoadingCardsAndChart] = useState(true);
//   const [loadingTable, setLoadingTable] = useState(true);
//   const [dateFilterFrom, setDateFilterFrom] = useState("");
//   const [dateFilterTo, setDateFilterTo] = useState("");
//   const [isDefaultMonth, setIsDefaultMonth] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);
//   const [filterOwner, setFilterOwner] = useState("");
//   const [filterReason, setFilterReason] = useState("");
//   const [filterRemarks, setFilterRemarks] = useState("");

//   const navigate = useNavigate();

//   // 1. DROPDOWN OPTIONS
//   const ownerOptions = useMemo(() => {
//     return Array.from(
//       new Set((filteredTableData || []).map((item) => item.lead_owner).filter(Boolean))
//     );
//   }, [filteredTableData]);

//   const reasonOptions = useMemo(() => {
//     return Array.from(
//       new Set((filteredTableData || []).map((item) => item.reason).filter(Boolean))
//     );
//   }, [filteredTableData]);

//   const remarksOptions = useMemo(() => {
//     return Array.from(
//       new Set((filteredTableData || []).map((item) => item.remarks).filter(Boolean))
//     );
//   }, [filteredTableData]);

//   // 2. FILTERED DATA
//   const filteredByOwnerReasonRemarks = useMemo(() => {
//     const ownerQ = (filterOwner || "").trim().toLowerCase();
//     const reasonQ = (filterReason || "").trim().toLowerCase();
//     const remarksQ = (filterRemarks || "").trim().toLowerCase();

//     return (filteredTableData || []).filter((lead) => {
//       const ownerVal = (lead.lead_owner || "").toLowerCase();
//       const reasonVal = (lead.reason || "").toLowerCase();
//       const remarksVal = (lead.remarks || "").toLowerCase();

//       const ownerMatch = !ownerQ || ownerVal === ownerQ;
//       const reasonMatch = !reasonQ || reasonVal === reasonQ;
//       const remarksMatch = !remarksQ || remarksVal.includes(remarksQ);

//       return ownerMatch && reasonMatch && remarksMatch;
//     });
//   }, [filteredTableData, filterOwner, filterReason, filterRemarks]);

//   // 3. CHART DATA
//   const filteredDataForCharts = useMemo(() => {
//     return filteredByOwnerReasonRemarks.length > 0
//       ? filteredByOwnerReasonRemarks
//       : filteredTableData;
//   }, [filteredByOwnerReasonRemarks, filteredTableData]);

//   const filteredPieData = useMemo(() => {
//     const lostByReason = {};
//     for (const lead of filteredDataForCharts) {
//       const reason = lead.reason?.trim() || "Not Specified";
//       lostByReason[reason] = (lostByReason[reason] || 0) + 1;
//     }

//     const colors = Object.keys(lostByReason).map(
//       (_, i) => `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
//     );

//     return {
//       labels: Object.keys(lostByReason),
//       datasets: [{ data: Object.values(lostByReason), backgroundColor: colors }],
//     };
//   }, [filteredDataForCharts]);

//   const filteredBarData = useMemo(() => {
//     const wonDetailsForChart = allTimeReportData.won_details || [];
//     const lostDetailsForChart = filteredDataForCharts;

//     const getMonthName = (dateStr) => {
//       const date = new Date(dateStr);
//       return date.toLocaleString("default", { month: "short" });
//     };

//     const wonByMonth = {};
//     const lostByMonth = {};

//     for (const won of wonDetailsForChart) {
//       if (won.created_at) {
//         const month = getMonthName(won.created_at);
//         wonByMonth[month] = (wonByMonth[month] || 0) + won.value;
//       }
//     }

//     for (const lost of lostDetailsForChart) {
//       if (lost.created_at) {
//         const month = getMonthName(lost.created_at);
//         lostByMonth[month] = (lostByMonth[month] || 0) + lost.value;
//       }
//     }

//     const monthOrder = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];
//     const allMonths = Array.from(
//       new Set([...Object.keys(wonByMonth), ...Object.keys(lostByMonth)])
//     ).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

//     return {
//       labels: allMonths,
//       datasets: [
//         {
//           label: "Lost Leads Amount",
//           data: allMonths.map((month) => lostByMonth[month] || 0),
//           backgroundColor: "#ff3b30",
//         },
//         {
//           label: "Won Leads Amount",
//           data: allMonths.map((month) => wonByMonth[month] || 0),
//           backgroundColor: "#34c759",
//         },
//       ],
//     };
//   }, [filteredDataForCharts, allTimeReportData]);

//   // FETCH DATA
//   const fetchFilteredTableData = async () => {
//     setLoadingTable(true);
//     setLoadingCardsAndChart(true);

//     const token = localStorage.getItem("token");
//     const queryParams = new URLSearchParams();

//     if (dateFilterFrom)
//       queryParams.append("fromDate", new Date(dateFilterFrom).toISOString());
//     if (dateFilterTo) {
//       const endOfDay = new Date(dateFilterTo);
//       endOfDay.setHours(23, 59, 59, 999);
//       queryParams.append("toDate", endOfDay.toISOString());
//     }

//     let apiUrl = `${ENDPOINTS.REPORT_LOST}`;
//     if (queryParams.toString()) apiUrl += `?${queryParams.toString()}`;

//     try {
//       const response = await fetch(apiUrl, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         console.error("Can't fetch filtered table data", response);
//         return;
//       }

//       const data = await response.json();
//       const allLeadsData = data.data;

//       setAllTimeReportData(allLeadsData);
//       setFilteredTableData(allLeadsData.lead_details || []);
//       setCurrentPage(1);
//     } catch (error) {
//       console.error("Error fetching all-time report data:", error);
//     } finally {
//       setLoadingTable(false);
//       setLoadingCardsAndChart(false);
//     }
//   };

//   useEffect(() => {
//     fetchFilteredTableData();
//   }, [dateFilterFrom, dateFilterTo]);

//   // CARDS DATA
//   const highestValueAmongLostLeads =
//     allTimeReportData.lead_details && allTimeReportData.lead_details.length > 0
//       ? Math.max(...allTimeReportData.lead_details.map((lead) => lead.value))
//       : 0;

//   const cardData = [
//     { title: "Total Leads ", value: `${allTimeReportData.totalCount || 0}` },
//     { title: "Lost Percentage ", value: `${allTimeReportData.lostPercentage || 0} %` },
//     {
//       title: "Total Lost",
//       value: `${(allTimeReportData.lostFromLeads || 0) + (allTimeReportData.lostFromDeals || 0)}`,
//     },
//     { title: "Highest Lost Lead Value", value: `₹${highestValueAmongLostLeads}` },
//   ];

//   // EXPORT FUNCTION
//   const handleExport = () => {
//     if (filteredByOwnerReasonRemarks.length === 0) {
//       alert("No data to export for the current filter.");
//       return;
//     }

//     const dataToExport = filteredByOwnerReasonRemarks.map((lead) => ({
//       "Lead Name": lead.lead_name,
//       "Lead Owner": lead.lead_owner,
//       "Created Date": new Date(lead.created_at).toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: false,
//       }),
//       "Value (₹)": lead.value,
//       Reason: lead.reason,
//       Remarks: lead.remarks || "",
//     }));

//     const ws = XLSX.utils.json_to_sheet(dataToExport);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "LostLeadsReport");

//     const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     saveAs(
//       new Blob([wbout], { type: "application/octet-stream" }),
//       "LostLeadsReport.xlsx"
//     );
//   };

//   // BAR OPTIONS
//   const barOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { position: "top" },
//       tooltip: { mode: "index", intersect: false },
//     },
//     scales: {
//       x: { stacked: false },
//       y: {
//         beginAtZero: true,
//         ticks: {
//           callback: function (value) {
//             return `₹${value}`;
//           },
//         },
//       },
//     },
//   };

//   // PAGINATION
//   const indexOfFirstItem = currentPage * itemsPerPage - itemsPerPage;
//   const currentItems = filteredByOwnerReasonRemarks.slice(
//     indexOfFirstItem,
//     currentPage * itemsPerPage
//   );
//   const totalPages = Math.ceil(filteredByOwnerReasonRemarks.length / itemsPerPage);
//   const paginate = (pageNumber) => setCurrentPage(pageNumber);

//   // MOBILE RESPONSIVE
//   const isMobile = window.innerWidth < 768;

//   // HELPER FUNCTIONS
//   const formatDateForInput = (date) => {
//     if (!date) return "";
//     const d = new Date(date);
//     const year = d.getFullYear();
//     const month = String(d.getMonth() + 1).padStart(2, "0");
//     const day = String(d.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   };

//   const getIntimationMessage = () => {
//     const fromDateObj = dateFilterFrom ? new Date(dateFilterFrom) : null;
//     const toDateObj = dateFilterTo ? new Date(dateFilterTo) : null;

//     if (isDefaultMonth && fromDateObj && toDateObj) {
//       return `💡 Showing leads for the **current month**: **${fromDateObj.toLocaleDateString(
//         "en-GB",
//         {
//           day: "2-digit",
//           month: "long",
//           year: "numeric",
//         }
//       )}** to **${toDateObj.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "long",
//         year: "numeric",
//       })}**.`;
//     } else if (fromDateObj && toDateObj) {
//       return `🗓️ Filtering leads from **${fromDateObj.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "long",
//         year: "numeric",
//       })}** to **${toDateObj.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "long",
//         year: "numeric",
//       })}**.`;
//     } else {
//       return `📊 Showing **all available leads** (no date filter applied).`;
//     }
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         padding: 24,
//         background: "linear-gradient(to bottom right, #f4f5f7, #e9ecf3)",
//         display: "flex",
//         flexDirection: "column",
//         gap: 24,
//       }}
//     >
//       {/* Header */}
//       <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
//         <button
//           onClick={() => navigate("/reportpage")}
//           style={{
//             color: "#6B7280",
//             padding: "8px",
//             borderRadius: "9999px",
//             marginRight: "16px",
//             fontSize: "24px",
//             cursor: "pointer",
//             background: "transparent",
//             border: "none",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             transition: "background-color 0.2s ease",
//           }}
//           onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
//           onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
//         >
//           <FaArrowLeft />
//         </button>
//         <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1c1c1e" }}>
//           Lost Lead Reports Overview
//         </h2>
//       </div>

//       {/* Stats Cards */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: isMobile
//             ? "1fr"
//             : "repeat(auto-fit, minmax(200px, 1fr))",
//           gap: 16,
//         }}
//       >
//         {loadingCardsAndChart ? (
//           <div
//             style={{
//               gridColumn: "1 / -1",
//               textAlign: "center",
//               padding: "20px",
//             }}
//           >
//             Loading Cards...
//           </div>
//         ) : (
//           cardData.map((card, idx) => (
//             <div
//               key={idx}
//               style={{
//                 background: "white",
//                 borderRadius: 16,
//                 padding: "24px 20px",
//                 boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
//                 display: "flex",
//                 flexDirection: "column",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 minHeight: 120,
//                 transition: "transform 0.2s ease, box-shadow 0.2s ease",
//                 border: "1px solid rgba(0, 0, 0, 0.05)",
//               }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.transform = "translateY(-4px)";
//                 e.currentTarget.style.boxShadow =
//                   "0 8px 20px rgba(0, 0, 0, 0.12)";
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = "translateY(0)";
//                 e.currentTarget.style.boxShadow =
//                   "0 4px 12px rgba(0, 0, 0, 0.08)";
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: 13,
//                   fontWeight: 600,
//                   color: "#666",
//                   textTransform: "uppercase",
//                   letterSpacing: 1,
//                   marginBottom: 8,
//                 }}
//               >
//                 {card.title}
//               </div>
//               <div
//                 style={{ fontSize: 32, fontWeight: 700, color: "#1c1c1e" }}
//               >
//                 {card.value}
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* Charts - MOBILE RESPONSIVE */}
//       <div
//         style={{
//           display: isMobile ? "block" : "grid",
//           gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
//           gap: 24,
//         }}
//       >
//         {/* Pie Chart */}
//         <div
//           style={{
//             background: "white",
//             borderRadius: 16,
//             boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
//             padding: 20,
//             border: "1px solid rgba(0, 0, 0, 0.05)",
//             display: "flex",
//             flexDirection: "column",
//             gap: 16,
//             height: isMobile ? "auto" : 420,
//           }}
//         >
//           <h3
//             style={{
//               fontSize: 16,
//               fontWeight: 600,
//               margin: 0,
//               color: "#1c1c1e",
//             }}
//           >
//             Lost Leads by Reason
//           </h3>

//           <div
//             style={{
//               display: "flex",
//               gap: 16,
//               flexDirection: isMobile ? "column" : "row",
//               flex: 1,
//               minHeight: 0,
//             }}
//           >
//             {/* Chart */}
//             <div
//               style={{
//                 flex: 1,
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//               }}
//             >
//               {filteredPieData.labels?.length > 0 ? (
//                 <div
//                   style={{
//                     width: isMobile ? 200 : 180,
//                     height: isMobile ? 200 : 180,
//                   }}
//                 >
//                   <Pie
//                     data={filteredPieData}
//                     options={{
//                       responsive: true,
//                       maintainAspectRatio: false,
//                       plugins: {
//                         legend: { display: false },
//                       },
//                     }}
//                   />
//                 </div>
//               ) : (
//                 <div
//                   style={{
//                     width: 180,
//                     height: 180,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     border: "2px dashed #e5e7eb",
//                     borderRadius: "50%",
//                     color: "#999",
//                     fontSize: 14,
//                   }}
//                 >
//                   No data
//                 </div>
//               )}
//             </div>

//             {/* Legend */}
//             <div
//               style={{
//                 flex: 1,
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: 8,
//                 paddingTop: 8,
//               }}
//             >
//               {filteredPieData.labels?.map((label, index) => (
//                 <div
//                   key={label}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 10,
//                     padding: "8px 12px",
//                     background: "#f8fafc",
//                     borderRadius: 8,
//                     border: "1px solid #e2e8f0",
//                   }}
//                 >
//                   <div
//                     style={{
//                       width: 12,
//                       height: 12,
//                       borderRadius: "50%",
//                       backgroundColor:
//                         filteredPieData.datasets[0].backgroundColor[index],
//                     }}
//                   />
//                   <div
//                     style={{
//                       fontSize: 13,
//                       fontWeight: 500,
//                       color: "#374151",
//                       flex: 1,
//                     }}
//                   >
//                     {label}
//                   </div>
//                   <div
//                     style={{
//                       fontSize: 13,
//                       fontWeight: 600,
//                       color: "#1e293b",
//                     }}
//                   >
//                     {filteredPieData.datasets[0].data[index]}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Bar Chart */}
//         <div
//           style={{
//             background: "white",
//             borderRadius: 16,
//             boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
//             padding: 24,
//             border: "1px solid rgba(0, 0, 0, 0.05)",
//             height: isMobile ? "auto" : 420,
//             display: "flex",
//             flexDirection: "column",
//           }}
//         >
//           <h3
//             style={{
//               fontSize: 18,
//               fontWeight: 600,
//               marginBottom: 16,
//               color: "#1c1c1e",
//             }}
//           >
//             Lead Trends
//           </h3>
//           {loadingCardsAndChart ? (
//             <p style={{ textAlign: "center", color: "#999", margin: "auto" }}>
//               Loading Chart...
//             </p>
//           ) : filteredBarData ? (
//             <div style={{ flex: 1, display: "flex" }}>
//               <Bar data={filteredBarData} options={barOptions} />
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "#999", margin: "auto" }}>
//               No chart data available.
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Table Section */}
//       <div
//         style={{
//           background: "white",
//           borderRadius: 16,
//           boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
//           padding: 24,
//           border: "1px solid rgba(0, 0, 0, 0.05)",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 20,
//             flexWrap: "wrap",
//             gap: "15px",
//           }}
//         >
//           <h3
//             style={{
//               fontSize: 20,
//               fontWeight: 600,
//               color: "#1c1c1e",
//               margin: 0,
//             }}
//           >
//             Lost Leads Table
//           </h3>

//           <button
//             onClick={handleExport}
//             style={{
//               display: "flex",
//               alignItems: "center",
//               padding: "10px 20px",
//               backgroundColor: "#28a745",
//               color: "white",
//               borderRadius: "8px",
//               border: "none",
//               cursor: "pointer",
//               fontSize: 14,
//               fontWeight: 600,
//               transition: "background-color 0.2s ease",
//               boxShadow: "0 2px 6px rgba(40, 167, 69, 0.3)",
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#218838")}
//             onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}
//           >
//             <HiDownload size={16} style={{ marginRight: 8 }} /> Export to Excel
//           </button>
//         </div>

//         {/* Filters Section */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 20,
//             flexWrap: "wrap",
//             gap: "15px",
//             padding: "16px",
//             backgroundColor: "#f8f9fa",
//             borderRadius: 12,
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               flexDirection: isMobile ? "column" : "row",
//               gap: 16,
//               flexWrap: "wrap",
//             }}
//           >
//             {/* Owner Dropdown */}
//             <select
//               value={filterOwner}
//               onChange={(e) => {
//                 setFilterOwner(e.target.value);
//                 setCurrentPage(1);
//               }}
//               style={{
//                 padding: "8px 12px",
//                 borderRadius: 8,
//                 border: "1px solid #ccc",
//                 fontSize: 14,
//                 minWidth: 200,
//                 backgroundColor: "white",
//               }}
//             >
//               <option value="">All Lead Owners</option>
//               {ownerOptions.map((owner) => (
//                 <option key={owner} value={owner}>
//                   {owner}
//                 </option>
//               ))}
//             </select>

//             {/* Reason Dropdown */}
//             <select
//               value={filterReason}
//               onChange={(e) => {
//                 setFilterReason(e.target.value);
//                 setCurrentPage(1);
//               }}
//               style={{
//                 padding: "8px 12px",
//                 borderRadius: 8,
//                 border: "1px solid #ccc",
//                 fontSize: 14,
//                 minWidth: 200,
//                 backgroundColor: "white",
//               }}
//             >
//               <option value="">All Reasons</option>
//               {reasonOptions.map((reason) => (
//                 <option key={reason} value={reason}>
//                   {reason}
//                 </option>
//               ))}
//             </select>

//             {/* Remarks Dropdown */}
           
//           </div>

//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               flexWrap: "wrap",
//             }}
//           >
//             <label
//               style={{ fontSize: 14, color: "#333", fontWeight: 600 }}
//             >
//               From:
//             </label>
//             <input
//               type="date"
//               value={dateFilterFrom}
//               onChange={(e) => {
//                 setDateFilterFrom(e.target.value);
//                 setIsDefaultMonth(false);
//               }}
//               style={{
//                 padding: "10px 14px",
//                 borderRadius: 8,
//                 border: "1px solid #ddd",
//                 fontSize: 14,
//                 backgroundColor: "white",
//               }}
//             />

//             <label
//               style={{ fontSize: 14, color: "#333", fontWeight: 600 }}
//             >
//               To:
//             </label>
//             <input
//               type="date"
//               value={dateFilterTo}
//               onChange={(e) => {
//                 setDateFilterTo(e.target.value);
//                 setIsDefaultMonth(false);
//               }}
//               style={{
//                 padding: "10px 14px",
//                 borderRadius: 8,
//                 border: "1px solid #ddd",
//                 fontSize: 14,
//                 backgroundColor: "white",
//               }}
//             />

//             <button
//               onClick={() => {
//                 setDateFilterFrom("");
//                 setDateFilterTo("");
//                 setIsDefaultMonth(false);
//                 setFilterOwner("");
//                 setFilterReason("");
//                 setFilterRemarks("");
//                 setCurrentPage(1);
//               }}
//               style={{
//                 padding: "10px 18px",
//                 borderRadius: 8,
//                 border: "1px solid #ddd",
//                 backgroundColor: "white",
//                 color: "#333",
//                 cursor: "pointer",
//                 fontSize: 14,
//                 fontWeight: 600,
//               }}
//               onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
//               onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
//             >
//               Reset
//             </button>
//           </div>

//           <div
//             style={{
//               flex: 1,
//               minWidth: "250px",
//               padding: "10px 18px",
//               borderRadius: 10,
//               fontSize: 14,
//               fontWeight: 500,
//               background:
//                 isDefaultMonth && dateFilterFrom
//                   ? "linear-gradient(to right, #e6ffe6, #d0ffe0)"
//                   : dateFilterFrom && dateFilterTo
//                   ? "linear-gradient(to right, #e0f7fa, #c2eff5)"
//                   : "linear-gradient(to right, #f8f8f8, #f0f0f0)",
//               color:
//                 isDefaultMonth && dateFilterFrom
//                   ? "#1b5e20"
//                   : dateFilterFrom && dateFilterTo
//                   ? "#006064"
//                   : "#424242",
//               border:
//                 isDefaultMonth && dateFilterFrom
//                   ? "1px solid #a5d6a7"
//                   : dateFilterFrom && dateFilterTo
//                   ? "1px solid #80deea"
//                   : "1px solid #e0e0e0",
//             }}
//           >
//             {getIntimationMessage()}
//           </div>
//         </div>

//         {/* Table */}
//         {loadingTable ? (
//           <p
//             style={{
//               textAlign: "center",
//               padding: "40px",
//               color: "#999",
//             }}
//           >
//             Loading table data...
//           </p>
//         ) : (
//           <>
//             <div
//               style={{
//                 overflowX: "auto",
//                 overflowY: "auto",
//                 maxHeight: "60vh",
//                 borderRadius: 12,
//                 border: "1px solid #e5e7eb",
//               }}
//             >
//               <table
//                 style={{
//                   width: "100%",
//                   borderCollapse: "separate",
//                   borderSpacing: 0,
//                   fontSize: 14,
//                 }}
//               >
//                 <thead>
//                   <tr style={{ backgroundColor: "#f9fafb" }}>
//                     <th
//                       style={{
//                         padding: "16px 12px",
//                         fontWeight: 600,
//                         fontSize: 13,
//                         textAlign: "center",
//                         color: "#374151",
//                         borderBottom: "2px solid #e5e7eb",
//                         position: "sticky",
//                         top: 0,
//                         backgroundColor: "#f9fafb",
//                         zIndex: 10,
//                       }}
//                     >
//                       S.No.
//                     </th>
//                     {["Lead Name", "Lead Owner", "Created Date", "Value", "Reason", "Remarks"].map(
//                       (header) => (
//                         <th
//                           key={header}
//                           style={{
//                             padding: "16px 12px",
//                             fontWeight: 600,
//                             fontSize: 13,
//                             textAlign: "center",
//                             color: "#374151",
//                             borderBottom: "2px solid #e5e7eb",
//                             position: "sticky",
//                             top: 0,
//                             backgroundColor: "#f9fafb",
//                             zIndex: 10,
//                           }}
//                         >
//                           {header}
//                         </th>
//                       )
//                     )}
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {currentItems.length > 0 ? (
//                     currentItems.map((lead, index) => (
//                       <tr
//                         key={index}
//                         style={{
//                           borderBottom: "1px solid #f3f4f6",
//                           transition: "background-color 0.2s ease",
//                         }}
//                         onMouseEnter={(e) =>
//                           (e.currentTarget.style.backgroundColor = "#f9fafb")
//                         }
//                         onMouseLeave={(e) =>
//                           (e.currentTarget.style.backgroundColor = "white")
//                         }
//                       >
//                         <td
//                           style={{
//                             padding: "14px 12px",
//                             textAlign: "center",
//                             color: "#6b7280",
//                             fontWeight: 500,
//                           }}
//                         >
//                           {(currentPage - 1) * itemsPerPage + index + 1}
//                         </td>

//                         <td
//                           style={{
//                             padding: "14px 12px",
//                             textAlign: "center",
//                             color: "#1f2937",
//                             fontWeight: 500,
//                           }}
//                         >
//                           {lead.lead_name}
//                         </td>

//                         <td
//                           style={{
//                             padding: "14px 12px",
//                             textAlign: "center",
//                             color: "#4b5563",
//                           }}
//                         >
//                           {lead.lead_owner}
//                         </td>

//                         <td
//                           style={{
//                             padding: "14px 12px",
//                             textAlign: "center",
//                             color: "#6b7280",
//                             fontSize: 13,
//                           }}
//                         >
//                           {new Date(lead.created_at)
//                             .toLocaleDateString("en-GB", {
//                               day: "2-digit",
//                               month: "numeric",
//                               year: "numeric",
//                               hour: "2-digit",
//                               minute: "2-digit",
//                               hour12: true,
//                             })
//                             .replace(",", "")
//                             .toUpperCase()}
//                         </td>

//                         <td
//                           style={{
//                             padding: "14px 12px",
//                             textAlign: "center",
//                             fontWeight: 600,
//                             color: "#2563eb",
//                           }}
//                         >
//                           ₹{lead.value}
//                         </td>

//                         <td
//                           style={{
//                             padding: "14px 12px",
//                             textAlign: "center",
//                             color: "#dc2626",
//                             fontWeight: 500,
//                           }}
//                         >
//                           {lead.reason}
//                         </td>

//                         <td
//                           style={{
//                             padding: "14px 12px",
//                             textAlign: "center",
//                             color: "#4b5563",
//                           }}
//                         >
//                           {lead.remarks || "-"}
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={7}
//                         style={{
//                           padding: "40px",
//                           textAlign: "center",
//                           color: "#9ca3af",
//                           fontSize: 15,
//                         }}
//                       >
//                         No lost leads found for the selected period.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             <Pagination
//               currentPage={currentPage}
//               totalPages={totalPages}
//               setCurrentPage={setCurrentPage}
//             />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

