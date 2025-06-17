import React, { useState, useEffect, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ENDPOINTS } from '../../api/constraints';
import { UserContext } from '../../context/UserContext';

// Reusable ToggleSwitch component (No changes needed here)
const ToggleSwitch = ({ label, isChecked, onToggle }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
    <span className="text-gray-700 font-medium">{label}</span>
    <div
      onClick={onToggle}
      className={`relative w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${
        isChecked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <div
        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isChecked ? 'translate-x-5' : 'translate-x-0'
        }`}
      ></div>
    </div>
  </div>
);

function AcheivementDashboard({ userId }) {
    console.log("AcheivementDashboard: Received userId prop:", userId);

    const { users } = useContext(UserContext);
    const currentUser = users ? users.find(user => user.iUser_id === userId) : null;
    const currentUserName = currentUser ? currentUser.cFull_name : ''; 

    const [achievements, setAchievements] = useState({
        totalLeadClosed: 0,
        dealCovertioRatio: 0,
        totalRevenueAmount: 0,
        totalLeads: 0,
        highestValueLead: { iproject_value: 0, dcreated_dt: null, convertToDealTime: null },
        highestAchievedMonth: { month: '', count: 0 },
        historicalRevenueData: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTimeFilter, setSelectedTimeFilter] = useState('this-week'); // Initial filter

    // --- Helper Functions for Formatting (unchanged) ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'Nil';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'Nil';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    // --- Data Fetching Logic (Modified to include timeFilter) ---
    useEffect(() => {
        const fetchAchievements = async () => {
            setLoading(true);
            setError(null);
            const authToken = localStorage.getItem("token");

            if (!authToken || !userId) {
                setError("Authentication token or User ID missing. Please log in.");
                setLoading(false);
                toast.error("Please login to view achievements.");
                return;
            }

            try {
                // Construct the URL with the timeFilter query parameter
                const url = new URL(`${ENDPOINTS.USER_ACHIEVEMENTS}/${userId}`);
                // Add the timeFilter parameter only if it's not 'all-time' or you want to send 'all-time' explicitly
                if (selectedTimeFilter && selectedTimeFilter !== 'all-time') {
                    url.searchParams.append('timeFilter', selectedTimeFilter);
                } else if (selectedTimeFilter === 'all-time') {
                     url.searchParams.append('timeFilter', 'all-time'); // Explicitly send 'all-time'
                }
                
                console.log(`Fetching achievements from: ${url.toString()} for User ID: ${userId} with filter: ${selectedTimeFilter}`);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Fetched achievement data:", data);

                setAchievements({
                    totalLeadClosed: data.totalLeadClosed || 0,
                    totalLeads: data.totalLeads || 0,
                    dealCovertioRatio: data.dealCovertioRatio || 0,
                    totalRevenueAmount: data.totalRevenueAmount || 0,
                    highestValueLead: data.highestValueLead || { iproject_value: 0, dcreated_dt: null, convertToDealTime: null },
                    highestAchievedMonth: data.highestAchievedMonth || { month: '', count: 0 },
                    historicalRevenueData: data.totalRevenue || [],
                });

            } catch (err) {
                console.error("Error fetching achievements:", err);
                setError(err.message);
                toast.error(`Error loading achievements: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchAchievements();
        } else {
            console.warn("AcheivementDashboard: userId prop is not available yet, skipping fetch.");
            setLoading(false);
        }
    }, [userId, selectedTimeFilter]); // *** Dependency now includes selectedTimeFilter ***

    const handleTimeFilterChange = (e) => {
        const newFilter = e.target.value;
        setSelectedTimeFilter(newFilter);
        // The useEffect hook will now re-run automatically because selectedTimeFilter changed.
        toast.info(`Time filter changed to: ${newFilter}. Re-fetching data...`);
    };

    if (loading) {
        return (
            <div className="min-h-screen p-5 font-sans text-gray-800 flex justify-center items-center">
                <p className="text-xl font-semibold">Loading Achievements...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-5 font-sans text-gray-800 flex justify-center items-center">
                <p className="text-xl font-semibold text-red-600">Error: {error}</p>
                <ToastContainer />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-5 text-gray-800 bg-gray-50">
            <div className="dashboard-container max-w-6xl mx-auto p-8 rounded-lg bg-white shadow-xl border border-gray-200">
                
                <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-blue-900 border-b-4 border-blue-400 pb-3 text-center tracking-tight animate-fade-in-down">Your Achievements</h2>

                <div className="achievement-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {/* Card 1: Total Deals Closed */}
                    <div className="achievement-card bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-102">
                        <div className="achievement-card-title text-base text-blue-800 font-medium mb-2">Total Deals Closed</div>
                        <div className="achievement-card-metric text-2xl font-bold text-blue-900 mb-2">{achievements.totalLeadClosed}</div>
                        <div className="achievement-card-trend flex items-center text-sm text-green-600 font-semibold">
                            <span className="arrow mr-1 text-lg">&#x25B2;</span>
                            +Overview
                        </div>
                    </div>

                    {/* Card 2: Revenue Generated */}
                    <div className="achievement-card bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-102">
                        <div className="achievement-card-title text-base text-green-800 font-medium mb-2">Revenue Generated</div>
                        <div className="achievement-card-metric text-2xl font-bold text-green-900 mb-2">
                            {formatCurrency(achievements.totalRevenueAmount)}
                        </div>
                        <div className="achievement-card-trend flex items-center text-sm text-green-600 font-semibold">
                            <span className="arrow mr-1 text-lg">&#x25B2;</span>
                            +Overview
                        </div>
                    </div>

                    {/* Card 3: Lead Conversion Ratio */}
                    <div className="achievement-card bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-102">
                        <div className="achievement-card-title text-base text-purple-800 font-medium mb-2">Lead Conversion Ratio</div>
                        <div className="achievement-card-metric text-2xl font-bold text-purple-900 mb-2">{achievements.dealCovertioRatio}%</div>
                        <div className="achievement-card-trend flex items-center text-sm text-green-600 font-semibold">
                            <span className="arrow mr-1 text-lg">&#x25B2;</span>
                            +Overview
                        </div>
                    </div>

                    {/* Card 4: Highest Value Deal Closed */}
                    <div className="achievement-card bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-102">
                        <div className="achievement-card-title text-base text-red-800 font-medium mb-2">Highest Value Deal Closed</div>
                        <div className="achievement-card-metric text-2xl font-bold text-red-900 mb-2">
                            {formatCurrency(achievements.highestValueLead?.iproject_value || 0)}
                        </div>
                        <div className="achievement-card-trend flex items-center text-sm text-red-600 font-semibold">
                            <span className="arrow mr-1 text-lg">&#x25B2;</span>
                            {achievements.highestValueLead?.convertToDealTime ? ` on ${formatDate(achievements.highestValueLead.convertToDealTime)}` : '+0.18% than last Month'}
                        </div>
                    </div>

                    {/* Card 5: Most Active Month */}
                    <div className="achievement-card bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border border-yellow-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-102">
                        <div className="achievement-card-title text-base text-yellow-800 font-medium mb-2">Most Active Month</div>
                        <div className="achievement-card-metric text-2xl font-bold text-yellow-900 mb-2">
                            {achievements.highestAchievedMonth?.month ? new Date(achievements.highestAchievedMonth.month).toLocaleString('en-IN', { month: 'long', year: 'numeric' }) : 'Nil'}
                        </div>
                        <div className="achievement-card-trend flex items-center text-sm text-yellow-600 font-semibold">
                            <span className="arrow mr-1 text-lg">&#x25B2;</span>
                            {achievements.highestAchievedMonth?.count ? ` with ${achievements.highestAchievedMonth.count} achievements` : '+Overview'}
                        </div>
                    </div>

                    {/* Card 6: Total Leads */}
                    <div className="achievement-card bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-lg border border-teal-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-102">
                        <div className="achievement-card-title text-base text-teal-800 font-medium mb-2">Total Leads</div>
                        <div className="achievement-card-metric text-2xl font-bold text-teal-900 mb-2">{achievements.totalLeads}</div>
                        <div className="achievement-card-trend flex items-center text-sm text-green-600 font-semibold">
                            <span className="arrow mr-1 text-lg">&#x25B2;</span>
                            +Overview
                        </div>
                    </div>
                </div>

                <div className="historical-section-header flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Historical Revenue Details</h2>
                    <div className="time-selector relative w-full sm:w-auto">
                        <select
                            className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 shadow-sm transition duration-200"
                            value={selectedTimeFilter}
                            onChange={handleTimeFilterChange}
                        >
                            <option value="this-week">This Week</option>
                            <option value="last-week">Last Week</option>
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="all-time">All Time</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                    <table className="historical-table w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-4 text-center border-b border-gray-200 font-semibold text-gray-700 uppercase text-sm whitespace-nowrap">S.No</th>
                                <th className="p-4 text-center border-b border-gray-200 font-semibold text-gray-700 uppercase text-sm whitespace-nowrap">User ID</th>
                                <th className="p-4 text-center border-b border-gray-200 font-semibold text-gray-700 uppercase text-sm whitespace-nowrap">Project Values</th>
                                <th className="p-4 text-center border-b border-gray-200 font-semibold text-gray-700 uppercase text-sm whitespace-nowrap">Created Date</th>
                                <th className="p-4 text-center border-b border-gray-200 font-semibold text-gray-700 uppercase text-sm whitespace-nowrap">Conversion Time</th> 
                            </tr>
                        </thead>
                        <tbody>
                            {achievements.historicalRevenueData.length > 0 ? (
                                achievements.historicalRevenueData.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className={`p-4 text-center border-b border-gray-200 text-gray-800 ${index === achievements.historicalRevenueData.length - 1 ? 'border-b-0' : ''}`}>
                                            {index + 1}
                                        </td>
                                        <td className={`p-4 text-center border-b border-gray-200 text-gray-800 ${index === achievements.historicalRevenueData.length - 1 ? 'border-b-0' : ''}`}>
                                            {userId}
                                        </td>
                                        <td className={`p-4 text-center border-b border-gray-200 text-gray-800 ${index === achievements.historicalRevenueData.length - 1 ? 'border-b-0' : ''}`}>
                                            {formatCurrency(row.iproject_value)}
                                        </td>
                                        <td className={`p-4 text-center border-b border-gray-200 text-gray-800 ${index === achievements.historicalRevenueData.length - 1 ? 'border-b-0' : ''}`}>
                                            {formatDate(row.dcreated_dt)}
                                        </td>
                                        <td className={`p-4 text-center border-b border-gray-200 text-gray-800 ${index === achievements.historicalRevenueData.length - 1 ? 'border-b-0' : ''}`}>
                                            {formatTime(row.convertToDealTime)} 
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-gray-500 bg-white">No historical revenue data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        </div>
    );
}

export default AcheivementDashboard;