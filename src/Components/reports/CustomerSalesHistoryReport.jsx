// // import React, { useContext, useEffect, useState, useMemo } from "react";
// // import axios from "axios";
// // import {
// //   ResponsiveContainer,
// //   BarChart,
// //   Bar,
// //   XAxis,
// //   YAxis,
// //   Tooltip,
// //   LineChart,
// //   Line,
// //   PieChart,
// //   Pie,
// //   Cell,
// //   Legend,
// //   CartesianGrid,
// // } from "recharts";
// // import { companyContext } from "../../context/companyContext";
// // import { useNavigate } from "react-router-dom";
// // import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaSearch, FaUserTie, FaCrown, FaChartLine } from "react-icons/fa";

// // const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4"];

// // const CustomerSalesHistoryReport = () => {
// //   const { companyId } = useContext(companyContext);
// //   const navigate = useNavigate();

// //   const [customers, setCustomers] = useState([]);
// //   const [selectedSalesPerson, setSelectedSalesPerson] = useState("ALL");
// //   const [loading, setLoading] = useState(true);
  
// //   // Table Specific States
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const itemsPerPage = 15;

// //   /* ================= FETCH DATA ================= */
// //   useEffect(() => {
// //     if (!companyId) return;
// //     const token = localStorage.getItem("token");

// //     axios
// //       .get(`http://192.168.29.236:3000/api/reports/customer-sales-history/${companyId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       })
// //       .then((res) => setCustomers(res.data.data || []))
// //       .finally(() => setLoading(false));
// //   }, [companyId]);

// //   /* ================= FILTERING LOGIC ================= */
// //   const salesPersons = useMemo(() => {
// //     const uniqueNames = Array.from(new Set(customers.map((c) => c.leadOwnerName).filter(Boolean)));
// //     uniqueNames.sort((a, b) => a.localeCompare(b));
// //     return ["ALL", ...uniqueNames];
// //   }, [customers]);

// //   const filteredByOwner = useMemo(() => {
// //     if (selectedSalesPerson === "ALL") return customers;
// //     return customers.filter((c) => c.leadOwnerName === selectedSalesPerson);
// //   }, [customers, selectedSalesPerson]);

// //   const tableData = useMemo(() => {
// //     let list = [...filteredByOwner];
// //     if (searchTerm) {
// //       const lowerSearch = searchTerm.toLowerCase();
// //       list = list.filter(
// //         (c) =>
// //           c.customerName?.toLowerCase().includes(lowerSearch) ||
// //           c.leadOwnerName?.toLowerCase().includes(lowerSearch) ||
// //           c.totalRevenue?.toString().includes(lowerSearch)
// //       );
// //     }
// //     return list.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
// //   }, [filteredByOwner, searchTerm]);

// //   /* ================= PAGINATION ================= */
// //   const totalPages = Math.ceil(tableData.length / itemsPerPage);
// //   const currentTableData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

// //   useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedSalesPerson]);

// //   /* ================= CHART & KPI DATA ================= */
// //   const summary = useMemo(() => {
// //     const totalRevenue = filteredByOwner.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
// //     const totalDeals = filteredByOwner.reduce((sum, c) => sum + (c.totalDeals || 0), 0);
    
// //     const highestRecord = filteredByOwner.length > 0 
// //       ? [...filteredByOwner].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
// //       : null;

// //     const salesMap = {};
// //     customers.forEach(c => {
// //       salesMap[c.leadOwnerName] = (salesMap[c.leadOwnerName] || 0) + (c.totalRevenue || 0);
// //     });
// //     const topSalesPersonName = Object.keys(salesMap).reduce((a, b) => salesMap[a] > salesMap[b] ? a : b, "N/A");

// //     return {
// //       totalRevenue,
// //       totalDeals,
// //       highestRevenue: highestRecord ? highestRecord.totalRevenue : 0,
// //       topCustomerName: highestRecord ? highestRecord.customerName : "N/A",
// //       topSalesPerson: topSalesPersonName
// //     };
// //   }, [filteredByOwner, customers]);

// //   const monthlyTrendData = useMemo(() => {
// //     const last6Months = [];
// //     for (let i = 5; i >= 0; i--) {
// //       const d = new Date();
// //       d.setMonth(d.getMonth() - i);
// //       const monthName = d.toLocaleString('default', { month: 'short' });
// //       const year = d.getFullYear();
// //       last6Months.push({ month: monthName, year, key: `${year}-${d.getMonth()}`, revenue: 0 });
// //     }

// //     filteredByOwner.forEach(c => {
// //       const date = new Date(c.lastPurchaseDate);
// //       const key = `${date.getFullYear()}-${date.getMonth()}`;
// //       const monthObj = last6Months.find(m => m.key === key);
// //       if (monthObj) {
// //         monthObj.revenue += (c.totalRevenue || 0);
// //       }
// //     });

// //     return last6Months;
// //   }, [filteredByOwner]);

// //   const topCustomersChart = useMemo(() => 
// //     [...filteredByOwner].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10), 
// //   [filteredByOwner]);

// //   const productRevenueData = useMemo(() => {
// //     const map = {};
// //     filteredByOwner.forEach((c) => {
// //       (c.productsPurchased || []).forEach((p) => {
// //         map[p] = (map[p] || 0) + (c.totalRevenue || 0);
// //       });
// //     });
// //     return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
// //   }, [filteredByOwner]);

// //   const salesPersonRevenueData = useMemo(() => {
// //     const map = {};
// //     customers.forEach((c) => {
// //       map[c.leadOwnerName] = (map[c.leadOwnerName] || 0) + (c.totalRevenue || 0);
// //     });
// //     return Object.keys(map).sort((a, b) => a.localeCompare(b)).map((k) => ({ name: k, value: map[k] }));
// //   }, [customers]);

// //   if (loading) return <div className="p-20 text-center font-bold text-indigo-600 animate-pulse text-xl">Generating Sales Insights...</div>;

// //   return (
// //     <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
// //       {/* ================= HEADER ================= */}
// //       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
// //         <div className="flex items-center gap-4">
// //           <button onClick={() => navigate("/reportpage")} className="p-2 rounded-full hover:bg-gray-100 transition-all">
// //             <FaArrowLeft size={18} className="text-gray-600" />
// //           </button>
// //           <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Customer Sales History</h2>
// //         </div>
// //         <div className="flex items-center gap-3">
// //           <span className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Owner:</span>
// //           <select
// //             className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 shadow-inner text-sm font-medium"
// //             value={selectedSalesPerson}
// //             onChange={(e) => setSelectedSalesPerson(e.target.value)}
// //           >
// //             {salesPersons.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
// //           </select>
// //         </div>
// //       </div>

// //       {/* ================= KPI CARDS ================= */}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
// //         <KpiCard title="Total Customers" value={summary.totalDeals} color="border-l-indigo-500" />
// //         <KpiCard title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} color="border-l-green-500" />
        
// //         <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
// //             <FaCrown className="absolute -right-2 -bottom-2 text-amber-50/50 size-16 rotate-12" />
// //             <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Top Customer</p>
// //             <p className="text-xl font-extrabold text-gray-800 truncate mb-1" title={summary.topCustomerName}>{summary.topCustomerName}</p>
// //             <p className="text-sm font-bold text-amber-600">₹{summary.highestRevenue.toLocaleString()}</p>
// //         </div>

// //         <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-l-rose-500 relative overflow-hidden">
// //             <FaUserTie className="absolute -right-2 -bottom-2 text-rose-50/50 size-16 rotate-12" />
// //             <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Top Salesperson</p>
// //             <p className="text-xl font-extrabold text-gray-800 truncate" title={summary.topSalesPerson}>{summary.topSalesPerson}</p>
// //             <p className="text-xs text-gray-500 font-medium">Leading overall sales</p>
// //         </div>
// //       </div>

// //       {/* ================= CHARTS GRID ================= */}
// //       <div className="grid md:grid-cols-2 gap-8">
    

// //         {/* 1. Top 10 Customers */}
// //         <ChartBlock title="Top 10 Customers by Revenue">
// //           <BarChart data={topCustomersChart} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
// //             <CartesianGrid strokeDasharray="3 3" vertical={false} />
// //             <XAxis dataKey="customerName" angle={-45} textAnchor="end" interval={0} height={70} fontSize={11} />
// //             <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
// //             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
// //             <Bar dataKey="totalRevenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
// //           </BarChart>
// //         </ChartBlock>

// //        {/* 2. Monthly Revenue Trend */}
// //         <ChartBlock title="Monthly Revenue Trend (Last 6 Months)">
// //           <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
// //             <CartesianGrid strokeDasharray="3 3" vertical={false} />
// //             <XAxis dataKey="month" fontSize={12} fontWeights="bold" />
// //             <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
// //             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
// //             <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: "#4f46e5" }} activeDot={{ r: 8 }} />
// //           </LineChart>
// //         </ChartBlock>

