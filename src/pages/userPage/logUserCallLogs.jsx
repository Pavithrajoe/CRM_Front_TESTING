import React, { useEffect, useState, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../../context/UserContext';
import { Filter, RotateCcw } from 'lucide-react';
import { ENDPOINTS } from '../../api/constraints';
import TeamleadHeader from '../../Components/dashboard/teamlead/tlHeader';
import ProfileHeader from '../../Components/common/ProfileHeader';

function LogUserCallLogs() {
    const { users } = useContext(UserContext);

    const [callLogs, setCallLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loggedInUserEmail, setLoggedInUserEmail] = useState(null);

    const [callStats, setCallStats] = useState({
        totalCalls: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0
    });

    // Helper functions
    const formatDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const getCurrentMonthDates = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
            start: formatDateForInput(firstDay),
            end: formatDateForInput(lastDay)
        };
    };

   const formatDisplayDate = (isoString) => {
    if (!isoString) return 'Nil';
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}:${day}:${year}`; // MM:DD:YYYY format
};

    const formatTime = (isoString) => {
        if (!isoString) return 'Nil';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toUpperCase();
    };

    const formatDuration = (seconds) => {
        if (typeof seconds !== 'number' || isNaN(seconds)) return 'Nil';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')} h ${minutes.toString().padStart(2, '0')} m ${secs.toString().padStart(2, '0')} s`;
    };

    // Initialize with current month dates
    useEffect(() => {
        const { start, end } = getCurrentMonthDates();
        setStartDate(start);
        setEndDate(end);
    }, []);

    // Get logged in user email
    useEffect(() => {
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                const userData = JSON.parse(userString);
                if (userData?.cEmail) {
                    setLoggedInUserEmail(userData.cEmail);
                }
            }
        } catch (err) {
            console.error("Failed to parse user data:", err);
            toast.error("Error retrieving user information");
        }
    }, []);

    // Fetch call logs
    useEffect(() => {
        const fetchCallLogs = async () => {
            if (!loggedInUserEmail) return;

            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');
                const queryParams = new URLSearchParams();
                queryParams.append('user_email', loggedInUserEmail);

                const url = `${ENDPOINTS.CALL_LOGS}?${queryParams}`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch call logs');
                
                const data = await response.json();
                setCallLogs(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCallLogs();
    }, [loggedInUserEmail]);

    // Apply date filtering
    useEffect(() => {
        if (callLogs.length === 0) return;

        const filtered = callLogs.filter(log => {
            const callDate = new Date(log.call_time).toISOString().split('T')[0];
            const meetsStart = !startDate || callDate >= startDate;
            const meetsEnd = !endDate || callDate <= endDate;
            return meetsStart && meetsEnd;
        });

        setFilteredLogs(filtered);
    }, [callLogs, startDate, endDate]);

    // Update stats
    useEffect(() => {
        const stats = {
            totalCalls: filteredLogs.length,
            incomingCalls: filteredLogs.filter(log => log.call_type_id === 1).length,
            outgoingCalls: filteredLogs.filter(log => log.call_type_id === 2).length,
            missedCalls: filteredLogs.filter(log => log.call_type_id === 3).length,
            rejectedCalls: filteredLogs.filter(log => log.call_type_id === 4).length
        };
        setCallStats(stats);
    }, [filteredLogs]);

    const handleFilter = () => {
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error('Start date cannot be after end date');
            return;
        }
        toast.success('Filter applied');
    };

    const handleReset = () => {
        const { start, end } = getCurrentMonthDates();
        setStartDate(start);
        setEndDate(end);
        toast.info('Reset to current month');
    };

    return (
      <div className="flex mt-[-80px] font-[San Francisco,-apple-system,BlinkMacSystemFont]">
  <main className="w-full flex-1 p-6 bg-gray-50 mt-[80px] min-h-screen">
    <div className="flex justify-between items-center mb-6">
      <TeamleadHeader />
      <ProfileHeader />
    </div>

    <div className=" mx-auto">
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className=" rounded-3xl">
        <h2 className="text-3xl font-semibold text-blue-900 mb-10 text-center tracking-tight">
          📞 User Call Logs
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 mb-12">
          {[
            { label: 'Total Calls', value: callStats.totalCalls, color: 'blue' },
            { label: 'Incoming Calls', value: callStats.incomingCalls, color: 'green' },
            { label: 'Outgoing Calls', value: callStats.outgoingCalls, color: 'purple' },
            { label: 'Missed Calls', value: callStats.missedCalls, color: 'orange' },
            { label: 'Rejected Calls', value: callStats.rejectedCalls, color: 'red' },
          ].map(({ label, value, color }, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-4 border border-${color}-100 shadow-sm bg-gradient-to-tr from-${color}-50 to-${color}-100`}
            >
              <div className={`text-sm font-medium text-${color}-800 mb-1`}>{label}</div>
              <div className={`text-2xl font-bold text-${color}-900`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4 bg-white/70 backdrop-blur-md border border-blue-100 rounded-2xl mb-8 shadow-inner">
          <div className="flex items-center gap-2">
            <label className="text-sm text-blue-700 font-medium">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 rounded-full border border-blue-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-blue-700 font-medium">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 rounded-full border border-blue-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 shadow-md flex items-center gap-2"
          >
            <Filter size={16} /> Filter
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-all duration-200 shadow-md flex items-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {/* Call Logs Table */}
        <div className="overflow-x-auto rounded-2xl border border-blue-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white/80">
          <table className="min-w-full divide-y divide-blue-100">
            <thead className="bg-blue-600 text-white">
              <tr>
                {['S.No', 'User', 'Number', 'Type', 'Date', 'Time', 'Duration'].map((header, i) => (
                  <th key={i} className="px-4 py-3 text-left text-sm font-semibold tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-blue-700">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-red-600">{error}</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                    No call logs found{startDate || endDate ? ' for selected date range' : ''}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const userName = log.caller_name ||
                    (Array.isArray(users) ? users.find(u => u.iUser_id === log.user_id)?.cFull_name : '-') || '-';

                  return (
                    <tr key={index} className="hover:bg-blue-50 transition-all duration-150">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{userName}</td>
                      <td className="px-4 py-3">{log.call_log_number}</td>
                      <td className="px-4 py-3">
                        {log.call_type_id === 1 ? "Incoming" :
                          log.call_type_id === 2 ? "Outgoing" :
                            log.call_type_id === 3 ? "Missed" : "Rejected"}
                      </td>
                      <td className="px-4 py-3">{formatDisplayDate(log.call_time)}</td>
                      <td className="px-4 py-3">{formatTime(log.call_time)}</td>
                      <td className="px-4 py-3">{formatDuration(log.duration)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</div>

    );
}

export default LogUserCallLogs;