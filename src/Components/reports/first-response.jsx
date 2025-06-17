import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, Area, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const FirstResponseTimeReport = () => {
  const [cardData] = useState([
    { title: "Avg. First Response Time", value: "20 Mins", change: "+0.47% than last Month", changeType: "positive" },
    { title: "Fastest Response Time",     value: "10 Mins", change: "+0.15% than last Month", changeType: "positive" },
    { title: "Response Time Vs Win Rate", isChart: true },
    { title: "Slowest Response Time",     value: "45 Mins", change: "-4.65% than last Month", changeType: "negative" },
    { title: "First Resp. SLA Rate",      value: "56%",     change: "+5.27% than last Month", changeType: "positive" },
  ]);

  const [responseTimeWinRateData] = useState([
    { name: 'Jan', 'Response Time': 25, 'Win Rate': 50 },
    { name: 'Feb', 'Response Time': 20, 'Win Rate': 55 },
    { name: 'Mar', 'Response Time': 22, 'Win Rate': 52 },
    { name: 'Apr', 'Response Time': 18, 'Win Rate': 60 },
    { name: 'May', 'Response Time': 20, 'Win Rate': 58 },
    { name: 'Jun', 'Response Time': 25, 'Win Rate': 50 },
    { name: 'Jul', 'Response Time': 23, 'Win Rate': 55 },
  ]);

  const [responseTimeMetricsTableData] = useState([
    { sNo: 1, salesRep: "Jaba Kumar",     opportunitySource: "Website",  opportunityType: "New Customer", priority: "High" },
    { sNo: 2, salesRep: "Siva Kumar",     opportunitySource: "Website",  opportunityType: "Upsell",       priority: "Low"  },
    { sNo: 3, salesRep: "Dinesh Raja",    opportunitySource: "Referral", opportunityType: "Upsell",       priority: "Low"  },
    { sNo: 4, salesRep: "Karthick Raja",  opportunitySource: "Website",  opportunityType: "Cross‑Sell",   priority: "Medium" },
    { sNo: 5, salesRep: "Nikesh Kumar",   opportunitySource: "Referral", opportunityType: "New Customer", priority: "High" },
  ]);

  const [responseTimeDistributionData] = useState([
    { name: '<1 hr',   value: 20 },
    { name: '1-3 hrs', value: 40 },
    { name: '4-24 hrs', value: 20 },
    { name: '24+ hrs',  value: 20 },
  ]);

  const PIE_COLORS = ["#98EE4E", "#FFC107", "#7E2D77", "#36A2EB"];

  return (
    <div style={{
      minHeight: "100vh",
      padding: 32,
      background: "linear-gradient(to bottom right, #f4f5f7, #e9ecf3)",
      display: "flex",
      flexDirection: "column",
      gap: 32,
      fontFamily: "SF Pro Display, Helvetica Neue, Helvetica, Arial, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h2 style={{
          fontSize: 26,
          fontWeight: 700,
          color: "#1c1c1e",
          margin: 0
        }}>First Response Time for Opportunity</h2>
        <div style={{ display: "flex", gap: 12 }} />
      </div>

      {/* Cards + Chart */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
      }}>
        {cardData.map((card, idx) => {
          if (card.isChart) {
            return (
              <div key={idx} style={{
                gridColumn: "span 2",
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 240,
              }}>
                <div style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "#f2f2f7",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#555",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  This Month <span style={{ fontSize: 10 }}>▼</span>
                </div>
                <h4 style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#1c1c1e",
                  margin: "0 0 12px 0"
                }}>Response Time Vs Win Rate</h4>
                <div style={{ flexGrow: 1, width: "100%" }}>
                 <ResponsiveContainer width="100%" height={180}>
  <LineChart data={responseTimeWinRateData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
    <XAxis dataKey="name" axisLine={false} tickLine={false} />
    <YAxis axisLine={false} tickLine={false} />
    <Tooltip />
    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />

    <Line
      type="monotone"
      dataKey="Response Time"
      stroke="#FF5722"
      strokeWidth={2}
      dot={false}
    />
    <Line
      type="monotone"
      dataKey="Win Rate"
      stroke="#4CAF50"
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>

                </div>
              </div>
            );
          }

          return (
            <div key={idx} style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}>
              <div style={{ fontSize: 15, color: "#666", fontWeight: 500 }}>
                {card.title}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#1c1c1e",
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}>
                {card.value}
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: card.changeType === "positive" ? "#34c759" : "#ff3b30"
                }}>
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 24,
        flexWrap: "wrap"
      }}>
        {/* Metrics Table */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          padding: 32,
          minWidth: 320,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20
          }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#1c1c1e",
              margin: 0
            }}>Response Time Metrics</h3>
            <span style={{
              fontSize: 14,
              color: "#007aff",
              cursor: "pointer",
              fontWeight: 500
            }}>View All</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              color: "#333",
            }}>
              <thead>
                <tr style={{ background: "#f2f2f7" }}>
                  {["S.No", "Sales Rep", "Opportunity Source", "Opportunity Type", "Priority"].map(h => (
                    <th key={h} style={{
                      padding: "14px 18px",
                      fontWeight: 600,
                      textAlign: "left"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responseTimeMetricsTableData.map(r => (
                  <tr key={r.sNo} style={{
                    borderBottom: "1px solid #eee",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9f9f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    <td style={{ padding: "14px 18px" }}>{r.sNo}</td>
                    <td style={{ padding: "14px 18px" }}>{r.salesRep}</td>
                    <td style={{ padding: "14px 18px" }}>{r.opportunitySource}</td>
                    <td style={{ padding: "14px 18px" }}>{r.opportunityType}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{
                        background: r.priority === "High" ? "#e6ffe6"
                                  : r.priority === "Medium" ? "#fffbe6"
                                  : "#e6f7ff",
                        color: r.priority === "High" ? "#34c759"
                             : r.priority === "Medium" ? "#ffcc00"
                             : "#007aff",
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontWeight: 500
                      }}>{r.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution Pie */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 300,
        }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#1c1c1e",
            margin: "0 0 20px 0",
            alignSelf: "flex-start"
          }}>Response Time Distribution</h3>
          <div style={{ width: "100%", maxWidth: 320 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={responseTimeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {responseTimeDistributionData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={val => `${val}%`} />
                <Legend verticalAlign="bottom" align="center" iconType="circle"
                  wrapperStyle={{ paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstResponseTimeReport;