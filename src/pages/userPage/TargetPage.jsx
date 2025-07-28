import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';
import goalIcon from '../../../public/images/nav/target.png';
import SalesForm from '../userPage/TargetForm';
import Select from "react-select";


import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';

// Custom Tooltip component for the Bar Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip p-3 bg-white border border-gray-300 rounded-lg shadow-lg">
        <p className="label text-gray-800 font-semibold mb-1">{label}</p>
        <p className="intro text-blue-600">{`Total Target: ₹${payload.find(p => p.dataKey === 'targetValue')?.value.toLocaleString('en-IN') || 0}`}</p>
        <p className="intro text-green-600">{`Total Achieved: ₹${payload.find(p => p.dataKey === 'achievedValue')?.value.toLocaleString('en-IN') || 0}`}</p>
        <p className="intro text-purple-600">{`Completion: ${payload.find(p => p.dataKey === 'completion')?.value || 0}%`}</p>
        <p className="desc text-gray-500 text-sm mt-1">Monthly performance overview</p>
      </div>
    );
  }
  return null;
};

// Helper function to format dates for API calls
const formatDateForAPI = (date, isEndOfDay = false) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = isEndOfDay ? '23' : '00';
  const minutes = isEndOfDay ? '59' : '00';
  const seconds = isEndOfDay ? '59' : '00';
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const TargetDashboard = ({ userId }) => {
  const [summaryData, setSummaryData] = useState({
    salesTarget: 0,
    achievedValue: 0,
    completionRate: 0,
    targetsAssigned: 0,
  });

  const [targetTrendsData, setTargetTrendsData] = useState([]);
  const [tableMetrics, setTableMetrics] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [overallError, setOverallError] = useState(null);
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);

  // selectedFromDate, selectedToDate, and selectedTargetId are no longer actively used for filtering
  // but kept for initial state if they are default values for API calls
  const [selectedFromDate] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayOfMonth;
  });

  const [selectedToDate] = useState(() => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDayOfMonth;
  });

  const [selectedTargetId] = useState(4); // Example default value

