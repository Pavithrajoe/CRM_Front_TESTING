import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../../context/UserContext';
import { Filter, RotateCcw, ArrowUp, ArrowDown,Clock } from 'lucide-react';
import { ENDPOINTS } from '../../api/constraints';
import TeamleadHeader from '../../Components/dashboard/teamlead/tlHeader';
import ProfileHeader from '../../Components/common/ProfileHeader';
import LeadForm from '../../Components/LeadForm';
import BlockUnblockNumber from './BLockUnblockNumber';
import { PhoneOff } from "lucide-react";



function LogUserCallLogs() {
    const { users } = useContext(UserContext);
    const [callLogs, setCallLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loggedInUserEmail, setLoggedInUserEmail] = useState(null);
    const [isDefaultFilter, setIsDefaultFilter] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [logsPerPage] = useState(10);
    const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
    const [isBlockPopupOpen, setIsBlockPopupOpen] = useState(false);
    const [leadFormInitialData, setLeadFormInitialData] = useState(null);
    const [callStats, setCallStats] = useState({
        totalCalls: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0
    });

    const [startTime, setStartTime] = useState(''); // NEW: Time range start
    const [endTime, setEndTime] = useState('');     
    const [selectedCallType, setSelectedCallType] = useState('')
    const [showFilterSummary, setShowFilterSummary] = useState(false);


     const callTypes = [
        { id: '', label: 'All Types', value: '' },
        { id: 1, label: 'Incoming', value: '1' },
        { id: 2, label: 'Outgoing', value: '2' },
        { id: 3, label: 'Missed', value: '3' },
        { id: 4, label: 'Rejected', value: '4' }
    ];

    const getTimeFromISO = useCallback((isoString) => {
    if (!isoString) return null;
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return null;
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        return null;
    }
}, []);

