import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../../api/constraints';
import goalIcon from '../../../public/images/nav/target.png';
// Import your provided SalesForm component
import SalesForm from '../userPage/TargetForm'; // Ensure this path is correct!

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';

// Custom Tooltip component for better UI
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip p-3 bg-white border border-gray-300 rounded-lg shadow-lg">
        <p className="label text-gray-800 font-semibold mb-1">{`Day: ${label}`}</p>
        <p className="intro text-blue-600">{`Target Value: ${payload[0].value}`}</p>
        <p className="desc text-gray-500 text-sm mt-1">Achieve your goals!</p>
      </div>
    );
  }
  return null;
};

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
    leadConversionTarget: 0,
    achievementRate: 0,
    pipelineValueTarget: 0,
  });
  const [tableMetrics, setTableMetrics] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [overallError, setOverallError] = useState(null);

  const [showAddTargetModal, setShowAddTargetModal] = useState(false);

  const [selectedFromDate, setSelectedFromDate] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDateForAPI(firstDayOfMonth);
  });

  const [selectedToDate, setSelectedToDate] = useState(() => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return formatDateForAPI(lastDayOfMonth, true);
  });

  const [selectedTargetId, setSelectedTargetId] = useState(4);

  const targetTrendsData = useMemo(() => [
    { day: 'Monday', value: 30 },
    { day: 'Tuesday', value: 20 },
    { day: 'Wednesday', value: 35 },
    { day: 'Thursday', value: 18 },
    { day: 'Friday', value: 45 },
    { day: 'Saturday', value: 22 },
    { day: 'Sunday', value: 30 },
  ], []);

  const fetchUserTarget = useCallback(async () => {
    setLoadingSummary(true);
    const token = localStorage.getItem("token");
    if (!userId || !token) {
      setOverallError("Authentication error. Please log in again.");
      setLoadingSummary(false);
      return;
    }

    try {
      const response = await axios.get(ENDPOINTS.GET_PARAMS_TARGET, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          userId,
          fromDate: selectedFromDate,
          toDate: selectedToDate,
          targetId: selectedTargetId,
        }
      });
      console.log("raw card response:", response.data);

      let fetchedTarget = {};
      if (response.data.fetchTargetValue) {
        fetchedTarget = response.data.fetchTargetValue;
      } else if (response.data.result && response.data.result.fetchTargetValue) {
        fetchedTarget = response.data.result.fetchTargetValue;
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        fetchedTarget = response.data[0];
      }

      const salesTargetValue = parseFloat(fetchedTarget?.bsales_value || 0);
      const totalAchievedAmountValue = parseFloat(response.data.totalAchievedAmount || 0);
      const targetPercentageValue = parseFloat(response.data.targetPercentage || 0);
      const resultCount = Array.isArray(response.data.result) ? response.data.result.length : 0;

      setSummaryData({
        salesTarget: salesTargetValue,
        pipelineValueTarget: totalAchievedAmountValue,
        leadConversionTarget: targetPercentageValue,
        achievementRate: resultCount,
      });

    } catch (error) {
      console.error("Error fetching user target:", error);
    } finally {
      setLoadingSummary(false);
    }
  }, [userId, selectedFromDate, selectedToDate, selectedTargetId]);

  const fetchTargetMetrics = useCallback(async () => {
    setLoadingTable(true);
    const token = localStorage.getItem("token");
    if (!userId || !token) {
      setOverallError("Authentication error. Please log in again.");
      setLoadingTable(false);
      return;
    }

    try {
      const response = await axios.get(`${ENDPOINTS.GET_METRICS_TARGET}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("response is:", response.data);

      const metricsArray = Array.isArray(response.data) ? response.data : [];

      if (metricsArray.length > 0) {
        const formattedMetrics = metricsArray.map((metric, index) => {
          if (!metric || typeof metric !== 'object') {
            return null;
          }

          const target = parseFloat(metric.bsales_value || 0);
          const achieved = parseFloat(metric.achieved_amount || 0);

          const completedPercentage = target !== 0 ? ((achieved / target) * 100).toFixed(2) : "0.00";

          return {
            id: metric.id || `metric-${index}`,
            metricName: metric.metric_name || "Sales Target (Assigned)",
            targetValue: target,
            achieved: achieved,
            completed: completedPercentage,
            status: metric.status || "N/A",
            fromDate: metric.dfrom_date ? new Date(metric.dfrom_date).toLocaleDateString() : "N/A",
            toDate: metric.dto_date ? new Date(metric.dto_date).toLocaleDateString() : "N/A",
            assignedTo: metric.AssignedTo || "N/A",
            assignedBy: metric.AssignedBy || "N/A",
            createdBy: metric.CreatedBy || "N/A",
          };
        }).filter(Boolean);

        setTableMetrics(formattedMetrics);
      } else {
        setTableMetrics([]);
      }
    } catch (error) {
      console.error("Error fetching target metrics:", error);
      setTableMetrics([]);
    } finally {
      setLoadingTable(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setOverallError("User ID is missing. Cannot load dashboard.");
      setLoadingSummary(false);
      setLoadingTable(false);
      return;
    }

    setOverallError(null);

    fetchUserTarget();
    fetchTargetMetrics();

  }, [userId, selectedFromDate, selectedToDate, selectedTargetId, fetchUserTarget, fetchTargetMetrics]);

  const handleFromDateChange = (e) => {
    setSelectedFromDate(e.target.value ? `${e.target.value}T00:00:00` : '');
  };

  const handleToDateChange = (e) => {
    setSelectedToDate(e.target.value ? `${e.target.value}T23:59:59` : '');
  };

  const handleTargetIdChange = (e) => {
    setSelectedTargetId(parseInt(e.target.value, 10));
  };

  const closeTargetModal = () => {
    setShowAddTargetModal(false);
  };

  const handleTargetAdded = () => {
    fetchUserTarget();
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
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto bg-gray-50 min-h-screen rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800 border-b-4 border-blue-500 pb-2 animate-fade-in-down">
          Sales Target Dashboard
        </h2>
        <button
          onClick={() => setShowAddTargetModal(true)}
          className="p-2 rounded-full hover:bg-blue-700 text-white shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          title="Set New Target"
        >
          <img src={goalIcon} alt="Set Target" className="w-8 h-8" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 p-5 bg-white rounded-xl shadow-md border border-gray-200">
        <div>
          <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
          <input
            type="date"
            id="fromDate"
            value={selectedFromDate.split('T')[0]}
            onChange={handleFromDateChange}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 transition duration-200 ease-in-out"
          />
        </div>
        <div>
          <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
          <input
            type="date"
            id="toDate"
            value={selectedToDate.split('T')[0]}
            onChange={handleToDateChange}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 transition duration-200 ease-in-out"
          />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="targetId" className="block text-sm font-medium text-gray-700 mb-1">Target Type:</label>
          <select
            id="targetId"
            value={selectedTargetId}
            onChange={handleTargetIdChange}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 bg-white transition duration-200 ease-in-out"
          >
            <option value={1}>Sales Target</option>
            <option value={2}>Lead Conversion</option>
            <option value={3}>Pipeline Value</option>
            <option value={4}>Overall Performance</option>
          </select>
        </div>
      </div>

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
              <h4 className="font-semibold text-lg">Sales Target</h4>
              <p className="text-xl font-bold break-words mt-2">₹{summaryData.salesTarget.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="font-semibold text-lg">Achieved Value</h4>
              <p className="text-xl font-bold mt-2">₹{summaryData.pipelineValueTarget.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white p-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="font-semibold text-lg">Completion Rate</h4>
              <p className="text-xl font-bold mt-2">{summaryData.leadConversionTarget.toFixed(2)}%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="font-semibold text-lg">Targets Assigned</h4>
              <p className="text-xl font-bold mt-2">{summaryData.achievementRate.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      <div className="mb-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Weekly Target Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={targetTrendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar
              dataKey="value"
              fill="url(#colorValue)"
              name="Target Value"
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
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-xs sm:text-sm leading-normal">
                  <th className="p-3 sm:p-4 border-b border-gray-200">Assigned To</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Assigned By</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Target</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Achieved</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Completed (%)</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">From</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">To</th>
                  <th className="p-3 sm:p-4 border-b border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {tableMetrics.map((row) => (
                  <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.assignedTo}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.assignedBy}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">₹{row.targetValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">₹{row.achieved.toLocaleString('en-IN')}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap font-medium">{row.completed}%</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.fromDate}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">{row.toDate}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        row.status === "Assigned" ? "bg-blue-100 text-blue-700" :
                        row.status === "Completed" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {row.status}
                      </span>
                    </td>
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

      {/* New Target Modal - Using your desired structure */}
      {showAddTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm overflow-auto p-4">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl">
            {/* SalesForm is placed directly inside this content div */}
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
