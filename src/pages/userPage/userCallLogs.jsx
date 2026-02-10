import React, { useEffect, useContext, useState, useMemo, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../../context/UserContext';
import { Filter, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { ENDPOINTS } from '../../api/constraints';

function UserCallLogs({ userId }) {
    const { users } = useContext(UserContext);

    // State management
    const [callLogs, setCallLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedCallType, setSelectedCallType] = useState('');

    const [endDate, setEndDate] = useState('');
    const [logsPerPage, setLogsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState([
        { key: 'call_time', direction: 'descending' }
    ]);

    // Stats (Initialize, will be updated based on filtered/sorted logs)
    const [callStats, setCallStats] = useState({
        totalCalls: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0
    });

    const getFormattedDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

  const formatDateForDisplay = (iso) => {
  if (!iso) return 'Nil';

  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: 'UTC',   
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

 const formatTime = (iso) => {
  if (!iso) return 'Nil';

  return new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: 'UTC',   
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toUpperCase();
};




    const formatDuration = (sec) => {
        if (typeof sec !== 'number' || isNaN(sec) || sec < 0) return 'Nil';
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${String(h).padStart(2, '0')} h ${String(m).padStart(2, '0')} m ${String(s).padStart(2, '0')} s`;
    };

    const getCurrentMonthDates = () => {
        const today = new Date();
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
            start: getFormattedDateForInput(first),
            end: getFormattedDateForInput(last),
        };
    };

    // Data fetching logic - memoized with useCallback
    const fetchCallLogs = useCallback(async (userEmail) => {
        if (!userEmail) {
            setError("No user email available to fetch call logs.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            queryParams.append('user_email', userEmail);

            const url = `${ENDPOINTS.CALL_LOGS}?${queryParams.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new new Error(errorData.message || 'Failed to fetch logs');
            }

            const data = await response.json();
            setCallLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            toast.error(`Error fetching call logs: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);
    const timeToMinutes = (time) => {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};


    // Determine the user email to fetch logs for
    const userEmailToFetch = useMemo(() => {

        if (userId && typeof userId === 'string' && userId.includes('@')) {
            return userId;
        }
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                const userData = JSON.parse(userString);
                if (userData?.cEmail) {
                    return userData.cEmail;
                }
            }
        } catch (err) {
            console.error("Failed to parse user data from localStorage:", err);
        }
        if (users.length > 0) {
            return users[0].cEmail;
        }
        return null;
    }, [userId, users]);

    // Initial load: Set current month dates and trigger fetch
    useEffect(() => {
        const { start, end } = getCurrentMonthDates();
        setStartDate(start);
        setEndDate(end);
    }, []);

    // Effect to trigger data fetch when userEmailToFetch is available or changes
    useEffect(() => {
        if (userEmailToFetch) {
            fetchCallLogs(userEmailToFetch);
        }
    }, [userEmailToFetch, fetchCallLogs]);

    // Comparison function for sorting
    const compareValues = (a, b, key) => {
        let aValue, bValue;

        if (key === 'call_time') {
            aValue = new Date(a.call_time).getTime();
            bValue = new Date(b.call_time).getTime();
        } else if (key === 'duration') {
            aValue = a.duration || 0;
            bValue = b.duration || 0;
        } else if (key === 'userName') {
            aValue = (a.caller_name || (users.find(u => u.iUser_id === a.user_id)?.cFull_name || '')).toLowerCase();
            bValue = (b.caller_name || (users.find(u => u.iUser_id === b.user_id)?.cFull_name || '')).toLowerCase();
        } else if (key === 'call_type_id') {
            const callTypeMap = { 1: 'Incoming', 2: 'Outgoing', 3: 'Missed', 4: 'Rejected' };
            aValue = callTypeMap[a.call_type_id] || '';
            bValue = callTypeMap[b.call_type_id] || '';
        } else {
            aValue = a[key];
            bValue = b[key];
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return aValue.localeCompare(bValue);
        }
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
    };

    // Memoized filtered and sorted logs
    const sortedAndFilteredLogs = useMemo(() => {
        let currentLogs = [...callLogs];

        // Apply Date Filtering
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); 

            currentLogs = currentLogs.filter(log => {
                const logTime = new Date(log.call_time);
                return logTime >= start && logTime <= end;
            });
        } else if (startDate) {
            const start = new Date(startDate);
            currentLogs = currentLogs.filter(log => new Date(log.call_time) >= start);
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            currentLogs = currentLogs.filter(log => new Date(log.call_time) <= end);
        }


        // Apply Call Type Filter
if (selectedCallType) {
    currentLogs = currentLogs.filter(
        log => log.call_type_id?.toString() === selectedCallType
    );
}

// Apply Time Filter
if (startTime && endTime) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  currentLogs = currentLogs.filter(log => {
    const d = new Date(log.call_time);

    const logMin =
      d.getUTCHours() * 60 + d.getUTCMinutes();

    return logMin >= startMin && logMin <= endMin;
  });
}
        //  Apply Sorting
        if (sortConfig.length > 0) {
            currentLogs.sort((a, b) => {
                for (const { key, direction } of sortConfig) {
                    const compareResult = compareValues(a, b, key);
                    if (compareResult !== 0) {
                        return direction === 'ascending' ? compareResult : -compareResult;
                    }
                }
                return 0;
            });
        }
        return currentLogs;
    }, [callLogs, startDate, endDate, startTime, endTime, selectedCallType, sortConfig, users]);


    // Update stats whenever `sortedAndFilteredLogs` changes
    useEffect(() => {
        setCallStats({
            totalCalls: sortedAndFilteredLogs.length,
            incomingCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 1).length,
            outgoingCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 2).length,
            missedCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 3).length,
            rejectedCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 4).length
        });
    }, [sortedAndFilteredLogs]);

    // Sorting UI and handlers
    const requestSort = (key) => {
        setSortConfig(prev => {
            if (prev.length > 0 && prev[0].key === key) {
                return [
                    { key, direction: prev[0].direction === 'ascending' ? 'descending' : 'ascending' },
                    ...prev.slice(1)
                ];
            }
            return [
                { key, direction: 'ascending' },
                ...prev.filter(item => item.key !== key)
            ];
        });
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        const sortItem = sortConfig.find(item => item.key === key);
        return (
            <div className="ml-1 inline-flex flex-col justify-center items-center">
                <ChevronUp
                    size={14}
                    className={sortItem?.direction === 'ascending' ? 'text-white' : 'text-white opacity-40'}
                />
                <ChevronDown
                    size={14}
                    className={sortItem?.direction === 'descending' ? 'text-white' : 'text-white opacity-40'}
                />
            </div>
        );
    };

    // Filter handlers
    const handleFilterClick = () => {
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error("Start date cannot be after end date.");
            return;
        }
        setCurrentPage(1);
        toast.info("Applying filter...");
    };

  const handleResetFilter = () => {
    const { start, end } = getCurrentMonthDates();

    setStartDate(start);
    setEndDate(end);

    setStartTime('');
    setEndTime('');
    setSelectedCallType('');

    setSortConfig([{ key: 'call_time', direction: 'descending' }]);
    setLogsPerPage(10);
    setCurrentPage(1);

    toast.info("All filters cleared.");
};


    // Pagination logic
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = sortedAndFilteredLogs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(sortedAndFilteredLogs.length / logsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);

            let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2) + 1);
            let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxVisiblePages / 2) - 1);

            if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
                endPage = maxVisiblePages - 1;
            } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
                startPage = totalPages - (maxVisiblePages - 2);
            }

            if (startPage > 2) {
                pageNumbers.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }

            if (!pageNumbers.includes(totalPages)) {
                pageNumbers.push(totalPages);
            }
        }

        return pageNumbers.map((number, index) => (
            number === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-700">...</span>
            ) : (
                <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-blue-900 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'} transition-colors`}
                >
                    {number}
                </button>
            )
        ));
    };

    return (
        <div className="p-6 text-gray-800 ">
            <div className="dashboard-container">
                <h2 className="text-4xl font-extrabold mb-8 text-center border-b-4 border-blue-400 text-blue-900 pb-3">
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
                    <div className="flex items-center gap-2">
    <label className="text-sm font-semibold text-blue-700">From Time:</label>
    <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="p-2 border border-blue-300 rounded-md"
    />
</div>

<div className="flex items-center gap-2">
    <label className="text-sm font-semibold text-blue-700">To Time:</label>
    <input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        className="p-2 border border-blue-300 rounded-md"
    />
</div>
<div className="flex items-center gap-2">
    <label className="text-sm font-semibold text-blue-700">Type:</label>

    <select
        value={selectedCallType}
        onChange={(e) => setSelectedCallType(e.target.value)}
        className="p-2 border border-blue-300 rounded-md"
    >
        <option value="">All</option>
        <option value="1">Incoming</option>
        <option value="2">Outgoing</option>
        <option value="3">Missed</option>
        <option value="4">Rejected</option>
    </select>
</div>


                    <button
                        onClick={handleFilterClick}
                        className="bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-800 transition-colors"
                    >
                        <Filter size={18} /> Filter
                    </button>
                    <button
                        onClick={handleResetFilter}
                        className="bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-700 transition-colors"
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto rounded-lg border border-blue-300 shadow-lg">
                    <table className="min-w-full text-sm text-center divide-y divide-blue-200">
                        <thead className="bg-blue-700 text-white sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-bold">S.No</th>
                                {[
                                    { label: 'User Name', key: 'userName' },
                                    { label: 'Mobile Number', key: 'call_log_number' },
                                    { label: 'Call Type', key: 'call_type_id' },
                                    { label: 'Date', key: 'call_time' },
                                    { label: 'Time', key: 'call_time' },
                                    { label: 'Duration', key: 'duration' }
                                ].map(({ label, key }) => (
                                    <th key={key} className="p-4 font-bold">
                                        <button
                                            type="button"
                                            onClick={() => requestSort(key)}
                                            className="flex items-center justify-center w-full focus:outline-none cursor-pointer hover:bg-blue-800 p-2 rounded-md -mx-2 -my-1 transition-colors"
                                        >
                                            {label} {getSortIcon(key)}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-blue-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-blue-600">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-red-600">
                                        {error}
                                        <button
                                            onClick={() => fetchCallLogs(userEmailToFetch)}
                                            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ) : currentLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-gray-500">
                                        No logs found{startDate || endDate ? ' for selected date range' : ''}.
                                    </td>
                                </tr>
                            ) : (
                                currentLogs.map((log, idx) => {
                                    const userName = log.caller_name ||
                                        (users.find(u => u.iUser_id === log.user_id)?.cFull_name || '-');
                                    return (
                                        <tr key={log.call_id || idx} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-4">{(currentPage - 1) * logsPerPage + idx + 1}</td>
                                            <td className="p-4">{userName}</td>
                                            <td className="p-4">{log.call_log_number}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    log.call_type_id === 1 ? 'bg-green-100 text-green-800' :
                                                    log.call_type_id === 2 ? 'bg-purple-100 text-purple-800' :
                                                    log.call_type_id === 3 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {{
                                                        1: 'Incoming',
                                                        2: 'Outgoing',
                                                        3: 'Missed',
                                                        4: 'Rejected'
                                                    }[log.call_type_id] || 'Unknown'}
                                                </span>
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Items per page:</span>
                            <select
                                value={logsPerPage}
                                onChange={(e) => {
                                    setLogsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="p-1 border rounded text-sm"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            <div className="flex gap-1">
                                {renderPageNumbers()}
                            </div>

                            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>

                        <div className="text-sm text-gray-700">
                            Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, sortedAndFilteredLogs.length)} of {sortedAndFilteredLogs.length} entries
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
}

export default UserCallLogs;



// import React, { useEffect, useContext, useState, useMemo, useCallback } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { UserContext } from '../../context/UserContext';
// import { Filter, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
// import { ENDPOINTS } from '../../api/constraints';

// function UserCallLogs({ userId }) {
//     const { users } = useContext(UserContext);

//     // State management
//     const [callLogs, setCallLogs] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [startDate, setStartDate] = useState('');
//     const [endDate, setEndDate] = useState('');
//     const [logsPerPage, setLogsPerPage] = useState(10);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [sortConfig, setSortConfig] = useState([
//         { key: 'call_time', direction: 'descending' }
//     ]);

//     // Stats (Initialize, will be updated based on filtered/sorted logs)
//     const [callStats, setCallStats] = useState({
//         totalCalls: 0,
//         incomingCalls: 0,
//         outgoingCalls: 0,
//         missedCalls: 0,
//         rejectedCalls: 0
//     });

//     const getFormattedDateForInput = (date) => {
//         if (!date) return '';
//         const d = new Date(date);
//         return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
//     };

//     const formatDateForDisplay = (iso) => {
//         if (!iso) return 'Nil';
//         const d = new Date(iso);
//         return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
//     };

//     const formatTime = (iso) => {
//         if (!iso) return 'Nil';
//         const d = new Date(iso);
//         return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
//     };

//     const formatDuration = (sec) => {
//         if (typeof sec !== 'number' || isNaN(sec) || sec < 0) return 'Nil';
//         const h = Math.floor(sec / 3600);
//         const m = Math.floor((sec % 3600) / 60);
//         const s = sec % 60;
//         return `${String(h).padStart(2, '0')} h ${String(m).padStart(2, '0')} m ${String(s).padStart(2, '0')} s`;
//     };

//     const getCurrentMonthDates = () => {
//         const today = new Date();
//         const first = new Date(today.getFullYear(), today.getMonth(), 1);
//         const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//         return {
//             start: getFormattedDateForInput(first),
//             end: getFormattedDateForInput(last),
//         };
//     };

//     // Data fetching logic - memoized with useCallback
//     const fetchCallLogs = useCallback(async (userEmail) => {
//         if (!userEmail) {
//             setError("No user email available to fetch call logs.");
//             setLoading(false);
//             return;
//         }

//         setLoading(true);
//         setError(null);

//         try {
//             const token = localStorage.getItem('token');
//             const queryParams = new URLSearchParams();
//             queryParams.append('user_email', userEmail);

//             const url = `${ENDPOINTS.CALL_LOGS}?${queryParams.toString()}`;
//             const response = await fetch(url, {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     ...(token && { Authorization: `Bearer ${token}` }),
//                 },
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new new Error(errorData.message || 'Failed to fetch logs');
//             }

//             const data = await response.json();
//             setCallLogs(Array.isArray(data) ? data : []);
//         } catch (err) {
//             setError(err.message);
//             toast.error(`Error fetching call logs: ${err.message}`);
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     // Determine the user email to fetch logs for
//     const userEmailToFetch = useMemo(() => {
//         if (userId && typeof userId === 'string' && userId.includes('@')) {
//             return userId;
//         }
//         try {
//             const userString = localStorage.getItem('user');
//             if (userString) {
//                 const userData = JSON.parse(userString);
//                 if (userData?.cEmail) {
//                     return userData.cEmail;
//                 }
//             }
//         } catch (err) {
//             console.error("Failed to parse user data from localStorage:", err);
//         }
//         if (users.length > 0) {
//             return users[0].cEmail;
//         }
//         return null;
//     }, [userId, users]);

//     // Initial load: Set current month dates and trigger fetch
//     useEffect(() => {
//         const { start, end } = getCurrentMonthDates();
//         setStartDate(start);
//         setEndDate(end);
//     }, []);

//     // Effect to trigger data fetch when userEmailToFetch is available or changes
//     useEffect(() => {
//         if (userEmailToFetch) {
//             fetchCallLogs(userEmailToFetch);
//         }
//     }, [userEmailToFetch, fetchCallLogs]);

//     // Comparison function for sorting
//     const compareValues = (a, b, key) => {
//         let aValue, bValue;

//         if (key === 'call_time') {
//             aValue = new Date(a.call_time).getTime();
//             bValue = new Date(b.call_time).getTime();
//         } else if (key === 'duration') {
//             aValue = a.duration || 0;
//             bValue = b.duration || 0;
//         } else if (key === 'userName') {
//             aValue = (a.caller_name || (users.find(u => u.iUser_id === a.user_id)?.cFull_name || '')).toLowerCase();
//             bValue = (b.caller_name || (users.find(u => u.iUser_id === b.user_id)?.cFull_name || '')).toLowerCase();
//         } else if (key === 'call_type_id') {
//             const callTypeMap = { 1: 'Incoming', 2: 'Outgoing', 3: 'Missed', 4: 'Rejected' };
//             aValue = callTypeMap[a.call_type_id] || '';
//             bValue = callTypeMap[b.call_type_id] || '';
//         } else {
//             aValue = a[key];
//             bValue = b[key];
//         }

//         if (typeof aValue === 'string' && typeof bValue === 'string') {
//             return aValue.localeCompare(bValue);
//         }
//         if (aValue < bValue) return -1;
//         if (aValue > bValue) return 1;
//         return 0;
//     };

//     // Memoized filtered and sorted logs
//     const sortedAndFilteredLogs = useMemo(() => {
//         let currentLogs = [...callLogs];

//         // Apply Date Filtering
//         if (startDate && endDate) {
//             const start = new Date(startDate);
//             const end = new Date(endDate);
//             end.setHours(23, 59, 59, 999); 

//             currentLogs = currentLogs.filter(log => {
//                 const logTime = new Date(log.call_time);
//                 return logTime >= start && logTime <= end;
//             });
//         } else if (startDate) {
//             const start = new Date(startDate);
//             currentLogs = currentLogs.filter(log => new Date(log.call_time) >= start);
//         } else if (endDate) {
//             const end = new Date(endDate);
//             end.setHours(23, 59, 59, 999);
//             currentLogs = currentLogs.filter(log => new Date(log.call_time) <= end);
//         }


//         //  Apply Sorting
//         if (sortConfig.length > 0) {
//             currentLogs.sort((a, b) => {
//                 for (const { key, direction } of sortConfig) {
//                     const compareResult = compareValues(a, b, key);
//                     if (compareResult !== 0) {
//                         return direction === 'ascending' ? compareResult : -compareResult;
//                     }
//                 }
//                 return 0;
//             });
//         }
//         return currentLogs;
//     }, [callLogs, startDate, endDate, sortConfig, users]);

//     // Update stats whenever `sortedAndFilteredLogs` changes
//     useEffect(() => {
//         setCallStats({
//             totalCalls: sortedAndFilteredLogs.length,
//             incomingCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 1).length,
//             outgoingCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 2).length,
//             missedCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 3).length,
//             rejectedCalls: sortedAndFilteredLogs.filter(c => c.call_type_id === 4).length
//         });
//     }, [sortedAndFilteredLogs]);

//     // Sorting UI and handlers
//     const requestSort = (key) => {
//         setSortConfig(prev => {
//             if (prev.length > 0 && prev[0].key === key) {
//                 return [
//                     { key, direction: prev[0].direction === 'ascending' ? 'descending' : 'ascending' },
//                     ...prev.slice(1)
//                 ];
//             }
//             return [
//                 { key, direction: 'ascending' },
//                 ...prev.filter(item => item.key !== key)
//             ];
//         });
//         setCurrentPage(1);
//     };

//     const getSortIcon = (key) => {
//         const sortItem = sortConfig.find(item => item.key === key);
//         return (
//             <div className="ml-1 inline-flex flex-col justify-center items-center">
//                 <ChevronUp
//                     size={14}
//                     className={sortItem?.direction === 'ascending' ? 'text-white' : 'text-white opacity-40'}
//                 />
//                 <ChevronDown
//                     size={14}
//                     className={sortItem?.direction === 'descending' ? 'text-white' : 'text-white opacity-40'}
//                 />
//             </div>
//         );
//     };

//     // Filter handlers
//     const handleFilterClick = () => {
//         if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
//             toast.error("Start date cannot be after end date.");
//             return;
//         }
//         setCurrentPage(1);
//         toast.info("Applying filter...");
//     };

//     const handleResetFilter = () => {
//         const { start, end } = getCurrentMonthDates();
//         setStartDate(start);
//         setEndDate(end);
//         setSortConfig([{ key: 'call_time', direction: 'descending' }]);
//         setLogsPerPage(10);
//         setCurrentPage(1);
//         toast.info("All filters cleared and data reset.");
//     };

//     // Pagination logic
//     const indexOfLastLog = currentPage * logsPerPage;
//     const indexOfFirstLog = indexOfLastLog - logsPerPage;
//     const currentLogs = sortedAndFilteredLogs.slice(indexOfFirstLog, indexOfLastLog);
//     const totalPages = Math.ceil(sortedAndFilteredLogs.length / logsPerPage);

//     const paginate = (pageNumber) => setCurrentPage(pageNumber);

//     const renderPageNumbers = () => {
//         const pageNumbers = [];
//         const maxVisiblePages = 5;

//         if (totalPages <= maxVisiblePages) {
//             for (let i = 1; i <= totalPages; i++) {
//                 pageNumbers.push(i);
//             }
//         } else {
//             pageNumbers.push(1);

//             let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2) + 1);
//             let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxVisiblePages / 2) - 1);

//             if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
//                 endPage = maxVisiblePages - 1;
//             } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
//                 startPage = totalPages - (maxVisiblePages - 2);
//             }

//             if (startPage > 2) {
//                 pageNumbers.push('...');
//             }

//             for (let i = startPage; i <= endPage; i++) {
//                 pageNumbers.push(i);
//             }

//             if (endPage < totalPages - 1) {
//                 pageNumbers.push('...');
//             }

//             if (!pageNumbers.includes(totalPages)) {
//                 pageNumbers.push(totalPages);
//             }
//         }

//         return pageNumbers.map((number, index) => (
//             number === '...' ? (
//                 <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-700">...</span>
//             ) : (
//                 <button
//                     key={number}
//                     onClick={() => paginate(number)}
//                     className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-blue-900 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'} transition-colors`}
//                 >
//                     {number}
//                 </button>
//             )
//         ));
//     };

//     return (
//         <div className="p-6 text-gray-800 ">
//             <div className="dashboard-container">
//                 <h2 className="text-4xl font-extrabold mb-8 text-center border-b-4 border-blue-400 text-blue-900 pb-3">
//                     User Call Logs
//                 </h2>

//                 {/* Stats Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//                     {[
//                         ['Total Calls', callStats.totalCalls, 'blue'],
//                         ['Incoming Calls', callStats.incomingCalls, 'green'],
//                         ['Outgoing Calls', callStats.outgoingCalls, 'purple'],
//                         ['Missed Calls', callStats.missedCalls, 'orange'],
//                         ['Rejected Calls', callStats.rejectedCalls, 'red']
//                     ].map(([label, count, color]) => (
//                         <div key={label} className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl shadow-lg border border-${color}-200`}>
//                             <div className={`text-base text-${color}-800 font-medium mb-2`}>{label}</div>
//                             <div className={`text-3xl font-bold text-${color}-900`}>{count}</div>
//                         </div>
//                     ))}
//                 </div>

//                 {/* Filters */}
//                 <div className="flex flex-wrap gap-4 justify-end items-center bg-blue-50 p-4 rounded-lg shadow-inner mb-8">
//                     <div className="flex items-center gap-2">
//                         <label className="text-sm font-semibold text-blue-700">From:</label>
//                         <input
//                             type="date"
//                             value={startDate}
//                             onChange={(e) => setStartDate(e.target.value)}
//                             className="p-2 border border-blue-300 rounded-md"
//                         />
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <label className="text-sm font-semibold text-blue-700">To:</label>
//                         <input
//                             type="date"
//                             value={endDate}
//                             onChange={(e) => setEndDate(e.target.value)}
//                             className="p-2 border border-blue-300 rounded-md"
//                         />
//                     </div>
//                     <button
//                         onClick={handleFilterClick}
//                         className="bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-800 transition-colors"
//                     >
//                         <Filter size={18} /> Filter
//                     </button>
//                     <button
//                         onClick={handleResetFilter}
//                         className="bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-700 transition-colors"
//                     >
//                         <RotateCcw size={18} /> Reset
//                     </button>
//                 </div>

//                 {/* Logs Table */}
//                 <div className="overflow-x-auto rounded-lg border border-blue-300 shadow-lg">
//                     <table className="min-w-full text-sm text-center divide-y divide-blue-200">
//                         <thead className="bg-blue-700 text-white sticky top-0 z-10">
//                             <tr>
//                                 <th className="p-4 font-bold">S.No</th>
//                                 {[
//                                     { label: 'User Name', key: 'userName' },
//                                     { label: 'Mobile Number', key: 'call_log_number' },
//                                     { label: 'Call Type', key: 'call_type_id' },
//                                     { label: 'Date', key: 'call_time' },
//                                     { label: 'Time', key: 'call_time' },
//                                     { label: 'Duration', key: 'duration' }
//                                 ].map(({ label, key }) => (
//                                     <th key={key} className="p-4 font-bold">
//                                         <button
//                                             type="button"
//                                             onClick={() => requestSort(key)}
//                                             className="flex items-center justify-center w-full focus:outline-none cursor-pointer hover:bg-blue-800 p-2 rounded-md -mx-2 -my-1 transition-colors"
//                                         >
//                                             {label} {getSortIcon(key)}
//                                         </button>
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-blue-100">
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan={7} className="p-4 text-blue-600">
//                                         <div className="flex justify-center">
//                                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ) : error ? (
//                                 <tr>
//                                     <td colSpan={7} className="p-4 text-red-600">
//                                         {error}
//                                         <button
//                                             onClick={() => fetchCallLogs(userEmailToFetch)}
//                                             className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
//                                         >
//                                             Retry
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ) : currentLogs.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={7} className="p-4 text-gray-500">
//                                         No logs found{startDate || endDate ? ' for selected date range' : ''}.
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 currentLogs.map((log, idx) => {
//                                     const userName = log.caller_name ||
//                                         (users.find(u => u.iUser_id === log.user_id)?.cFull_name || '-');
//                                     return (
//                                         <tr key={log.call_id || idx} className="hover:bg-blue-50 transition-colors">
//                                             <td className="p-4">{(currentPage - 1) * logsPerPage + idx + 1}</td>
//                                             <td className="p-4">{userName}</td>
//                                             <td className="p-4">{log.call_log_number}</td>
//                                             <td className="p-4">
//                                                 <span className={`px-2 py-1 rounded-full text-xs ${
//                                                     log.call_type_id === 1 ? 'bg-green-100 text-green-800' :
//                                                     log.call_type_id === 2 ? 'bg-purple-100 text-purple-800' :
//                                                     log.call_type_id === 3 ? 'bg-orange-100 text-orange-800' :
//                                                     'bg-red-100 text-red-800'
//                                                 }`}>
//                                                     {{
//                                                         1: 'Incoming',
//                                                         2: 'Outgoing',
//                                                         3: 'Missed',
//                                                         4: 'Rejected'
//                                                     }[log.call_type_id] || 'Unknown'}
//                                                 </span>
//                                             </td>
//                                             <td className="p-4">{formatDateForDisplay(log.call_time)}</td>
//                                             <td className="p-4">{formatTime(log.call_time)}</td>
//                                             <td className="p-4">{formatDuration(log.duration)}</td>
//                                         </tr>
//                                     );
//                                 })
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination Controls */}
//                 {totalPages > 1 && (
//                     <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
//                         <div className="flex items-center gap-2">
//                             <span className="text-sm text-gray-600">Items per page:</span>
//                             <select
//                                 value={logsPerPage}
//                                 onChange={(e) => {
//                                     setLogsPerPage(Number(e.target.value));
//                                     setCurrentPage(1);
//                                 }}
//                                 className="p-1 border rounded text-sm"
//                             >
//                                 <option value={10}>10</option>
//                                 <option value={25}>25</option>
//                                 <option value={50}>50</option>
//                                 <option value={100}>100</option>
//                             </select>
//                         </div>

//                         <div className="flex items-center gap-4">
//                             <button
//                                 onClick={() => paginate(currentPage - 1)}
//                                 disabled={currentPage === 1}
//                                 className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                             >
//                                 Previous
//                             </button>

//                             <div className="flex gap-1">
//                                 {renderPageNumbers()}
//                             </div>

//                             <button
//                                 onClick={() => paginate(currentPage + 1)}
//                                 disabled={currentPage === totalPages}
//                                 className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                             >
//                                 Next
//                             </button>
//                         </div>

//                         <div className="text-sm text-gray-700">
//                             Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, sortedAndFilteredLogs.length)} of {sortedAndFilteredLogs.length} entries
//                         </div>
//                     </div>
//                 )}
//             </div>
//             <ToastContainer position="bottom-right" autoClose={3000} />
//         </div>
//     );
// }

// export default UserCallLogs;