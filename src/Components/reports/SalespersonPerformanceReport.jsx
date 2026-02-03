import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6"];
const STATUS_COLORS = {
  Active: "#2563eb",
  Converted: "#16a34a",
  Lost: "#ef4444",
};

const SalespersonPerformanceReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [loading, setLoading] = useState(true);

  /* ================= API ================= */
  useEffect(() => {
    if (!companyId) return;
    const token = localStorage.getItem("token");

    axios
      .get(
        `http://192.168.29.236:3000/api/reports/salesperson-performance/${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setData(res.data.data || []))
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false));
  }, [companyId]);

  /* ================= HELPERS ================= */
  const users = useMemo(() => data.map((d) => ({ id: d.user_id, name: d.salesperson })), [data]);

  const filteredData = useMemo(() => {
    if (selectedUser === "ALL") return data;
    return data.filter((d) => String(d.user_id) === selectedUser);
  }, [data, selectedUser]);

  const kpi = useMemo(() => {
    const totalLeads = filteredData.reduce((a, b) => a + b.totalLeads, 0);
    const activeLeads = filteredData.reduce((a, b) => a + b.activeLeads, 0);
    const lostLeads = filteredData.reduce((a, b) => a + b.lostLeads, 0);
    const websiteLeads = filteredData.reduce((a, b) => a + b.websiteLeads, 0);
    const converted = filteredData.reduce((a, b) => a + b.convertedLeads, 0);
    const revenue = filteredData.reduce((a, b) => a + b.totalRevenue, 0);
    const conversion = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(2) : 0;

    return { totalLeads, activeLeads, lostLeads, websiteLeads, converted, revenue, conversion };
  }, [filteredData]);

  const pieData = useMemo(() => {
    return [
      { name: "Active", value: kpi.activeLeads },
      { name: "Converted", value: kpi.converted },
      { name: "Lost", value: kpi.lostLeads },
    ].filter(item => item.value > 0);
  }, [kpi]);

  if (loading) return <div className="p-10 text-center font-semibold">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-8 bg-[#f8fafc] min-h-screen">
      {/* ================= HEADER ================= */}
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

      {/* ================= KPI CARDS (4-sided colored borders) ================= */}
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
        {/* REVENUE BAR CHART */}
        <ChartCard title="Revenue Distribution per Salesperson">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="salesperson" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* PIE CHART */}
        <ChartCard title="Pipeline Status Mix">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name]} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* CONVERSION TIME LINE CHART */}
      <ChartCard title="Efficiency: Avg Conversion Time (Hours)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="salesperson" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="avgConversionHours" 
              stroke="#6366f1" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

/* ================= REUSABLE COMPONENTS ================= */

const KpiCard = ({ title, value, borderColor, bgColor, textColor }) => (
  <div className={`bg-white rounded-2xl shadow-sm border-2 ${borderColor} p-5 flex flex-col items-center justify-center transition-transform hover:scale-105`}>
    <div className={`mb-2 px-3 py-1 rounded-full ${bgColor} ${textColor} text-[10px] font-black uppercase tracking-widest`}>
      {title}
    </div>
    <div className="text-xl font-extrabold text-gray-900">
      {value}
    </div>
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