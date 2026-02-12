import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; 
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import LeadSummaryModal from "../../pages/dashboard/LeadViewComponents/LeadSummaryModal.jsx";
import { ENDPOINTS } from "../../api/constraints.js";
import Pagination from "../../context/Pagination/pagination.jsx";
import usePagination from "../../hooks/usePagination.jsx";

const STATUS_COLORS = {
  Active: "#2563eb",
  Converted: "#16a34a",
  Lost: "#ef4444",
};

const SalespersonPerformanceReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();
  const [perfData, setPerfData] = useState([]);
  const itemsPerPage = 10; 
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [loading, setLoading] = useState(true);
  // Date Filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLeadId, setSummaryLeadId] = useState(null);


  /* ================= FETCH DATA ================= */

useEffect(() => {
  if (!companyId) return;

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${ENDPOINTS.SALES_PERSON_PERFORMANCE}/${companyId}`,
        { headers }
      );

      setPerfData(res.data.data || []);

    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [companyId]);

useEffect(() => {
  setCurrentPage(1);
}, [fromDate, toDate, selectedUser]);



  /* ================= HELPERS ================= */
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; 
    const strTime = `${hours}:${minutes} ${ampm}`;

    return `${day}-${month}-${year} ${strTime}`;
  };

  
const users = useMemo(() => {
  return perfData.map((d) => ({
    id: d.user_id,
    name: d.salesperson,
  }));
}, [perfData]);

  
  const filteredPerf = useMemo(() => {
    if (selectedUser === "ALL") return perfData;
    return perfData.filter((d) => String(d.user_id) === selectedUser);
  }, [perfData, selectedUser]);


const filteredLeads = useMemo(() => {
  let allLeads = [];

  // Collect leads from API
  perfData.forEach((user) => {
    if (Array.isArray(user.leads)) {
      user.leads.forEach((l) => {
        allLeads.push({
          id: l.lead_id,
          name: l.lead_name,
          status: l.status_name,
          createdAt: l.created_at,
          createdBy: l.created_by,
        });
      });
    }
  });

  // Filter by User
  if (selectedUser !== "ALL") {
    const userName = users.find(
      (u) => String(u.id) === selectedUser
    )?.name;

    allLeads = allLeads.filter(
      (l) => l.createdBy === userName
    );
  }

  //  Filter by Date
  if (fromDate) {
    const from = new Date(fromDate);

    allLeads = allLeads.filter(
      (l) => new Date(l.createdAt) >= from
    );
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); 

    allLeads = allLeads.filter(
      (l) => new Date(l.createdAt) <= to
    );
  }

  return allLeads;
}, [perfData, selectedUser, users, fromDate, toDate]);


const {
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedData
} = usePagination(filteredLeads, 10);

  const kpi = useMemo(() => {
  const totalLeads = filteredLeads.length;
  let active = 0;
  let lost = 0;
  let converted = 0;

  filteredLeads.forEach((l) => {
    const status = l.status?.toLowerCase() || "";

    if (status.includes("demo") || status.includes("discussion")) {
      active++;
    }

    if (status.includes("lost")) {
      lost++;
    }

    if (status.includes("dealing") || status.includes("won")) {
      converted++;
    }
  });

  const conversion =
    totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(2) : 0;

  return {
    totalLeads,
    activeLeads: active,
    lostLeads: lost,
    websiteLeads: 0,
    converted,
    revenue: filteredPerf.reduce((a, b) => a + b.totalRevenue, 0),
    conversion,
  };
}, [filteredLeads, filteredPerf]);


  const pieData = useMemo(() => {
    return [
      { name: "Active", value: kpi.activeLeads },
      { name: "Converted", value: kpi.converted },
      { name: "Lost", value: kpi.lostLeads },
    ].filter(item => item.value > 0);
  }, [kpi]);

  /* ================= EXPORT TO EXCEL ================= */
  const exportToExcel = () => {
    const excelData = filteredLeads.map((l, i) => ({
      "S.No": i + 1,
      "Lead Name": l.name,
      "Email": l.email,
      "Status": l.status,
      "Created At": formatDate(l.createdAt),
      "Created By": l.createdBy
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Report");
    XLSX.writeFile(workbook, "Lead_Report.xlsx");
  };

    const revenueChartData = useMemo(() => {
  const map = {};

  filteredLeads.forEach((l) => {
    if (!map[l.createdBy]) {
      map[l.createdBy] = 0;
    }

    // Find revenue from perfData
    const userPerf = perfData.find(
      (p) => p.salesperson === l.createdBy
    );

    if (userPerf) {
      map[l.createdBy] +=
        userPerf.totalRevenue / userPerf.totalLeads || 0;
    }
  });

  return Object.keys(map).map((k) => ({
    salesperson: k,
    totalRevenue: Math.round(map[k]),
  }));
}, [filteredLeads, perfData]);


  if (loading) return <div className="p-10 text-center font-semibold">Loading Report...</div>;


  return (
    <div className="p-6 space-y-8 bg-[#f8fafc] min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/reportpage")}
            className="p-2.5 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 rounded-lg transition-all"
          >
            <FaArrowLeft size={18} className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Sales Person - Performance Analytics
          </h2>
        </div>

       <div className="flex flex-wrap gap-3 w-full md:w-auto">

        {/* FROM DATE */}
        <div className="flex flex-col text-xs">
          <span className="text-gray-500 font-semibold">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm"
          />
        </div>

        {/* TO DATE */}
        <div className="flex flex-col text-xs">
          <span className="text-gray-500 font-semibold">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm"
          />
        </div>

        {/* USER FILTER */}
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">All Salespersons</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

      </div>

        
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <KpiCard title="Total Leads" value={kpi.totalLeads} borderColor="border-blue-500" bgColor="bg-blue-50" textColor="text-blue-700" />
        <KpiCard title="Active Leads" value={kpi.activeLeads} borderColor="border-indigo-500" bgColor="bg-indigo-50" textColor="text-indigo-700" />
        <KpiCard title="Lost Leads" value={kpi.lostLeads} borderColor="border-red-500" bgColor="bg-red-50" textColor="text-red-700" />
        <KpiCard title="Website Leads" value={kpi.websiteLeads} borderColor="border-amber-500" bgColor="bg-amber-50" textColor="text-amber-700" />
        <KpiCard title="Won Leads" value={kpi.converted} borderColor="border-emerald-500" bgColor="bg-emerald-50" textColor="text-emerald-700" />
        <KpiCard title="Conv. Rate" value={`${kpi.conversion}%`} borderColor="border-purple-500" bgColor="bg-purple-50" textColor="text-purple-700" />
        <KpiCard title="Revenue" value={`₹${kpi.revenue.toLocaleString()}`} borderColor="border-cyan-600" bgColor="bg-cyan-50" textColor="text-cyan-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Distribution">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="salesperson" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline Status Mix">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={5}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            <h3 className="text-lg font-bold text-gray-800">Detailed Lead Logs</h3>
          </div>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
          >
            <FaDownload size={14} />
            Export Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">S.No</th>
                <th className="px-6 py-4 font-bold">Lead Name</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created At</th>
                <th className="px-6 py-4 font-bold">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((lead, index) => (
                <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-400 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-6 py-4">
                  <button
                  onClick={() => {
                    setSummaryLeadId(lead.id);
                    setShowSummary(true);
                  }}
                  className=" text-sm font-semibold text-blue-700 hover:underline hover:text-blue-900 transition text-left"
                  title="View Lead Summary"
                >
                  {lead.name}
                </button>

                    <div className="text-[11px] text-gray-400">{lead.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-tight">
                      {lead.status || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 font-medium">{lead.createdBy}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* PAGINATION */}
             <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />

            {showSummary && summaryLeadId && (
              <LeadSummaryModal
                leadId={summaryLeadId}
                onClose={() => {
                  setShowSummary(false);
                  setSummaryLeadId(null);
                }}
              />
            )}


        </div>
      </div>
    </div>
  );
};

/* ================= REUSABLE COMPONENTS ================= */
const KpiCard = ({ title, value, borderColor, bgColor, textColor }) => (
  <div className={`bg-white rounded-2xl shadow-sm border-2 ${borderColor} p-5 flex flex-col items-center justify-center transition-transform hover:scale-105`}>
    <div className={`mb-2 px-3 py-1 rounded-full ${bgColor} ${textColor} text-[10px] font-black uppercase tracking-widest`}>
      {title}
    </div>
    <div className="text-xl font-extrabold text-gray-900">{value}</div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
      {title}
    </h3>
    {children}
  </div>
);

export default SalespersonPerformanceReport;




// import React, { useContext, useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx"; 
// import {
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   ResponsiveContainer,
// } from "recharts";
// import { companyContext } from "../../context/companyContext";
// import { useNavigate } from "react-router-dom";
// import { FaArrowLeft, FaDownload } from "react-icons/fa";
// import LeadSummaryModal from "../../pages/dashboard/LeadViewComponents/LeadSummaryModal.jsx";
// import { ENDPOINTS } from "../../api/constraints.js";
// import Pagination from "../../context/Pagination/pagination.jsx";

// const STATUS_COLORS = {
//   Active: "#2563eb",
//   Converted: "#16a34a",
//   Lost: "#ef4444",
// };

// const SalespersonPerformanceReport = () => {
//   const { companyId } = useContext(companyContext);
//   const navigate = useNavigate();
//   const [perfData, setPerfData] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10; 
//   const [selectedUser, setSelectedUser] = useState("ALL");
//   const [loading, setLoading] = useState(true);
//   // Date Filter
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [showSummary, setShowSummary] = useState(false);
//   const [summaryLeadId, setSummaryLeadId] = useState(null);


//   /* ================= FETCH DATA ================= */

// useEffect(() => {
//   if (!companyId) return;

//   const token = localStorage.getItem("token");
//   const headers = { Authorization: `Bearer ${token}` };

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       const res = await axios.get(`${ENDPOINTS.SALES_PERSON_PERFORMANCE}/${companyId}`,
//         { headers }
//       );

//       setPerfData(res.data.data || []);

//     } catch (err) {
//       console.error("API Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchData();
// }, [companyId]);

// useEffect(() => {
//   setCurrentPage(1);
// }, [fromDate, toDate, selectedUser]);



//   /* ================= HELPERS ================= */
//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
    
//     let hours = date.getHours();
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     hours = hours % 12 || 12; 
//     const strTime = `${hours}:${minutes} ${ampm}`;

//     return `${day}-${month}-${year} ${strTime}`;
//   };

//   // const users = useMemo(() => perfData.map((d) => ({ id: d.user_id, name: d.salesperson })), [perfData]);
  
// const users = useMemo(() => {
//   return perfData.map((d) => ({
//     id: d.user_id,
//     name: d.salesperson,
//   }));
// }, [perfData]);

  
//   const filteredPerf = useMemo(() => {
//     if (selectedUser === "ALL") return perfData;
//     return perfData.filter((d) => String(d.user_id) === selectedUser);
//   }, [perfData, selectedUser]);


// const filteredLeads = useMemo(() => {
//   let allLeads = [];

//   // Collect leads from API
//   perfData.forEach((user) => {
//     if (Array.isArray(user.leads)) {
//       user.leads.forEach((l) => {
//         allLeads.push({
//           id: l.lead_id,
//           name: l.lead_name,
//           status: l.status_name,
//           createdAt: l.created_at,
//           createdBy: l.created_by,
//         });
//       });
//     }
//   });

//   // Filter by User
//   if (selectedUser !== "ALL") {
//     const userName = users.find(
//       (u) => String(u.id) === selectedUser
//     )?.name;

//     allLeads = allLeads.filter(
//       (l) => l.createdBy === userName
//     );
//   }

//   //  Filter by Date
//   if (fromDate) {
//     const from = new Date(fromDate);

//     allLeads = allLeads.filter(
//       (l) => new Date(l.createdAt) >= from
//     );
//   }

//   if (toDate) {
//     const to = new Date(toDate);
//     to.setHours(23, 59, 59, 999); 

//     allLeads = allLeads.filter(
//       (l) => new Date(l.createdAt) <= to
//     );
//   }

//   return allLeads;
// }, [perfData, selectedUser, users, fromDate, toDate]);


// const paginatedLeads = useMemo(() => {
//   const start = (currentPage - 1) * itemsPerPage;
//   const end = start + itemsPerPage;

//   return filteredLeads.slice(start, end);
// }, [filteredLeads, currentPage]);

// const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);


//   const kpi = useMemo(() => {
//   const totalLeads = filteredLeads.length;

//   let active = 0;
//   let lost = 0;
//   let converted = 0;

//   filteredLeads.forEach((l) => {
//     const status = l.status?.toLowerCase() || "";

//     if (status.includes("demo") || status.includes("discussion")) {
//       active++;
//     }

//     if (status.includes("lost")) {
//       lost++;
//     }

//     if (status.includes("dealing") || status.includes("won")) {
//       converted++;
//     }
//   });

//   const conversion =
//     totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(2) : 0;

//   return {
//     totalLeads,
//     activeLeads: active,
//     lostLeads: lost,
//     websiteLeads: 0,
//     converted,
//     revenue: filteredPerf.reduce((a, b) => a + b.totalRevenue, 0),
//     conversion,
//   };
// }, [filteredLeads, filteredPerf]);


//   const pieData = useMemo(() => {
//     return [
//       { name: "Active", value: kpi.activeLeads },
//       { name: "Converted", value: kpi.converted },
//       { name: "Lost", value: kpi.lostLeads },
//     ].filter(item => item.value > 0);
//   }, [kpi]);

//   /* ================= EXPORT TO EXCEL ================= */
//   const exportToExcel = () => {
//     const excelData = filteredLeads.map((l, i) => ({
//       "S.No": i + 1,
//       "Lead Name": l.name,
//       "Email": l.email,
//       "Status": l.status,
//       "Created At": formatDate(l.createdAt),
//       "Created By": l.createdBy
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(excelData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Report");
//     XLSX.writeFile(workbook, "Lead_Report.xlsx");
//   };

//     const revenueChartData = useMemo(() => {
//   const map = {};

//   filteredLeads.forEach((l) => {
//     if (!map[l.createdBy]) {
//       map[l.createdBy] = 0;
//     }

//     // Find revenue from perfData
//     const userPerf = perfData.find(
//       (p) => p.salesperson === l.createdBy
//     );

//     if (userPerf) {
//       map[l.createdBy] +=
//         userPerf.totalRevenue / userPerf.totalLeads || 0;
//     }
//   });

//   return Object.keys(map).map((k) => ({
//     salesperson: k,
//     totalRevenue: Math.round(map[k]),
//   }));
// }, [filteredLeads, perfData]);


//   if (loading) return <div className="p-10 text-center font-semibold">Loading Report...</div>;


//   return (
//     <div className="p-6 space-y-8 bg-[#f8fafc] min-h-screen">
//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => navigate("/reportpage")}
//             className="p-2.5 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 rounded-lg transition-all"
//           >
//             <FaArrowLeft size={18} className="text-gray-600" />
//           </button>
//           <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
//             Sales Person - Performance Analytics
//           </h2>
//         </div>

//        <div className="flex flex-wrap gap-3 w-full md:w-auto">

//         {/* FROM DATE */}
//         <div className="flex flex-col text-xs">
//           <span className="text-gray-500 font-semibold">From</span>
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//             className="border border-gray-300 px-3 py-2 rounded-lg text-sm"
//           />
//         </div>

//         {/* TO DATE */}
//         <div className="flex flex-col text-xs">
//           <span className="text-gray-500 font-semibold">To</span>
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//             className="border border-gray-300 px-3 py-2 rounded-lg text-sm"
//           />
//         </div>

//         {/* USER FILTER */}
//         <select
//           value={selectedUser}
//           onChange={(e) => setSelectedUser(e.target.value)}
//           className="border border-gray-300 px-4 py-2 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
//         >
//           <option value="ALL">All Salespersons</option>
//           {users.map((u) => (
//             <option key={u.id} value={u.id}>{u.name}</option>
//           ))}
//         </select>

//       </div>

        
//       </div>

//       {/* KPI CARDS */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
//         <KpiCard title="Total Leads" value={kpi.totalLeads} borderColor="border-blue-500" bgColor="bg-blue-50" textColor="text-blue-700" />
//         <KpiCard title="Active Leads" value={kpi.activeLeads} borderColor="border-indigo-500" bgColor="bg-indigo-50" textColor="text-indigo-700" />
//         <KpiCard title="Lost Leads" value={kpi.lostLeads} borderColor="border-red-500" bgColor="bg-red-50" textColor="text-red-700" />
//         <KpiCard title="Website Leads" value={kpi.websiteLeads} borderColor="border-amber-500" bgColor="bg-amber-50" textColor="text-amber-700" />
//         <KpiCard title="Won Leads" value={kpi.converted} borderColor="border-emerald-500" bgColor="bg-emerald-50" textColor="text-emerald-700" />
//         <KpiCard title="Conv. Rate" value={`${kpi.conversion}%`} borderColor="border-purple-500" bgColor="bg-purple-50" textColor="text-purple-700" />
//         <KpiCard title="Revenue" value={`₹${kpi.revenue.toLocaleString()}`} borderColor="border-cyan-600" bgColor="bg-cyan-50" textColor="text-cyan-800" />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <ChartCard title="Revenue Distribution">
//           <ResponsiveContainer width="100%" height={320}>
//             <BarChart data={revenueChartData}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//               <XAxis dataKey="salesperson" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
//               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
//               <Tooltip cursor={{ fill: '#f1f5f9' }} />
//               <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
//             </BarChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <ChartCard title="Pipeline Status Mix">
//           <ResponsiveContainer width="100%" height={320}>
//             <PieChart>
//               <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={5}>
//                 {pieData.map((entry, i) => (
//                   <Cell key={i} fill={STATUS_COLORS[entry.name]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//               <Legend verticalAlign="bottom" height={36} />
//             </PieChart>
//           </ResponsiveContainer>
//         </ChartCard>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
//           <div className="flex items-center gap-2">
//             <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
//             <h3 className="text-lg font-bold text-gray-800">Detailed Lead Logs</h3>
//           </div>
//           <button 
//             onClick={exportToExcel}
//             className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
//           >
//             <FaDownload size={14} />
//             Export Excel
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
//                 <th className="px-6 py-4 font-bold">S.No</th>
//                 <th className="px-6 py-4 font-bold">Lead Name</th>
//                 <th className="px-6 py-4 font-bold">Status</th>
//                 <th className="px-6 py-4 font-bold">Created At</th>
//                 <th className="px-6 py-4 font-bold">Created By</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {paginatedLeads.map((lead, index) => (
//                 <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors group">
//                   <td className="px-6 py-4 text-sm text-gray-400 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
//                   <td className="px-6 py-4">
//                   <button
//                   onClick={() => {
//                     setSummaryLeadId(lead.id);
//                     setShowSummary(true);
//                   }}
//                   className="
//                     text-sm font-semibold text-blue-700
//                     hover:underline hover:text-blue-900
//                     transition
//                     text-left
//                   "
//                   title="View Lead Summary"
//                 >
//                   {lead.name}
//                 </button>

//                     <div className="text-[11px] text-gray-400">{lead.email}</div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-tight">
//                       {lead.status || '-'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
//                     {formatDate(lead.createdAt)}
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className="text-sm text-gray-700 font-medium">{lead.createdBy}</span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {/* PAGINATION */}
//              <Pagination
//               currentPage={currentPage}
//               totalPages={totalPages}
//               setCurrentPage={setCurrentPage}
//              />
//             {showSummary && summaryLeadId && (
//               <LeadSummaryModal
//                 leadId={summaryLeadId}
//                 onClose={() => {
//                   setShowSummary(false);
//                   setSummaryLeadId(null);
//                 }}
//               />
//             )}


//         </div>
//       </div>
//     </div>
//   );
// };

// /* ================= REUSABLE COMPONENTS ================= */
// const KpiCard = ({ title, value, borderColor, bgColor, textColor }) => (
//   <div className={`bg-white rounded-2xl shadow-sm border-2 ${borderColor} p-5 flex flex-col items-center justify-center transition-transform hover:scale-105`}>
//     <div className={`mb-2 px-3 py-1 rounded-full ${bgColor} ${textColor} text-[10px] font-black uppercase tracking-widest`}>
//       {title}
//     </div>
//     <div className="text-xl font-extrabold text-gray-900">{value}</div>
//   </div>
// );

// const ChartCard = ({ title, children }) => (
//   <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
//     <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
//       <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
//       {title}
//     </h3>
//     {children}
//   </div>
// );

// export default SalespersonPerformanceReport;


