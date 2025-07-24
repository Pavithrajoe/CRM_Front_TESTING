import React, { useEffect, useContext, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../../context/UserContext';
import { Filter, RotateCcw } from 'lucide-react';
import { ENDPOINTS } from '../../api/constraints';

function UserCallLogs({ userId }) {
    const { users } = useContext(UserContext);

    const [callLogs, setCallLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterTrigger, setFilterTrigger] = useState(0);

    const [callStats, setCallStats] = useState({
        totalCalls: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0
    });

    // Format date to YYYY-MM-DD
    const getFormattedDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Get current month range
    const getCurrentMonthDates = () => {
        const today = new Date();
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
            firstDay: getFormattedDateForInput(first),
            lastDay: getFormattedDateForInput(last),
        };
    };

    // Format for display
    const formatDateForDisplay = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN') : 'Nil';
    const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Nil';
    const formatDuration = (sec) => {
        if (typeof sec !== 'number' || isNaN(sec) || sec < 0) return 'Nil';
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${String(h).padStart(2, '0')} h ${String(m).padStart(2, '0')} m ${String(s).padStart(2, '0')} s`;
    };

    // Initialize current month
    useEffect(() => {
        const { firstDay, lastDay } = getCurrentMonthDates();
        setStartDate(firstDay);
        setEndDate(lastDay);
        setFilterTrigger(prev => prev + 1);
    }, []);

    const handleFilterClick = () => {
        if (!startDate && !endDate) {
            toast.warn("Please select at least a start or end date.");
            return;
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error("Start date cannot be after end date.");
            return;
        }
        setFilterTrigger(prev => prev + 1);
        toast.info("Applying filter...");
    };

    const handleResetFilter = () => {
        const { firstDay, lastDay } = getCurrentMonthDates();
        setStartDate(firstDay);
        setEndDate(lastDay);
        setFilterTrigger(prev => prev + 1);
        toast.info("Filter reset.");
    };

    useEffect(() => {
        const fetchCallLogs = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const baseUrl = ENDPOINTS.CALL_LOGS;
                const queryParams = new URLSearchParams();

                const selectedUserEmail = userId || users[0]?.cEmail;
                if (selectedUserEmail) {
                    queryParams.append('user_email', selectedUserEmail);
                }

                if (startDate) queryParams.append('startDate', startDate);
                if (endDate) queryParams.append('endDate', endDate);

                const url = `${baseUrl}?${queryParams.toString()}`;

                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch logs');
                }

                const data = await response.json();
                setCallLogs(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message);
                toast.error(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchCallLogs();
    }, [filterTrigger, userId, startDate, endDate]);

    useEffect(() => {
        if (!callLogs.length) {
            setCallStats({
                totalCalls: 0,
                incomingCalls: 0,
                outgoingCalls: 0,
                missedCalls: 0,
                rejectedCalls: 0
            });
            return;
        }

        setCallStats({
            totalCalls: callLogs.length,
            incomingCalls: callLogs.filter(c => c.call_type_id === 1).length,
            outgoingCalls: callLogs.filter(c => c.call_type_id === 2).length,
            missedCalls: callLogs.filter(c => c.call_type_id === 3).length,
            rejectedCalls: callLogs.filter(c => c.call_type_id === 4).length
        });
    }, [callLogs]);

    return (
        <div className="p-6 text-gray-800 font-sans">
            <div className="dashboard-container">
                <h2 className="text-4xl font-extrabold mb-8 text-center border-b-4 border-blue-400 pb-3">
                    User Call Logs
                </h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {[
                        ['Total Calls', callStats.totalCalls, 'blue'],
                        ['Incoming Calls', callStats.incomingCalls, 'green'],
                        ['Outgoing Calls', callStats.outgoingCalls, 'purple'],
                        ['Missed Calls', callStats.missedCalls, 'orange'],
                        ['Rejected Calls', callStats.rejectedCalls, 'red']
                    ].map(([label, count, color]) => (
                        <div key={label} className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl shadow-lg border border-${color}-200`}>
                            <div className={`text-base text-${color}-800 font-medium mb-2`}>{label}</div>
                            <div className={`text-3xl font-bold text-${color}-900`}>{count}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 justify-end items-center bg-blue-50 p-4 rounded-lg shadow-inner mb-8">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-blue-700">From:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-2 border border-blue-300 rounded-md"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-blue-700">To:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border border-blue-300 rounded-md"
                        />
                    </div>
                    <button onClick={handleFilterClick} className="bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-800">
                        <Filter size={18} /> Filter
                    </button>
                    <button onClick={handleResetFilter} className="bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-700">
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto overflow-y-scroll h-[550px] rounded-lg border border-blue-300 shadow-lg">
                    <table className="min-w-full text-sm text-center divide-y divide-blue-200">
                        <thead className="bg-blue-700 text-white sticky top-0 z-10">
                            <tr>
                                {['S.No', 'User Name', 'Mobile Number', 'Call Type', 'Date', 'Time', 'Duration'].map((h) => (
                                    <th key={h} className="p-4 font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-blue-100">
                            {loading ? (
                                <tr><td colSpan={7} className="p-4 text-blue-600">Loading...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={7} className="p-4 text-red-600">{error}</td></tr>
                            ) : callLogs.length === 0 ? (
                                <tr><td colSpan={7} className="p-4 text-gray-500">No logs found.</td></tr>
                            ) : (
                                callLogs.map((log, idx) => {
                                    const userName = log.caller_name || (users.find(u => u.iUser_id === log.user_id)?.cFull_name || '-');
                                    return (
                                        <tr key={log.call_id || idx} className="hover:bg-blue-50">
                                            <td className="p-4">{idx + 1}</td>
                                            <td className="p-4">{userName}</td>
                                            <td className="p-4">{log.call_log_number}</td>
                                            <td className="p-4">
                                                {{
                                                    1: 'Incoming',
                                                    2: 'Outgoing',
                                                    3: 'Missed',
                                                    4: 'Rejected'
                                                }[log.call_type_id] || 'Unknown'}
                                            </td>
                                            <td className="p-4">{formatDateForDisplay(log.call_time)}</td>
                                            <td className="p-4">{formatTime(log.call_time)}</td>
                                            <td className="p-4">{formatDuration(log.duration)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
}

export default UserCallLogs;
