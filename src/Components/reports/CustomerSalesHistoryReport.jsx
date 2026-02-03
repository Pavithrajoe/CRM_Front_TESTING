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
} from "recharts";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4"];

const CustomerSalesHistoryReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const token = localStorage.getItem("token");

    axios
      .get(
        `http://192.168.29.236:3000/api/reports/customer-sales-history/${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setCustomers(res.data.data || []))
      .finally(() => setLoading(false));
  }, [companyId]);

  /* ================= KPI CALC ================= */
  const summary = useMemo(() => {
    const totalRevenue = customers.reduce(
      (s, c) => s + (c.totalRevenue || 0),
      0
    );
    const totalDeals = customers.reduce(
      (s, c) => s + (c.totalDeals || 0),
      0
    );

    return {
      totalCustomers: customers.length,
      totalRevenue,
      totalDeals,
      avgRevenue:
        customers.length > 0
          ? Math.round(totalRevenue / customers.length)
          : 0,
    };
  }, [customers]);

  /* ================= PRODUCT PIE DATA ================= */
  const productRevenue = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      (c.productsPurchased || []).forEach((p) => {
        map[p] = (map[p] || 0) + c.totalRevenue;
      });
    });
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [customers]);

  if (loading) return <p>Loading Customer Sales History...</p>;

  return (
    <div className="space-y-8 p-4">
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate("/reportpage")}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition"
          aria-label="Back to reports"
        >
          <FaArrowLeft size={22} />
        </button>

        <h2 className="text-2xl font-semibold">
          👥 Customer Sales History
        </h2>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="flex flex-wrap gap-4">
        <KpiCard title="Customers" value={summary.totalCustomers} />
        <KpiCard
          title="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString()}`}
        />
        <KpiCard title="Total Deals" value={summary.totalDeals} />
        <KpiCard
          title="Avg Revenue / Customer"
          value={`₹${summary.avgRevenue.toLocaleString()}`}
        />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Customer */}
        <ChartBlock title="Top Customers by Revenue">
          <BarChart data={customers.slice(0, 10)}>
            <XAxis dataKey="customerName" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalRevenue" />
          </BarChart>
        </ChartBlock>

        {/* Deals Trend */}
        <ChartBlock title="Deals by Customer">
          <LineChart data={customers.slice(0, 10)}>
            <XAxis dataKey="customerName" hide />
            <YAxis />
            <Tooltip />
            <Line dataKey="totalDeals" strokeWidth={2} />
          </LineChart>
        </ChartBlock>

        {/* Product Revenue Share */}
        <ChartBlock title="Revenue by Product">
          <PieChart>
            <Pie
              data={productRevenue}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label
            >
              {productRevenue.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartBlock>
      </div>

      {/* ================= CUSTOMER TABLE ================= */}
      <div className="overflow-auto">
        <table className="min-w-full border rounded-xl">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-2 text-left">Customer</th>
              <th className="p-2">Deals</th>
              <th className="p-2">Revenue</th>
              <th className="p-2">First Purchase</th>
              <th className="p-2">Last Purchase</th>
              <th className="p-2">Products</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-t text-sm">
                <td className="p-2">
                  <div className="font-medium">{c.customerName}</div>
                  <div className="text-gray-500 text-xs">
                    {c.email || "-"}
                  </div>
                </td>
                <td className="p-2 text-center">{c.totalDeals}</td>
                <td className="p-2 text-center">
                  ₹{c.totalRevenue.toLocaleString()}
                </td>
                <td className="p-2 text-center">
                  {new Date(c.firstPurchaseDate).toLocaleDateString()}
                </td>
                <td className="p-2 text-center">
                  {new Date(c.lastPurchaseDate).toLocaleDateString()}
                </td>
                <td className="p-2 text-center">
                  {(c.productsPurchased || []).join(", ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= SMALL COMPONENTS ================= */

const KpiCard = ({ title, value }) => (
  <div className="bg-white shadow rounded-xl p-4 w-56">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const ChartBlock = ({ title, children }) => (
  <div>
    <h3 className="mb-2 font-medium">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      {children}
    </ResponsiveContainer>
  </div>
);

export default CustomerSalesHistoryReport;
