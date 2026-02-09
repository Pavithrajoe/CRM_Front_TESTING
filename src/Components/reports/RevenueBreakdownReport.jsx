import React, { useContext, useEffect, useState } from "react";
import { ENDPOINTS } from "../../api/constraints";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ================= CONSTANTS ================= */

const COLORS = [
  "#22c55e",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
];

const PAGE_SIZE = 5;


const formatCurrencyShort = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

// Clean tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border rounded-lg shadow px-3 py-2 text-sm">
        <p className="font-semibold">{d.label}</p>
        <p className="text-green-600">
          Revenue: {formatCurrencyShort(d.totalRevenue)}
        </p>
        <div className="text-gray-600">Leads: {d.totalLeads}</div>
        <p className="text-gray-600">Deals: {d.totalDeals}</p>
      </div>
    );
  }
  return null;
};

/* ================= MAIN ================= */

const RevenueBreakdownReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [active, setActive] = useState("service");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showBack, setShowBack] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const exportToExcel = () => {
    if (!reportData.length) return;

    // Prepare clean data for Excel
    const excelData = reportData.map((item, index) => ({
      "S.No": index + 1,
      Label: item.label,
      Revenue: item.totalRevenue,
      Pipeline: item.pipelineValue,
      Deals: item.totalDeals,
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto column width (important for long labels)
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Report");

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Download
    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      file,
      `Revenue_Report_${active}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const fetchTimeData = async () => {
    if (!fromDate || !toDate) return;

    const token = localStorage.getItem("token");
    setLoading(true);

    const res = await axios.get(
      `${ENDPOINTS.REVENUE_REPORT}/${companyId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          groupBy: "time",
          fromDate,
          toDate,
        },
      }
    );

    const data = res.data.data || [];

    setReportData(
      data.sort((a, b) => new Date(a.label) - new Date(b.label))
    );

    setLoading(false);
  };

  const fetchRevenue = async (type) => {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      `${ENDPOINTS.REVENUE_REPORT}/${companyId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { groupBy: type },
      }
    );

    const data = res.data.data || [];

    //  ONLY SORT 
    if (type === "time") {
      return data
        .map((i) => ({ ...i, d: new Date(i.label) }))
        .sort((a, b) => a.d - b.d)
        .map(({ d, ...rest }) => rest);
    }

    return data.sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  useEffect(() => {
    if (active === "time") {
      setReportData([]);
      setLoading(false);
      return;
    }

    if (!companyId) return;
    setLoading(true);
    setPage(1);

    fetchRevenue(active)
      .then(setReportData)
      .finally(() => setLoading(false));
  }, [active, companyId]);

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/reportpage")}
          className="p-2 rounded-full bg-white shadow"
        >
          <FaArrowLeft />
        </button>
        <h2 className="text-xl md:text-2xl font-bold">
          Revenue Breakdown
        </h2>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {["service", "subservice", "client", "salesperson", "region", "time"].map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={`p-3 rounded-xl font-semibold capitalize shadow transition
              ${
                active === k
                  ? "bg-indigo-600 text-white"
                  : "bg-white hover:bg-indigo-50"
              }`}
          >
            {k === "subservice" ? "Sub-Service" : k}
          </button>
        ))}
      </div>

      {active === "time" && (
        <div className="flex gap-3 bg-white p-4 rounded-xl shadow">
          <div>
            <label className="text-sm text-gray-600">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>

          <button
            onClick={fetchTimeData}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Apply
          </button>
        </div>
      )}

      {/* Charts + Table */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6">
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <>
            <ChartSection data={reportData} type={active} />
            <FlipCard showBack={showBack}>
              {/* FRONT SIDE – TABLE */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Detailed Data</h3>
                  <button
                    onClick={exportToExcel}
                    className="
                      px-3 py-1.5
                      text-sm
                      border border-indigo-300
                      text-indigo-700
                      rounded
                      hover:bg-indigo-50
                      transition
                    "
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={() => setShowBack(true)}
                    className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1 rounded hover:bg-indigo-50"
                  >
                    View Chart
                  </button>
                </div>

                <DataTable data={reportData} page={page} setPage={setPage} />
              </div>

              {/* BACK SIDE – LINE CHART */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Trend View</h3>
                  <button
                    onClick={() => setShowBack(false)}
                    className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1 rounded hover:bg-indigo-50"
                  >
                    Back to Table
                  </button>
                </div>

                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData}>
                      <XAxis dataKey="label" angle={-20} textAnchor="end" height={70} />
                      <YAxis tickFormatter={formatCurrencyShort} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="totalRevenue"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </FlipCard>
          </>
        )}
      </div>
      
      {/* Add CSS for flip card */}
      <style jsx>{`
        .flip-card {
          perspective: 1000px;
          height: 500px; /* Adjust based on your content */
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

/* ================= CHART SECTION ================= */

const ChartSection = ({ data, type }) => {
  if (!data.length) return <p>No data</p>;

  //  limit bars ONLY for chart 
  const chartData = data.slice(0, 6);
 return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
      {/* Revenue Chart */}
      <ChartCard title="Revenue">
        {type === "time" ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 40 }}>
              <XAxis
                dataKey="label"
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={formatCurrencyShort}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                dataKey="totalRevenue"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={chartData}
              barCategoryGap={28}
              margin={{ top: 10, right: 20, bottom: 60 }}
            >
              <XAxis
                dataKey="label"
                angle={-20}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11, fill: "#374151" }}
              />
              <YAxis
                tickFormatter={formatCurrencyShort}
                width={70}
                tick={{ fontSize: 11, fill: "#374151" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="totalRevenue"
                fill="#22c55e"
                barSize={34}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Deals Distribution */}
      <ChartCard title="Deals Distribution">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="totalDeals"
              nameKey="label"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              iconSize={10}
              wrapperStyle={{
                fontSize: "12px",
                color: "#374151",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

/* TABLE  PAGINATION */

const DataTable = ({ data, page, setPage }) => {
  const start = (page - 1) * PAGE_SIZE;
  const paged = data.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  return (
    <div>
 <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200 bg-white">
  <table className="min-w-full text-sm">
    {/* Header */}
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 w-14">
        S.No
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
          Label
        </th>
        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">
          Leads
        </th>
        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">
          Pipeline
        </th>
        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">
          Customers
        </th>
        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">
          Revenue
        </th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-100">
      {paged.length === 0 ? (
        <tr>
          <td
            colSpan={6}
            className="px-6 py-14 text-center text-gray-400 text-sm"
          >
            No data available
          </td>
        </tr>
      ) : (
        paged.map((row, i) => (
          <tr
            key={i}
            className="hover:bg-indigo-50/40 transition-colors"
          >
            {/* Index */}
            <td className="px-6 py-4 text-sm font-semibold text-gray-700">
              {start + i + 1}
            </td>

            {/* Label */}
            <td className="px-6 py-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  {row.label || "Unspecified"}
                </span>
              </div>
            </td>

            {/* Leads */}
            <td className="px-6 py-4 text-right">
              <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 text-gray-900 font-semibold">
                {row.totalLeads ?? 0}
              </span>
            </td>

            {/* Pipeline */}
            <td className="px-6 py-4 text-right font-medium text-gray-800">
              <span className="text-gray-700">₹</span>
              {(row.pipelineValue ?? 0).toLocaleString()}
            </td>

            {/* Customers */}
            <td className="px-6 py-4 text-right">
              <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                {row.totalDeals ?? 0}
              </span>
            </td>

            {/* Revenue */}
            <td className="px-6 py-4 text-right font-semibold text-green-700">
              ₹{(row.totalRevenue ?? 0).toLocaleString()}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>



      {/* Pagination */}
      <div className="flex justify-end items-center gap-3 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="
            px-3 py-1
            border border-indigo-300
            rounded
            text-indigo-700
            disabled:opacity-40
          "
        >
          Prev
        </button>

        <span className="text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="
            px-3 py-1
            border border-indigo-300
            rounded
            text-indigo-700
            disabled:opacity-40
          "
        >
          Next
        </button>
      </div>
    </div>
  );
};

/* UI  */
const ChartCard = ({ title, children }) => (
  <div
    className="
      bg-white
      border border-indigo-200
      rounded-xl
      p-4
      shadow-sm
    "
  >
    <h3 className="text-sm font-semibold text-indigo-700 mb-2">
      {title}
    </h3>
    {children}
  </div>
);

/* FLIP CARD COMPONENT */
const FlipCard = ({ showBack, children }) => {
  const [front, back] = React.Children.toArray(children);

  return (
    <div className={`flip-card ${showBack ? 'flipped' : ''}`}>
      <div className="flip-card-inner">
        {/* FRONT SIDE */}
        <div className="flip-card-front bg-white">
          {front}
        </div>
        
        {/* BACK SIDE */}
        <div className="flip-card-back bg-white">
          {back}
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakdownReport;


// import React, { useContext, useEffect, useState } from "react";
// import { ENDPOINTS } from "../../api/constraints";
// import axios from "axios";
// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
// } from "recharts";
// import { companyContext } from "../../context/companyContext";
// import { useNavigate } from "react-router-dom";
// import { FaArrowLeft } from "react-icons/fa";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";

// /* ================= CONSTANTS ================= */

// const COLORS = [
//   "#22c55e",
//   "#6366f1",
//   "#f59e0b",
//   "#ef4444",
//   "#06b6d4",
//   "#a855f7",
// ];

// const PAGE_SIZE = 5;


// const formatCurrencyShort = (value) => {
//   if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
//   if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
//   if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
//   return `₹${value}`;
// };

// // Clean tooltip
// const CustomTooltip = ({ active, payload }) => {
//   if (active && payload && payload.length) {
//     const d = payload[0].payload;
//     return (
//       <div className="bg-white border rounded-lg shadow px-3 py-2 text-sm">
//         <p className="font-semibold">{d.label}</p>
//         <p className="text-green-600">
//           Revenue: {formatCurrencyShort(d.totalRevenue)}
//         </p>
//         <div className="text-gray-600">Leads: {d.totalLeads}</div>
//         <p className="text-gray-600">Deals: {d.totalDeals}</p>
//       </div>
//     );
//   }
//   return null;
// };

// /* ================= MAIN ================= */

// const RevenueBreakdownReport = () => {
//   const { companyId } = useContext(companyContext);
//   const navigate = useNavigate();

//   const [active, setActive] = useState("service");
//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [showBack, setShowBack] = useState(false);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   const exportToExcel = () => {
//     if (!reportData.length) return;

//     // Prepare clean data for Excel
//     const excelData = reportData.map((item, index) => ({
//       "S.No": index + 1,
//       Label: item.label,
//       Revenue: item.totalRevenue,
//       Pipeline: item.pipelineValue,
//       Deals: item.totalDeals,
//     }));

//     // Create worksheet
//     const worksheet = XLSX.utils.json_to_sheet(excelData);

//     // Auto column width (important for long labels)
//     worksheet["!cols"] = [
//       { wch: 6 },
//       { wch: 45 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 10 },
//     ];

//     // Create workbook
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Report");

//     // Generate Excel buffer
//     const excelBuffer = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "array",
//     });

//     // Download
//     const file = new Blob([excelBuffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });

//     saveAs(
//       file,
//       `Revenue_Report_${active}_${new Date().toISOString().slice(0, 10)}.xlsx`
//     );
//   };

//   const fetchTimeData = async () => {
//     if (!fromDate || !toDate) return;

//     const token = localStorage.getItem("token");
//     setLoading(true);

//     const res = await axios.get(
//       `${ENDPOINTS.REVENUE_REPORT}/${companyId}`,
//       {
//         headers: { Authorization: `Bearer ${token}` },
//         params: {
//           groupBy: "time",
//           fromDate,
//           toDate,
//         },
//       }
//     );

//     const data = res.data.data || [];

//     setReportData(
//       data.sort((a, b) => new Date(a.label) - new Date(b.label))
//     );

//     setLoading(false);
//   };

//   const fetchRevenue = async (type) => {
//     const token = localStorage.getItem("token");

//     const res = await axios.get(
//       `${ENDPOINTS.REVENUE_REPORT}/${companyId}`,
//       {
//         headers: { Authorization: `Bearer ${token}` },
//         params: { groupBy: type },
//       }
//     );

//     const data = res.data.data || [];

//     //  ONLY SORT 
//     if (type === "time") {
//       return data
//         .map((i) => ({ ...i, d: new Date(i.label) }))
//         .sort((a, b) => a.d - b.d)
//         .map(({ d, ...rest }) => rest);
//     }

//     return data.sort((a, b) => b.totalRevenue - a.totalRevenue);
//   };

//   useEffect(() => {
//     if (active === "time") {
//       setReportData([]);
//       setLoading(false);
//       return;
//     }

//     if (!companyId) return;
//     setLoading(true);
//     setPage(1);

//     fetchRevenue(active)
//       .then(setReportData)
//       .finally(() => setLoading(false));
//   }, [active, companyId]);

//   return (
//     <div className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-3">
//         <button
//           onClick={() => navigate("/reportpage")}
//           className="p-2 rounded-full bg-white shadow"
//         >
//           <FaArrowLeft />
//         </button>
//         <h2 className="text-xl md:text-2xl font-bold">
//           Revenue Breakdown
//         </h2>
//       </div>

//       {/* Tabs */}
//       <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
//         {["service", "subservice", "client", "salesperson", "region", "time"].map((k) => (
//           <button
//             key={k}
//             onClick={() => setActive(k)}
//             className={`p-3 rounded-xl font-semibold capitalize shadow transition
//               ${
//                 active === k
//                   ? "bg-indigo-600 text-white"
//                   : "bg-white hover:bg-indigo-50"
//               }`}
//           >
//             {k === "subservice" ? "Sub-Service" : k}
//           </button>
//         ))}
//       </div>

//       {active === "time" && (
//         <div className="flex gap-3 bg-white p-4 rounded-xl shadow">
//           <div>
//             <label className="text-sm text-gray-600">From</label>
//             <input
//               type="date"
//               value={fromDate}
//               onChange={(e) => setFromDate(e.target.value)}
//               className="border rounded px-3 py-2"
//             />
//           </div>

//           <div>
//             <label className="text-sm text-gray-600">To</label>
//             <input
//               type="date"
//               value={toDate}
//               onChange={(e) => setToDate(e.target.value)}
//               className="border rounded px-3 py-2"
//             />
//           </div>

//           <button
//             onClick={fetchTimeData}
//             className="px-4 py-2 bg-indigo-600 text-white rounded"
//           >
//             Apply
//           </button>
//         </div>
//       )}

//       {/* Charts + Table */}
//       <div className="bg-white rounded-xl shadow p-4 md:p-6">
//         {loading ? (
//           <p className="text-gray-500">Loading…</p>
//         ) : (
//           <>
//             <ChartSection data={reportData} type={active} />
//             <FlipCard showBack={showBack}>
//               {/* FRONT SIDE – TABLE */}
//               <div>
//                 <div className="flex justify-between items-center mb-3">
//                   <h3 className="text-lg font-semibold">Detailed Data</h3>
//                   <button
//                     onClick={exportToExcel}
//                     className="
//                       px-3 py-1.5
//                       text-sm
//                       border border-indigo-300
//                       text-indigo-700
//                       rounded
//                       hover:bg-indigo-50
//                       transition
//                     "
//                   >
//                     Export Excel
//                   </button>
//                   <button
//                     onClick={() => setShowBack(true)}
//                     className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1 rounded hover:bg-indigo-50"
//                   >
//                     View Chart
//                   </button>
//                 </div>

//                 <DataTable data={reportData} page={page} setPage={setPage} />
//               </div>

//               {/* BACK SIDE – LINE CHART */}
//               <div>
//                 <div className="flex justify-between items-center mb-3">
//                   <h3 className="text-lg font-semibold">Trend View</h3>
//                   <button
//                     onClick={() => setShowBack(false)}
//                     className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1 rounded hover:bg-indigo-50"
//                   >
//                     Back to Table
//                   </button>
//                 </div>

//                 <div className="w-full h-[320px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={reportData}>
//                       <XAxis dataKey="label" angle={-20} textAnchor="end" height={70} />
//                       <YAxis tickFormatter={formatCurrencyShort} />
//                       <Tooltip content={<CustomTooltip />} />
//                       <Line
//                         type="monotone"
//                         dataKey="totalRevenue"
//                         stroke="#22c55e"
//                         strokeWidth={3}
//                         dot={{ r: 4 }}
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             </FlipCard>
//           </>
//         )}
//       </div>
      
//       {/* Add CSS for flip card */}
//       <style jsx>{`
//         .flip-card {
//           perspective: 1000px;
//           height: 500px; /* Adjust based on your content */
//         }
        
//         .flip-card-inner {
//           position: relative;
//           width: 100%;
//           height: 100%;
//           text-align: center;
//           transition: transform 0.6s;
//           transform-style: preserve-3d;
//         }
        
//         .flip-card.flipped .flip-card-inner {
//           transform: rotateY(180deg);
//         }
        
//         .flip-card-front, .flip-card-back {
//           position: absolute;
//           width: 100%;
//           height: 100%;
//           -webkit-backface-visibility: hidden;
//           backface-visibility: hidden;
//           padding: 20px;
//           box-sizing: border-box;
//         }
        
//         .flip-card-back {
//           transform: rotateY(180deg);
//         }
//       `}</style>
//     </div>
//   );
// };

// /* ================= CHART SECTION ================= */

// const ChartSection = ({ data, type }) => {
//   if (!data.length) return <p>No data</p>;

//   //  limit bars ONLY for chart 
//   const chartData = data.slice(0, 6);

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
//       {/* Revenue Chart */}
//       <ChartCard title="Revenue">
//         {type === "time" ? (
//           <ResponsiveContainer width="100%" height={260}>
//             <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 40 }}>
//               <XAxis
//                 dataKey="label"
//                 angle={-15}
//                 textAnchor="end"
//                 height={60}
//               />
//               <YAxis
//                 tickFormatter={formatCurrencyShort}
//                 width={70}
//               />
//               <Tooltip content={<CustomTooltip />} />
//               <Line
//                 dataKey="totalRevenue"
//                 stroke="#22c55e"
//                 strokeWidth={3}
//                 dot={{ r: 4 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         ) : (
//           <ResponsiveContainer width="100%" height={260}>
//             <BarChart
//               data={chartData}
//               barCategoryGap={28}
//               margin={{ top: 10, right: 20, bottom: 60 }}
//             >
//               <XAxis
//                 dataKey="label"
//                 angle={-20}
//                 textAnchor="end"
//                 height={80}
//                 tick={{ fontSize: 11, fill: "#374151" }}
//               />
//               <YAxis
//                 tickFormatter={formatCurrencyShort}
//                 width={70}
//                 tick={{ fontSize: 11, fill: "#374151" }}
//               />
//               <Tooltip content={<CustomTooltip />} />
//               <Bar
//                 dataKey="totalRevenue"
//                 fill="#22c55e"
//                 barSize={34}
//                 radius={[6, 6, 0, 0]}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         )}
//       </ChartCard>

//       {/* Deals Distribution */}
//       <ChartCard title="Deals Distribution">
//         <ResponsiveContainer width="100%" height={260}>
//           <PieChart>
//             <Pie
//               data={chartData}
//               dataKey="totalDeals"
//               nameKey="label"
//               innerRadius={65}
//               outerRadius={95}
//               paddingAngle={3}
//             >
//               {chartData.map((_, i) => (
//                 <Cell key={i} fill={COLORS[i % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend
//               iconSize={10}
//               wrapperStyle={{
//                 fontSize: "12px",
//                 color: "#374151",
//               }}
//             />
//           </PieChart>
//         </ResponsiveContainer>
//       </ChartCard>
//     </div>
//   );
// };

// /* TABLE  PAGINATION */

// const DataTable = ({ data, page, setPage }) => {
//   const start = (page - 1) * PAGE_SIZE;
//   const paged = data.slice(start, start + PAGE_SIZE);
//   const totalPages = Math.ceil(data.length / PAGE_SIZE);

//   return (
//     <div>
//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm border border-indigo-200 rounded-lg overflow-hidden">
//           <thead className="bg-indigo-50 text-indigo-700">
//             <tr>
//               <th className="p-3 border border-indigo-200 text-center w-12"> S.No </th>
//               <th className="p-3 border border-indigo-200 text-left"> Label </th>
//               <th className="p-3 border border-indigo-200 text-center"> Leads </th>
//               <th className="p-3 border border-indigo-200 text-right"> Pipeline </th>
//               <th className="p-3 border border-indigo-200 text-center"> Customer </th>
//               <th className="p-3 border border-indigo-200 text-right"> Revenue </th>
//             </tr>
//           </thead>

//           <tbody>
//             {paged.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={6}
//                   className="p-4 text-center text-gray-500"
//                 >
//                   No data available
//                 </td>
//               </tr>
//             ) : (
//               paged.map((row, i) => (
//                 <tr
//                   key={i}
//                   className="hover:bg-indigo-50 transition"
//                 >
//                   {/* SERIAL NUMBER  */}
//                   <td className="p-3 border border-indigo-100 text-center font-medium">
//                     {start + i + 1}
//                   </td>

//                   <td className="p-3 border border-indigo-100 text-gray-800">
//                     {row.label}
//                   </td>

//                   <td className="p-3 border border-indigo-100 text-center font-semibold">
//                     {row.totalLeads ?? 0}
//                   </td>
//                   <td className="p-3 border border-indigo-100 text-right">
//                     ₹{(row.pipelineValue ?? 0).toLocaleString()}
//                   </td>
//                   <td className="p-3 border border-indigo-100 text-center font-semibold">
//                     {row.totalDeals ?? 0}
//                   </td>
//                   <td className="p-3 border border-indigo-100 text-right font-medium">
//                     ₹{(row.totalRevenue ?? 0).toLocaleString()}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="flex justify-end items-center gap-3 mt-4">
//         <button
//           disabled={page === 1}
//           onClick={() => setPage(page - 1)}
//           className="
//             px-3 py-1
//             border border-indigo-300
//             rounded
//             text-indigo-700
//             disabled:opacity-40
//           "
//         >
//           Prev
//         </button>

//         <span className="text-sm text-gray-600">
//           Page {page} of {totalPages || 1}
//         </span>

//         <button
//           disabled={page === totalPages || totalPages === 0}
//           onClick={() => setPage(page + 1)}
//           className="
//             px-3 py-1
//             border border-indigo-300
//             rounded
//             text-indigo-700
//             disabled:opacity-40
//           "
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// /* UI  */
// const ChartCard = ({ title, children }) => (
//   <div
//     className="
//       bg-white
//       border border-indigo-200
//       rounded-xl
//       p-4
//       shadow-sm
//     "
//   >
//     <h3 className="text-sm font-semibold text-indigo-700 mb-2">
//       {title}
//     </h3>
//     {children}
//   </div>
// );

// /* FLIP CARD COMPONENT */
// const FlipCard = ({ showBack, children }) => {
//   const [front, back] = React.Children.toArray(children);

//   return (
//     <div className={`flip-card ${showBack ? 'flipped' : ''}`}>
//       <div className="flip-card-inner">
//         {/* FRONT SIDE */}
//         <div className="flip-card-front bg-white">
//           {front}
//         </div>
        
//         {/* BACK SIDE */}
//         <div className="flip-card-back bg-white">
//           {back}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RevenueBreakdownReport;


