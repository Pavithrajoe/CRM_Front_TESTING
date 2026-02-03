import React, { useContext, useEffect, useState } from "react";
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
} from "recharts";
import axios from "axios";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE"];

const SalespersonPerformanceReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://192.168.29.236:3000/api/reports/salesperson-performance/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(res.data.data || []);
      } catch (error) {
        console.error("Error fetching salesperson performance", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [companyId]);

  if (loading) return <p>Loading report...</p>;

  return (
    <div style={{ padding: "20px" }}>
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => navigate("/reportpage")}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "6px",
          }}
          aria-label="Back to reports"
        >
          <FaArrowLeft size={22} />
        </button>

        <h2 style={{ margin: 0 }}>📊 Salesperson Performance Report</h2>
      </div>

      {/* ================= CARDS ================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        {data.map((item) => (
          <div
            key={item.user_id}
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "10px",
              width: "250px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h4>{item.salesperson}</h4>
            <p>
              Total Leads: <b>{item.totalLeads}</b>
            </p>
            <p>
              Converted: <b>{item.convertedLeads}</b>
            </p>
            <p>
              Revenue: <b>₹{item.totalRevenue}</b>
            </p>
            <p>
              Conversion %: <b>{item.conversionRate}%</b>
            </p>
          </div>
        ))}
      </div>

      {/* ================= LINE CHART ================= */}
      <div style={{ marginTop: "40px" }}>
        <h3>📈 Revenue by Salesperson</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="salesperson" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="totalRevenue" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================= PIE CHART ================= */}
      <div style={{ marginTop: "40px" }}>
        <h3>⭕ Conversion Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="convertedLeads"
              nameKey="salesperson"
              outerRadius={110}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ================= LINE CHART (TIME) ================= */}
      <div style={{ marginTop: "40px" }}>
        <h3>⏱ Avg Conversion Time (Hours)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="salesperson" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="avgConversionHours"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalespersonPerformanceReport;
