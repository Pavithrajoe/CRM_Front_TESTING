import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../api/constraints";

// Helper function to format a Date object as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Helper function to calculate the start and end of the current month
const getCurrentMonthDates = () => {
    const today = new Date();
    // Start of the month (YYYY-MM-01)
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    // End of the month (Last day of the month)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
        start: formatDate(firstDay),
        end: formatDate(lastDay),
    };
};

const UserLead = ({ userId, token }) => {
    const { start: defaultFromDate, end: defaultToDate } = getCurrentMonthDates();

    const [activeTab, setActiveTab] = useState("leads");
    const [leads, setLeads] = useState([]);
    const [lostLeads, setLostLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state set to the current month
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState(defaultFromDate);
    const [toDate, setToDate] = useState(defaultToDate);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const navigate = useNavigate();

    // Fetch leads data (Unchanged from your original logic)
    useEffect(() => {
        if (!userId || !token) return;

        const fetchLeads = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Leads
                const resLeads = await fetch(`${ENDPOINTS.LEAD}${userId}?page=1&limit=5000`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const dataLeads = await resLeads.json();
                setLeads(dataLeads?.details || []);

                // Fetch Lost Leads
                const resLost = await fetch(`${ENDPOINTS.LOST_DETAILS}/${userId}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const dataLost = await resLost.json();
                setLostLeads(dataLost?.data || []);
            } catch (err) {
                const errorMessage = err.message || 'An unknown error occurred during data fetching.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, [userId, token]);

    // **CORRECTED AND CONFIRMED DATE FILTER LOGIC**
    const applyFilters = (list) => {
        // Reset current page to 1 whenever filters change to avoid empty state
        // NOTE: The setCurrentPage(1) calls in the onChange handlers cover this.
        
        return list.filter((item) => {
            const matchesSearchTerm =
                item.clead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.iphone_no?.includes(searchTerm);

            // 1. Get the lead's creation date
            const itemDate = new Date(item.dcreated_dt);
            
            // 2. Start Date Check: Must be on or after fromDate (midnight)
            const from = fromDate ? new Date(fromDate) : null;
            const matchesFromDate = !from || itemDate >= from;

            // 3. End Date Check: Must be on or before toDate (end of day)
            let matchesToDate = true;
            if (toDate) {
                const to = new Date(toDate);
                // Set the time to the last millisecond of the day (23:59:59.999)
                to.setHours(23, 59, 59, 999);
                matchesToDate = itemDate <= to;
            }

            return matchesFromDate && matchesToDate && matchesSearchTerm;
        });
    };
    
    // ... (rest of the component's renderTable logic and return statement remain the same)
    // ... (To avoid redundancy, I'll only show the modified parts in the final component)
    
    // --- (The renderTable function and the main return block follow) ---

    const renderTable = (dataList) => {
        const filteredData = applyFilters(dataList);

        if (loading) return <p className="text-blue-600 text-center">Loading...</p>;
        if (error) return <p className="text-red-600 text-center">{error}</p>;
        if (filteredData.length === 0)
            return <p className="text-gray-500 text-center py-8">No records found.</p>;

        // Pagination calculations
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        // Ensure currentPage is valid after filtering
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

        const isLostTab = activeTab === "lost";

        return (
            <>
                {/* Pagination */}
                <div className="flex justify-end mb-4 space-x-2">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="px-3 py-1">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium">S.No.</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Lead Name</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Organization</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Website</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Phone</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">WhatsApp</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                                {!isLostTab && <th className="px-6 py-3 text-left text-sm font-medium">Owner</th>}
                                <th className="px-6 py-3 text-left text-sm font-medium">Created Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentData.map((item, index) => (
                                <tr
                                    key={item.ilead_id}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/leaddetailview/${item.ilead_id}`)} 
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.clead_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.corganization}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:underline">{item.cwebsite}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.iphone_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.whatsapp_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cemail}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                            {item.lead_status?.clead_name || "-"}
                                        </span>
                                    </td>
                                    {!isLostTab && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.user?.cFull_name || "-"}</td>}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.dcreated_dt ? new Date(item.dcreated_dt).toLocaleDateString() : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <span className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} records.
                        </span>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen w-full bg-gray-100 p-8">
            <div className="max-w-full mx-auto bg-white h-[100vh] rounded-xl shadow-lg p-6 flex flex-col">
                <h1 className="text-2xl font-bold text-blue-800 mb-6">User Leads</h1>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                    <button
                        onClick={() => {
                            setActiveTab("leads");
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 font-medium ${
                            activeTab === "leads"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-blue-500"
                        }`}
                    >
                        Leads ({leads.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("lost");
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 font-medium ${
                            activeTab === "lost"
                                ? "border-b-2 border-red-600 text-red-600"
                                : "text-gray-600 hover:text-red-500"
                        }`}
                    >
                        Lost Leads ({lostLeads.length})
                    </button>
                </div>

                {/* Search & Filter - UNCHANGED JSX */}
                <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or mobile..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => {
                            setFromDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                        title="Start Date"
                    />
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => {
                            setToDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                        title="End Date"
                    />
                </div>

                {/* Tab Content */}
                <div className="flex-grow overflow-y-auto">
                    {activeTab === "leads" && renderTable(leads)}
                    {activeTab === "lost" && renderTable(lostLeads)}
                </div>
            </div>
        </div>
    );
};

export default UserLead;