// //         {/* 3. Revenue Distribution by Product */}
// //         <ChartBlock title="Revenue Distribution by Service">
// //           <PieChart>
// //             <Pie 
// //               data={productRevenueData} 
// //               dataKey="value" 
// //               nameKey="name" 
// //               cx="50%" cy="50%" 
// //               outerRadius={100} 
// //               label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
// //               fontSize={10}
// //             >
// //               {productRevenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
// //             </Pie>
// //             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
// //             <Legend verticalAlign="bottom" height={36} iconType="circle" />
// //           </PieChart>
// //         </ChartBlock>

// //         {/* 4. Performance by Sales Person */}
// //         <ChartBlock title="Performance by Sales Person">
// //           <BarChart data={salesPersonRevenueData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
// //             <CartesianGrid strokeDasharray="3 3" vertical={false} />
// //             <XAxis dataKey="name" fontSize={11} />
// //             <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
// //             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
// //             <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
// //           </BarChart>
// //         </ChartBlock>
// //       </div>

// //       {/* ================= TABLE SECTION ================= */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
// //         <div className="p-5 border-b bg-white flex flex-col md:flex-row justify-between items-center gap-4">
// //           <div>
// //             <h3 className="font-bold text-gray-700">Detailed Sales Ledger</h3>
// //             <p className="text-xs text-gray-400">Ranked by Highest Revenue</p>
// //           </div>
// //           <div className="relative w-full md:w-80">
// //             <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-3" />
// //             <input 
// //               type="text"
// //               placeholder="Search customer, owner, or amount..."
// //               className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
// //               value={searchTerm}
// //               onChange={(e) => setSearchTerm(e.target.value)}
// //             />
// //           </div>
// //         </div>

// //         <div className="overflow-x-auto">
// //           <table className="min-w-full text-sm">
// //             <thead className="bg-gray-50/50 text-gray-500 uppercase font-bold tracking-wider">
// //               <tr>
// //                 <th className="p-4 text-left">S.No</th>
// //                 <th className="p-4 text-left">Customer Name</th>
// //                 <th className="p-4 text-center">Lead Owner</th>
// //                 <th className="p-4 text-center">Total Deals</th>
// //                 <th className="p-4 text-center">Revenue</th>
// //                 <th className="p-4 text-center">Last Purchase</th>
// //               </tr>
// //             </thead>
// //             <tbody className="divide-y divide-gray-100">
// //               {currentTableData.length > 0 ? (
// //                 currentTableData.map((c, i) => (
// //                   <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
// //                     <td className="p-4 text-gray-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
// //                     <td className="p-4 font-semibold text-gray-800">{c.customerName}</td>
// //                     <td className="p-4 text-center text-gray-600">{c.leadOwnerName}</td>
// //                     <td className="p-4 text-center text-gray-600">{c.totalDeals}</td>
// //                     <td className="p-4 text-center font-bold text-green-600">₹{c.totalRevenue.toLocaleString()}</td>
// //                     <td className="p-4 text-center text-gray-500">{new Date(c.lastPurchaseDate).toLocaleDateString()}</td>
// //                   </tr>
// //                 ))
// //               ) : (
// //                 <tr>
// //                   <td colSpan="6" className="p-10 text-center text-gray-400 italic">No records matching your search.</td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </table>
// //         </div>

// //         {/* PAGINATION */}
// //         {totalPages > 1 && (
// //           <div className="p-4 bg-gray-50 flex items-center justify-between border-t">
// //             <button
// //               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
// //               disabled={currentPage === 1}
// //               className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-100 transition-all shadow-sm"
// //             >
// //               <FaChevronLeft size={10} /> Previous
// //             </button>
// //             <div className="text-xs font-bold text-gray-500 tracking-widest">
// //               PAGE {currentPage} / {totalPages}
// //             </div>
// //             <button
// //               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
// //               disabled={currentPage === totalPages}
// //               className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-100 transition-all shadow-sm"
// //             >
// //               Next <FaChevronRight size={10} />
// //             </button>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // const KpiCard = ({ title, value, color }) => (
// //   <div className={`bg-white shadow-sm rounded-xl p-5 border-l-4 ${color} hover:shadow-md transition-shadow`}>
// //     <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
// //     <p className="text-2xl font-extrabold text-gray-800">{value}</p>
// //   </div>
// // );

// // const ChartBlock = ({ title, children }) => (
// //   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
// //     <h3 className="mb-6 text-lg font-bold text-gray-700 border-b pb-3">{title}</h3>
// //     <div className="w-full h-[350px]">
// //       <ResponsiveContainer width="100%" height="100%">
// //         {children}
// //       </ResponsiveContainer>
// //     </div>
// //   </div>
// // );

// // export default CustomerSalesHistoryReport;

