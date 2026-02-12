import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../../api/constraints";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line, Bar, Pie } from "react-chartjs-2";
import { ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ================= REGISTER ================= */

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

/* ================= DASHBOARD ================= */

const CallLogsReport = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoverData, setHoverData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userHoverData, setUserHoverData] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const rowsPerPage = 10;

  // Convert ISO → YYYY-MM-DD (LOCAL)
    const getLocalDate = (iso) => {
    if (!iso) return "";

    return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
    };

// Convert ISO → HH:mm (LOCAL)
    const getLocalTime = (iso) => {
    if (!iso) return "";

    const d = new Date(iso);

    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");

    return `${h}:${m}`;
    };


  /* ================= GET LOGGED USER ================= */

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.cEmail) {
      setSelectedUserEmail(user.cEmail);
    }
  }, []);

  /* ================= FETCH USERS ================= */

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(
        
        ENDPOINTS.USERS,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(res.data || []);
    } catch (err) {
      console.error("User fetch error", err);
    }
  }, [token]);

  /* ================= FETCH REPORT ================= */

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);

      const payload = {
        fromDate: fromDate || "2000-01-01",
        toDate: toDate || new Date().toISOString().slice(0, 10),
        userEmail: selectedUserEmail || null,
        monthYear: selectedMonth || null, 
      };

      const res = await axios.post(
     
        ENDPOINTS.DCRM_CALL_REPORT,
          
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setData(res.data.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedUserEmail, selectedMonth, token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchReport();
  }, [selectedUserEmail, selectedMonth, fetchReport]);

  /* ================= DROPDOWN USERS ================= */

  const dropdownUsers = useMemo(
    () => [
      { label: "All Users", value: "" },
      ...users.map((u) => ({
        label: u.cFull_name,
        value: u.cEmail,
      })),
    ],
    [users]
  );

  /* ================= MONTH LIST ================= */

 const monthsList = useMemo(() => {
  if (!data?.monthchart) return [];

  const monthMap = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  return [
    { label: "All Months", value: "" },

    ...data.monthchart.map((m) => {
      const [mon, year] = m.month.split(" "); 

      return {
        label: m.month,                    
        value: `${year}-${monthMap[mon]}`, 
      };
    }),
  ];
}, [data?.monthchart]);


  /* ================= FORMAT TIME ================= */

  const formatTime = (sec) => {
    if (!sec) return "0s";

    const m = Math.floor(sec / 60);
    const s = sec % 60;

    return `${m}m ${s}s`;
  };

  /* ================= EXPORT ================= */

  const exportExcel = () => {
    if (!data?.tabledata) return;

    const exportData = data.tabledata.map((row, i) => ({
      "S.No": i + 1,
      Name: row.caller_name || "-",
      Number: row.call_log_number || "-",
      Time: row.call_time
        ? new Date(row.call_time).toLocaleString()
        : "-",
      Duration: `${row.duration || 0}s`,
      Company: row.company_name || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Call Report");

    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      "call_dashboard.xlsx"
    );
  };

  /* ================= PAGINATION ================= */

const tableData = useMemo(() => {
  if (!data?.tabledata) return [];

  return data.tabledata.filter((row) => {
    const text = searchText.toLowerCase();

    /* ===== DATE FILTER (LOCAL) ===== */
    let allowDate = true;

    if (fromDate && toDate && row.call_time) {
      const callDate = getLocalDate(row.call_time);

      allowDate =
        callDate >= fromDate &&
        callDate <= toDate;
    }

    /* ===== TIME FILTER (LOCAL) ===== */
    let allowTime = true;

    if (fromTime && toTime && row.call_time) {
      const callTime = getLocalTime(row.call_time);

      allowTime =
        callTime >= fromTime &&
        callTime <= toTime;
    }

    /* ===== SEARCH FILTER ===== */
    const allowSearch =
      row.caller_name?.toLowerCase().includes(text) ||
      row.call_log_number?.includes(text) ||
      row.user_name?.toLowerCase().includes(text);

    return allowDate && allowTime && allowSearch;
  });
}, [
  data?.tabledata,
  searchText,
  fromDate,
  toDate,
  fromTime,
  toTime,
]);

const filteredLogs = tableData;

const cardStats = useMemo(() => {
  const stats = {
    total: 0,
    incoming: 0,
    outgoing: 0,
    missed: 0,
    rejected: 0,
    totalSeconds: 0,
  };

  filteredLogs.forEach((row) => {
    stats.total++;
    stats.totalSeconds += row.duration || 0;

    if (row.call_type_id === 1) stats.incoming++;
    if (row.call_type_id === 2) stats.outgoing++;
    if (row.call_type_id === 3) stats.missed++;
    if (row.call_type_id === 4) stats.rejected++;
  });

  return stats;
}, [filteredLogs]);


  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;

  const currentRows = tableData.slice(indexOfFirst, indexOfLast);

  /* ================= CHART OPTIONS ================= */

  const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#111827",
      titleColor: "#fff",
      bodyColor: "#fff",
      padding: 12,
      cornerRadius: 8,
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Days",
        font: { size: 14, weight: "bold" },
      },
    },

    y: {
      beginAtZero: true,
      grid: {
        color: "#f3f4f6",
      },
      title: {
        display: true,
        text: "Call Count",
        font: { size: 14, weight: "bold" },
      },
      ticks: {
        precision: 0,
      },
    },
  },
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: { display: false },

    tooltip: {
      callbacks: {
        label: function (context) {
          const calls = context.parsed.y;

          const seconds =
            context.dataset.durations?.[context.dataIndex] || 0;

          const min = Math.floor(seconds / 60);
          const sec = seconds % 60;

          return [
            `Calls: ${calls}`,
            `Duration: ${min}m ${sec}s`,
          ];
        },
      },
    },
  },

  scales: {
    x: {
      title: {
        display: true,
        text: "Call Type",
         font: {
          size: 14,
          weight: "bold",
        },
        
      },
    },

    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Total Calls",
         font: {
          size: 14,
          weight: "bold",
        },
      },
      ticks: {
        precision: 0,
      },
    },
  },
};

const topCallerOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: { display: false },
  },

  scales: {
    x: {
      title: {
        display: true,
        text: "Lead", 
        font: {
          size: 14,
          weight: "bold",
        },
      },
      ticks: {
        maxRotation: 30,
        minRotation: 20, 
      },
    },

    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Total Calls", 
        font: {
          size: 14,
          weight: "bold",
        },
      },
      ticks: {
        precision: 0,
      },
    },
  },
};



  /* ================= LINE ================= */

const lineData = useMemo(() => {
  const map = {};

  filteredLogs.forEach((row) => {
    const date = getLocalDate(row.call_time);

    if (!map[date]) {
      map[date] = 0;
    }

    map[date]++;
  });

  const labels = Object.keys(map).sort();
  const values = labels.map((d) => map[d]);

  return {
    labels,
    datasets: [
      {
        label: "Total Calls",
        data: values,
        backgroundColor: "#6366f1",
        borderRadius: 6,
      },
    ],
  };
}, [filteredLogs]);


  /* ================= BAR ================= */

const callTypePieData = useMemo(() => {
  const map = {
    Incoming: 0,
    Outgoing: 0,
    Missed: 0,
    Rejected: 0,
  };

  filteredLogs.forEach((row) => {
    if (row.call_type_id === 1) map.Incoming++;
    if (row.call_type_id === 2) map.Outgoing++;
    if (row.call_type_id === 3) map.Missed++;
    if (row.call_type_id === 4) map.Rejected++;
  });

  return {
    labels: Object.keys(map),
    datasets: [
      {
        data: Object.values(map),
        backgroundColor: [
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#6366f1",
        ],
      },
    ],
  };
}, [filteredLogs]);




  /* ================= PIE ================= */

  const pieData = {
    labels: data?.piechart?.map((d) => d.type_name),

    datasets: [
      {
        data: data?.piechart?.map((d) => d.count),
        backgroundColor: ["#4f46e5", "#22c55e", "#f97316", "#ef4444"],
      },
    ],
  };


const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      position: "right",
    },

    tooltip: {
      callbacks: {
        label: function (context) {
          const calls = context.parsed;

        
          const seconds =
            context.dataset.durations?.[context.dataIndex] || 0;

          const min = Math.floor(seconds / 60);
          const sec = seconds % 60;

          return [
            `Calls: ${calls}`,
            `Duration: ${min}m ${sec}s`,
          ];
        },
      },
    },
  },
};

  /* ================= USER PIE ================= */

const userPieData = useMemo(() => {
  const map = {};

  filteredLogs.forEach((row) => {
    const user = row.user_name || "Unknown";

    if (!map[user]) map[user] = 0;

    map[user]++;
  });

  return {
    labels: Object.keys(map),
    datasets: [
      {
        data: Object.values(map),
        backgroundColor: [
          "#6366f1",
          "#22c55e",
          "#f97316",
          "#ef4444",
          "#06b6d4",
        ],
      },
    ],
  };
}, [filteredLogs]);


const userPieOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      position: "right",
    },

    tooltip: {
      callbacks: {
        title: (context) => {
          const label = context[0].label;

          // User icon
          return `👤 ${label}`;
        },

        label: (context) => {
          return `Calls: ${context.parsed}`;
        },
      },
    },

    // LABEL ON SLICE
    datalabels: {
      color: "#fff",
      font: {
        weight: "bold",
        size: 14,
      },

      formatter: (value, context) => {
        const label =
          context.chart.data.labels[context.dataIndex];

        return `${label}\n${value}`;
      },
    },
  },
};






  /* ================= TOP CALLERS ================= */
  useEffect(() => {
  setCurrentPage(1);
}, [searchText]);


 const topCallerData = useMemo(() => {
  const map = {};

  filteredLogs.forEach((row) => {
    const key = `${row.caller_name} (${row.call_log_number})`;

    if (!map[key]) map[key] = 0;

    map[key]++;
  });

  return {
    labels: Object.keys(map),
    datasets: [
      {
        data: Object.values(map),
        backgroundColor: "#6366f1",
      },
    ],
  };
}, [filteredLogs]);


  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="p-4 bg-gray-50 min-h-screen">

      {/* HEADER */}

      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 text-xl">
          <FaArrowLeft />
        </button>

        <h1 className="text-2xl font-bold">Call Dashboard</h1>
      </div>

      {/* FILTERS */}

      <div className="flex gap-4 mb-6 flex-wrap">

        {/* USER */}

        <SelectBox
          value={selectedUserEmail}
          onChange={setSelectedUserEmail}
          list={dropdownUsers}
          placeholder="Select User"
        />

        {/* MONTH */}

        <SelectBox
          value={selectedMonth}
          onChange={setSelectedMonth}
          list={monthsList}
          placeholder="Select Month"
        />

        {/* DATE */}

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        {/* <button
          onClick={fetchReport}
          className="bg-blue-600 text-white px-6 rounded-full"
        >
          Filter
        </button> */}

        <input
  type="time"
  value={fromTime}
  onChange={(e) => setFromTime(e.target.value)}
  className="border px-3 py-2 rounded"
/>

<input
  type="time"
  value={toTime}
  onChange={(e) => setToTime(e.target.value)}
  className="border px-3 py-2 rounded"
/>



      </div>

      {/* CARDS */}

    {filteredLogs && (


        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">

    
          <StatCard title="Total Calls" value={cardStats.total} color="border-blue-500" />
            <StatCard
            title="Incoming"
            value={cardStats.incoming}
            color="border-green-500"
            />

            <StatCard
            title="Outgoing"
            value={cardStats.outgoing}
            color="border-yellow-500"
            />

            <StatCard
            title="Missed"
            value={cardStats.missed}
            color="border-orange-500"
            />

            <StatCard
            title="Rejected"
            value={cardStats.rejected}
            color="border-red-500"
            />

            <StatCard
            title="Avg Time"
            value={
            cardStats.total
                ? formatTime(Math.floor(cardStats.totalSeconds / cardStats.total))
                : "0s"
            }
            color="border-purple-500"
            />

            <StatCard
            title="Total Call Time"
            value={formatTime(cardStats.totalSeconds)}
            color="border-indigo-500"
            />

            <StatCard
            title="Blocked Numbers"
            value={data?.cards?.blocked_numbers || 0}
            color="border-pink-500"
            />

            <StatCard
            title="Blocked Calls"
            value={data?.cards?.blocked_calls || 0}
            color="border-gray-600"
            />


        </div>
      )}

      {/* CHARTS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <ChartBox title="Calls Over Time">
          <Bar data={lineData} options={lineChartOptions} />
        </ChartBox>

  <ChartBox title="Call Types">
  <div className="flex justify-center items-center h-full">
    <div className="w-80 h-80">
      <Pie data={callTypePieData} options={pieOptions} />
    </div>
  </div>
</ChartBox>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

      <ChartBox title="User Call Distribution">

  <div className="flex items-center justify-center gap-6">

    {/* PIE */}
    <div className="w-80 h-80">
      <Pie data={userPieData} options={userPieOptions} />
    </div>

    {/* INFO CARD */}
    {userHoverData && (
      <div className="bg-gray-50 border rounded-xl p-4 w-40 shadow text-center">

        <p className="text-sm text-gray-500">User</p>
        <p className="font-bold text-lg">{userHoverData.label}</p>

        <p className="text-sm text-gray-500 mt-2">Calls</p>
        <p className="font-bold text-xl text-green-600">
          {userHoverData.value}
        </p>

      </div>
    )}

  </div>

</ChartBox>
        <ChartBox title="Top Callers">
          <Bar data={topCallerData} options={topCallerOptions} />
        </ChartBox>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">




