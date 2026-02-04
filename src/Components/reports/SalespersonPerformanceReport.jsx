// import React, { useContext, useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx"; // Import the xlsx library
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

// const STATUS_COLORS = {
//   Active: "#2563eb",
//   Converted: "#16a34a",
//   Lost: "#ef4444",
// };

// const SalespersonPerformanceReport = () => {
//   const { companyId } = useContext(companyContext);
//   const navigate = useNavigate();

//   const [perfData, setPerfData] = useState([]);
//   const [leads, setLeads] = useState([]);
//   const [selectedUser, setSelectedUser] = useState("ALL");
//   const [loading, setLoading] = useState(true);

//   /* ================= FETCH DATA ================= */
//   useEffect(() => {
//     if (!companyId) return;
//     const token = localStorage.getItem("token");
//     const headers = { Authorization: `Bearer ${token}` };

//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const perfRes = await axios.get(`http://192.168.29.236:3000/api/reports/salesperson-performance/${companyId}`, { headers });
//         setPerfData(perfRes.data.data || []);

//         const leadsRes = await axios.get(`http://192.168.29.236:3000/api/lead/company/${companyId}/leads`, { headers });
//         setLeads(leadsRes.data || []);
//       } catch (err) {
//         console.error("API Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [companyId]);

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

//   const users = useMemo(() => perfData.map((d) => ({ id: d.user_id, name: d.salesperson })), [perfData]);

//   const filteredPerf = useMemo(() => {
//     if (selectedUser === "ALL") return perfData;
//     return perfData.filter((d) => String(d.user_id) === selectedUser);
//   }, [perfData, selectedUser]);

//   const filteredLeads = useMemo(() => {
//     if (selectedUser === "ALL") return leads;
//     const userName = users.find(u => String(u.id) === selectedUser)?.name;
//     return leads.filter(l => l.createdBy === userName);
//   }, [leads, selectedUser, users]);

//   const kpi = useMemo(() => {
//     const totalLeads = filteredPerf.reduce((a, b) => a + b.totalLeads, 0);
//     const activeLeads = filteredPerf.reduce((a, b) => a + b.activeLeads, 0);
//     const lostLeads = filteredPerf.reduce((a, b) => a + b.lostLeads, 0);
//     const websiteLeads = filteredPerf.reduce((a, b) => a + b.websiteLeads, 0);
//     const converted = filteredPerf.reduce((a, b) => a + b.convertedLeads, 0);
//     const revenue = filteredPerf.reduce((a, b) => a + b.totalRevenue, 0);
//     const conversion = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(2) : 0;

//     return { totalLeads, activeLeads, lostLeads, websiteLeads, converted, revenue, conversion };
//   }, [filteredPerf]);

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

//         <select
//           value={selectedUser}
//           onChange={(e) => setSelectedUser(e.target.value)}
//           className="w-full md:w-64 border border-gray-300 px-4 py-2.5 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
//         >
//           <option value="ALL">All Salespersons</option>
//           {users.map((u) => (
//             <option key={u.id} value={u.id}>{u.name}</option>
//           ))}
//         </select>
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
//             <BarChart data={filteredPerf}>
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
//               {filteredLeads.map((lead, index) => (
//                 <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors group">
//                   <td className="px-6 py-4 text-sm text-gray-400 font-medium">{index + 1}</td>
//                   <td className="px-6 py-4">
//                     <div className="text-sm font-semibold text-gray-900">{lead.name}</div>
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
//           {filteredLeads.length === 0 && (
//             <div className="p-10 text-center text-gray-400">No leads found.</div>
//           )}
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

const STATUS_COLORS = {
  Active: "#2563eb",
  Converted: "#16a34a",
  Lost: "#ef4444",
};

const SalespersonPerformanceReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [perfData, setPerfData] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [loading, setLoading] = useState(true);
  
  // Date filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!companyId) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      try {
        setLoading(true);
        const perfRes = await axios.get(`http://192.168.29.236:3000/api/reports/salesperson-performance/${companyId}`, { headers });
        setPerfData(perfRes.data.data || []);

        const leadsRes = await axios.get(`http://192.168.29.236:3000/api/lead/company/${companyId}/leads`, { headers });
        setLeads(leadsRes.data || []);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

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

  const todayDate = useMemo(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }, []);

  const users = useMemo(() => perfData.map((d) => ({ id: d.user_id, name: d.salesperson })), [perfData]);

  // Filter leads by date range and salesperson
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Apply date filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter((lead) => {
        const createdDate = new Date(lead.createdAt);
        return createdDate >= start && createdDate <= end;
      });
    }

    // Apply user filter
    if (selectedUser !== "ALL") {
      const userName = users.find(u => String(u.id) === selectedUser)?.name;
      filtered = filtered.filter(l => l.createdBy === userName);
    }

    return filtered;
  }, [leads, startDate, endDate, selectedUser, users]);

  const filteredPerf = useMemo(() => {
    if (selectedUser === "ALL") return perfData;
    return perfData.filter((d) => String(d.user_id) === selectedUser);
  }, [perfData, selectedUser]);

  // Calculate KPIs from filtered leads
  const kpi = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const activeLeads = filteredLeads.filter(l => l.status === 'Active' || l.isActive === true).length;
    const lostLeads = filteredLeads.filter(l => l.status === 'Lost').length;
    const converted = filteredLeads.filter(l => l.status === 'Converted' || l.status === 'Won').length;
    const websiteLeads = filteredLeads.filter(l => l.source === 'website').length || 0;
    const revenue = 0;
    const conversion = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(2) : 0;

    return { totalLeads, activeLeads, lostLeads, websiteLeads, converted, revenue, conversion };
  }, [filteredLeads]);

  const pieData = useMemo(() => {
    return [
      { name: "Active", value: kpi.activeLeads },
      { name: "Converted", value: kpi.converted },
      { name: "Lost", value: kpi.lostLeads },
    ].filter(item => item.value > 0);
  }, [kpi]);

  // PAGINATION LOGIC
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToFirst = () => setCurrentPage(1);
  const goToLast = () => setCurrentPage(totalPages);

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

    const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : "";
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Report");
    XLSX.writeFile(workbook, `Lead_Report${dateRange}.xlsx`);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredLeads.length]);

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

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Date Range Filter */}
          <div className="flex gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                max={todayDate}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                max={todayDate}
              />
            </div>
          </div>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full md:w-64 border border-gray-300 px-4 py-2.5 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
            <BarChart data={filteredPerf}>
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

      {/* TABLE WITH PAGINATION */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            <h3 className="text-lg font-bold text-gray-800">Detailed Lead Logs</h3>
            <span className="text-sm text-gray-500">({filteredLeads.length} total leads)</span>
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
              {currentLeads.map((lead, index) => (
                <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{lead.name}</div>
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
          {filteredLeads.length === 0 && (
            <div className="p-10 text-center text-gray-400">No leads found for selected filters.</div>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of{' '}
                {filteredLeads.length} leads
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={goToFirst}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>

                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-200 hover:text-blue-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={goToLast}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
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