const parseTime = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}, []);


    

    // Helper functions
    const formatDateForInput = useCallback((date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }, []);

    const getCurrentMonthDates = useCallback(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
            start: formatDateForInput(firstDay),
            end: formatDateForInput(lastDay)
        };
    }, [formatDateForInput]);

    const formatDisplayDate = useCallback((isoString) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return 'Invalid Date';
        }
    }, []);

    const formatTime = useCallback((isoString) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return 'Invalid Time';
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'UTC'
            }).toUpperCase();
        } catch (error) {
            return 'Invalid Time';
        }
    }, []);

    const formatDuration = useCallback((seconds) => {
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '-';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }, []);

    const getCallTypeString = useCallback((id) => {
        const callTypes = {
            1: "Incoming",
            2: "Outgoing", 
            3: "Missed",
            4: "Rejected"
        };
        return callTypes[id] || "Unknown";
    }, []);

    // Initialize with current month dates
    useEffect(() => {
        const { start, end } = getCurrentMonthDates();
        setStartDate(start);
        setEndDate(end);
        setIsDefaultFilter(true);
    }, [getCurrentMonthDates]);

    // Get logged in user email
    useEffect(() => {
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                const userData = JSON.parse(userString);
                if (userData?.cEmail) {
                    setLoggedInUserEmail(userData.cEmail);
                } else {
                    setError("User email not found in stored data");
                }
            } else {
                setError("No user data found in localStorage");
            }
        } catch (err) {
            console.error("Failed to parse user data:", err);
            setError("Error retrieving user information");
            toast.error("Error retrieving user information");
        }
    }, []);

    // Fetch call logs
   const fetchCallLogs = useCallback(async () => {
  if (!loggedInUserEmail) return;

  setLoading(true);
  setError(null);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams({
      user_email: loggedInUserEmail
    });

    const url = `${ENDPOINTS.CALL_LOGS}?${queryParams}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorMessage = response.status === 401 ? 'Unauthorized access' :
        response.status === 404 ? 'Call logs not found' :
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const logsArray = Array.isArray(data) ? data : (data.logs || []);
    setCallLogs(logsArray);
    
   
  } catch (err) {
    console.error('Fetch call logs error:', err);
    // Check if an error has already been set to avoid duplicate toasts
    if (!error) {
      setError(err.message);
      toast.error(err.message);
    }
  } finally {
    setLoading(false);
  }
}, [loggedInUserEmail]);

    // Trigger initial fetch when loggedInUserEmail is available
    useEffect(() => {
        if (loggedInUserEmail) {
            fetchCallLogs();
        }
    }, [fetchCallLogs, loggedInUserEmail]);

    // Memoized filtered and sorted logs
    const filteredAndSortedLogs = useMemo(() => {
        let filtered = [...callLogs];

        if (isDefaultFilter) {
            // Apply current month filter by default
            const { start, end } = getCurrentMonthDates();
            filtered = filtered.filter(log => {
                if (!log || !log.call_time) return false;
                try {
                    const callDate = new Date(log.call_time).toISOString().split('T')[0];
                    return callDate >= start && callDate <= end;
                } catch (error) {
                    console.warn('Invalid call_time format:', log.call_time);
                    return false;
                }
            });
        } else if (startDate || endDate) {
            // Apply custom date filter when not in default mode
            filtered = filtered.filter(log => {
                if (!log || !log.call_time) return false;
                try {
                    const callDate = new Date(log.call_time).toISOString().split('T')[0];
                    const meetsStart = !startDate || callDate >= startDate;
                    const meetsEnd = !endDate || callDate <= endDate;
                    return meetsStart && meetsEnd;
                } catch (error) {
                    console.warn('Invalid call_time format:', log.call_time);
                    return false;
                }
            });
        }
        // NEW: Call Type filtering
if (selectedCallType) {
    filtered = filtered.filter(log => 
        log.call_type_id?.toString() === selectedCallType
    );
}

// NEW: Time range filtering  
if (startTime && endTime) {
    filtered = filtered.filter(log => {
        const logTime = getTimeFromISO(log.call_time);
        if (!logTime) return false;
        
        const start = parseTime(startTime);
        const end = parseTime(endTime);
        const logMinutes = parseTime(logTime);
        
        return logMinutes >= start && logMinutes <= end;
    });
}


        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue, bValue;

                try {
                    switch (sortConfig.key) {
                        case 'userName':
                            aValue = a.caller_name || 
                                    (Array.isArray(users) ? users.find(u => u.iUser_id === a.user_id)?.cFull_name : '') || '';
                            bValue = b.caller_name || 
                                    (Array.isArray(users) ? users.find(u => u.iUser_id === b.user_id)?.cFull_name : '') || '';
                            return sortConfig.direction === 'ascending' ? 
                                aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                        
                        case 'call_time':
                            aValue = new Date(a.call_time).getTime();
                            bValue = new Date(b.call_time).getTime();
                            if (isNaN(aValue) || isNaN(bValue)) return 0;
                            break;
                        
                        case 'duration':
                            aValue = Number(a.duration) || 0;
                            bValue = Number(b.duration) || 0;
                            break;
                        
                        case 'call_type_id':
                            aValue = getCallTypeString(a.call_type_id);
                            bValue = getCallTypeString(b.call_type_id);
                            return sortConfig.direction === 'ascending' ? 
                                aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                        
                        case 'call_log_number':
                            aValue = String(a.call_log_number || '');
                            bValue = String(b.call_log_number || '');
                            return sortConfig.direction === 'ascending' ? 
                                aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                        
                        default:
                            aValue = a[sortConfig.key];
                            bValue = b[sortConfig.key];
                    }

                    if (aValue < bValue) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                } catch (error) {
                    console.warn('Sorting error:', error);
                    return 0;
                }
            });
        }
        return filtered;
   }, [callLogs, startDate, endDate, startTime, endTime, selectedCallType, sortConfig, users, getCallTypeString, isDefaultFilter, getCurrentMonthDates, getTimeFromISO]);


    // Update stats whenever filteredAndSortedLogs changes
    useEffect(() => {
        const stats = filteredAndSortedLogs.reduce((acc, log) => {
            acc.totalCalls++;
            switch (log.call_type_id) {
                case 1: acc.incomingCalls++; break;
                case 2: acc.outgoingCalls++; break;
                case 3: acc.missedCalls++; break;
                case 4: acc.rejectedCalls++; break;
                default: break;
            }
            return acc;
        }, {
            totalCalls: 0,
            incomingCalls: 0,
            outgoingCalls: 0,
            missedCalls: 0,
            rejectedCalls: 0
        });
        setCallStats(stats);
    }, [filteredAndSortedLogs]);

    // Pagination Logic
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredAndSortedLogs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(filteredAndSortedLogs.length / logsPerPage);

    const paginate = useCallback((pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    }, [totalPages]);

    const handleSort = useCallback((key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === 'ascending' 
                ? 'descending' : 'ascending';
            return { key, direction };
        });
        setCurrentPage(1);
    }, []);

    const getSortIcon = useCallback((key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? (
                <ArrowUp size={14} className="ml-1 inline" />
            ) : (
                <ArrowDown size={14} className="ml-1 inline" />
            );
        }
        return (
            <div className="ml-1 inline-flex flex-col justify-center">
                <ArrowUp size={10} className="text-white opacity-40 -mb-0.5" />
                <ArrowDown size={10} className="text-white opacity-40 -mt-0.5" />
            </div>
        );
    }, [sortConfig]);

   const handleFilter = useCallback(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        toast.error('Start date cannot be after end date');
        return;
    }
    
    // Validate time range
    if (startTime && endTime) {
        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);
        if (startMinutes > endMinutes) {
            toast.error('Start time cannot be after end time');
            return;
        }
    }

    setIsDefaultFilter(false);
    setCurrentPage(1);
    toast.success('Filters applied successfully');
}, [startDate, endDate, startTime, endTime, parseTime]);


   const handleReset = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setStartTime('');        // NEW
    setEndTime('');          // NEW
    setSelectedCallType(''); // NEW
    setIsDefaultFilter(false);
    setSortConfig({ key: null, direction: 'ascending' });
    setCurrentPage(1);
    toast.info('Showing all call logs');
}, []);


    const handleAddLeadClick = useCallback((log) => {
        if (!log || !log.call_log_number) {
            toast.error('Invalid call log data');
            return;
        }
        
        const initialData = {
            phoneNumber: log.call_log_number,
            callerName: log.caller_name || '',
            callType: getCallTypeString(log.call_type_id),
            callDate: formatDisplayDate(log.call_time),
            duration: formatDuration(log.duration)
        };
        setLeadFormInitialData(initialData);
        setIsLeadFormOpen(true);
    }, [getCallTypeString, formatDisplayDate, formatDuration]);

    const closeLeadForm = useCallback(() => {
        setIsLeadFormOpen(false);
        setLeadFormInitialData(null);
    }, []);

    // Stats card component
    const StatsCard = ({ label, value, color }) => (
        <div className={`rounded-2xl p-4 border border-${color}-200 shadow-sm bg-gradient-to-br from-${color}-50 to-${color}-100`}>
            <div className={`text-sm font-medium text-${color}-700 mb-1`}>{label}</div>
            <div className={`text-2xl font-bold text-${color}-900`}>{value}</div>
        </div>
    );

    return (
        <div className="flex mt-[-80px]">
            <main className="w-full flex-1 p-6 mt-[80px] min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <TeamleadHeader />
                    <ProfileHeader />
                </div>

                <div className="mx-auto max-w-full">
                    <ToastContainer 
                        position="bottom-right" 
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                    />

                    <div className="rounded-3xl">
                        <h2 className="text-3xl font-semibold text-blue-900 mb-10 text-center tracking-tight"> User Call Logs </h2>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 mb-12">
                            <StatsCard label="Total Calls" value={callStats.totalCalls} color="blue" />
                            <StatsCard label="Incoming" value={callStats.incomingCalls} color="green" />
                            <StatsCard label="Outgoing" value={callStats.outgoingCalls} color="purple" />
                            <StatsCard label="Missed" value={callStats.missedCalls} color="yellow" />
                            <StatsCard label="Rejected" value={callStats.rejectedCalls} color="red" />
                        </div>

                       {/* Block / Unblock Button */}

                      {/* Filter Controls - ADD THIS */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 backdrop-blur-md mb-8 rounded-2xl border border-blue-100 bg-white/60">
                            {/* All Filters in Uniform Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full lg:w-auto items-center">
                                
                                {/* From Date */}
                                <div className="flex items-center gap-2 min-w-[140px]">
                                    <label htmlFor="startDate" className="text-sm text-blue-700 font-medium whitespace-nowrap">From:</label>
                                    <input
                                        id="startDate"
                                        type="date"
                                        value={isDefaultFilter ? getCurrentMonthDates().start : startDate}
                                        onChange={(e) => {
                                            setIsDefaultFilter(false);
                                            setStartDate(e.target.value);
                                        }}
                                        className="flex-1 p-2 rounded-full border border-black-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[120px] h-11"
                                    />
                                </div>

                                {/* To Date */}
                                <div className="flex items-center gap-2 min-w-[120px]">
                                    <label htmlFor="endDate" className="text-sm text-blue-700 font-medium whitespace-nowrap">To:</label>
                                    <input
                                        id="endDate"
                                        type="date"
                                        value={isDefaultFilter ? getCurrentMonthDates().end : endDate}
                                        onChange={(e) => {
                                            setIsDefaultFilter(false);
                                            setEndDate(e.target.value);
                                        }}
                                        className="flex-1 p-2 rounded-full border border-black-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[120px] h-11"
                                    />
                                </div>

                                {/* From Time */}
                                <div className="flex items-center gap-2 min-w-[140px]">
                            
                                    <label className="text-sm text-blue-700 font-medium whitespace-nowrap">From:</label>
                                    <input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="flex-1 p-2 rounded-full border border-black-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[100px] h-11"
                                    />
                                </div>

                                {/* To Time */}
                                <div className="flex items-center gap-2 min-w-[120px]">
                                    <label className="text-sm text-blue-700 font-medium whitespace-nowrap">To:</label>
                                    <input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="flex-1 p-2 rounded-full border border-black-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[100px] h-11"
                                    />
                                </div>

                                {/* Call Type */}
                                <div className="flex items-center gap-2 min-w-[140px]">
                                    <label className="text-sm text-blue-700 font-medium whitespace-nowrap">Type:</label>
                                    <select
                                        value={selectedCallType}
                                        onChange={(e) => setSelectedCallType(e.target.value)}
                                        className="flex-1 p-2 rounded-full border border-black-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white min-w-[120px] h-11"
                                    >
                                        {callTypes.map(type => (
                                            <option key={type.id} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Buttons & Block Button */}
                            <div className="flex items-center gap-3 mt-4 lg:mt-0 flex-shrink-0">
                                <button
                                    onClick={() => setShowFilterSummary(true)}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 whitespace-nowrap"
                                >
                                    <Filter size={16} /> Apply Filters
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-md flex items-center gap-2 focus:outline-none whitespace-nowrap"
                                >
                                    <RotateCcw size={16} /> Reset
                                </button>
                                <div className="flex justify-end relative group ml-2">
                                    <button
                                        onClick={() => setIsBlockPopupOpen(true)}
                                        className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                                    >
                                        <PhoneOff size={20} strokeWidth={2.2} />
                                    </button>
                                    <span className="absolute bottom-full mb-2 right-0 scale-0 group-hover:scale-100 transition-transform bg-black text-white text-xs px-3 py-1 rounded-md whitespace-nowrap">
                                        Block / Unblock Numbers
                                    </span>
                                </div>
                            </div>
                        </div>



                        {/* Call Logs Table */}
                        <div className="overflow-x-auto rounded-2xl border border-blue-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white/80">
                            <table className="min-w-full divide-y divide-blue-100">
                                <thead className="bg-blue-600 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold tracking-wide">S.No</th>
                                        {[
                                            { label: 'User', key: 'userName' },
                                            { label: 'Number', key: 'call_log_number' },
                                            { label: 'Type', key: 'call_type_id' },
                                            { label: 'Date', key: 'call_time' },
                                            { label: 'Time', key: 'call_time' },
                                            { label: 'Duration', key: 'duration' }
                                        ].map((header) => (
                                            <th key={header.key} className="px-4 py-3 text-left text-sm font-semibold tracking-wide">
                                                <button
                                                    onClick={() => handleSort(header.key)}
                                                    className="flex items-center focus:outline-none focus:text-blue-200 transition-colors duration-200 cursor-pointer hover:bg-blue-700 p-2 rounded-md -mx-2 -my-1"
                                                    title={`Sort by ${header.label}`}
                                                >
                                                    {header.label} {getSortIcon(header.key)}
                                                </button>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-left text-sm font-semibold tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-blue-700">
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    <span className="ml-2">Loading call logs...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 h-[50vh] text-center text-red-600">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-medium">Error: {error}</span>
                                                    <button 
                                                        onClick={fetchCallLogs}
                                                        className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center h-[50vh]">
                                                    <span>No call logs found</span>
                                                    {(!isDefaultFilter && (startDate || endDate)) && (
                                                        <button 
                                                            onClick={handleReset}
                                                            className="mt-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
                                                        >
                                                            Clear filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentLogs.map((log, index) => {
                                            const userName = log.caller_name ||
                                                (Array.isArray(users) ? users.find(u => u.iUser_id === log.user_id)?.cFull_name : '') || 'Unknown';

                                            return (
                                                <tr key={`${log.id || index}-${log.call_time}`} className="hover:bg-blue-50 transition-all duration-150">
                                                    <td className="px-4 py-3 font-medium">{indexOfFirstLog + index + 1}</td>
                                                    <td className="px-4 py-3">{userName}</td>
                                                    <td className="px-4 py-3">{log.call_log_number || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            log.call_type_id === 1 ? 'bg-green-100 text-green-800' :
                                                            log.call_type_id === 2 ? 'bg-blue-100 text-blue-800' :
                                                            log.call_type_id === 3 ? 'bg-orange-200 text-orange-800' : 
                                                            'bg-orage-200 text-red-800'
                                                        }`}>
                                                            {getCallTypeString(log.call_type_id)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">{formatDisplayDate(log.call_time)}</td>
                                                    <td className="px-4 py-3">{formatTime(log.call_time)}</td>
                                                    <td className="px-4 py-3">{formatDuration(log.duration)}</td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => handleAddLeadClick(log)}
                                                            className="text-blue-600 font-semibold hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                            title="Add as Lead"
                                                        >
                                                            Add as Lead
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-8 space-x-2">
                                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    Previous
                                </button>
                                
                                {totalPages <= 7 ? (
                                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => paginate(page)}
                                            className={`px-4 py-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 ${
                                                currentPage === page 
                                                    ? 'bg-blue-800 text-white focus:ring-blue-600' 
                                                    : 'bg-blue-200 text-blue-800 hover:bg-blue-300 focus:ring-blue-400'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))
                                ) : (
                                    <>
                                        {currentPage > 3 && (
                                            <>
                                                <button onClick={() => paginate(1)} className="px-4 py-2 bg-blue-200 text-blue-800 hover:bg-blue-300 rounded-full">1</button>
                                                {currentPage > 4 && <span className="px-2">...</span>}
                                            </>
                                        )}
                                        
                                        {Array.from({ length: 3 }, (_, i) => {
                                            const page = currentPage - 1 + i;
                                            if (page < 1 || page > totalPages) return null;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => paginate(page)}
                                                    className={`px-4 py-2 rounded-full ${
                                                        currentPage === page ? 'bg-blue-800 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        
                                        {currentPage < totalPages - 2 && (
                                            <>
                                                {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                                                <button onClick={() => paginate(totalPages)} className="px-4 py-2 bg-blue-200 text-blue-800 hover:bg-blue-300 rounded-full">{totalPages}</button>
                                            </>
                                        )}
                                    </>
                                )}
                                
                                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Lead Form Modal */}
            {isLeadFormOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm z-50" onClick={closeLeadForm}>
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-blue-900">Add New Lead</h3>
                            <button onClick={closeLeadForm} className="text-gray-500 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                                title="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <LeadForm 
                            initialData={leadFormInitialData} 
                            onClose={closeLeadForm}
                            onSuccess={() => {
                                toast.success('Lead added successfully!');
                                closeLeadForm();
                            }}
                        />
                    </div>
                </div>
            )}
            {/* Block / Unblock Modal */}
                {isBlockPopupOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50" onClick={() => setIsBlockPopupOpen(false)} >
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800"> Block / Unblock Numbers </h3>
                        <button onClick={() => setIsBlockPopupOpen(false)} className="text-gray-500 hover:text-black text-xl" > ✖ </button>
                    </div>

                    {/* Component */}
                    <BlockUnblockNumber />
                    </div>
                </div>
                )}
        </div>
    );
}

export default LogUserCallLogs;



// import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { UserContext } from '../../context/UserContext';
// import { Filter, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
// import { ENDPOINTS } from '../../api/constraints';
// import TeamleadHeader from '../../Components/dashboard/teamlead/tlHeader';
// import ProfileHeader from '../../Components/common/ProfileHeader';
// import LeadForm from '../../Components/LeadForm';

// function LogUserCallLogs() {
//     const { users } = useContext(UserContext);
//     const [callLogs, setCallLogs] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [startDate, setStartDate] = useState('');
//     const [endDate, setEndDate] = useState('');
//     const [loggedInUserEmail, setLoggedInUserEmail] = useState(null);
//     const [isDefaultFilter, setIsDefaultFilter] = useState(true);
//     const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
//     const [currentPage, setCurrentPage] = useState(1);
//     const [logsPerPage] = useState(10);
//     const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
//     const [leadFormInitialData, setLeadFormInitialData] = useState(null);
//     const [callStats, setCallStats] = useState({
//         totalCalls: 0,
//         incomingCalls: 0,
//         outgoingCalls: 0,
//         missedCalls: 0,
//         rejectedCalls: 0
//     });

    

//     // Helper functions
//     const formatDateForInput = useCallback((date) => {
//         if (!date) return '';
//         const d = new Date(date);
//         return d.toISOString().split('T')[0];
//     }, []);

