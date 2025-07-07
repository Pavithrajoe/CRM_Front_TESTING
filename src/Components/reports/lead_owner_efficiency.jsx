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
import { useNavigate } from "react-router-dom"; 
import { FaArrowLeft } from "react-icons/fa";

export default function LeadOwnerEfficiency() {
  const [leadOwnerEfficiency, setLeadOwnerEfficiency] = useState({});
  const [chartData, setChartData] = useState([]);
  const [showAllRows, setShowAllRows] = useState(false);
  const navigate = useNavigate();  

  // --- Date Filtering States ---
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [showDefaultMonthNotification, setShowDefaultMonthNotification] = useState(false); // ✅ New state for notification

  // Helper to format date for input[type="date"]
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Effect to set default date range to current month on initial mount
  useEffect(() => {
    const today = new Date();
    // Get the first day of the current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Get the last day of the current month
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setShowDefaultMonthNotification(true); // Show notification on default load
  }, []); // Run only once on mount

  // Effect to fetch data based on filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token not found');

        // Decode token to get company_id
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

        // Build params object, only include dates if they are not empty strings
        const params = {};
        if (dateFilterFrom) params.fromDate = dateFilterFrom;
        if (dateFilterTo) params.toDate = dateFilterTo;

        const response = await axios.get(
          `${ENDPOINTS.LEAD_OWNER_FIRST_RES}/${company_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: params, // Axios will append these as query parameters
          }
        );

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
        // Handle error state if necessary
      }
    };


    if (dateFilterFrom || dateFilterTo || (!dateFilterFrom && !dateFilterTo)) {
      fetchData();
    }
  }, [dateFilterFrom, dateFilterTo]); // Depend on date filters to re-fetch when they change

  const metrics = leadOwnerEfficiency.overallMetrics || {};
  const leads = leadOwnerEfficiency?.individualLeadData || [];

  const cardData = [
    {
      title: 'Avg. 1st Resp. Time / Owner',
      value: metrics?.overallAverageFirstResponseHours ? `${metrics.overallAverageFirstResponseHours}h` : '0h',
      change: '+0.47%', // Static, consider making dynamic
    },
    {
      title: 'Avg. Conv. Time / Owner',
      value: metrics?.overallDealConversionPercentage ? `${metrics.overallDealConversionPercentage}%` : '0%',
      change: '-1.25%', // Static, consider making dynamic
    },
    {
      title: 'Lead Response SLA %',
      value: metrics?.firstResponseSla?.slaHours ? `${metrics.firstResponseSla.slaHours}h` : '0h',
      change: '+2.10%', // Static, consider making dynamic
    },
    {
      title: 'Achieved Lead Response SLA %',
      value: metrics?.firstResponseSla?.percentageMet ? `${metrics.firstResponseSla.percentageMet}%` : '0%',
      change: '-0.65%', // Static, consider making dynamic
    },
    {
      title: 'Lead Conv SLA %',
      value: metrics?.dealConversionSla?.slaHours ? `${metrics.dealConversionSla.slaHours}h` : '0h',
      change: '-0.65%', // Static, consider making dynamic
    },
    {
      title: 'Achieved Lead Conv SLA %',
      value: metrics?.dealConversionSla?.percentageMet ? `${metrics.dealConversionSla.percentageMet}%` : '0%',
      change: '-0.65%', // Static, consider making dynamic
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

  const visibleLeads = showAllRows ? leads : leads.slice(0, 10);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={() => navigate("/reportpage")} 
          style={{
            color: "#6B7280", 
            padding: "8px",
            borderRadius: "9999px", 
            marginRight: "16px", 
            fontSize: "24px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease", 
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")} 
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="Back to reports"
        >
          <FaArrowLeft />
        </button>
      <h1 className='text-2xl font-bold p-2'>Lead Owner Efficiency</h1>
</div>
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
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2"> {/* Added flex-wrap and gap-2 */}
          <h2 className="text-lg font-semibold text-gray-800">
            Lead Handling & Productivity Metrics
          </h2>
          <div className="flex gap-4 items-center flex-wrap"> {/* Container for date filters and View All */}
            {/* "From" Date Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="fromDate" className="text-sm text-gray-700">From:</label>
              <input
                type="date"
                id="fromDate"
                value={dateFilterFrom}
                onChange={(e) => {
                  setDateFilterFrom(e.target.value);
                  setShowDefaultMonthNotification(false); // User changed, hide default notification
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
              />
            </div>
            {/* "To" Date Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="toDate" className="text-sm text-gray-700">To:</label>
              <input
                type="date"
                id="toDate"
                value={dateFilterTo}
                onChange={(e) => {
                  setDateFilterTo(e.target.value);
                  setShowDefaultMonthNotification(false); // User changed, hide default notification
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
              />
            </div>
            {/* "View All" Button for date filters */}
            <button
              onClick={() => {
                setDateFilterFrom(''); // Clear "from" date
                setDateFilterTo('');    // Clear "to" date
                setShowDefaultMonthNotification(false); // Ensure notification is off
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
            >
              View All
            </button>
          </div>
        </div>

        {/* --- Date Filter Notification Area --- */}
        {showDefaultMonthNotification && dateFilterFrom && dateFilterTo && (
          <div className="mb-4 p-6 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-sm">
            💡 Showing data for the **current month**: **{new Date(dateFilterFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **{new Date(dateFilterTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.
          </div>
        )}
        {!showDefaultMonthNotification && dateFilterFrom && dateFilterTo && (
          <div className="mb-4 p-6 bg-orange-100 border border-orange-200 text-gray-700 rounded-lg text-sm">
            Filtering data from **{new Date(dateFilterFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **{new Date(dateFilterTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.
          </div>
        )}
        {!dateFilterFrom && !dateFilterTo && (
          <div className="mb-4 p-6 bg-orange-100 border border-orange-200 text-gray-700 rounded-lg text-sm">
            Showing all available data.
          </div>
        )}
        {/* --- End Date Filter Notification Area --- */}

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
                  {/* Safely format dates, adding a check if the date string exists */}
                  <td className="px-4 py-2 h-16">
                    {metric.createdAtIST ? new Date(metric.createdAtIST).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No created date"}
                  </td>
                  <td className="px-4 py-2 h-16">
                    {metric.firstInteractionTimeIST ? new Date(metric.firstInteractionTimeIST).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Interaction Yet"}
                  </td>
                  <td className="px-4 py-2 h-16">{metric.hoursToFirstInteraction || "No First Response"}</td>
                  <td className="px-4 py-2 h-16">
                    {metric.conversionTimeHours ? new Date(metric.conversionTimeHours).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Didn't convert"}
                  </td>
                  <td className="px-4 py-2 h-16">{metric.note || "No notes found"}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                    No lead data available for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Toggle button for local row display only */}
        {leads.length > 10 && (
            <div className="flex justify-center mt-4">
                <button
                    className="text-sm font-medium text-blue-600 hover:underline"
                    onClick={() => setShowAllRows(!showAllRows)}
                >
                    {showAllRows ? "Show Less" : "View More"}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}