const fetchTargetMetrics = useCallback(async () => {
  setLoadingTable(true);
  setLoadingSummary(true);

  const token = localStorage.getItem("token");
  if (!userId || !token) {
    setOverallError("Authentication error. Please log in again.");
    setLoadingSummary(false);
    setLoadingTable(false);
    return;
  }

  const fromDateAPI = formatDateForAPI(selectedFromDate);
  const toDateAPI = formatDateForAPI(selectedToDate, true);

  try {
    const response = await axios.get(`${ENDPOINTS.GET_METRICS_TARGET}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        fromDate: fromDateAPI,
        toDate: toDateAPI,
      }
    });

    // Handle the response structure with userTargets array
    const metricsArray = response.data.userTargets || [];
    const totalTargets = response.data.totalTarget || 0;

    const formattedMetrics = metricsArray.map((metric, index) => {
      const target = parseFloat(metric.bsales_value || 0);
      const achieved = parseFloat(metric.achievedAmount || 0);
      const completedPercentage = target !== 0 ? ((achieved / target) * 100).toFixed(2) : "0.00";

      const fromDate = metric.dfrom_date ? new Date(metric.dfrom_date) : null;
      const toDate = metric.dto_date ? new Date(metric.dto_date) : null;

      // Define options for DD/MM/YYYY format
      const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

      return {
        id: metric.isalesId || `metric-${index}`,
        metricName: "Sales Target", // Default name since not in response
        targetValue: target,
        achieved: achieved,
        completed: completedPercentage,
        status: metric.bactive ? "Active" : "Inactive",
        fromDate: fromDate ? fromDate.toLocaleDateString('en-GB', dateOptions) : "-",
        toDate: toDate ? toDate.toLocaleDateString('en-GB', dateOptions) : "-",
        rawFromDate: fromDate,
        rawToDate: toDate,
        assignedTo: metric.AssignedTo || "-",
        assignedBy: metric.AssignedBy || "-",
        createdBy: metric.createdBy || "-",
      };
    });

    setTableMetrics(formattedMetrics);

    // Calculate summary data
    let totalSalesTarget = 0;
    let totalAchievedValue = 0;
    let totalCompletionRate = 0;

    metricsArray.forEach(metric => {
      const target = parseFloat(metric.bsales_value || 0);
      const achieved = parseFloat(metric.achievedAmount || 0);
      totalSalesTarget += target;
      totalAchievedValue += achieved;
    });

    if (totalSalesTarget > 0) {
      totalCompletionRate = ((totalAchievedValue / totalSalesTarget) * 100).toFixed(2);
    }

    setSummaryData({
      salesTarget: totalSalesTarget,
      achievedValue: totalAchievedValue,
      completionRate: parseFloat(totalCompletionRate),
      targetsAssigned: totalTargets, // Using the totalTarget from response
    });

    // Prepare chart data
    const chartData = [{
      name: "Target Overview",
      targetValue: totalSalesTarget,
      achievedValue: totalAchievedValue,
      completion: parseFloat(totalCompletionRate),
    }];

    setTargetTrendsData(chartData);

  } catch (error) {
    console.error("Error fetching target metrics:", error);
    setTableMetrics([]);
    setSummaryData({
      salesTarget: 0,
      achievedValue: 0,
      completionRate: 0,
      targetsAssigned: 0,
    });
    setTargetTrendsData([]);
    setOverallError("Failed to load dashboard data. Please try again.");
  } finally {
    setLoadingSummary(false);
    setLoadingTable(false);
  }
}, [userId, selectedFromDate, selectedToDate]);

  useEffect(() => {
    if (!userId) {
      setOverallError("User ID is missing. Cannot load dashboard.");
      setLoadingSummary(false);
      setLoadingTable(false);
      return;
    }

    setOverallError(null);
    fetchTargetMetrics();
  }, [userId, fetchTargetMetrics]);

  // Removed handleFromDateChange, handleToDateChange, and handleTargetIdChange functions
  // as they are no longer tied to UI elements.

  const closeTargetModal = () => {
    setShowAddTargetModal(false);
  };

  const handleTargetAdded = () => {
    fetchTargetMetrics();
  };

  if (overallError) {
    return (
      <div className="p-6 max-w-screen-lg mx-auto bg-red-100 rounded-lg shadow-md text-red-700 text-center py-10">
        <h2 className="text-xl font-bold mb-4">Dashboard Loading Error</h2>
        <p>{overallError}</p>
        <p className="mt-4 text-sm text-red-600">Please ensure you are logged in and have the correct permissions.</p>
      </div>
    );
  }

  return (
     <div className="  font-sans p-4 md:p-6">
            <div className="dashboard-container">
  <div className="flex justify-between items-center mb-8 border-b-4 border-blue-400 pb-3 animate-fade-in-down">
    <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800 text-left tracking-tight">
      Sales Target Dashboard
    </h2>
    <button
      onClick={() => setShowAddTargetModal(true)}
      className="p-2 rounded-full text-white shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none "
      title="Set New Target"
    >
      <img src={goalIcon} alt="Set Target" className="w-8 h-8" />
    </button>
  </div>
</div>

      {/* Date Filters and Target ID Selector section removed */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {loadingSummary ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse p-5 rounded-xl shadow-md border border-gray-300 h-32 flex flex-col justify-center items-center">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="font-semibold text-lg">Current Month Target</h4>
              <p className="text-xl font-bold break-words mt-2">₹{summaryData.salesTarget.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="font-semibold text-lg">Current Month Achieved</h4>
              <p className="text-xl font-bold mt-2">₹{summaryData.achievedValue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white p-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="font-semibold text-lg">Current Month Completion</h4>
              <p className="text-xl font-bold mt-2">{summaryData.completionRate.toFixed(2)}%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="font-semibold text-lg">Total Targets Assigned</h4>
              <p className="text-xl font-bold mt-2">{summaryData.targetsAssigned.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      <div className="mb-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Monthly Performance Summary</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={targetTrendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorAchieved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#a855f7" axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar
              yAxisId="left"
              dataKey="targetValue"
              fill="url(#colorTarget)"
              name="Total Target Value"
              barSize={30}
              radius={[10, 10, 0, 0]}
              isAnimationActive={true}
              animationDuration={1500}
            />
            <Bar
              yAxisId="left"
              dataKey="achievedValue"
              fill="url(#colorAchieved)"
              name="Total Achieved Value"
              barSize={30}
              radius={[10, 10, 0, 0]}
              isAnimationActive={true}
              animationDuration={1500}
            />
            <Bar
              yAxisId="right"
              dataKey="completion"
              fill="url(#colorCompletion)"
              name="Completion Rate (%)"
              barSize={30}
              radius={[10, 10, 0, 0]}
              isAnimationActive={true}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Assigned Target Metrics</h3>
        {loadingTable ? (
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded my-2"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 h-[350px] rounded-lg overflow-y-scroll">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-xs sm:text-sm leading-normal">
                  <th className="p-3 sm:p-4 border-b border-gray-200">S.No</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Assigned To</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Assigned By</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Target</th>
                  {/* <th className="p-3 sm:p-4 border-b border-gray-200">Achieved</th> */}
                  <th className="p-3 sm:p-4 border-b border-gray-200">Completed (%)</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">From</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">To</th>
                  {/* <th className="p-3 sm:p-4 border-b border-gray-200">Status</th> */}
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {tableMetrics.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                    <td className="p-3 sm:p-4 whitespace-nowrap">{index + 1}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.assignedTo}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.assignedBy}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">₹{row.targetValue.toLocaleString('en-IN')}</td>
                    {/* <td className="p-3 sm:p-4 whitespace-nowrap">₹{row.achieved.toLocaleString('en-IN')}</td> */}
                    <td className="p-3 sm:p-4 whitespace-nowrap font-medium">{row.completed}%</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.fromDate}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.toDate}</td>
                    {/* <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        row.status === "Assigned" ? "bg-blue-100 text-blue-700" :
                        row.status === "Completed" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {row.status}
                      </span>
                    </td> */}
                  </tr>
                ))}
                {tableMetrics.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center p-6 text-gray-500">No target metrics found for the selected criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm overflow-auto p-4">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl">
            <SalesForm
              onClose={() => {
                closeTargetModal();
                handleTargetAdded();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetDashboard;