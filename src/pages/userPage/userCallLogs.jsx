import React, { useEffect, useContext, useState ,useMemo} from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from '../../context/UserContext';
import { Filter, RotateCcw } from 'lucide-react';
import  { ENDPOINTS } from '../../api/constraints';

function UserCallLogs({userId}) {
    console.log(userId);    
    const { users } = useContext(UserContext);

    const [callLogs, setCallLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterTrigger, setFilterTrigger] = useState(0);

    const [callStats, setCallStats] = useState({
        totalCalls:0,
        incomingCalls:0,
        outgoingCalls:0,
        missedCalls:0,
        rejectedCalls:0
    });

   
     

 
    // Hardcoding the user_email as per the request
    const userEmailToFetch = 'gayathirinagaraj.inklidox@gmail.com'; 

    const formatDate = (isoString) => {
        if (!isoString) return 'Nil';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
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
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
            return 'Nil';
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const pad = (num) => num.toString().padStart(2, '0');

        return `${pad(hours)} h ${pad(minutes)} m ${pad(remainingSeconds)} s`;
    };

    const handleFilterClick = () => {
        if (!startDate && !endDate) {
            toast.warn("Please select at least a start or end date to filter.");
            return;
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error("Start date cannot be after end date.");
            return;
        }
        setFilterTrigger(prev => prev + 1);
        toast.info(`Applying filter...`);
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        setFilterTrigger(prev => prev + 1);
        toast.info("Filter reset. Showing all logs.");
    };
    

    useEffect(() => {
        const fetchCallLogs = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');

                // Constructing URL with user_email as a query parameter
                           const baseUrl = ENDPOINTS.CALL_LOGS;
           
                const queryParams = new URLSearchParams();
                queryParams.append('user_email', userId); // Appen9d the hardcoded email

                // if (startDate) {
                //     queryParams.append('startDate', startDate);
                // }
                // if (endDate) {
                //     queryParams.append('endDate', endDate);
                // }

                const url = `${baseUrl}?${queryParams}`;
                // const url = `${baseUrl}?user_email`;

                console.log("The URL is,", url);

                console.log("Fetching call logs for user email (hardcoded):", userEmailToFetch, "from URL:", url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || `Failed to fetch call logs: ${response.statusText}`;
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                console.log("Received call logs data:", data);

                if (Array.isArray(data)) {
                    setCallLogs(data);
                } else {
                    setCallLogs([]);
                    toast.warn("Received unexpected data format for call logs.");
                }
            } catch (err) {
                console.error("Error fetching call logs:", err);
                setError(err.message);
                toast.error(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchCallLogs();
    }, [ userEmailToFetch]); // Add userEmailToFetch to dependencies
    
 useEffect(() => {
  if (!callLogs || callLogs.length === 0) return;

  const stats = {
    totalCalls: callLogs.length,
    incomingCalls: callLogs.filter(log => log.call_type_id === 1).length,
    outgoingCalls: callLogs.filter(log => log.call_type_id === 2).length,
    missedCalls: callLogs.filter(log => log.call_type_id === 3).length,
    rejectedCalls: callLogs.filter(log => log.call_type_id === 4).length,
  };

  setCallStats(stats);
}, [callLogs]);

      

       return (
        <div className="min-h-screen p-6 bg-blue-50 text-gray-800 font-sans">
            <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-blue-200">
                <h2 className="text-3xl font-extrabold text-blue-800 mb-6 text-center">User Call Logs</h2>

                {/* Call Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {/* Total Calls Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
                        <div className="text-base text-blue-800 font-medium mb-2">Total Calls</div>
                        <div className="text-3xl font-bold text-blue-900">{callStats.totalCalls}</div>
                        <div className="text-sm text-blue-600 mt-2">All call activities</div>
                    </div>
                    
                    {/* Incoming Calls Card */}
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-300 p-6 rounded-xl shadow-lg border border-red-200">

                        <div className="text-base text-green-800 font-medium mb-2">Incoming Calls</div>
                        <div className="text-3xl font-bold text-green-900">{callStats.incomingCalls}</div>
                        <div className="text-sm text-green-600 mt-2">Received calls</div>
                    </div>
                    
                    {/* Outgoing Calls Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
                        <div className="text-base text-purple-800 font-medium mb-2">Outgoing Calls</div>
                        <div className="text-3xl font-bold text-purple-900">{callStats.outgoingCalls}</div>
                        <div className="text-sm text-purple-600 mt-2">Dialed calls</div>
                    </div>
                    
                    {/* Missed Calls Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg border border-orange-200">
                        <div className="text-base text-orange-800 font-medium mb-2">Missed Calls</div>
                        <div className="text-3xl font-bold text-orange-900">{callStats.missedCalls}</div>
                        <div className="text-sm text-orange-600 mt-2">Unanswered calls</div>
                    </div>
                    {/* Rejected Calls Card */}

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
                        <div className="text-base text-orange-800 font-medium mb-2">Rejected Calls</div>
                        <div className="text-3xl font-bold text-orange-900">{callStats.rejectedCalls}</div>
                        <div className="text-sm text-orange-600 mt-2">Rejections</div>
                    </div>               

                    {/* Card 4: Highest Value Deal Closed */}
                    {/* <div className="achievement-card bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-102">
                        <div className="achievement-card-title text-base text-red-800 font-medium mb-2">Highest Value Deal Closed</div>
                        <div className="achievement-card-metric text-2xl font-bold text-red-900 mb-2">
                            {formatCurrency(achievements.highestValueLead?.iproject_value || 0)}
                        </div>
                        <div className="achievement-card-trend flex items-center text-sm text-red-600 font-semibold">
                            {achievements.highestValueLead?.convertToDealTime ? ` on ${formatDate(achievements.highestValueLead.convertToDealTime)}` : '-'}
                        </div> */}
                    </div>

                

                {/* Filter and Reset Buttons */}
                <div className="flex flex-col md:flex-row items-center justify-end mb-8 space-y-4 md:space-y-0 md:space-x-4 p-4 bg-blue-50 rounded-lg shadow-inner"> {/* Blue-themed filter section */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="startDate" className="text-sm font-semibold text-blue-700">From:</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="endDate" className="text-sm font-semibold text-blue-700">To:</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                        />
                    </div>
                    <button
                        onClick={handleFilterClick}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                        title="Apply Filter"
                    >
                        <Filter size={20} className="mr-2" />
                        <span>Filter</span>
                    </button>
                    <button
                        onClick={handleResetFilter}
                        className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center justify-center"
                        title="Reset Filter"
                    >
                        <RotateCcw size={20} className="mr-2" />
                        <span>Reset</span>
                    </button>
                </div>

                {/* Call Logs Table */}
                <div className="overflow-x-auto overflow-y-scroll h-[550px] shadow-lg rounded-lg border border-blue-300"> {/* Blue border for table container */}
                    <table className="min-w-full divide-y divide-blue-200"> {/* Blue divider */}
                        <thead className="bg-blue-700 text-white sticky top-0 shadow-md"> {/* Darker blue header */}
                            <tr>
                                <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">S.No</th>
                                {/* <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">Call ID</th> */}
                                <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">User Name</th>
                                <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">Mobile Number</th>
                                <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">Call Type</th>
                                <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">Date</th>
                                <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">Time</th>
                                <th className="p-4 text-center border-b border-blue-600 font-bold text-sm whitespace-nowrap">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-blue-100"> {/* Lighter blue divider for rows */}
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-4 text-center text-blue-600 font-medium">Loading call logs...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="8" className="p-4 text-center text-red-600 font-medium">Error: {error}</td>
                                </tr>
                            ) : callLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-4 text-center text-gray-500">No call logs found for this user.</td>
                                </tr>
                            ) : (
                                callLogs.map((log, index) => {
                                    const userName = log.caller_name || (users.find(u => u.iUser_id === log.user_id)?.cFull_name || '-');

                                    return (
                                        <tr key={log.call_id || index} className="hover:bg-blue-50 transition-colors duration-150 ease-in-out"> {/* Blue hover for rows */}
                                            <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>{index + 1}</td>
                                            {/* <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>{log.call_id}</td> */}
                                            <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>{userName}</td>
                                            <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>{log.call_log_number}</td>
                                            <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>
                                                {log.call_type_id === 1 ? "Incoming" :
                                                 log.call_type_id === 2 ? "Outgoing" :
                                                 log.call_type_id === 3 ? "Missed" : "Rejected"}
                                            </td>
                                            <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>{formatDate(log.call_time)}</td>
                                            <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>{formatTime(log.call_time)}</td>
                                            <td className='p-4 text-center border-b border-blue-100 text-gray-800 text-base'>{formatDuration(log.duration)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div> {/* Closing div for max-w-7xl container */}
            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
}

export default UserCallLogs;