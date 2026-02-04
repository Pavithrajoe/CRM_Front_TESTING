import React, { useContext, useEffect, useState } from "react";
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

/* ================= HELPERS ================= */

// ✅ Fix 00000 issue (PRO formatting)
const formatCurrencyShort = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

// ✅ Clean tooltip
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
const [showAllCharts, setShowAllCharts] = useState(false);


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
    `http://localhost:3000/api/reports/revenue/${companyId}`,
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
    data.sort(
      (a, b) => new Date(a.label) - new Date(b.label)
    )
  );

  setLoading(false);
};


  const fetchRevenue = async (type) => {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      `http://localhost:3000/api/reports/revenue/${companyId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { groupBy: type },
      }
    );

    const data = res.data.data || [];

    // ✅ ONLY SORT (no aggregation)
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
        <FlipCard
  showBack={showBack}
  onToggle={() => setShowBack(!showBack)}
>
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

    <ResponsiveContainer width="100%" height={320}>
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
</FlipCard>

          </>
        )}
      </div>
    </div>
  );
};

/* ================= CHART SECTION ================= */

const ChartSection = ({ data, type }) => {
  if (!data.length) return <p>No data</p>;

  // ✅ limit bars ONLY for chart (not table)
  const chartData = data.slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
      {/* Revenue Chart */}
      <ChartCard title="Revenue">
        {type === "time" ? (
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
        ) : (
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

        )}
      </ChartCard>

      {/* Deals Distribution */}
      <ChartCard title="Deals Distribution">
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

      </ChartCard>
    </div>
  );
};

/* ================= TABLE + PAGINATION ================= */

const DataTable = ({ data, page, setPage }) => {
  const start = (page - 1) * PAGE_SIZE;
  const paged = data.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-indigo-200 rounded-lg overflow-hidden">
          <thead className="bg-indigo-50 text-indigo-700">
            <tr>
              <th className="p-3 border border-indigo-200 text-center w-12">
                #
              </th>
              <th className="p-3 border border-indigo-200 text-left">
                Label
              </th>
              <th className="p-3 border border-indigo-200 text-center">
                Leads
              </th>
               <th className="p-3 border border-indigo-200 text-right">
                Pipeline
              </th>
               <th className="p-3 border border-indigo-200 text-center">
              Customer
              </th>
              <th className="p-3 border border-indigo-200 text-right">
                Revenue
              </th>
             
             
            </tr>
          </thead>

          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-indigo-50 transition"
                >
                  {/* ✅ SERIAL NUMBER (global index) */}
                  <td className="p-3 border border-indigo-100 text-center font-medium">
                    {start + i + 1}
                  </td>

                  <td className="p-3 border border-indigo-100 text-gray-800">
                    {row.label}
                  </td>

                  <td className="p-3 border border-indigo-100 text-center font-semibold">
                    {row.totalLeads ?? 0}
                  </td>
                  <td className="p-3 border border-indigo-100 text-right">
                    ₹{(row.pipelineValue ?? 0).toLocaleString()}
                  </td>
                   <td className="p-3 border border-indigo-100 text-center font-semibold">
                    {row.totalDeals ?? 0}
                  </td>
                  <td className="p-3 border border-indigo-100 text-right font-medium">
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

/* ================= UI ================= */
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
    <ResponsiveContainer width="100%" height={260}>
      {children}
    </ResponsiveContainer>
  </div>
);


export default RevenueBreakdownReport;
const FlipCard = ({ showBack, onToggle, children }) => {
  const [front, back] = React.Children.toArray(children);

  return (
    <div className="relative w-full perspective">
      <div
        className={`
          relative w-full transition-transform duration-700
          transform-style-preserve-3d
          ${showBack ? "rotate-y-180" : ""}
        `}
      >
        {/* FRONT */}
        <div className="backface-hidden">
          {front}
        </div>

        {/* BACK */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white">
          {back}
        </div>
      </div>
    </div>
  );
};


// import React, { useContext, useEffect, useState } from "react";
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

// const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4"];

// const calcTotals = (data = []) => {
//   return data.reduce(
//     (acc, cur) => {
//       acc.revenue += cur.totalRevenue || 0;
//       acc.deals += cur.totalDeals || 0;
//       return acc;
//     },
//     { revenue: 0, deals: 0 }
//   );
// };

// const ChartTitle = ({ title }) => (
//   <h3 className="text-lg font-semibold mb-3 mt-6">{title}</h3>
// );

// const RevenueBreakdownReport = () => {
//   const { companyId } = useContext(companyContext);
//   const navigate = useNavigate();

//   const [salesperson, setSalesperson] = useState([]);
//   const [service, setService] = useState([]);
//   const [client, setClient] = useState([]);
//   const [region, setRegion] = useState([]);
//   const [time, setTime] = useState({});
//   const [active, setActive] = useState("salesperson");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!companyId) return;

//     const token = localStorage.getItem("token");
//     const headers = { Authorization: `Bearer ${token}` };

//     Promise.all([
//       axios.get(
//         `http://192.168.29.236:3000/api/reports/revenue-by-salesperson/${companyId}`,
//         { headers }
//       ),
//       axios.get(
//         `http://192.168.29.236:3000/api/reports/revenue-by-service/${companyId}`,
//         { headers }
//       ),
//       axios.get(
//         `http://192.168.29.236:3000/api/reports/revenue-by-client/${companyId}`,
//         { headers }
//       ),
//       axios.get(
//         `http://192.168.29.236:3000/api/reports/revenue-by-region/${companyId}`,
//         { headers }
//       ),
//       axios.get(
//         `http://192.168.29.236:3000/api/reports/revenue-by-time-period/${companyId}`,
//         { headers }
//       ),
//     ])
//       .then(([sp, sv, cl, rg, tm]) => {
//         setSalesperson(sp.data.data || []);
//         setService(sv.data.data || []);
//         setClient(cl.data.data || []);
//         setRegion(rg.data.data || []);
//         setTime(tm.data.data || {});
//       })
//       .finally(() => setLoading(false));
//   }, [companyId]);

//   if (loading) return <p>Loading Revenue Report...</p>;

//   return (
//     <div className="space-y-6 p-4">
//       {/* ================= HEADER WITH BACK BUTTON ================= */}
//       <div className="flex items-center gap-4">
//         <button
//           onClick={() => navigate("/reportpage")}
//           className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition"
//           aria-label="Back to reports"
//         >
//           <FaArrowLeft size={22} />
//         </button>

//         <h2 className="text-2xl font-semibold">💰 Revenue Breakdown</h2>
//       </div>

//       {/* 🔹 TOP 5 CLICKABLE CARDS */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//         <TopCard
//           label="Salesperson"
//           active={active === "salesperson"}
//           onClick={() => setActive("salesperson")}
//         />
//         <TopCard
//           label="Service"
//           active={active === "service"}
//           onClick={() => setActive("service")}
//         />
//         <TopCard
//           label="Client"
//           active={active === "client"}
//           onClick={() => setActive("client")}
//         />
//         <TopCard
//           label="Region"
//           active={active === "region"}
//           onClick={() => setActive("region")}
//         />
//         <TopCard
//           label="Time Period"
//           active={active === "time"}
//           onClick={() => setActive("time")}
//         />
//       </div>

//       {/* 🔹 REPORT AREA */}
//       <div className="bg-white p-4 rounded-2xl shadow">
//         {active === "salesperson" && (
//           <RevenueBySalesperson data={salesperson} />
//         )}
//         {active === "service" && <RevenueByService data={service} />}
//         {active === "client" && <RevenueByClient data={client} />}
//         {active === "region" && <RevenueByRegion data={region} />}
//         {active === "time" && <RevenueByTime data={time} />}
//       </div>
//     </div>
//   );
// };

// /* ===================== 5 SEPARATE COMPONENTS ===================== */

// const RevenueBySalesperson = ({ data }) => {
//   const { revenue, deals } = calcTotals(data);

//   return (
//     <>
//       <KpiRow>
//         <KpiCard title="Salespersons" value={data.length} />
//         <KpiCard
//           title="Total Revenue"
//           value={`₹${revenue.toLocaleString()}`}
//         />
//         <KpiCard title="Total Deals" value={deals} />
//       </KpiRow>

//       <BarBlock data={data} xKey="salesperson" />
//       <LineBlock data={data} xKey="salesperson" yKey="totalDeals" />
//       <PieBlock data={data} nameKey="salesperson" />
//     </>
//   );
// };

// const RevenueByService = ({ data }) => {
//   const { revenue, deals } = calcTotals(data);

//   return (
//     <>
//       <KpiRow>
//         <KpiCard title="Services" value={data.length} />
//         <KpiCard
//           title="Total Revenue"
//           value={`₹${revenue.toLocaleString()}`}
//         />
//         <KpiCard title="Total Deals" value={deals} />
//       </KpiRow>

//       <BarBlock data={data} xKey="service" />
//       <LineBlock data={data} xKey="service" yKey="totalDeals" />
//       <PieBlock data={data} nameKey="service" />
//     </>
//   );
// };

// const RevenueByClient = ({ data }) => {
//   const { revenue, deals } = calcTotals(data);

//   return (
//     <>
//       <KpiRow>
//         <KpiCard title="Clients" value={data.length} />
//         <KpiCard
//           title="Total Revenue"
//           value={`₹${revenue.toLocaleString()}`}
//         />
//         <KpiCard title="Total Deals" value={deals} />
//       </KpiRow>

//       <BarBlock data={data.slice(0, 15)} xKey="clientName" />
//       <PieBlock data={data.slice(0, 10)} nameKey="clientName" />
//     </>
//   );
// };

// const RevenueByRegion = ({ data }) => {
//   const { revenue, deals } = calcTotals(data);

//   return (
//     <>
//       <KpiRow>
//         <KpiCard title="Regions" value={data.length} />
//         <KpiCard
//           title="Total Revenue"
//           value={`₹${revenue.toLocaleString()}`}
//         />
//         <KpiCard title="Total Deals" value={deals} />
//       </KpiRow>

//       <BarBlock data={data} xKey="region" />
//       <PieBlock data={data} nameKey="region" />
//     </>
//   );
// };

// const RevenueByTime = ({ data }) => {
//   const summary = data?.summary || {};
//   const daily = data?.dailyRevenue || [];
//   const monthly = data?.monthlyRevenue || [];
//   const yearly = data?.yearlyRevenue || [];

//   return (
//     <>
//       <KpiRow>
//         <KpiCard
//           title="This Month Revenue"
//           value={`₹${(summary.revenueThisMonth || 0).toLocaleString()}`}
//         />
//         <KpiCard
//           title="This Year Revenue"
//           value={`₹${(summary.revenueThisYear || 0).toLocaleString()}`}
//         />
//         <KpiCard
//           title="Total Revenue"
//           value={`₹${(summary.totalRevenue || 0).toLocaleString()}`}
//         />
//       </KpiRow>

//       <ChartTitle title="Daily Revenue Trend" />
//       <ChartBlock>
//         <LineChart data={daily}>
//           <XAxis dataKey="date" />
//           <YAxis />
//           <Tooltip />
//           <Line type="monotone" dataKey="revenue" strokeWidth={2} />
//         </LineChart>
//       </ChartBlock>

//       <ChartTitle title="Monthly Revenue" />
//       <ChartBlock>
//         <BarChart data={monthly}>
//           <XAxis dataKey="month" />
//           <YAxis />
//           <Tooltip />
//           <Bar dataKey="revenue" />
//         </BarChart>
//       </ChartBlock>

//       <ChartTitle title="Yearly Revenue" />
//       <ChartBlock>
//         <BarChart data={yearly}>
//           <XAxis dataKey="year" />
//           <YAxis />
//           <Tooltip />
//           <Bar dataKey="revenue" />
//         </BarChart>
//       </ChartBlock>
//     </>
//   );
// };

// /* ===================== COMMON UI BLOCKS ===================== */

// const TopCard = ({ label, active, onClick }) => (
//   <button
//     onClick={onClick}
//     className={`p-4 rounded-xl font-semibold transition ${
//       active
//         ? "bg-blue-600 text-white"
//         : "bg-gray-100 hover:bg-blue-100"
//     }`}
//   >
//     {label}
//   </button>
// );

// const KpiRow = ({ children }) => (
//   <div className="flex flex-wrap gap-4 mb-6">{children}</div>
// );

// const KpiCard = ({ title, value }) => (
//   <div className="bg-gray-50 p-4 rounded-xl w-56">
//     <p className="text-sm text-gray-500">{title}</p>
//     <p className="text-xl font-bold">{value}</p>
//   </div>
// );

// const BarBlock = ({ data, xKey }) => (
//   <ChartBlock>
//     <BarChart data={data}>
//       <XAxis dataKey={xKey} />
//       <YAxis />
//       <Tooltip />
//       <Bar dataKey="totalRevenue" />
//     </BarChart>
//   </ChartBlock>
// );

// const LineBlock = ({ data, xKey, yKey }) => (
//   <ChartBlock>
//     <LineChart data={data}>
//       <XAxis dataKey={xKey} />
//       <YAxis />
//       <Tooltip />
//       <Line dataKey={yKey} strokeWidth={2} />
//     </LineChart>
//   </ChartBlock>
// );

// const PieBlock = ({ data, nameKey }) => (
//   <ChartBlock>
//     <PieChart>
//       <Pie data={data} dataKey="totalRevenue" nameKey={nameKey} label>
//         {data.map((_, i) => (
//           <Cell key={i} fill={COLORS[i % COLORS.length]} />
//         ))}
//       </Pie>
//       <Tooltip />
//       <Legend />
//     </PieChart>
//   </ChartBlock>
// );

// const ChartBlock = ({ children }) => (
//   <ResponsiveContainer width="100%" height={300}>
//     {children}
//   </ResponsiveContainer>
// );

// export default RevenueBreakdownReport;