// import React, { useContext, useEffect, useState, useMemo } from "react";
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
//   CartesianGrid,
// } from "recharts";
// import { companyContext } from "../../context/companyContext";
// import { useNavigate } from "react-router-dom";
// import { 
//   FaArrowLeft, 
//   FaChevronLeft, 
//   FaChevronRight, 
//   FaSearch, 
//   FaUserTie, 
//   FaCrown, 
//   FaFileExcel 
// } from "react-icons/fa";
// import * as XLSX from "xlsx"; // Added for Excel Export

// const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4"];

// const CustomerSalesHistoryReport = () => {
//   const { companyId } = useContext(companyContext);
//   const navigate = useNavigate();

//   const [customers, setCustomers] = useState([]);
//   const [selectedSalesPerson, setSelectedSalesPerson] = useState("ALL");
//   const [loading, setLoading] = useState(true);
  
//   // Table Specific States
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 15;

//   /* ================= FETCH DATA ================= */
//   useEffect(() => {
//     if (!companyId) return;
//     const token = localStorage.getItem("token");

//     axios
//       .get(`http://192.168.29.236:3000/api/reports/customer-sales-history/${companyId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => setCustomers(res.data.data || []))
//       .finally(() => setLoading(false));
//   }, [companyId]);

//   /* ================= EXPORT LOGIC ================= */
//   const exportToExcel = () => {
//     // Prepare data for export (cleaner format)
//     const exportData = tableData.map((c, index) => ({
//       "S.No": index + 1,
//       "Customer Name": c.customerName,
//       "Lead Owner": c.leadOwnerName,
//       "Total Deals": c.totalDeals,
//       "Revenue (₹)": c.totalRevenue,
//       "Last Purchase Date": new Date(c.lastPurchaseDate).toLocaleDateString(),
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");

//     // Generate buffer and download
//     XLSX.writeFile(workbook, `Customer_Sales_History_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   /* ================= FILTERING LOGIC ================= */
//   const salesPersons = useMemo(() => {
//     const uniqueNames = Array.from(new Set(customers.map((c) => c.leadOwnerName).filter(Boolean)));
//     uniqueNames.sort((a, b) => a.localeCompare(b));
//     return ["ALL", ...uniqueNames];
//   }, [customers]);

//   const filteredByOwner = useMemo(() => {
//     if (selectedSalesPerson === "ALL") return customers;
//     return customers.filter((c) => c.leadOwnerName === selectedSalesPerson);
//   }, [customers, selectedSalesPerson]);

//   const tableData = useMemo(() => {
//     let list = [...filteredByOwner];
//     if (searchTerm) {
//       const lowerSearch = searchTerm.toLowerCase();
//       list = list.filter(
//         (c) =>
//           c.customerName?.toLowerCase().includes(lowerSearch) ||
//           c.leadOwnerName?.toLowerCase().includes(lowerSearch) ||
//           c.totalRevenue?.toString().includes(lowerSearch)
//       );
//     }
//     return list.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
//   }, [filteredByOwner, searchTerm]);

//   /* ================= PAGINATION ================= */
//   const totalPages = Math.ceil(tableData.length / itemsPerPage);
//   const currentTableData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedSalesPerson]);

//   /* ================= CHART & KPI DATA ================= */
//   const summary = useMemo(() => {
//     const totalRevenue = filteredByOwner.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
//     const totalDeals = filteredByOwner.reduce((sum, c) => sum + (c.totalDeals || 0), 0);
    
//     const highestRecord = filteredByOwner.length > 0 
//       ? [...filteredByOwner].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
//       : null;

//     const salesMap = {};
//     customers.forEach(c => {
//       salesMap[c.leadOwnerName] = (salesMap[c.leadOwnerName] || 0) + (c.totalRevenue || 0);
//     });
//     const topSalesPersonName = Object.keys(salesMap).reduce((a, b) => salesMap[a] > salesMap[b] ? a : b, "N/A");

//     return {
//       totalRevenue,
//       totalDeals,
//       highestRevenue: highestRecord ? highestRecord.totalRevenue : 0,
//       topCustomerName: highestRecord ? highestRecord.customerName : "N/A",
//       topSalesPerson: topSalesPersonName
//     };
//   }, [filteredByOwner, customers]);

//   const monthlyTrendData = useMemo(() => {
//     const last6Months = [];
//     for (let i = 5; i >= 0; i--) {
//       const d = new Date();
//       d.setMonth(d.getMonth() - i);
//       const monthName = d.toLocaleString('default', { month: 'short' });
//       const year = d.getFullYear();
//       last6Months.push({ month: monthName, year, key: `${year}-${d.getMonth()}`, revenue: 0 });
//     }

