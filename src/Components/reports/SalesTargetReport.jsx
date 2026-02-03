import React, { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import { companyContext } from "../../context/companyContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { TrendingUp, Users, Target } from "lucide-react";

/* ================= CHART REGISTER ================= */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const SalesTargetReport = () => {
  const { companyId } = useContext(companyContext);

  const [data, setData] = useState([]);
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= API ================= */
  useEffect(() => {
    if (!companyId) return;

    setLoading(true);
    axios
      .get("http://192.168.29.236:3000/api/reports/sales-target-vs-achievement", {
        params: { company_id: companyId },
      })
      .then((res) => {
        setData(res.data?.data || []);
        setError(null);
      })
      .catch(() => setError("Failed to load sales target report"))
      .finally(() => setLoading(false));
  }, [companyId]);

  /* ================= USER LIST ================= */
  const users = useMemo(() => {
    const map = new Map();
    data.forEach((d) => map.set(d.user_id, d.salesperson));
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [data]);

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    if (selectedUser === "ALL") return data;
    return data.filter((d) => String(d.user_id) === selectedUser);
  }, [data, selectedUser]);

  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    const totalTarget = filteredData.reduce(
      (sum, d) => sum + (d.targetAmount || 0),
      0
    );

    const totalAchieved = filteredData.reduce(
      (sum, d) => sum + (d.achievedAmount || 0),
      0
    );

    const avgAchievement =
      filteredData.reduce(
        (sum, d) => sum + (d.achievementPercent || 0),
        0
      ) / (filteredData.length || 1);

    const best = filteredData.reduce(
      (max, item) =>
        (item.achievementPercent || 0) >
        (max?.achievementPercent || 0)
          ? item
          : max,
      null
    );

    return { totalTarget, totalAchieved, avgAchievement, best };
  }, [filteredData]);

  /* ================= CHART DATA ================= */
  const labels = filteredData.map((d) => d.salesperson || "Unknown");

  const barData = {
    labels,
    datasets: [
      {
        label: "Target Amount",
        data: filteredData.map((d) => d.targetAmount || 0),
      },
      {
        label: "Achieved Amount",
        data: filteredData.map((d) => d.achievedAmount || 0),
      },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: "Achievement %",
        data: filteredData.map((d) => d.achievementPercent || 0),
        tension: 0.4,
      },
    ],
  };

  /* ================= STATES ================= */
  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Loading Sales Target Report…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
        {error}
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 font-[system-ui]">
      <h1 className="text-2xl font-bold text-gray-900">
        🎯 Sales Target vs Achievement
      </h1>

      {/* ================= USER FILTER ================= */}
      <div className="flex gap-4 items-center">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2 rounded-full border shadow bg-white text-sm"
        >
          <option value="ALL">All Salespersons</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Target />}
          title="Total Target"
          value={`₹${summary.totalTarget.toLocaleString()}`}
        />
        <KpiCard
          icon={<TrendingUp />}
          title="Total Achieved"
          value={`₹${summary.totalAchieved.toLocaleString()}`}
        />
        <KpiCard
          icon={<Users />}
          title="Avg Achievement"
          value={`${summary.avgAchievement.toFixed(2)}%`}
        />
        <KpiCard
          title="Top Performer"
          value={summary.best?.salesperson || "-"}
        />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Target vs Achieved">
          <Bar data={barData} />
        </ChartCard>

        <ChartCard title="Achievement % Trend">
          <Line data={lineData} />
        </ChartCard>
      </div>

      {/* ================= PERFORMANCE BOX ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredData.map((item) => (
          <div
            key={item.user_id + item.fromDate}
            className={`p-4 rounded-2xl shadow ${
              item.achievementPercent >= 100
                ? "bg-green-100"
                : item.achievementPercent >= 50
                ? "bg-yellow-100"
                : "bg-red-100"
            }`}
          >
            <h4 className="font-semibold">{item.salesperson}</h4>
            <p>Target: ₹{item.targetAmount}</p>
            <p>Achieved: ₹{item.achievedAmount}</p>
            <p>Achievement: {item.achievementPercent}%</p>
            <p className="font-medium">
              {item.overOrShort > 0 ? "Over Achieved" : "Short By"} ₹
              {Math.abs(item.overOrShort)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesTargetReport;

/* ================= SMALL COMPONENTS ================= */

const KpiCard = ({ icon, title, value }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 text-center">
    {icon && (
      <div className="text-blue-600 mb-1 flex justify-center">{icon}</div>
    )}
    <p className="text-xs text-gray-500">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-md p-4">
    <h3 className="font-semibold mb-3">{title}</h3>
    {children}
  </div>
);
