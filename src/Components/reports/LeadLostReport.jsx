import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { ENDPOINTS } from "../../api/constraints";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import * as XLSX from 'xlsx'; // Import xlsx library
import { saveAs } from 'file-saver'; // Import saveAs from file-saver

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function LostLeadReports() {
  // State for data for the CARDS and CHARTS (all time)
  const [allTimeReportData, setAllTimeReportData] = useState({});
  // State for data for the TABLE (filterable by date)
  const [filteredTableData, setFilteredTableData] = useState([]);

  const [loadingCardsAndChart, setLoadingCardsAndChart] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const [barData, setBarData] = useState(null);

  // States for date filtering for the TABLE
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [isDefaultMonth, setIsDefaultMonth] = useState(true); // Tracks if current month is active

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can adjust this value

  const navigate = useNavigate();

  // Helper function to format date to YYYY-MM-DD for input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- NEW EFFECT FOR ALL-TIME DATA (CARDS & CHART) ---
  useEffect(() => {
    const fetchAllTimeData = async () => {
      setLoadingCardsAndChart(true);
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(ENDPOINTS.REPORT_LOST, { // No query params for all-time data
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Can't fetch all-time lost leads data", response);
          setLoadingCardsAndChart(false);
          return;
        }

        const data = await response.json();
        const allLeadsData = data.data; // This is now your all-time data

        setAllTimeReportData(allLeadsData); // Set for cards

        // Prepare chart data from all-time leads
        const wonDetailsForChart = allLeadsData.won_details || [];
        const lostDetailsForChart = allLeadsData.lead_details || [];

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

        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const allMonths = Array.from(
          new Set([...Object.keys(wonByMonth), ...Object.keys(lostByMonth)])
        ).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

        const chartData = {
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
        setBarData(chartData);

      } catch (error) {
        console.error("Error fetching all-time report data:", error);
      } finally {
        setLoadingCardsAndChart(false);
      }
    };

    fetchAllTimeData();
  }, []); // Run only once on mount to get all-time data

  // --- EFFECT FOR TABLE DATA (DATE FILTERED) ---

  // Set default current month dates for the table filter on initial load
  useEffect(() => {
    const today = new Date(); // Current date
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setIsDefaultMonth(true); // Set to true as it's the default load
  }, []); // Run only once on mount

  // Effect to fetch TABLE data based on date filters
  useEffect(() => {
    const fetchFilteredTableData = async () => {
      setLoadingTable(true);
      const token = localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      if (dateFilterFrom) {
        queryParams.append("fromDate", new Date(dateFilterFrom).toISOString());
      }
      if (dateFilterTo) {
        const endOfDay = new Date(dateFilterTo);
        endOfDay.setHours(23, 59, 59, 999);
        queryParams.append("toDate", endOfDay.toISOString());
      }

      let apiUrl = `${ENDPOINTS.REPORT_LOST}`;
      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

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
          setLoadingTable(false);
          return;
        }

        const data = await response.json();
        setFilteredTableData(data.data.lead_details || []); // Only set lead_details for the table
        setCurrentPage(1); // Reset to first page when filters change
      } catch (error) {
        console.error("Error fetching filtered table data:", error);
      } finally {
        setLoadingTable(false);
      }
    };

    fetchFilteredTableData();
  }, [dateFilterFrom, dateFilterTo]); // Re-fetch table data when date filters change

  // Calculate highest lost value from all-time leads for the card
  const highestValueAmongLostLeads = allTimeReportData.lead_details && allTimeReportData.lead_details.length > 0
    ? Math.max(...allTimeReportData.lead_details.map(lead => lead.value))
    : 0;

  const cardData = [
    { title: "Total Leads ", value: `${allTimeReportData.totalCount || 0}` },
    { title: "Lost Percentage ", value: `${allTimeReportData.lostPercentage || 0} %` },
    { title: "Total Lost", value: `${(allTimeReportData.lostFromLeads || 0) + (allTimeReportData.lostFromDeals || 0)}` },
    { title: "Highest Lost Lead Value", value: `₹${highestValueAmongLostLeads}` },
  ];

  // Updated barOptions with axis titles
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
      title: {
        display: true,
        text: 'Monthly Lead Performance', // Chart Title
        font: {
          size: 20,
          weight: 'bold'
        },
        color: '#333'
      }
    },
    scales: {
      x: {
        stacked: false,
        title: { // X-axis title
          display: true,
          text: 'Month', // Label for the X-axis
          color: '#333',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      y: {
        beginAtZero: true,
        title: { // Y-axis title
          display: true,
          text: 'Amount (₹)', // Label for the Y-axis
          color: '#333',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return `₹${value}`; // Format Y-axis ticks with Rupee symbol
          }
        }
      },
    },
  };

  const getIntimationMessage = () => {
    const fromDateObj = dateFilterFrom ? new Date(dateFilterFrom) : null;
    const toDateObj = dateFilterTo ? new Date(dateFilterTo) : null;

    if (isDefaultMonth && fromDateObj && toDateObj) {
      return `💡 Showing leads for the **current month**: **${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.`;
    } else if (fromDateObj && toDateObj) {
      return `🗓️ Filtering leads from **${fromDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **${toDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.`;
    } else {
      return `📊 Showing **all available leads** (no date filter applied).`;
    }
  };

  // Function to handle Excel export
  const handleExport = () => {
    if (filteredTableData.length === 0) {
      alert("No data to export for the current filter.");
      return;
    }

    const dataToExport = filteredTableData.map(lead => ({
      'Lead Name': lead.lead_name,
      'Lead Owner': lead.lead_owner,
      'Created Date': new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
      'Value (₹)': lead.value,
      'Reason': lead.reason,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LostLeadsReport");

    // Generate buffer and download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'LostLeadsReport.xlsx');
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTableData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      {/* Header with Back Button and Title */}
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
          aria-label="Back to reports"
        >
          <FaArrowLeft />
        </button>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1c1c1e" }}>
          Lost Lead Reports Overview 
        </h2>
      </div>

      {/* Cards and Chart Side-by-Side */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Left Side - Card Container Box */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 25px rgba(0.06,0.06,0.06,0.06)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {loadingCardsAndChart ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>Loading Cards...</div>
          ) : (
            cardData.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.75)",
                  // backdropFilter: "blur(12px)",
                  borderRadius: 30,
                  padding: "20px 16px",
                  boxShadow: "0 6px 12px rgba(0.04, 00.4, 0.04, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 100,
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#333",
                    opacity: 0.75,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#111",
                    marginTop: 6,
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Side - Bar Chart */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            padding: 24,
            minWidth: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loadingCardsAndChart ? (
            <p>Loading Chart...</p>
          ) : barData ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <p>No chart data available.</p>
          )}
        </div>
      </div>

      {/* Lost Leads Table */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: "15px" }}>
          <h3
            style={{ fontSize: 20, fontWeight: 600, color: "#1c1c1e" }}
          >
            Lost Leads Table (Filtered by Date)
          </h3>
          {/* Export to Excel Button */}
          <button
            onClick={handleExport}
                       className="flex items-center px-4 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition-colors text-sm font-semibold"

            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#218838"} // Darker green on hover
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#28a745"} // Original green on leave
          >
            <HiDownload size={16} className="mr-2" /> Export to Excel
          </button>
        </div>


        {/* Date Filters and Message Display */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: "15px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 16, color: "#555", fontWeight: "bold" }}>From:</label>
            <input
              type="date"
              value={dateFilterFrom}
              onChange={(e) => {
                setDateFilterFrom(e.target.value);
                setIsDefaultMonth(false);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            />
            <label style={{ fontSize: 16, color: "#555", fontWeight: "bold" }}>To:</label>
            <input
              type="date"
              value={dateFilterTo}
              onChange={(e) => {
                setDateFilterTo(e.target.value);
                setIsDefaultMonth(false);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            />
            <button
              onClick={() => {
                setDateFilterFrom('');
                setDateFilterTo('');
                setIsDefaultMonth(false); // Reset to false to show "all available leads" message if no dates
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #ccc",
                backgroundColor: "#f0f0f0",
                color: "#333",
                cursor: "pointer",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              Reset
            </button>
          </div>
          {/* Enhanced Intimation Area */}
          <div style={{
            flex: 1,
            minWidth: "250px",
            padding: "10px 18px",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            background: isDefaultMonth && dateFilterFrom ? "linear-gradient(to right, #e6ffe6, #d0ffe0)" :
              (dateFilterFrom && dateFilterTo ? "linear-gradient(to right, #e0f7fa, #c2eff5)" :
                "linear-gradient(to right, #f8f8f8, #f0f0f0)"),
            color: isDefaultMonth && dateFilterFrom ? "#1b5e20" :
              (dateFilterFrom && dateFilterTo ? "#006064" : "#424242"),
            border: isDefaultMonth && dateFilterFrom ? "1px solid #a5d6a7" :
              (dateFilterFrom && dateFilterTo ? "1px solid #80deea" : "1px solid #e0e0e0"),
          }}>
            {getIntimationMessage()}
          </div>
        </div>

        {loadingTable ? (
          <p>Loading table data...</p>
        ) : (
          <>
            <div style={{ overflowX: "auto", overflowY: "scroll", height: "60vh" }}>
              <table className="w-full justify-center border-collapse text-lg text-gray-800">
                <thead>
                  <tr style={{ backgroundColor: "#f2f2f7", fontSize: 20, fontWeight: 600 }}>
                    <th
                      className="px-4 py-3 font-semibold text-sm text-center"
                      style={{ wordBreak: "break-word" }}
                    >
                      S.No.
                    </th>
                    {[
                      "Lead Name",
                      "Lead Owner",
                      "Created Date",
                      "Value",
                      "Reason",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-sm font-semibold text-center"
                        style={{ wordBreak: "break-word" }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((lead, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: "1px solid #ececec",
                          transition: "background 0.3s",
                        }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm justify-center text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-4 py-3 text-sm justify-center text-center">{lead.lead_name}</td>
                        <td className="px-4 py-3 text-sm justify-center text-center">{lead.lead_owner}</td>
                        <td className="px-4 py-3 text-sm justify-center text-center">
                          {new Date(lead.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          }).replace(',', '').toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-sm justify-center text-center font-semibold text-blue-600">
                          ₹{lead.value}
                        </td>
                        <td className="px-4 py-3 text-sm justify-center text-center text-red-500 font-medium">
                          {lead.reason}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center  text-gray-500">
                        No lost leads found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredTableData.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                <nav>
                  <ul style={{ display: "flex", listStyle: "none", padding: 0 }}>
                    <li>
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          padding: "8px 12px",
                          margin: "0 4px",
                          border: "1px solid #ddd",
                          borderRadius: 5,
                          backgroundColor: currentPage === 1 ? "#f0f0f0" : "#fff",
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          color: "#333",
                          transition: "background-color 0.2s",
                        }}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li key={i}>
                        <button
                          onClick={() => paginate(i + 1)}
                          style={{
                            padding: "8px 12px",
                            margin: "0 4px",
                            border: "1px solid #ddd",
                            borderRadius: 5,
                            backgroundColor: currentPage === i + 1 ? "#007bff" : "#fff",
                            color: currentPage === i + 1 ? "#fff" : "#333",
                            cursor: "pointer",
                            transition: "background-color 0.2s, color 0.2s",
                          }}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: "8px 12px",
                          margin: "0 4px",
                          border: "1px solid #ddd",
                          borderRadius: 5,
                          backgroundColor: currentPage === totalPages ? "#f0f0f0" : "#fff",
                          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                          color: "#333",
                          transition: "background-color 0.2s",
                        }}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}