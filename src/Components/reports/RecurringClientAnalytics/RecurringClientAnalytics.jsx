import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { ENDPOINTS } from "../../../api/constraints";

const getCompanyIdFromToken = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const { company_id } = JSON.parse(jsonPayload);
        const id = parseInt(company_id, 10);
        return (!isNaN(id) && id > 0) ? id : null;
    } catch (error) {
        console.error("Error decoding token for company ID:", error);
        return null;
    }
};

// Summary Card Component
const SummaryCard = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 text-center hover:shadow-md transition">
        <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-wider">{title}</h3>
        <p className="text-lg font-bold text-gray-700 mt-3">{value}</p>
    </div>
);

// Helper Functions
const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return "Invalid Date";
    }
};

const formatAvgGap = (gap) => {
    return `${Number(gap).toFixed(0)} days`;
};

const RecurringClientAnalytics = () => {
    const navigate = useNavigate();

    // State initialization
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch data function wrapped in useCallback
    const fetchRecurringReport = useCallback(async () => {
        const token = localStorage.getItem('token');
        const companyId = getCompanyIdFromToken(token);

        if (!companyId || !token) {
            setLoading(false);
            setError("Authentication failure: Company ID or Token not found.");
            return;
        }

        try {
            const endpoint = `${ENDPOINTS.RECURRING_CLIENT_REPORT}/${companyId}`;
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReportData(response.data.data);
        } catch (e) {
            console.error("Failed to fetch recurring client report:", e);
            setError(e.response?.data?.message || "Failed to load data. Please check network or API.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        fetchRecurringReport();
    }, [fetchRecurringReport]);

    // Rendering States
    if (loading) {
        return (
            <div className="p-8 text-center text-gray-600 min-h-screen">
                <p>Loading analytics data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600 min-h-screen">
                <p>Error: {error}</p>
            </div>
        );
    }

    if (!reportData || !reportData.clientWiseReport) {
        return (
            <div className="p-8 text-center text-gray-600 min-h-screen">
                <p>No recurring client data available.</p>
            </div>
        );
    }

    const {
        clientWiseReport,
        mostOptedService,
        recurrenceRate,
        topSalesPerson,
        leadCounts,
    } = reportData;

    const summary = {
        totalClients: leadCounts,
        recurrenceRate: recurrenceRate,
        topService: mostOptedService,
        topSalesPerson: topSalesPerson,
    };

    const clientDetails = clientWiseReport || [];

    // 	Pagination Logic
    const totalPages = Math.ceil(clientDetails.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = clientDetails.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="p-3 space-y-8 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="flex items-center mb-4">
                <button
                    onClick={() => navigate("/reportpage")}
                    className="text-gray-600 hover:text-gray-900 mr-4 text-xl p-2 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Back"
                >
                    <FaArrowLeft />
                </button>
                <h1 className="text-2xl font-semibold text-gray-800"> Recurring Client Analytics </h1>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard title="Total Clients" value={summary.totalClients} />
                <SummaryCard title="Recurrence Rate" value={summary.recurrenceRate} />
                <SummaryCard title="Top Service" value={summary.topService} />
                <SummaryCard title="Top Salesperson" value={summary.topSalesPerson} />
            </div>

            {/* Table Section */}
            <div className="bg-white shadow rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-2"> Recurring Client Details </h2>
                
                {/* Note about Email ID basis - ADDED HERE */}
                <p className="text-sm text-yellow-700 bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-4 rounded-sm">
                    ⚠️ **Note:** This report compiles recurring client data based on a unique **Email ID**.
                </p>

                <div className="overflow-x-auto">
                    <table className="border border-gray-200 text-sm w-full">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-center w-[5%] min-w-[50px]">S.No</th>
                                <th className="px-4 py-2 text-left w-[20%] min-w-[160px]">Client Name</th>
                                <th className="px-4 py-2 text-left w-[18%] min-w-[180px]">Email</th>
                                <th className="px-4 py-2 text-center w-[12%] min-w-[120px]">Recurrence Count</th>
                                <th className="px-4 py-2 text-left w-[15%] min-w-[100px]">First Service Date</th>
                                <th className="px-4 py-2 text-left w-[15%] min-w-[100px]">Last Service Date</th>
                                <th className="px-4 py-2 text-center w-[12%] min-w-[80px]">Avg Gap (Days)</th>
                                <th className="px-4 py-2 text-left w-[20%] min-w-[180px]">Services Used</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((client, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2 text-center text-gray-600">
                                        {startIndex + index + 1}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-gray-800">
                                        {client.client_name || "-"}
                                    </td>
                                    <td
                                        className="px-4 py-2 text-xs text-blue-600 max-w-[180px] truncate"
                                        title={client.email || "No Email Provided"}
                                    >
                                        {client.email || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-center">{client.recurredCount}</td>
                                    <td className="px-4 py-2">{formatDate(client.firstService)}</td>
                                    <td className="px-4 py-2">{formatDate(client.lastService)}</td>
                                    <td className="px-4 py-2 text-center">{formatAvgGap(client.avgGap)}</td>
                                    <td className="px-4 py-2 text-sm">
                                        {(client.services || []).filter(Boolean).join(", ") || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {clientDetails.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No recurring clients found.</p>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-5 space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="text-gray-700 text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecurringClientAnalytics;