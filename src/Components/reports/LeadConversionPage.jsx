import React, { useEffect, useState, useCallback, useContext } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../api/constraints";
import { UserContext } from "../../context/UserContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// Chart registration
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const LeadConversionPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { companyId } = useContext(UserContext);
  const token = localStorage.getItem("token");

  const fetchConversionData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Log token and companyId to check if they are available
    console.log("Fetching data with:", { token: token ? "Available" : "Missing", companyId });

    if (!token || !companyId) {
      setError("Missing authentication token or company ID. Please ensure you are logged in and have a company ID.");
      setLoading(false);
      return;
    }

    try {
      // Fetching data from the API
      const response = await axios.get(`${ENDPOINTS.LEAD_CONVERSION}/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Log the full API response for inspection
      console.log("API Response:", response.data);


      if (response.data) { // Check if response.data exists
        setData(response.data);
        console.log("Data set successfully:", response.data);
      } else {
        setError("API response was empty or did not contain expected data.");
        console.error("API response missing 'data' property at top level:", response.data);
      }
    } catch (err) {
      // Log the actual error for debugging purposes
      console.error("Error fetching data:", err);
      setError(`Error fetching data: ${err.message || "An unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  }, [token, companyId]);

  useEffect(() => {
    // Call the fetch function when the component mounts or dependencies change
    fetchConversionData();
  }, [fetchConversionData]);

  // Conditional rendering for loading, error, and no data states
  if (loading) return <div className="p-10 text-center text-gray-600">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>; // Make error more prominent

  // Ensure 'data' and 'data.metrics' exist before attempting to render the content
  if (!data || !data.metrics) {
    console.log("Data or metrics object is missing after setting state:", data);
    return <div className="p-10 text-center text-gray-600">No data available or metrics data is missing.</div>;
  }

  // Destructure 'metrics' and 'apiData' from the fetched data
  const { metrics, data: apiData = {} } = data; // Renaming 'data' to 'apiData' to avoid conflict with state 'data'
  const { dealConversion = [], lostLeads = [] } = apiData; // Destructure dealConversion and lostLeads from apiData

  console.log("Metrics data available for display:", metrics);
  console.log("Deal Conversion data available for display:", dealConversion);
  console.log("Lost Leads data available for display:", lostLeads);


  // --- Chart Data ---
  const barChartData = {
    labels: ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Conversion Rate",
        backgroundColor: "#9FE11D", // Green/Yellow from image
        data: [90, 50, 75, 75, 25, 45, 80], // Sample data
      },
      {
        label: "Win Rate",
        backgroundColor: "#CD37CC", // Purple from image
        data: [60, 65, 88, 70, 50, 0, 80], // Sample data, 0 for Saturday as per image
      },
    ],
  };


  const lineChartData = {
    labels: [0, 20, 40, 60, 80, 100], // Lead Volume categories (dummy)
    datasets: [
      {
        label: "Avg. Conv Time",
        data: [11, 11, 16, 22, 12, 21], // Sample Avg Conv Time (Hrs) (dummy)
        borderColor: "#3B82F6", // Blue from image
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
        fill: false, // Do not fill under the line for this chart as per image
        pointRadius: 5, // Make points visible
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#fff",
        pointHoverRadius: 7,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '(Hrs)', // Y-axis label
          align: 'end',
        },
        ticks: {
          stepSize: 5,
          max: 24,
        },
      },
      x: {
        title: {
          display: true,
          text: '(Lead Vol)', // X-axis label
          align: 'end',
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend for single dataset as in image
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' Hrs';
            }
            return label;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100, // Max percentage for conversion/win rate
        ticks: {
          callback: function(value) {
            return value + '%'; // Add percentage sign
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom', // Move legend to bottom
        labels: {
          usePointStyle: true, // Use point style for legend items
        }
      }
    }
  };


  return (
    <div className="p-6 space-y-10 bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
      <h1 className="font-semibold text-xl ms-2">Lead Conversion Time</h1>
      {/* Metric Cards - Values are now bound to the 'metrics' object from the API response */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-5">
        <Card
          title="Avg Lead Conversion Time"
          value={`${metrics.averageDaysToConvert} Days`} // Bound to API response
          change="0.08%" // Hardcoded, consider making dynamic
          isPositive={true} // Hardcoded, consider making dynamic
        />
        <Card
          title="Fastest Conversion Time"
          value={`${metrics.fastestConversion} Days`} // Bound to API response
          change="0.03%" // Hardcoded, consider making dynamic
          isPositive={false} // Hardcoded, consider making dynamic
        />
        <Card
          title="Slowest Conversion Time"
          value={`${metrics.slowestConversion} Days`} // Bound to API response
          change="1.25%" // Hardcoded, consider making dynamic
          isPositive={true} // Hardcoded, consider making dynamic
        />
        <Card
          title="Conversion SLA %"
          value={`${metrics.slaPercentage}%`} // Bound to API response, added '%'
          change="4.66%" // Hardcoded, consider making dynamic
          isPositive={false} // Hardcoded, consider making dynamic
        />
      </div>

      {/* Lost Opportunity Table - Now uses lostLeads data */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Lost Opportunity Breakdown</h2>
          {/* <button className="text-blue-600 text-sm hover:underline">View All</button> */}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-auto">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                {["S.No", "Lead Name", "Owner", "Source", "Created", "Priority", "Lost At", "Time to Lose"].map((head, i) => (
                  <th key={i} className="px-4 py-2">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lostLeads.length > 0 ? (
                lostLeads.map((lostLead, i) => {
                  const createdAt = lostLead.dcreated_dt ? new Date(lostLead.dcreated_dt) : null;
                  const lostAt = lostLead.ConvertToLostTime ? new Date(lostLead.ConvertToLostTime) : null;
                  let timeToLose = "N/A";

                  if (createdAt && lostAt) {
                    const diffTime = Math.abs(lostAt.getTime() - createdAt.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    timeToLose = `${diffDays} D`;
                  }

                  return (
                    <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{lostLead.clead_name || "N/A"}</td>
                      <td className="px-4 py-2">{lostLead.cresponded_by || "N/A"}</td> {/* Assuming cresponded_by is owner */}
                      <td className="px-4 py-2">{lostLead.lead_source_id === 1 ? "Website" : "Referral"}</td>
                     
                      <td className="px-4 py-2">{createdAt ? createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"}</td>
                      <td className="px-4 py-2">
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">High</span> {/* Hardcoded Priority, update if dynamic data exists */}
                      </td>
                      <td className="px-4 py-2">{lostAt ? lostAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"}</td>
                      <td className="px-4 py-2">{timeToLose}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-gray-500 py-4">No lost leads data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts - Uses dummy data, integrate with API response for dynamic charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-xl shadow h-[350px]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold mt-5 text-gray-800">Conversion Rate vs Win Rate</h2>
            {/* <select className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700">
              <option>This Week</option>
            </select> */}
          </div>
          <Bar
            data={barChartData}
            options={barChartOptions}
          />
        </div>

        {/* Line Chart */}
        <div className="bg-white p-4 rounded-xl mb-2 shadow h-[350px]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-gray-800">Lead Volume vs Avg. Conv Time</h2>
            {/* <select className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700">
              <option>This Week</option>
            </select> */}
          </div>
          <Line
            data={lineChartData}
            options={lineChartOptions}
          />
        </div>
      </div>
    </div>
  );
};

// Card component to display individual metrics
const Card = ({ title, value, change, isPositive }) => (
  <div className="bg-white p-6 rounded-sm shadow flex flex-col gap-3 hover:shadow-md transition">
    <h4 className="text-xs text-gray-500">{title}</h4>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
    <div className={`text-xs flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
      <span className="mr-1">{isPositive ? "▲" : "▼"}</span>
      {change} from last Month
    </div>
  </div>
);

export default LeadConversionPage;