//     const getCurrentMonthDates = useCallback(() => {
//         const today = new Date();
//         const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//         const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//         return {
//             start: formatDateForInput(firstDay),
//             end: formatDateForInput(lastDay)
//         };
//     }, [formatDateForInput]);

//     const formatDisplayDate = useCallback((isoString) => {
//         if (!isoString) return '-';
//         try {
//             const date = new Date(isoString);
//             if (isNaN(date.getTime())) return 'Invalid Date';
//             const day = String(date.getDate()).padStart(2, '0');
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const year = date.getFullYear();
//             return `${day}/${month}/${year}`;
//         } catch (error) {
//             return 'Invalid Date';
//         }
//     }, []);

//     const formatTime = useCallback((isoString) => {
//         if (!isoString) return '-';
//         try {
//             const date = new Date(isoString);
//             if (isNaN(date.getTime())) return 'Invalid Time';
//             return date.toLocaleTimeString('en-IN', {
//                 hour: '2-digit',
//                 minute: '2-digit',
//                 hour12: true,
//                 timeZone: 'UTC'
//             }).toUpperCase();
//         } catch (error) {
//             return 'Invalid Time';
//         }
//     }, []);

//     const formatDuration = useCallback((seconds) => {
//         if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '-';
//         const hours = Math.floor(seconds / 3600);
//         const minutes = Math.floor((seconds % 3600) / 60);
//         const secs = Math.floor(seconds % 60);
//         return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
//     }, []);

