import React, { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../api/constraints";

/* ===== chart.js ===== */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

/* ===== UI ===== */
import { TrendingUp, Users, Target, ChevronDown,Calendar } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaArrowLeft } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const SalesTargetReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [dateFilterType, setDateFilterType] = useState('year'); 



  /* ================= API ================= */
  useEffect(() => {
    if (!companyId) return;

    setLoading(true);
    axios.get( ENDPOINTS.TARGET_ARCHIVEMENT_REPORT,
        { params: { company_id: companyId } }
      )
      .then((res) => {
        setData(res.data?.data || []);
        setError(null);
      })
      .catch(() => setError("Failed to load sales target report"))
      .finally(() => setLoading(false));
  }, [companyId]);

  /* ================= USERS ================= */
  const users = useMemo(() => {
    const map = new Map();
    data.forEach((d) => map.set(d.user_id, d.salesperson));
    return Array.from(map.entries()).map(([id, name]) => ({
      id: String(id),
      name,
    }));
  }, [data]);

  /* ================= FILTER ================= */
  const getAllMonths = () => {
  const months = [];
  const today = new Date();
  
  
  // Generate last 12 months + current month (total 13, but filter will handle)
  for (let i = 0; i < 24; i++) { // 24 months back for coverage
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthYear = date.toISOString().slice(0, 7); // "2026-02"
    months.push(monthYear);
  }
  
  return [...new Set(months)].sort().reverse(); // Remove duplicates, newest first
};

const getAllYears = () => {
  const years = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) { // Last 5 years + current
    const year = today.getFullYear() - i;
    years.push(String(year));
  }
  return years;
};

const getMonthsForYear = (year) => {
  if (!year) return [];
  const months = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  for (let i = 1; i <= 12; i++) {
    const date = new Date(Number(year), i - 1, 1);
    const monthYear = date.toISOString().slice(0, 7); // "2025-12"
    
    // If selected year is current year, only show months up to current
    if (year === String(currentYear) && i > currentMonth) continue;
    
    months.push(monthYear);
  }
  return months;
};
const monthsLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

  const getStatus = (percent = 0) => {
  if (percent >= 100) return "OVER";
  if (percent >= 50) return "PARTIAL";
  return "UNDER";
};
const getMonthYear = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().slice(0, 7); // "2025-12"
};
const dateMatchesFilter = (itemDate) => {
  if (!dateRange.start && !dateRange.end) return true;
  
  const itemMonth = getMonthYear(itemDate);
  
  if (dateFilterType === 'month') {
    return itemMonth === dateRange.start;
  }
  
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end + 'T23:59:59');
  const itemDateTime = new Date(itemDate);
  
  return itemDateTime >= startDate && itemDateTime <= endDate;
};

// Add this helper function with your other helpers (after getMonthYear)
const formatMonthYear = (monthYear) => {
  if (!monthYear) return '';
  const date = new Date(monthYear + '-01');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};



const filteredData = useMemo(() => {
  return data.filter((item) => {
    const matchesUser = selectedUser === "ALL" || String(item.user_id) === selectedUser;
    const matchesSearch = item.salesperson?.toLowerCase().includes(searchText.toLowerCase());
    const status = getStatus(item.achievementPercent);
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
    
    // New Year-Month filter logic
    const itemMonthYear = getMonthYear(item.fromDate);
    const matchesYear = !selectedYear || itemMonthYear.startsWith(selectedYear);
    const matchesMonth = !selectedMonth || itemMonthYear === selectedMonth;
    
    return matchesUser && matchesSearch && matchesStatus && matchesYear && matchesMonth;
  });
}, [data, selectedUser, searchText, statusFilter, selectedYear, selectedMonth]);



const totalPages = Math.max(
  1,
  Math.ceil(filteredData.length / rowsPerPage)
);
// Get month-year string from date


// Filter dates


