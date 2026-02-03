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

const COLORS = ["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4"];

const calcTotals = (data = []) => {
  return data.reduce(
    (acc, cur) => {
      acc.revenue += cur.totalRevenue || 0;
      acc.deals += cur.totalDeals || 0;
      return acc;
    },
    { revenue: 0, deals: 0 }
  );
};

const ChartTitle = ({ title }) => (
  <h3 className="text-lg font-semibold mb-3 mt-6">{title}</h3>
);

const RevenueBreakdownReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [salesperson, setSalesperson] = useState([]);
  const [service, setService] = useState([]);
  const [client, setClient] = useState([]);
  const [region, setRegion] = useState([]);
  const [time, setTime] = useState({});
  const [active, setActive] = useState("salesperson");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(
        `http://192.168.29.236:3000/api/reports/revenue-by-salesperson/${companyId}`,
        { headers }
      ),
      axios.get(
        `http://192.168.29.236:3000/api/reports/revenue-by-service/${companyId}`,
        { headers }
      ),
      axios.get(
        `http://192.168.29.236:3000/api/reports/revenue-by-client/${companyId}`,
        { headers }
      ),
      axios.get(
        `http://192.168.29.236:3000/api/reports/revenue-by-region/${companyId}`,
        { headers }
      ),
      axios.get(
        `http://192.168.29.236:3000/api/reports/revenue-by-time-period/${companyId}`,
        { headers }
      ),
    ])
      .then(([sp, sv, cl, rg, tm]) => {
        setSalesperson(sp.data.data || []);
        setService(sv.data.data || []);
        setClient(cl.data.data || []);
        setRegion(rg.data.data || []);
        setTime(tm.data.data || {});
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <p>Loading Revenue Report...</p>;

  return (
    <div className="space-y-6 p-4">
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/reportpage")}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition"
          aria-label="Back to reports"
        >
          <FaArrowLeft size={22} />
        </button>

        <h2 className="text-2xl font-semibold">💰 Revenue Breakdown</h2>
      </div>

      {/* 🔹 TOP 5 CLICKABLE CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <TopCard
          label="Salesperson"
          active={active === "salesperson"}
          onClick={() => setActive("salesperson")}
        />
        <TopCard
          label="Service"
          active={active === "service"}
          onClick={() => setActive("service")}
        />
        <TopCard
          label="Client"
          active={active === "client"}
          onClick={() => setActive("client")}
        />
        <TopCard
          label="Region"
          active={active === "region"}
          onClick={() => setActive("region")}
        />
        <TopCard
          label="Time Period"
          active={active === "time"}
          onClick={() => setActive("time")}
        />
      </div>

      {/* 🔹 REPORT AREA */}
      <div className="bg-white p-4 rounded-2xl shadow">
        {active === "salesperson" && (
          <RevenueBySalesperson data={salesperson} />
        )}
        {active === "service" && <RevenueByService data={service} />}
        {active === "client" && <RevenueByClient data={client} />}
        {active === "region" && <RevenueByRegion data={region} />}
        {active === "time" && <RevenueByTime data={time} />}
      </div>
    </div>
  );
};

/* ===================== 5 SEPARATE COMPONENTS ===================== */

const RevenueBySalesperson = ({ data }) => {
  const { revenue, deals } = calcTotals(data);

  return (
    <>
      <KpiRow>
        <KpiCard title="Salespersons" value={data.length} />
        <KpiCard
          title="Total Revenue"
          value={`₹${revenue.toLocaleString()}`}
        />
        <KpiCard title="Total Deals" value={deals} />
      </KpiRow>

      <BarBlock data={data} xKey="salesperson" />
      <LineBlock data={data} xKey="salesperson" yKey="totalDeals" />
      <PieBlock data={data} nameKey="salesperson" />
    </>
  );
};

const RevenueByService = ({ data }) => {
  const { revenue, deals } = calcTotals(data);

  return (
    <>
      <KpiRow>
        <KpiCard title="Services" value={data.length} />
        <KpiCard
          title="Total Revenue"
          value={`₹${revenue.toLocaleString()}`}
        />
        <KpiCard title="Total Deals" value={deals} />
      </KpiRow>

      <BarBlock data={data} xKey="service" />
      <LineBlock data={data} xKey="service" yKey="totalDeals" />
      <PieBlock data={data} nameKey="service" />
    </>
  );
};

const RevenueByClient = ({ data }) => {
  const { revenue, deals } = calcTotals(data);

  return (
    <>
      <KpiRow>
        <KpiCard title="Clients" value={data.length} />
        <KpiCard
          title="Total Revenue"
          value={`₹${revenue.toLocaleString()}`}
        />
        <KpiCard title="Total Deals" value={deals} />
      </KpiRow>

      <BarBlock data={data.slice(0, 15)} xKey="clientName" />
      <PieBlock data={data.slice(0, 10)} nameKey="clientName" />
    </>
  );
};

const RevenueByRegion = ({ data }) => {
  const { revenue, deals } = calcTotals(data);

  return (
    <>
      <KpiRow>
        <KpiCard title="Regions" value={data.length} />
        <KpiCard
          title="Total Revenue"
          value={`₹${revenue.toLocaleString()}`}
        />
        <KpiCard title="Total Deals" value={deals} />
      </KpiRow>

      <BarBlock data={data} xKey="region" />
      <PieBlock data={data} nameKey="region" />
    </>
  );
};

const RevenueByTime = ({ data }) => {
  const summary = data?.summary || {};
  const daily = data?.dailyRevenue || [];
  const monthly = data?.monthlyRevenue || [];
  const yearly = data?.yearlyRevenue || [];

  return (
    <>
      <KpiRow>
        <KpiCard
          title="This Month Revenue"
          value={`₹${(summary.revenueThisMonth || 0).toLocaleString()}`}
        />
        <KpiCard
          title="This Year Revenue"
          value={`₹${(summary.revenueThisYear || 0).toLocaleString()}`}
        />
        <KpiCard
          title="Total Revenue"
          value={`₹${(summary.totalRevenue || 0).toLocaleString()}`}
        />
      </KpiRow>

      <ChartTitle title="Daily Revenue Trend" />
      <ChartBlock>
        <LineChart data={daily}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" strokeWidth={2} />
        </LineChart>
      </ChartBlock>

      <ChartTitle title="Monthly Revenue" />
      <ChartBlock>
        <BarChart data={monthly}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" />
        </BarChart>
      </ChartBlock>

      <ChartTitle title="Yearly Revenue" />
      <ChartBlock>
        <BarChart data={yearly}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" />
        </BarChart>
      </ChartBlock>
    </>
  );
};

/* ===================== COMMON UI BLOCKS ===================== */

const TopCard = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-xl font-semibold transition ${
      active
        ? "bg-blue-600 text-white"
        : "bg-gray-100 hover:bg-blue-100"
    }`}
  >
    {label}
  </button>
);

const KpiRow = ({ children }) => (
  <div className="flex flex-wrap gap-4 mb-6">{children}</div>
);

const KpiCard = ({ title, value }) => (
  <div className="bg-gray-50 p-4 rounded-xl w-56">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const BarBlock = ({ data, xKey }) => (
  <ChartBlock>
    <BarChart data={data}>
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Bar dataKey="totalRevenue" />
    </BarChart>
  </ChartBlock>
);

const LineBlock = ({ data, xKey, yKey }) => (
  <ChartBlock>
    <LineChart data={data}>
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Line dataKey={yKey} strokeWidth={2} />
    </LineChart>
  </ChartBlock>
);

const PieBlock = ({ data, nameKey }) => (
  <ChartBlock>
    <PieChart>
      <Pie data={data} dataKey="totalRevenue" nameKey={nameKey} label>
        {data.map((_, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ChartBlock>
);

const ChartBlock = ({ children }) => (
  <ResponsiveContainer width="100%" height={300}>
    {children}
  </ResponsiveContainer>
);

export default RevenueBreakdownReport;