//     const getCallTypeString = useCallback((id) => {
//         const callTypes = {
//             1: "Incoming",
//             2: "Outgoing", 
//             3: "Missed",
//             4: "Rejected"
//         };
//         return callTypes[id] || "Unknown";
//     }, []);

//     // Initialize with current month dates
//     useEffect(() => {
//         const { start, end } = getCurrentMonthDates();
//         setStartDate(start);
//         setEndDate(end);
//         setIsDefaultFilter(true);
//     }, [getCurrentMonthDates]);

//     // Get logged in user email
//     useEffect(() => {
//         try {
//             const userString = localStorage.getItem('user');
//             if (userString) {
//                 const userData = JSON.parse(userString);
//                 if (userData?.cEmail) {
//                     setLoggedInUserEmail(userData.cEmail);
//                 } else {
//                     setError("User email not found in stored data");
//                 }
//             } else {
//                 setError("No user data found in localStorage");
//             }
//         } catch (err) {
//             console.error("Failed to parse user data:", err);
//             setError("Error retrieving user information");
//             toast.error("Error retrieving user information");
//         }
//     }, []);

//     // Fetch call logs
//    const fetchCallLogs = useCallback(async () => {
//   if (!loggedInUserEmail) return;

//   setLoading(true);
//   setError(null);

//   try {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       throw new Error('Authentication token not found');
//     }

//     const queryParams = new URLSearchParams({
//       user_email: loggedInUserEmail
//     });