const paginatedData = useMemo(() => {
  const start = (currentPage - 1) * rowsPerPage;
  return filteredData.slice(start, start + rowsPerPage);
}, [filteredData, currentPage]);

  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    const totalTarget = filteredData.reduce(
      (s, d) => s + (d.targetAmount || 0),
      0
    );
    const totalAchieved = filteredData.reduce(
      (s, d) => s + (d.achievedAmount || 0),
      0
    );
    const avgAchievement =
      filteredData.reduce(
        (s, d) => s + (d.achievementPercent || 0),
        0
      ) / (filteredData.length || 1);

    // const best = filteredData.reduce(
    //   (max, item) =>
    //     (item.achievementPercent || 0) >
    //     (max?.achievementPercent || 0)
    //       ? item
    //       : max,
    //   null
    // );
 const balance = totalTarget - totalAchieved;
    return { totalTarget, totalAchieved, avgAchievement, balance };
  }, [filteredData]);

  /* ================= CHART DATA ================= */
  const labels = filteredData.map((d) => d.salesperson || "Unknown");

 const barData = {
  labels,
  datasets: [
    {
      label: "Target",
      data: filteredData.map((d) => d.targetAmount || 0),
      backgroundColor: "rgba(59, 130, 246, 0.7)", // 🔵 Blue
      borderColor: "rgba(59, 130, 246, 1)",
      borderWidth: 1,
      borderRadius: 6,
      barPercentage: 0.6,
      categoryPercentage: 0.6,
    },
    {
      label: "Achieved",
      data: filteredData.map((d) => d.achievedAmount || 0),
      backgroundColor: "rgba(34, 197, 94, 0.7)", // 🟢 Green
      borderColor: "rgba(34, 197, 94, 1)",
      borderWidth: 1,
      borderRadius: 6,
      barPercentage: 0.6,
      categoryPercentage: 0.6,
    },
  ],
};


  const lineData = {
    labels,
    datasets: [
      {
        label: "Achievement %",
        data: filteredData.map((d) => d.achievementPercent || 0),
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        ticks: { precision: 0 },
      },
    },
  };

  /* ================= STATES ================= */
  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Loading Sales Target Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
        {error}
      </div>
    );
  }
  const exportToExcel = () => {
  if (filteredData.length === 0) {
    alert("No data to export");
    return;
  }

  const excelData = filteredData.map((item, index) => ({
    "S.No": index + 1,
    "Salesperson": item.salesperson || "-",
    "Target Amount": item.targetAmount || 0,
    "Achieved Amount": item.achievedAmount || 0,
    "Achievement %": item.achievementPercent || 0,
    "Over / Short": item.overOrShort || 0,
    "Status":
      item.achievementPercent >= 100
        ? "Over Achieved"
        : item.achievementPercent >= 50
        ? "Partial"
        : "Under Achieved",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(blob, "sales_target_report.xlsx");
};


  /* ================= UI ================= */
  return (
    <div className="p-4 mx-auto font-[system-ui] bg-gray-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/reportpage")}
          className="text-gray-600 hover:text-gray-900 mr-4 text-2xl p-2 rounded-full hover:bg-gray-200 transition"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Sales Target vs Achievement
        </h1>
      </div>

      {/* ===== FILTER ===== */}
      <div className="mb-8 flex flex-wrap gap-4 justify-center items-end p-4 bg-white rounded-2xl shadow-sm">
  {/* Salesperson Dropdown */}
  <Listbox value={selectedUser} onChange={setSelectedUser}>
    <div className="relative w-64">
      <Listbox.Button className="w-full bg-white border border-gray-300 rounded-full py-2 pl-4 pr-10 text-left shadow-md text-sm hover:shadow-lg transition-all">
        {selectedUser === "ALL"
          ? "All Salespersons"
          : users.find((u) => u.id === selectedUser)?.name || "Select User"}
        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
      </Listbox.Button>

      <Listbox.Options className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl max-h-60 overflow-auto text-sm border border-gray-200">
        <Listbox.Option
          value="ALL"
          className="cursor-pointer py-2 px-4 hover:bg-blue-50 data-[focus]:bg-blue-100 rounded-lg transition-colors"
        >
          All Salespersons
        </Listbox.Option>
        {users.map((u) => (
          <Listbox.Option
            key={u.id}
            value={u.id}
            className="cursor-pointer py-2 px-4 hover:bg-blue-50 data-[focus]:bg-blue-100 rounded-lg transition-colors"
          >
            {u.name}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </div>
  </Listbox>

  {/* Year Filter */}
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1 font-medium">Year</label>
    <select
      value={selectedYear}
      onChange={(e) => {
        setSelectedYear(e.target.value);
        setSelectedMonth(""); // Reset month when year changes
      }}
      className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white text-sm w-32 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">All Years</option>
      {getAllYears().map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  </div>

  {/* Month Filter (shows only when year selected) */}
  {selectedYear && (
    <div className="flex flex-col">
      <label className="text-xs text-gray-500 mb-1 font-medium">Month</label>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white text-sm w-32 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Months ({selectedYear})</option>
        {getMonthsForYear(selectedYear).map((monthYear) => {
          const monthIndex = Number(monthYear.split('-')[1]) - 1;
          return (
            <option key={monthYear} value={monthYear}>
              {monthsLabels[monthIndex]} {selectedYear}
            </option>
          );
        })}
      </select>
    </div>
  )}
</div>


      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card
          icon={<Target size={18} />}
          title="Total Target"
          value={`₹${summary.totalTarget.toLocaleString()}`}
        />
        <Card
          icon={<TrendingUp size={18} />}
          title="Achieved"
          value={`₹${summary.totalAchieved.toLocaleString()}`}
        />
        <Card
          icon={<Users size={18} />}
          title="Avg Achievement"
          value={`${summary.avgAchievement.toFixed(2)}%`}
        />
        <Card
          icon={<Users size={18} />}
          title="Balance"
          value={`₹${summary.balance.toLocaleString()}`}
        />

      </div>

      {/* ===== CHARTS ===== */}
     {/* ===== CHARTS ===== */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
  
  {/* Target vs Achieved */}
  <div className="bg-blue-50 border border-blue-200 rounded-2xl shadow-md p-4 h-[280px] flex flex-col">
    <h3 className="text-sm font-semibold text-blue-700 mb-2">
      Target vs Achieved
    </h3>
    <div className="flex-grow">
      <Bar data={barData} options={chartOptions} />
    </div>
    {/* ===== DATE FILTER ===== */}


  </div>

  {/* Achievement Trend */}
  <div className="bg-green-50 border border-green-200 rounded-2xl shadow-md p-4 h-[280px] flex flex-col">
    <h3 className="text-sm font-semibold text-green-700 mb-2">
      Achievement Trend
    </h3>
    <div className="flex-grow">
      <Line data={lineData} options={chartOptions} />
    </div>
  </div>

</div>


      {/* ===== PERFORMANCE CARDS ===== */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredData.map((item) => (
          <div
            key={item.user_id + item.fromDate}
            className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition"
          >
            <h4 className="font-semibold text-gray-800">
              {item.salesperson}
            </h4>

            <p className="text-sm text-gray-600">
              Target: ₹{item.targetAmount}
            </p>
            <p className="text-sm text-gray-600">
              Achieved: ₹{item.achievedAmount}
            </p>

            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold
                ${
                  item.achievementPercent >= 100
                    ? "bg-green-100 text-green-700"
                    : item.achievementPercent >= 50
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
            >
              {item.achievementPercent}% Achievement
            </span>
          </div>
        ))}
      </div> */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
  <input
    type="text"
    placeholder="Search Salesperson..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    className="px-4 py-2 w-full md:w-64 rounded-full border shadow text-sm"
  />

  <div className="flex gap-3">
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-4 py-2 rounded-full border shadow bg-white text-sm"
    >
      <option value="ALL">All Status</option>
      <option value="OVER">Over Achieved</option>
      <option value="PARTIAL">Partial</option>
      <option value="UNDER">Under Achieved</option>
    </select>

    <button
      onClick={exportToExcel}
      className="px-5 py-2 bg-green-600 text-white rounded-full shadow hover:bg-green-700 text-sm font-semibold"
    >
      Export Excel
    </button>
  </div>
</div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600 sticky top-0">
          <tr>
            <th className="px-4 py-3">S.No</th>
            <th className="px-4 py-3">Salesperson</th>
            <th className="px-4 py-3">Target Amount</th>
            <th className="px-4 py-3">Achieved Amount</th>
            <th className="px-4 py-3">Achievement %</th>
            <th className="px-4 py-3">Over / Short</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {filteredData.length > 0 ? (
            paginatedData.map((item, index) => {
              const isSuccess = item.achievementPercent >= 100;
              const isMid = item.achievementPercent >= 50;

              return (
                <tr key={item.user_id + index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
  {(currentPage - 1) * rowsPerPage + index + 1}
</td>
                  <td className="px-4 py-3 font-medium">
                    {item.salesperson || "-"}
                  </td>
                  <td className="px-4 py-3">
                    ₹{item.targetAmount?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3">
                    ₹{item.achievedAmount?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3">
                    {item.achievementPercent?.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    ₹{Math.abs(item.overOrShort || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isSuccess
                          ? "bg-green-100 text-green-700"
                          : isMid
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isSuccess
                        ? "Over Achieved"
                        : isMid
                        ? "Partial"
                        : "Under Achieved"}
                    </span>
                  </td>
                </tr>

                
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-6 text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
  <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 rounded-full border bg-white text-sm disabled:opacity-40"
    >
      Prev
    </button>

    {[...Array(totalPages)].map((_, i) => {
      const page = i + 1;
      return (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-4 py-2 rounded-full text-sm ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "bg-white border"
          }`}
        >
          {page}
        </button>
      );
    })}

    <button
      onClick={() =>
        setCurrentPage((p) => Math.min(p + 1, totalPages))
      }
      disabled={currentPage === totalPages}
      className="px-4 py-2 rounded-full border bg-white text-sm disabled:opacity-40"
    >
      Next
    </button>
  </div>
)}

    </div>
    </div>
  );
};

/* ===== CARD COMPONENT ===== */
const Card = ({ icon, title, value }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center transition-all hover:shadow-lg transform hover:-translate-y-1">
    <div className="text-blue-600 mb-1">{icon}</div>
    <h4 className="text-xs text-gray-500">{title}</h4>
    <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

export default SalesTargetReport;