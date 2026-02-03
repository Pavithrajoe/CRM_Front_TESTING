import React, { useContext, useEffect, useState } from "react";
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
  ErrorBar,
} from "recharts";
import { companyContext } from "../../context/companyContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE"];

const LeadSourcePerformanceReport = () => {
  const { companyId } = useContext(companyContext);
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchReport = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://192.168.29.236:3000/api/reports/lead-source-performance/${companyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Prepare box-plot style values
        const formatted = res.data.data.map((item) => ({
          ...item,
          min: 0,
          max: item.totalLeads,
          avg: item.convertedLeads,
        }));

        setData(formatted);
      } catch (err) {
        console.error("Lead source report error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [companyId]);

  if (loading) return <p>Loading Lead Source Report...</p>;

  return (
    <div className="p-4 space-y-10">
      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/reportpage")}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition"
          aria-label="Back to reports"
        >
          <FaArrowLeft size={22} />
        </button>

        <h2 className="text-xl font-semibold">
          📊 Lead Source Performance
        </h2>
      </div>

      {/* ================= CARDS ================= */}
      <div className="flex flex-wrap gap-4">
        {data.map((item) => (
          <div
            key={item.source}
            className="bg-white shadow rounded-xl p-4 w-60"
          >
            <h4 className="font-semibold">{item.source}</h4>
            <p>Total Leads: <b>{item.totalLeads}</b></p>
            <p>Converted: <b>{item.convertedLeads}</b></p>
            <p>Revenue: <b>₹{item.totalRevenue}</b></p>
            <p>Conversion: <b>{item.conversionRate}%</b></p>
          </div>
        ))}
      </div>

      {/* ================= LINE CHART ================= */}
      <div>
        <h3 className="mb-2 font-medium">📈 Revenue by Lead Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="source" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="totalRevenue" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================= PIE CHART ================= */}
      <div>
        <h3 className="mb-2 font-medium">⭕ Lead Conversion Share</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="convertedLeads"
              nameKey="source"
              outerRadius={110}
              label
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ================= BOX-PLOT (SIMULATED) ================= */}
      <div>
        <h3 className="mb-2 font-medium">
          📦 Lead Distribution (Box Plot Style)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="source" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avg" fill="#8884d8">
              <ErrorBar
                dataKey="max"
                direction="y"
                stroke="red"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeadSourcePerformanceReport;