//     filteredByOwner.forEach(c => {
//       const date = new Date(c.lastPurchaseDate);
//       const key = `${date.getFullYear()}-${date.getMonth()}`;
//       const monthObj = last6Months.find(m => m.key === key);
//       if (monthObj) {
//         monthObj.revenue += (c.totalRevenue || 0);
//       }
//     });

//     return last6Months;
//   }, [filteredByOwner]);

//   const topCustomersChart = useMemo(() => 
//     [...filteredByOwner].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10), 
//   [filteredByOwner]);

//   const productRevenueData = useMemo(() => {
//     const map = {};
//     filteredByOwner.forEach((c) => {
//       (c.productsPurchased || []).forEach((p) => {
//         map[p] = (map[p] || 0) + (c.totalRevenue || 0);
//       });
//     });
//     return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
//   }, [filteredByOwner]);

//   const salesPersonRevenueData = useMemo(() => {
//     const map = {};
//     customers.forEach((c) => {
//       map[c.leadOwnerName] = (map[c.leadOwnerName] || 0) + (c.totalRevenue || 0);
//     });
//     return Object.keys(map).sort((a, b) => a.localeCompare(b)).map((k) => ({ name: k, value: map[k] }));
//   }, [customers]);

//   if (loading) return <div className="p-20 text-center font-bold text-indigo-600 animate-pulse text-xl">Generating Sales Insights...</div>;

//   return (
//     <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
//       {/* ================= HEADER ================= */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
//         <div className="flex items-center gap-4">
//           <button onClick={() => navigate("/reportpage")} className="p-2 rounded-full hover:bg-gray-100 transition-all">
//             <FaArrowLeft size={18} className="text-gray-600" />
//           </button>
//           <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Customer Sales History</h2>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Owner:</span>
//           <select
//             className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 shadow-inner text-sm font-medium"
//             value={selectedSalesPerson}
//             onChange={(e) => setSelectedSalesPerson(e.target.value)}
//           >
//             {salesPersons.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* ================= KPI CARDS ================= */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         <KpiCard title="Total Customers" value={summary.totalDeals} color="border-l-indigo-500" />
//         <KpiCard title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} color="border-l-green-500" />
        
//         <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
//             <FaCrown className="absolute -right-2 -bottom-2 text-amber-50/50 size-16 rotate-12" />
//             <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Top Customer</p>
//             <p className="text-xl font-extrabold text-gray-800 truncate mb-1" title={summary.topCustomerName}>{summary.topCustomerName}</p>
//             <p className="text-sm font-bold text-amber-600">₹{summary.highestRevenue.toLocaleString()}</p>
//         </div>

//         <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-l-rose-500 relative overflow-hidden">
//             <FaUserTie className="absolute -right-2 -bottom-2 text-rose-50/50 size-16 rotate-12" />
//             <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Top Salesperson</p>
//             <p className="text-xl font-extrabold text-gray-800 truncate" title={summary.topSalesPerson}>{summary.topSalesPerson}</p>
//             <p className="text-xs text-gray-500 font-medium">Leading overall sales</p>
//         </div>
//       </div>

//       {/* ================= CHARTS GRID ================= */}
//       <div className="grid md:grid-cols-2 gap-8">
//         <ChartBlock title="Top 10 Customers by Revenue">
//           <BarChart data={topCustomersChart} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
//             <CartesianGrid strokeDasharray="3 3" vertical={false} />
//             <XAxis dataKey="customerName" angle={-45} textAnchor="end" interval={0} height={70} fontSize={11} />
//             <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
//             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
//             <Bar dataKey="totalRevenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
//           </BarChart>
//         </ChartBlock>

//         <ChartBlock title="Monthly Revenue Trend (Last 6 Months)">
//           <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
//             <CartesianGrid strokeDasharray="3 3" vertical={false} />
//             <XAxis dataKey="month" fontSize={12} fontWeights="bold" />
//             <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
//             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
//             <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: "#4f46e5" }} activeDot={{ r: 8 }} />
//           </LineChart>
//         </ChartBlock>

//         <ChartBlock title="Revenue Distribution by Service">
//           <PieChart>
//             <Pie 
//               data={productRevenueData} 
//               dataKey="value" 
//               nameKey="name" 
//               cx="50%" cy="50%" 
//               outerRadius={100} 
//               label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
//               fontSize={10}
//             >
//               {productRevenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
//             </Pie>
//             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
//             <Legend verticalAlign="bottom" height={36} iconType="circle" />
//           </PieChart>
//         </ChartBlock>

//         <ChartBlock title="Performance by Sales Person">
//           <BarChart data={salesPersonRevenueData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
//             <CartesianGrid strokeDasharray="3 3" vertical={false} />
//             <XAxis dataKey="name" fontSize={11} />
//             <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
//             <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
//             <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
//           </BarChart>
//         </ChartBlock>
//       </div>