</div>


      {/* TABLE */}

      {/* <div className="bg-white rounded-xl p-6 shadow">

        <div className="flex justify-between mb-4">

          <h3 className="font-bold">Call History</h3>

          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Export
          </button>

        </div>

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">S.No</th>
              <th>Name</th>
              <th>Number</th>
              <th>Time</th>
              <th>Duration</th>
            </tr>
          </thead>

          <tbody>

            {currentRows.map((row, i) => (

              <tr key={i} className="border-b">

                <td className="p-2">{indexOfFirst + i + 1}</td>
                <td>{row.caller_name}</td>
                <td>{row.call_log_number}</td>
                <td>{new Date(row.call_time).toLocaleString()}</td>
                <td>{formatTime(row.duration)}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div> */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">

 {/* ===== Header ===== */}
<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-5">

  <div>
    <h3 className="text-lg font-semibold text-gray-800">
      Call List
    </h3>
  </div>

  {/* SEARCH */}
  <input
    type="text"
    placeholder="Search name, number, user..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    className="border px-4 py-2 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-400 outline-none"
  />

  {/* EXPORT */}
  <button
    onClick={exportExcel}
    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
  >
    Export
  </button>

</div>


  {/* ===== Table ===== */}
  <div className="overflow-x-auto rounded-xl border border-gray-200">

    <table className="w-full text-sm text-gray-700">

      <thead className="bg-gray-100 text-gray-700 text-xs uppercase">

        <tr>
          <th className="p-3 text-center">S.No</th>
          <th className="p-3 text-left">Name</th>
          <th className="p-3 text-left">Number</th>
          <th className="p-3 text-center">Time</th>
          <th className="p-3 text-center">Duration</th>
        </tr>

      </thead>

      <tbody>

        {currentRows.map((row, i) => (

          <tr
            key={i}
            className="border-b hover:bg-blue-50 transition even:bg-gray-50"
          >

            <td className="p-3 text-center font-medium text-gray-500">
              {indexOfFirst + i + 1}
            </td>

            <td className="p-3 font-medium">
              {row.caller_name || "-"}
            </td>

            <td className="p-3 font-mono text-gray-700">
              {row.call_log_number}
            </td>

            <td className="p-3 text-center text-gray-600">
              {new Date(row.call_time).toLocaleString("en-IN")}

            </td>

            <td className="p-3 text-center font-semibold text-blue-600">
              {formatTime(row.duration)}
            </td>

          </tr>

        ))}

        {/* Empty State */}
        {currentRows.length === 0 && (
          <tr>
            <td
              colSpan="5"
              className="p-6 text-center text-gray-400"
            >
              No call history found
            </td>
          </tr>
        )}

      </tbody>

    </table>

    {/* ===== PAGINATION ===== */}
<div className="flex justify-between items-center mt-4 text-sm">

  <p className="text-gray-500">
    Showing {indexOfFirst + 1}–
    {Math.min(indexOfLast, tableData.length)} of{" "}
    {tableData.length}
  </p>

  <div className="flex gap-2">

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
    >
      Prev
    </button>

    {Array.from(
      { length: Math.ceil(tableData.length / rowsPerPage) },
      (_, i) => i + 1
    ).map((num) => (
      <button
        key={num}
        onClick={() => setCurrentPage(num)}
        className={`px-3 py-1 border rounded ${
          currentPage === num
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-100"
        }`}
      >
        {num}
      </button>
    ))}

    <button
      disabled={
        currentPage ===
        Math.ceil(tableData.length / rowsPerPage)
      }
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
    >
      Next
    </button>

  </div>

</div>


  </div>

</div>


    </div>
  );
};

/* ================= COMPONENTS ================= */

// const StatCard = ({ title, value }) => (
//   <div className="bg-white p-4 rounded-xl shadow text-center">
//     <p className="text-xs text-gray-500">{title}</p>
//     <p className="text-xl font-bold mt-1">{value}</p>
//   </div>
// );
const StatCard = ({ title, value, color }) => (
  <div
    className={`bg-white p-4 rounded-xl shadow text-center border-l-4 ${color}`}
  >
  <p className="text-sm font-semibold text-gray-700 tracking-wide">
  {title}
</p>


    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);


const ChartBox = ({ title, children }) => (
  <div className="bg-white p-5 rounded-xl shadow h-[350px] flex flex-col">
    <h3 className="font-semibold mb-4">{title}</h3>
    <div className="flex-1">{children}</div>
  </div>
);

const SelectBox = ({ value, onChange, list, placeholder }) => (
  <Listbox value={value} onChange={onChange}>
    <div className="relative w-48">

      <Listbox.Button className="w-full border px-4 py-2 rounded-full bg-white text-left">

        {list.find((i) => i.value === value)?.label || placeholder}

        <ChevronDown className="absolute right-3 top-3 w-4" />

      </Listbox.Button>

      <Listbox.Options className="absolute w-full bg-white border mt-2 rounded shadow z-10">

        {list.map((i) => (
          <Listbox.Option
            key={i.value || "all"}
            value={i.value}
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
          >
            {i.label}
          </Listbox.Option>
        ))}

      </Listbox.Options>

    </div>
  </Listbox>
);

export default CallLogsReport;