//     const url = `${ENDPOINTS.CALL_LOGS}?${queryParams}`;
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     if (!response.ok) {
//       const errorMessage = response.status === 401 ? 'Unauthorized access' :
//         response.status === 404 ? 'Call logs not found' :
//         `HTTP ${response.status}: ${response.statusText}`;
//       throw new Error(errorMessage);
//     }

//     const data = await response.json();
//     const logsArray = Array.isArray(data) ? data : (data.logs || []);
//     setCallLogs(logsArray);
    
//     // Check if logsArray is empty and a 'no logs found' toast hasn't been shown
//     // if (logsArray.length === 0) {
//     //   toast.info('No call logs found for this user');
//     // }
//   } catch (err) {
//     console.error('Fetch call logs error:', err);
//     // Check if an error has already been set to avoid duplicate toasts
//     if (!error) {
//       setError(err.message);
//       toast.error(err.message);
//     }
//   } finally {
//     setLoading(false);
//   }
// }, [loggedInUserEmail]);

//     // Trigger initial fetch when loggedInUserEmail is available
//     useEffect(() => {
//         if (loggedInUserEmail) {
//             fetchCallLogs();
//         }
//     }, [fetchCallLogs, loggedInUserEmail]);

//     // Memoized filtered and sorted logs
//     const filteredAndSortedLogs = useMemo(() => {
//         let filtered = [...callLogs];

//         if (isDefaultFilter) {
//             // Apply current month filter by default
//             const { start, end } = getCurrentMonthDates();
//             filtered = filtered.filter(log => {
//                 if (!log || !log.call_time) return false;
//                 try {
//                     const callDate = new Date(log.call_time).toISOString().split('T')[0];
//                     return callDate >= start && callDate <= end;
//                 } catch (error) {
//                     console.warn('Invalid call_time format:', log.call_time);
//                     return false;
//                 }
//             });
//         } else if (startDate || endDate) {
//             // Apply custom date filter when not in default mode
//             filtered = filtered.filter(log => {
//                 if (!log || !log.call_time) return false;
//                 try {
//                     const callDate = new Date(log.call_time).toISOString().split('T')[0];
//                     const meetsStart = !startDate || callDate >= startDate;
//                     const meetsEnd = !endDate || callDate <= endDate;
//                     return meetsStart && meetsEnd;
//                 } catch (error) {
//                     console.warn('Invalid call_time format:', log.call_time);
//                     return false;
//                 }
//             });
//         }

//         if (sortConfig.key) {
//             filtered.sort((a, b) => {
//                 let aValue, bValue;

//                 try {
//                     switch (sortConfig.key) {
//                         case 'userName':
//                             aValue = a.caller_name || 
//                                     (Array.isArray(users) ? users.find(u => u.iUser_id === a.user_id)?.cFull_name : '') || '';
//                             bValue = b.caller_name || 
//                                     (Array.isArray(users) ? users.find(u => u.iUser_id === b.user_id)?.cFull_name : '') || '';
//                             return sortConfig.direction === 'ascending' ? 
//                                 aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                        
//                         case 'call_time':
//                             aValue = new Date(a.call_time).getTime();
//                             bValue = new Date(b.call_time).getTime();
//                             if (isNaN(aValue) || isNaN(bValue)) return 0;
//                             break;
                        
//                         case 'duration':
//                             aValue = Number(a.duration) || 0;
//                             bValue = Number(b.duration) || 0;
//                             break;
                        
//                         case 'call_type_id':
//                             aValue = getCallTypeString(a.call_type_id);
//                             bValue = getCallTypeString(b.call_type_id);
//                             return sortConfig.direction === 'ascending' ? 
//                                 aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                        
//                         case 'call_log_number':
//                             aValue = String(a.call_log_number || '');
//                             bValue = String(b.call_log_number || '');
//                             return sortConfig.direction === 'ascending' ? 
//                                 aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                        
//                         default:
//                             aValue = a[sortConfig.key];
//                             bValue = b[sortConfig.key];
//                     }

//                     if (aValue < bValue) {
//                         return sortConfig.direction === 'ascending' ? -1 : 1;
//                     }
//                     if (aValue > bValue) {
//                         return sortConfig.direction === 'ascending' ? 1 : -1;
//                     }
//                     return 0;
//                 } catch (error) {
//                     console.warn('Sorting error:', error);
//                     return 0;
//                 }
//             });
//         }
//         return filtered;
//     }, [callLogs, startDate, endDate, sortConfig, users, getCallTypeString, isDefaultFilter, getCurrentMonthDates]);

//     // Update stats whenever filteredAndSortedLogs changes
//     useEffect(() => {
//         const stats = filteredAndSortedLogs.reduce((acc, log) => {
//             acc.totalCalls++;
//             switch (log.call_type_id) {
//                 case 1: acc.incomingCalls++; break;
//                 case 2: acc.outgoingCalls++; break;
//                 case 3: acc.missedCalls++; break;
//                 case 4: acc.rejectedCalls++; break;
//                 default: break;
//             }
//             return acc;
//         }, {
//             totalCalls: 0,
//             incomingCalls: 0,
//             outgoingCalls: 0,
//             missedCalls: 0,
//             rejectedCalls: 0
//         });
//         setCallStats(stats);
//     }, [filteredAndSortedLogs]);

//     // Pagination Logic
//     const indexOfLastLog = currentPage * logsPerPage;
//     const indexOfFirstLog = indexOfLastLog - logsPerPage;
//     const currentLogs = filteredAndSortedLogs.slice(indexOfFirstLog, indexOfLastLog);
//     const totalPages = Math.ceil(filteredAndSortedLogs.length / logsPerPage);

//     const paginate = useCallback((pageNumber) => {
//         if (pageNumber >= 1 && pageNumber <= totalPages) {
//             setCurrentPage(pageNumber);
//         }
//     }, [totalPages]);

//     const handleSort = useCallback((key) => {
//         setSortConfig(prevConfig => {
//             const direction = prevConfig.key === key && prevConfig.direction === 'ascending' 
//                 ? 'descending' : 'ascending';
//             return { key, direction };
//         });
//         setCurrentPage(1);
//     }, []);

//     const getSortIcon = useCallback((key) => {
//         if (sortConfig.key === key) {
//             return sortConfig.direction === 'ascending' ? (
//                 <ArrowUp size={14} className="ml-1 inline" />
//             ) : (
//                 <ArrowDown size={14} className="ml-1 inline" />
//             );
//         }
//         return (
//             <div className="ml-1 inline-flex flex-col justify-center">
//                 <ArrowUp size={10} className="text-white opacity-40 -mb-0.5" />
//                 <ArrowDown size={10} className="text-white opacity-40 -mt-0.5" />
//             </div>
//         );
//     }, [sortConfig]);

//     const handleFilter = useCallback(() => {
//         if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
//             toast.error('Start date cannot be after end date');
//             return;
//         }
//         setIsDefaultFilter(false);
//         setCurrentPage(1);
//         toast.success('Filter applied successfully');
//     }, [startDate, endDate]);

//     const handleReset = useCallback(() => {
//         setStartDate('');
//         setEndDate('');
//         setIsDefaultFilter(false);
//         setSortConfig({ key: null, direction: 'ascending' });
//         setCurrentPage(1);
//         toast.info('Showing all call logs');
//     }, []);

//     const handleAddLeadClick = useCallback((log) => {
//         if (!log || !log.call_log_number) {
//             toast.error('Invalid call log data');
//             return;
//         }
        
//         const initialData = {
//             phoneNumber: log.call_log_number,
//             callerName: log.caller_name || '',
//             callType: getCallTypeString(log.call_type_id),
//             callDate: formatDisplayDate(log.call_time),
//             duration: formatDuration(log.duration)
//         };
//         setLeadFormInitialData(initialData);
//         setIsLeadFormOpen(true);
//     }, [getCallTypeString, formatDisplayDate, formatDuration]);

//     const closeLeadForm = useCallback(() => {
//         setIsLeadFormOpen(false);
//         setLeadFormInitialData(null);
//     }, []);

//     // Stats card component
//     const StatsCard = ({ label, value, color }) => (
//         <div className={`rounded-2xl p-4 border border-${color}-200 shadow-sm bg-gradient-to-br from-${color}-50 to-${color}-100`}>
//             <div className={`text-sm font-medium text-${color}-700 mb-1`}>{label}</div>
//             <div className={`text-2xl font-bold text-${color}-900`}>{value}</div>
//         </div>
//     );

//     return (
//         <div className="flex mt-[-80px]">
//             <main className="w-full flex-1 p-6 mt-[80px] min-h-screen">
//                 <div className="flex justify-between items-center mb-6">
//                     <TeamleadHeader />
//                     <ProfileHeader />
//                 </div>

//                 <div className="mx-auto max-w-full">
//                     <ToastContainer 
//                         position="bottom-right" 
//                         autoClose={3000}
//                         hideProgressBar={false}
//                         newestOnTop={false}
//                         closeOnClick
//                         rtl={false}
//                         pauseOnFocusLoss
//                         draggable
//                         pauseOnHover
//                     />

//                     <div className="rounded-3xl">
//                         <h2 className="text-3xl font-semibold text-blue-900 mb-10 text-center tracking-tight">
//                              User Call Logs
//                         </h2>

//                         {/* Stats Cards */}
//                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 mb-12">
//                             <StatsCard label="Total Calls" value={callStats.totalCalls} color="blue" />
//                             <StatsCard label="Incoming" value={callStats.incomingCalls} color="green" />
//                             <StatsCard label="Outgoing" value={callStats.outgoingCalls} color="purple" />
//                             <StatsCard label="Missed" value={callStats.missedCalls} color="yellow" />
//                             <StatsCard label="Rejected" value={callStats.rejectedCalls} color="red" />
//                         </div>

//                         {/* Filter Controls */}
//                         <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4  backdrop-blur-md mb-8">
//                             <div className="flex items-center gap-2">
//                                 <label htmlFor="startDate" className="text-sm text-blue-700 font-medium">From:</label>
//                                 <input
//                                     id="startDate"
//                                     type="date"
//                                     value={isDefaultFilter ? getCurrentMonthDates().start : startDate}
//                                     onChange={(e) => {
//                                         setIsDefaultFilter(false);
//                                         setStartDate(e.target.value);
//                                     }}
//                                     className="p-2 rounded-full border border-blue-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300"
//                                 />
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <label htmlFor="endDate" className="text-sm text-blue-700 font-medium">To:</label>
//                                 <input
//                                     id="endDate"
//                                     type="date"
//                                     value={isDefaultFilter ? getCurrentMonthDates().end : endDate}
//                                     onChange={(e) => {
//                                         setIsDefaultFilter(false);
//                                         setEndDate(e.target.value);
//                                     }}
//                                     className="p-2 rounded-full border border-blue-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300"
//                                 />
//                             </div>
//                             <button
//                                 onClick={handleFilter}
//                                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 shadow-md flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
//                             >
//                                 <Filter size={16} /> {isDefaultFilter ? 'Current Month' : 'Apply Filter'}
//                             </button>
//                             <button
//                                 onClick={handleReset}
//                                 className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-all duration-200 shadow-md flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
//                             >
//                                 <RotateCcw size={16} /> Show All
//                             </button>
//                         </div>

//                         {/* Call Logs Table */}
//                         <div className="overflow-x-auto rounded-2xl border border-blue-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white/80">
//                             <table className="min-w-full divide-y divide-blue-100">
//                                 <thead className="bg-blue-600 text-white">
//                                     <tr>
//                                         <th className="px-4 py-3 text-left text-sm font-semibold tracking-wide">S.No</th>
//                                         {[
//                                             { label: 'User', key: 'userName' },
//                                             { label: 'Number', key: 'call_log_number' },
//                                             { label: 'Type', key: 'call_type_id' },
//                                             { label: 'Date', key: 'call_time' },
//                                             { label: 'Time', key: 'call_time' },
//                                             { label: 'Duration', key: 'duration' }
//                                         ].map((header) => (
//                                             <th key={header.key} className="px-4 py-3 text-left text-sm font-semibold tracking-wide">
//                                                 <button
//                                                     onClick={() => handleSort(header.key)}
//                                                     className="flex items-center focus:outline-none focus:text-blue-200 transition-colors duration-200 cursor-pointer hover:bg-blue-700 p-2 rounded-md -mx-2 -my-1"
//                                                     title={`Sort by ${header.label}`}
//                                                 >
//                                                     {header.label} {getSortIcon(header.key)}
//                                                 </button>
//                                             </th>
//                                         ))}
//                                         <th className="px-4 py-3 text-left text-sm font-semibold tracking-wide">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="divide-y divide-gray-200 text-sm">
//                                     {loading ? (
//                                         <tr>
//                                             <td colSpan="8" className="px-4 py-8 text-center text-blue-700">
//                                                 <div className="flex items-center justify-center">
//                                                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
//                                                     <span className="ml-2">Loading call logs...</span>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ) : error ? (
//                                         <tr>
//                                             <td colSpan="8" className="px-4 py-8 h-[50vh] text-center text-red-600">
//                                                 <div className="flex flex-col items-center">
//                                                     <span className="font-medium">Error: {error}</span>
//                                                     <button 
//                                                         onClick={fetchCallLogs}
//                                                         className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
//                                                     >
//                                                         Retry
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ) : currentLogs.length === 0 ? (
//                                         <tr>
//                                             <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
//                                                 <div className="flex flex-col items-center h-[50vh]">
//                                                     <span>No call logs found</span>
//                                                     {(!isDefaultFilter && (startDate || endDate)) && (
//                                                         <button 
//                                                             onClick={handleReset}
//                                                             className="mt-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
//                                                         >
//                                                             Clear filters
//                                                         </button>
//                                                     )}
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ) : (
//                                         currentLogs.map((log, index) => {
//                                             const userName = log.caller_name ||
//                                                 (Array.isArray(users) ? users.find(u => u.iUser_id === log.user_id)?.cFull_name : '') || 'Unknown';

//                                             return (
//                                                 <tr key={`${log.id || index}-${log.call_time}`} className="hover:bg-blue-50 transition-all duration-150">
//                                                     <td className="px-4 py-3 font-medium">{indexOfFirstLog + index + 1}</td>
//                                                     <td className="px-4 py-3">{userName}</td>
//                                                     <td className="px-4 py-3">{log.call_log_number || '-'}</td>
//                                                     <td className="px-4 py-3">
//                                                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                                                             log.call_type_id === 1 ? 'bg-green-100 text-green-800' :
//                                                             log.call_type_id === 2 ? 'bg-blue-100 text-blue-800' :
//                                                             log.call_type_id === 3 ? 'bg-orange-200 text-orange-800' : 
//                                                             'bg-orage-200 text-red-800'
//                                                         }`}>
//                                                             {getCallTypeString(log.call_type_id)}
//                                                         </span>
//                                                     </td>
//                                                     <td className="px-4 py-3">{formatDisplayDate(log.call_time)}</td>
//                                                     <td className="px-4 py-3">{formatTime(log.call_time)}</td>
//                                                     <td className="px-4 py-3">{formatDuration(log.duration)}</td>
//                                                     <td className="px-4 py-3">
//                                                         <button
//                                                             onClick={() => handleAddLeadClick(log)}
//                                                             className="text-blue-600 font-semibold hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
//                                                             title="Add as Lead"
//                                                         >
//                                                             Add as Lead
//                                                         </button>
//                                                     </td>
//                                                 </tr>
//                                             );
//                                         })
//                                     )}
//                                 </tbody>
//                             </table>
//                         </div>

//                         {/* Pagination Controls */}
//                         {totalPages > 1 && (
//                             <div className="flex justify-center items-center mt-8 space-x-2">
//                                 <button
//                                     onClick={() => paginate(currentPage - 1)}
//                                     disabled={currentPage === 1}
//                                     className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
//                                 >
//                                     Previous
//                                 </button>
                                
//                                 {totalPages <= 7 ? (
//                                     Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                                         <button
//                                             key={page}
//                                             onClick={() => paginate(page)}
//                                             className={`px-4 py-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 ${
//                                                 currentPage === page 
//                                                     ? 'bg-blue-800 text-white focus:ring-blue-600' 
//                                                     : 'bg-blue-200 text-blue-800 hover:bg-blue-300 focus:ring-blue-400'
//                                             }`}
//                                         >
//                                             {page}
//                                         </button>
//                                     ))
//                                 ) : (
//                                     <>
//                                         {currentPage > 3 && (
//                                             <>
//                                                 <button onClick={() => paginate(1)} className="px-4 py-2 bg-blue-200 text-blue-800 hover:bg-blue-300 rounded-full">1</button>
//                                                 {currentPage > 4 && <span className="px-2">...</span>}
//                                             </>
//                                         )}
                                        
//                                         {Array.from({ length: 3 }, (_, i) => {
//                                             const page = currentPage - 1 + i;
//                                             if (page < 1 || page > totalPages) return null;
//                                             return (
//                                                 <button
//                                                     key={page}
//                                                     onClick={() => paginate(page)}
//                                                     className={`px-4 py-2 rounded-full ${
//                                                         currentPage === page ? 'bg-blue-800 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
//                                                     }`}
//                                                 >
//                                                     {page}
//                                                 </button>
//                                             );
//                                         })}
                                        
//                                         {currentPage < totalPages - 2 && (
//                                             <>
//                                                 {currentPage < totalPages - 3 && <span className="px-2">...</span>}
//                                                 <button onClick={() => paginate(totalPages)} className="px-4 py-2 bg-blue-200 text-blue-800 hover:bg-blue-300 rounded-full">{totalPages}</button>
//                                             </>
//                                         )}
//                                     </>
//                                 )}
                                
//                                 <button
//                                     onClick={() => paginate(currentPage + 1)}
//                                     disabled={currentPage === totalPages}
//                                     className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
//                                 >
//                                     Next
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </main>

//             {/* Lead Form Modal */}
//             {isLeadFormOpen && (
//                 <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm z-50" onClick={closeLeadForm}>
//                     <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
//                         <div className="flex justify-between items-center mb-6">
//                             <h3 className="text-2xl font-semibold text-blue-900">Add New Lead</h3>
//                             <button 
//                                 onClick={closeLeadForm} 
//                                 className="text-gray-500 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
//                                 title="Close"
//                             >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                 </svg>
//                             </button>
//                         </div>
//                         <LeadForm 
//                             initialData={leadFormInitialData} 
//                             onClose={closeLeadForm}
//                             onSuccess={() => {
//                                 toast.success('Lead added successfully!');
//                                 closeLeadForm();
//                             }}
//                         />
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default LogUserCallLogs;