//       {/* ================= TABLE SECTION ================= */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="p-5 border-b bg-white flex flex-col md:flex-row justify-between items-center gap-4">
//           <div>
//             <h3 className="font-bold text-gray-700">Detailed Sales Ledger</h3>
//             <p className="text-xs text-gray-400">Ranked by Highest Revenue</p>
//           </div>
          
//           <div className="flex items-center gap-3 w-full md:w-auto">
//             {/* EXCEL EXPORT BUTTON */}
//             <button 
//               onClick={exportToExcel}
//               className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-green-100"
//             >
//               <FaFileExcel /> Export
//             </button>

//             <div className="relative w-full md:w-64">
//               <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-3" />
//               <input 
//                 type="text"
//                 placeholder="Search ledger..."
//                 className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="min-w-full text-sm">
//             <thead className="bg-gray-50/50 text-gray-500 uppercase font-bold tracking-wider">
//               <tr>
//                 <th className="p-4 text-left">S.No</th>
//                 <th className="p-4 text-left">Customer Name</th>
//                 <th className="p-4 text-center">Lead Owner</th>
//                 <th className="p-4 text-center">Total Deals</th>
//                 <th className="p-4 text-center">Revenue</th>
//                 <th className="p-4 text-center">Last Purchase</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {currentTableData.length > 0 ? (
//                 currentTableData.map((c, i) => (
//                   <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
//                     <td className="p-4 text-gray-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
//                     <td className="p-4 font-semibold text-gray-800">{c.customerName}</td>
//                     <td className="p-4 text-center text-gray-600">{c.leadOwnerName}</td>
//                     <td className="p-4 text-center text-gray-600">{c.totalDeals}</td>
//                     <td className="p-4 text-center font-bold text-green-600">₹{c.totalRevenue.toLocaleString()}</td>
//                     <td className="p-4 text-center text-gray-500">{new Date(c.lastPurchaseDate).toLocaleDateString()}</td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="6" className="p-10 text-center text-gray-400 italic">No records matching your search.</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* PAGINATION */}
//         {totalPages > 1 && (
//           <div className="p-4 bg-gray-50 flex items-center justify-between border-t">
//             <button
//               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-100 transition-all shadow-sm"
//             >
//               <FaChevronLeft size={10} /> Previous
//             </button>
//             <div className="text-xs font-bold text-gray-500 tracking-widest">
//               PAGE {currentPage} / {totalPages}
//             </div>
//             <button
//               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-100 transition-all shadow-sm"
//             >
//               Next <FaChevronRight size={10} />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const KpiCard = ({ title, value, color }) => (
//   <div className={`bg-white shadow-sm rounded-xl p-5 border-l-4 ${color} hover:shadow-md transition-shadow`}>
//     <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
//     <p className="text-2xl font-extrabold text-gray-800">{value}</p>
//   </div>
// );

// const ChartBlock = ({ title, children }) => (
//   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
//     <h3 className="mb-6 text-lg font-bold text-gray-700 border-b pb-3">{title}</h3>
//     <div className="w-full h-[350px]">
//       <ResponsiveContainer width="100%" height="100%">
//         {children}
//       </ResponsiveContainer>
//     </div>
//   </div>
// );

// export default CustomerSalesHistoryReport;

import React, { useContext, useEffect, useState, useMemo } from "react";
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
  CartesianGrid,
} from "recharts";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaChevronLeft, 
  FaChevronRight, 
  FaSearch, 
  FaUserTie, 
  FaCrown, 
  FaFileExcel 
} from "react-icons/fa";
import * as XLSX from "xlsx"; // Added for Excel Export

const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4"];

const CustomerSalesHistoryReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState("ALL");
  const [loading, setLoading] = useState(true);
  // Date Filter States
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");

  
  // Table Specific States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!companyId) return;
    const token = localStorage.getItem("token");

    axios
      .get(`http://192.168.29.236:3000/api/reports/customer-sales-history/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCustomers(res.data.data || []))
      .finally(() => setLoading(false));
  }, [companyId]);

  /* ================= EXPORT LOGIC ================= */
  const exportToExcel = () => {
    // Prepare data for export (cleaner format)
    const exportData = tableData.map((c, index) => ({
      "S.No": index + 1,
      "Customer Name": c.customerName,
      "Lead Owner": c.leadOwnerName,
      "Total Deals": c.totalDeals,
      "Revenue (₹)": c.totalRevenue,
      "Last Purchase Date": new Date(c.lastPurchaseDate).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");

    // Generate buffer and download
    XLSX.writeFile(workbook, `Customer_Sales_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  /* ================= FILTERING LOGIC ================= */
  const salesPersons = useMemo(() => {
    const uniqueNames = Array.from(new Set(customers.map((c) => c.leadOwnerName).filter(Boolean)));
    uniqueNames.sort((a, b) => a.localeCompare(b));
    return ["ALL", ...uniqueNames];
  }, [customers]);

  // const filteredByOwner = useMemo(() => {
  //   if (selectedSalesPerson === "ALL") return customers;
  //   return customers.filter((c) => c.leadOwnerName === selectedSalesPerson);
  // }, [customers, selectedSalesPerson]);

  const filteredByOwner = useMemo(() => {
  let list = [...customers];

  // Filter by Sales Person
  if (selectedSalesPerson !== "ALL") {
    list = list.filter((c) => c.leadOwnerName === selectedSalesPerson);
  }

  // Filter by Date Range (using lastPurchaseDate)
  if (fromDate) {
    const from = new Date(fromDate);
    list = list.filter(
      (c) => new Date(c.lastPurchaseDate) >= from
    );
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // include full day

    list = list.filter(
      (c) => new Date(c.lastPurchaseDate) <= to
    );
  }

  return list;
}, [customers, selectedSalesPerson, fromDate, toDate]);


  const tableData = useMemo(() => {
    let list = [...filteredByOwner];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(lowerSearch) ||
          c.leadOwnerName?.toLowerCase().includes(lowerSearch) ||
          c.totalRevenue?.toString().includes(lowerSearch)
      );
    }
    return list.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
  }, [filteredByOwner, searchTerm]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const currentTableData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedSalesPerson]);
useEffect(() => { 
  setCurrentPage(1); 
}, [searchTerm, selectedSalesPerson, fromDate, toDate]);

  /* ================= CHART & KPI DATA ================= */
  const summary = useMemo(() => {
    const totalRevenue = filteredByOwner.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const totalDeals = filteredByOwner.reduce((sum, c) => sum + (c.totalDeals || 0), 0);
    
    const highestRecord = filteredByOwner.length > 0 
      ? [...filteredByOwner].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
      : null;

    const salesMap = {};
    customers.forEach(c => {
      salesMap[c.leadOwnerName] = (salesMap[c.leadOwnerName] || 0) + (c.totalRevenue || 0);
    });
    const topSalesPersonName = Object.keys(salesMap).reduce((a, b) => salesMap[a] > salesMap[b] ? a : b, "N/A");

    return {
      totalRevenue,
      totalDeals,
      highestRevenue: highestRecord ? highestRecord.totalRevenue : 0,
      topCustomerName: highestRecord ? highestRecord.customerName : "N/A",
      topSalesPerson: topSalesPersonName
    };
  }, [filteredByOwner, customers]);

  const monthlyTrendData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      last6Months.push({ month: monthName, year, key: `${year}-${d.getMonth()}`, revenue: 0 });
    }

    filteredByOwner.forEach(c => {
      const date = new Date(c.lastPurchaseDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthObj = last6Months.find(m => m.key === key);
      if (monthObj) {
        monthObj.revenue += (c.totalRevenue || 0);
      }
    });

    return last6Months;
  }, [filteredByOwner]);

  const topCustomersChart = useMemo(() => 
    [...filteredByOwner].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10), 
  [filteredByOwner]);

  const productRevenueData = useMemo(() => {
    const map = {};
    filteredByOwner.forEach((c) => {
      (c.productsPurchased || []).forEach((p) => {
        map[p] = (map[p] || 0) + (c.totalRevenue || 0);
      });
    });
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [filteredByOwner]);

  const salesPersonRevenueData = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      map[c.leadOwnerName] = (map[c.leadOwnerName] || 0) + (c.totalRevenue || 0);
    });
    return Object.keys(map).sort((a, b) => a.localeCompare(b)).map((k) => ({ name: k, value: map[k] }));
  }, [customers]);

  if (loading) return <div className="p-20 text-center font-bold text-indigo-600 animate-pulse text-xl">Generating Sales Insights...</div>;

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/reportpage")} className="p-2 rounded-full hover:bg-gray-100 transition-all">
            <FaArrowLeft size={18} className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Customer Sales History</h2>
        </div>
        {/* <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Owner:</span>
          <select
            className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 shadow-inner text-sm font-medium"
            value={selectedSalesPerson}
            onChange={(e) => setSelectedSalesPerson(e.target.value)}
          >
            {salesPersons.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
          </select>
        </div> */}
        <div className="flex flex-wrap items-center gap-3">

  {/* FROM DATE */}
  <div className="flex flex-col text-xs">
    <span className="text-gray-500 font-semibold">From</span>
    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
    />
  </div>

  {/* TO DATE */}
  <div className="flex flex-col text-xs">
    <span className="text-gray-500 font-semibold">To</span>
    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
    />
  </div>

  {/* OWNER FILTER */}
  <div className="flex flex-col text-xs">
    <span className="text-gray-500 font-semibold">Owner</span>

    <select
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
      value={selectedSalesPerson}
      onChange={(e) => setSelectedSalesPerson(e.target.value)}
    >
      {salesPersons.map((sp) => (
        <option key={sp} value={sp}>
          {sp}
        </option>
      ))}
    </select>
  </div>

</div>

      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Customers" value={summary.totalDeals} color="border-l-indigo-500" />
        <KpiCard title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} color="border-l-green-500" />
        
        <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
            <FaCrown className="absolute -right-2 -bottom-2 text-amber-50/50 size-16 rotate-12" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Top Customer</p>
            <p className="text-xl font-extrabold text-gray-800 truncate mb-1" title={summary.topCustomerName}>{summary.topCustomerName}</p>
            <p className="text-sm font-bold text-amber-600">₹{summary.highestRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-l-rose-500 relative overflow-hidden">
            <FaUserTie className="absolute -right-2 -bottom-2 text-rose-50/50 size-16 rotate-12" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Top Salesperson</p>
            <p className="text-xl font-extrabold text-gray-800 truncate" title={summary.topSalesPerson}>{summary.topSalesPerson}</p>
            <p className="text-xs text-gray-500 font-medium">Leading overall sales</p>
        </div>
      </div>

      {/* ================= CHARTS GRID ================= */}
      <div className="grid md:grid-cols-2 gap-8">
        <ChartBlock title="Top 10 Customers by Revenue">
          <BarChart data={topCustomersChart} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="customerName" angle={-45} textAnchor="end" interval={0} height={70} fontSize={11} />
            <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Bar dataKey="totalRevenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartBlock>

        <ChartBlock title="Monthly Revenue Trend (Last 6 Months)">
          <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} fontWeights="bold" />
            <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: "#4f46e5" }} activeDot={{ r: 8 }} />
          </LineChart>
        </ChartBlock>

        <ChartBlock title="Revenue Distribution by Service">
          <PieChart>
            <Pie 
              data={productRevenueData} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" cy="50%" 
              outerRadius={100} 
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              fontSize={10}
            >
              {productRevenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ChartBlock>

        <ChartBlock title="Performance by Sales Person">
          <BarChart data={salesPersonRevenueData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartBlock>
      </div>

      {/* ================= TABLE SECTION ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-gray-700">Detailed Sales Ledger</h3>
            <p className="text-xs text-gray-400">Ranked by Highest Revenue</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* EXCEL EXPORT BUTTON */}
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-green-100"
            >
              <FaFileExcel /> Export
            </button>

            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-3" />
              <input 
                type="text"
                placeholder="Search ledger..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/50 text-gray-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4 text-left">S.No</th>
                <th className="p-4 text-left">Customer Name</th>
                <th className="p-4 text-center">Lead Owner</th>
                <th className="p-4 text-center">Total Deals</th>
                <th className="p-4 text-center">Revenue</th>
                <th className="p-4 text-center">Last Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentTableData.length > 0 ? (
                currentTableData.map((c, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4 text-gray-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td className="p-4 font-semibold text-gray-800">{c.customerName}</td>
                    <td className="p-4 text-center text-gray-600">{c.leadOwnerName}</td>
                    <td className="p-4 text-center text-gray-600">{c.totalDeals}</td>
                    <td className="p-4 text-center font-bold text-green-600">₹{c.totalRevenue.toLocaleString()}</td>
                    <td className="p-4 text-center text-gray-500">{new Date(c.lastPurchaseDate).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400 italic">No records matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 flex items-center justify-between border-t">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-100 transition-all shadow-sm"
            >
              <FaChevronLeft size={10} /> Previous
            </button>
            <div className="text-xs font-bold text-gray-500 tracking-widest">
              PAGE {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-100 transition-all shadow-sm"
            >
              Next <FaChevronRight size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, color }) => (
  <div className={`bg-white shadow-sm rounded-xl p-5 border-l-4 ${color} hover:shadow-md transition-shadow`}>
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
    <p className="text-2xl font-extrabold text-gray-800">{value}</p>
  </div>
);

const ChartBlock = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="mb-6 text-lg font-bold text-gray-700 border-b pb-3">{title}</h3>
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export default CustomerSalesHistoryReport;