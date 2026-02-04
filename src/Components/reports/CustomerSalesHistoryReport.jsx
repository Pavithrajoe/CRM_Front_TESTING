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
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";

const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4"];

const CustomerSalesHistoryReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState("ALL");
  const [loading, setLoading] = useState(true);
  
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

  /* ================= FILTERING LOGIC ================= */
  const salesPersons = useMemo(() => {
    const uniqueNames = Array.from(new Set(customers.map((c) => c.leadOwnerName).filter(Boolean)));
    uniqueNames.sort((a, b) => a.localeCompare(b));
    return ["ALL", ...uniqueNames];
  }, [customers]);

  // Base list filtered by Sales Person (used for Cards and Charts)
  const filteredByOwner = useMemo(() => {
    if (selectedSalesPerson === "ALL") return customers;
    return customers.filter((c) => c.leadOwnerName === selectedSalesPerson);
  }, [customers, selectedSalesPerson]);

  // Table list (Owner Filter + Search + Sort by Revenue)
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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedSalesPerson]);

  /* ================= CHART & KPI DATA ================= */
  const summary = useMemo(() => {
    const totalRevenue = filteredByOwner.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const totalDeals = filteredByOwner.reduce((sum, c) => sum + (c.totalDeals || 0), 0);
    return {
      totalCustomers: filteredByOwner.length,
      totalRevenue,
      totalDeals,
      avgRevenue: filteredByOwner.length > 0 ? Math.round(totalRevenue / filteredByOwner.length) : 0,
    };
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
    // We use 'customers' here to show overall performance even if a specific filter is on, 
    // OR change to 'filteredByOwner' if you want it to react to the dropdown.
    customers.forEach((c) => {
      map[c.leadOwnerName] = (map[c.leadOwnerName] || 0) + (c.totalRevenue || 0);
    });
    return Object.keys(map).sort((a, b) => a.localeCompare(b)).map((k) => ({ name: k, value: map[k] }));
  }, [customers]);

  if (loading) return <div className="p-20 text-center font-bold text-indigo-600 animate-pulse">Loading Analytics Data...</div>;

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/reportpage")} className="p-2 rounded-full hover:bg-gray-100 transition-all">
            <FaArrowLeft size={18} className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Customer Sales History</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Sales Owner:</span>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm text-sm"
            value={selectedSalesPerson}
            onChange={(e) => setSelectedSalesPerson(e.target.value)}
          >
            {salesPersons.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
          </select>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Customers" value={summary.totalCustomers} color="border-l-indigo-500" />
        <KpiCard title="Total Deals" value={summary.totalDeals} color="border-l-green-500" />
        <KpiCard title="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} color="border-l-amber-500" />
        <KpiCard title="Avg Revenue / Customer" value={`₹${summary.avgRevenue.toLocaleString()}`} color="border-l-cyan-500" />
      </div>

      {/* ================= CHARTS GRID ================= */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* 1. Top Customers */}
        <ChartBlock title="Top 10 Customers by Revenue">
          <BarChart data={topCustomersChart} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="customerName" angle={-45} textAnchor="end" interval={0} height={70} fontSize={11} />
            <YAxis fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', offset: -20 }} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Bar dataKey="totalRevenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartBlock>

        {/* 2. Deals by Customer */}
        <ChartBlock title="Deals per Customer (Top 10)">
          <LineChart data={topCustomersChart} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="customerName" angle={-45} textAnchor="end" interval={0} height={70} fontSize={11} />
            <YAxis fontSize={11} label={{ value: 'Deals', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="totalDeals" stroke="#16a34a" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ChartBlock>

        {/* 3. Revenue by Product */}
        <ChartBlock title="Revenue Distribution by Product">
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

        {/* 4. Revenue by Sales Person */}
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
            <p className="text-xs text-gray-400">Ranked by high revenue</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-3" />
            <input 
              type="text"
              placeholder="Search customer, owner, or amount..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
            
            <div className="text-xs font-bold text-gray-500">
              Page {currentPage} / {totalPages}
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

/* ================= UTILITY COMPONENTS ================= */

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