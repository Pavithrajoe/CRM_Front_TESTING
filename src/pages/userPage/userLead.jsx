import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../api/constraints";

const STORAGE_KEY = (userId) => `userLeadFilters_${userId}`;
const formatDate = (date) => date.toISOString().split('T')[0];
const getCurrentMonthDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
        start: formatDate(firstDay),
        end: formatDate(lastDay),
    };
};

const defaultDates = getCurrentMonthDates();

// Function to load state from sessionStorage
const loadFilterState = (userId) => {
    const storedState = sessionStorage.getItem(STORAGE_KEY(userId));
    if (storedState) {
        try {
            return JSON.parse(storedState);
        } catch (e) {
            console.error("Error parsing stored filter state:", e);
        }
    }
    return {
        activeTab: "leads",
        searchTerm: "",
        fromDate: defaultDates.start,
        toDate: defaultDates.end,
        currentPage: 1,
    };
};

const saveFilterState = (userId, state) => {
    try {
        sessionStorage.setItem(STORAGE_KEY(userId), JSON.stringify(state));
    } catch (e) {
        console.error("Error saving filter state:", e);
    }
};

const UserLead = ({ userId, token }) => {
    const navigate = useNavigate();
    const itemsPerPage = 12;
    const initialFilterState = loadFilterState(userId);
    const [activeTab, setActiveTabState] = useState(initialFilterState.activeTab);
    const [searchTerm, setSearchTermState] = useState(initialFilterState.searchTerm);
    const [fromDate, setFromDateState] = useState(initialFilterState.fromDate);
    const [toDate, setToDateState] = useState(initialFilterState.toDate);
    const [currentPage, setCurrentPageState] = useState(initialFilterState.currentPage);
    const [leads, setLeads] = useState([]);
    const [lostLeads, setLostLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to update state and save to storage
    const updateAndPersist = useCallback((key, value, resetPage = false) => {
        let newState = {};

        if (key === 'activeTab') setActiveTabState(value);
        if (key === 'searchTerm') setSearchTermState(value);
        if (key === 'fromDate') setFromDateState(value);
        if (key === 'toDate') setToDateState(value);
        if (key === 'currentPage') setCurrentPageState(value);
        newState = {
            activeTab: key === 'activeTab' ? value : activeTab,
            searchTerm: key === 'searchTerm' ? value : searchTerm,
            fromDate: key === 'fromDate' ? value : fromDate,
            toDate: key === 'toDate' ? value : toDate,
            currentPage: resetPage ? 1 : (key === 'currentPage' ? value : currentPage),
        };
        
        saveFilterState(userId, newState);
        if (resetPage) {
             setCurrentPageState(1);
        }

    }, [activeTab, searchTerm, fromDate, toDate, currentPage, userId]);

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

    //  DATE FILTER LOGIC
    const applyFilters = (list) => {
        // Only run if leads are loaded
        if (!list || list.length === 0) return [];
        
        return list.filter((item) => {
            const matchesSearchTerm =
                item.clead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.iphone_no?.includes(searchTerm);
            const itemDate = new Date(item.dcreated_dt);
            itemDate.setHours(0, 0, 0, 0); 
            
            let matchesFromDate = true;
            if (fromDate) {
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                matchesFromDate = itemDate >= from;
            }

            let matchesToDate = true;
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(0, 0, 0, 0);
                matchesToDate = itemDate <= to;
            }

            return matchesFromDate && matchesToDate && matchesSearchTerm;
        });
    };
    
    const currentList = activeTab === "leads" ? leads : lostLeads;
    const filteredData = applyFilters(currentList);
    
    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Effect to adjust currentPage if filter causes it to exceed totalPages
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            updateAndPersist('currentPage', totalPages);
        } else if (totalPages === 0 && currentPage !== 1) {
             updateAndPersist('currentPage', 1);
        }
    }, [filteredData.length, totalPages, currentPage, updateAndPersist]);


    const renderTable = () => {
        if (loading) return <p className="text-blue-600 text-center">Loading...</p>;
        if (error) return <p className="text-red-600 text-center">{error}</p>;
        if (filteredData.length === 0)
            return <p className="text-gray-500 text-center py-8">No records found for the applied filters.</p>;

        const isLostTab = activeTab === "lost";

        return (
            <>
                {/* Pagination Controls */}
                <div className="flex justify-end mb-4 space-x-2">
                    <button onClick={() => updateAndPersist('currentPage', currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50" >
                        Prev
                    </button>
                    <span className="px-3 py-1"> Page {currentPage} of {totalPages} </span>
                    <button onClick={() => updateAndPersist('currentPage', currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50" >
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
                                <tr key={item.ilead_id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => navigate(`/leaddetailview/${item.ilead_id}`)}  >
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
<>            <div className="max-w-full mx-auto h-[100vh] rounded-xl p-6 flex flex-col">
                <h1 className="text-center w-full font-extrabold text-3xl md:text-4xl  mb-8 border-b-4 border-blue-400 pb-3 mt-[-10px] animate-fade-in-down items-center text-blue-900">User Leads</h1>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                    <button onClick={() => updateAndPersist("activeTab", "leads", true)} className={`px-4 py-2 font-medium ${  activeTab === "leads" ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-blue-500"
                        }`}
                    >
                        Leads ({leads.length})
                    </button>
                    <button onClick={() => updateAndPersist("activeTab", "lost", true)} className={`px-4 py-2 font-medium ${ activeTab === "lost" ? "border-b-2 border-red-600 text-red-600"
                                : "text-gray-600 hover:text-red-500"
                        }`}
                    >
                        Lost Leads ({lostLeads.length})
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
                    <input type="text" placeholder="Search by name or mobile..." value={searchTerm} onChange={(e) => updateAndPersist("searchTerm", e.target.value, true)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input type="date" value={fromDate} onChange={(e) => updateAndPersist("fromDate", e.target.value, true)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                        title="Start Date"
                    />
                    <input type="date" value={toDate} onChange={(e) => updateAndPersist("toDate", e.target.value, true)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                        title="End Date"
                    />
                </div>

                {/* Tab Content */}
                <div className="flex-grow overflow-y-auto">
                    {renderTable()}
                </div>
            </div>
        </>
    );
};

export default UserLead;