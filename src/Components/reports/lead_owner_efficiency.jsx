import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';

export default function LeadOwnerEfficiency() {
  const [leadOwnerEfficiency, setLeadOwnerEfficiency] = useState({});
  const [chartData, setChartData] = useState([]);
  const [showAllRows, setShowAllRows] = useState(false); // ✅ New state for View All

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token not found');

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const { company_id } = JSON.parse(jsonPayload);
        if (!company_id) throw new Error('Company ID missing');

        const response = await axios.get(
          `${ENDPOINTS.LEAD_OWNER_FIRST_RES}/${company_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // console.log("API Response:", response.data);
        setLeadOwnerEfficiency(response.data);

        const summary = response.data.leadOwnerSummary || {};
        const formattedChartData = Object.values(summary).map((item) => ({
          name: item.ownerName,
          value: item.averageConversionHours,
          avatar: '👤',
        }));

        setChartData(formattedChartData);
      } catch (err) {
        console.error('Error fetching first response report:', err.message);
      }
    };

    fetchData();
  }, []);

  const metrics = leadOwnerEfficiency.overallMetrics || {};
  const leads = leadOwnerEfficiency?.individualLeadData || [];

  const cardData = [
    {
      title: 'Avg. 1st Resp. Time / Owner',
      value: metrics?.overallAverageFirstResponseHours || '0h',
      change: '+0.47%',
    },
    {
      title: 'Avg. Conv. Time / Owner',
      value: metrics?.overallDealConversionPercentage || '0%',
      change: '-1.25%',
    },
    {
      title: 'Lead Response SLA %',
      value: metrics?.firstResponseSla?.slaHours || '0h',
      change: '+2.10%',
    },
    {
      title: 'Achieved Lead Response SLA %',
      value: metrics?.firstResponseSla?.percentageMet ?? '0%',
      change: '-0.65%',
    },
    {
      title: 'Lead Conv SLA %',
      value: metrics?.dealConversionSla?.slaHours || '0h',
      change: '-0.65%',
    },
    {
      title: 'Achieved Lead Conv SLA %',
      value: metrics?.dealConversionSla?.percentageMet ?? '0%',
      change: '-0.65%',
    },
  ];

  const renderCustomBarLabel = (props) => {
    const { x, y, width, index } = props;
    const emoji = chartData[index]?.avatar || '👤';
    return (
      <text x={x + width / 2} y={y + 1} textAnchor="middle" fontSize={22}>
        {emoji}
      </text>
    );
  };

  // ✅ Show 10 rows by default
  const visibleLeads = showAllRows ? leads : leads.slice(0, 10);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className='text-2xl font-bold p-2'>Lead Owner Efficiency</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-10">
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-1">
          {cardData.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm p-4 flex flex-col"
            >
              <p className="text-sm font-medium mb-1">{card.title}</p>
              <h2 className="text-3xl text-center mt-5 font-bold text-black">
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4 h-full flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Average Conversion Time Per Owner</h2>
            <div className="bg-gray-200 px-3 py-1 rounded-md text-sm font-medium">
              This Month
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis
                domain={[0, 'dataMax + 30']}
                tickFormatter={(tick) => `${tick} min`}
                ticks={[30, 60, 90, 120, 150, 180, 210, 240, 270, 300]}
              />
              <Tooltip formatter={(value) => `${value} min`} />
              <Bar
                dataKey="value"
                fill="#000000"
                barSize={40}
                label={renderCustomBarLabel}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Lead Handling & Productivity Metrics
          </h2>
          <button
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={() => setShowAllRows(!showAllRows)}
          >
            {showAllRows ? "Show Less" : "View All"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-black">
            <thead>
              <tr className="bg-gray-100 text-left text-lg h-16">
                <th className="px-4 py-2 font-semibold">S.No</th>
                <th className="px-4 py-2 font-semibold">Lead Owner</th>
                <th className="px-4 py-2 font-semibold">Created at</th>
                <th className="px-4 py-2 font-semibold">First Responded at</th>
                <th className="px-4 py-2 font-semibold">Hours to First response</th>
                <th className="px-4 py-2 font-semibold">Converted at</th>
                <th className="px-4 py-2 font-semibold">Note</th>
              </tr>
            </thead>
        <tbody>
  {visibleLeads.map((metric, index) => (
    <tr key={index} className="border-b">
      <td className="px-4 py-2 h-16">{index + 1}</td>
      <td className="px-4 py-2 h-16">{metric.ownerName || "Unknown"}</td>
      <td className="px-4 py-2 h-16">{metric.createdAtIST || "No created date"}</td>
      <td className="px-4 py-2 h-16">{metric.firstInteractionTimeIST || "No Interaction Yet"}</td>
      <td className="px-4 py-2 h-16">{metric.hoursToFirstInteraction || "No First Response"}</td>
      <td className="px-4 py-2 h-16">{metric.conversionTimeHours || "Didn't convert"}</td>
      <td className="px-4 py-2 h-16">{metric.note || "No notes found"}</td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
