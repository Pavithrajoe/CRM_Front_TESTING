// src/pages/userPage/UserDeals.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../api/constraints';
import { useLocation, useParams } from 'react-router-dom'; // Import useParams

const UserDeals = () => { // Remove userId from props, we'll get it from params
    const { userId } = useParams(); // <--- This is the key change!
    const [deals, setDeals] = useState([]);
    const [filteredDeals, setFilteredDeals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const dealsPerPage = 10;

    const location = useLocation(); // Hook to access URL parameters

    const queryParams = new URLSearchParams(location.search);
    const initialFrom = queryParams.get('startDate') || '';
    const initialTo = queryParams.get('endDate') || '';

    const [dateFilterFrom, setDateFilterFrom] = useState(initialFrom);
    const [dateFilterTo, setDateFilterTo] = useState(initialTo);
    // showDefaultMonthNotification is no longer used for initial mount default, so can be removed if not used elsewhere
    // const [showDefaultMonthNotification, setShowDefaultMonthNotification] = useState(false);

    const formatDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ✅ Fetch deals whenever userId or date filters change (API call now includes dates)
    useEffect(() => {
        console.log("The user id is:", userId); // Now this should correctly log the ID
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('Authentication token not found.');
                    setDeals([]);
                    setFilteredDeals([]);
                    return;
                }

                if (!userId) {
                    // This can happen on initial render before params are fully resolved, or if the route isn't configured correctly.
                    // Keep this check, but it should be less frequent now.
                    console.warn('User ID not provided from URL parameters. Skipping API call.');
                    setDeals([]);
                    setFilteredDeals([]);
                    return;
                }

                const url = new URL(`${ENDPOINTS.USER_REPORT_DEALS}/${userId}`);
                console.log("The api url:",url)
                if (dateFilterFrom) {
                    url.searchParams.append('startDate', dateFilterFrom);
                }
                if (dateFilterTo) {
                    url.searchParams.append('endDate', dateFilterTo);
                }

                console.log(`Fetching deals from: ${url.toString()}`);

                const response = await axios.get(`${ENDPOINTS.USER_REPORT_DEALS}/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("The response is ", response)

                const data = response.data?.Response || [];
                console.log("response of userdeals:", response.data);
                setDeals(data);
                setFilteredDeals(data);
            } catch (err) {
                console.error('Error fetching deals:', err);
                setDeals([]);
                setFilteredDeals([]);
            }
        };

        fetchData();
    }, [userId, dateFilterFrom, dateFilterTo]); // Re-fetch when these change

    // 🔄 Client-side filtering based on search and status (dates are now handled by API)
    useEffect(() => {
        let updatedDeals = [...deals]; // Start with the deals fetched by the API (which are already date-filtered)

        if (filterType === 'open') {
            updatedDeals = updatedDeals.filter((deal) => deal.bactive === true && deal.bisConverted === false);
        } else if (filterType === 'lost') {
            updatedDeals = updatedDeals.filter((deal) => deal.bactive === false);
        } else if (filterType === 'deal') { // Assuming 'deal' means 'Won'
            updatedDeals = updatedDeals.filter((deal) => deal.bisConverted === true);
        }

        if (searchTerm.trim() !== '') {
            updatedDeals = updatedDeals.filter((deal) =>
                [
                    deal.clead_name,
                    deal.updated_by,
                    deal.cemail,
                    deal.corganization,
                    deal.lead_status,
                    deal.lead_sources,
                    deal.iphone_no,
                    deal.whatsapp_number,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
        }

        setFilteredDeals(updatedDeals);
        setCurrentPage(1); // Reset to first page on filter change
    }, [searchTerm, filterType, deals]); // Depend on `deals` (the API fetched data)

    // Pagination logic remains the same
    const indexOfLastDeal = currentPage * dealsPerPage;
    const indexOfFirstDeal = indexOfLastDeal - dealsPerPage;
    const currentDeals = filteredDeals.slice(indexOfFirstDeal, indexOfLastDeal);
    const totalPages = Math.ceil(filteredDeals.length / dealsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisiblePages = 8;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                    Prev
                </button>
                {pageNumbers.map((number) => (
                    <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-3 py-1 border rounded-lg ${
                            currentPage === number ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {number}
                    </button>
                ))}
                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                    Next
                </button>
                <span className="text-sm text-gray-600">
                    {indexOfLastDeal > filteredDeals.length ? filteredDeals.length : indexOfLastDeal}/{filteredDeals.length}
                </span>
            </div>
        );
    };

    // Handler to clear all filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterType(null);
        setDateFilterFrom('');
        setDateFilterTo('');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-inter">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <div className="relative flex items-center space-x-2 flex-wrap gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search deals"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M12.9 14.32a8 8 0 111.41-1.41l4.24 4.24-1.42 1.42-4.23-4.25zM8 14a6 6 0 100-12 6 6 0 000 12z" />
                            </svg>
                        </div>
                        <button
                            className={`px-4 py-2 rounded-full ${filterType === 'open' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => setFilterType('open')}
                        >
                            Open
                        </button>
                        <button
                            className={`px-4 py-2 rounded-full ${filterType === 'lost' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => setFilterType('lost')}
                        >
                            Lost
                        </button>
                        <button
                            className={`px-4 py-2 rounded-full ${filterType === 'deal' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => setFilterType('deal')}
                        >
                            Won
                        </button>
                        <label htmlFor="dateFrom" className="text-gray-700 font-medium text-sm">From:</label>
                        <input
                            id="dateFrom"
                            type="date"
                            value={dateFilterFrom}
                            onChange={(e) => {
                                setDateFilterFrom(e.target.value);
                            }}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
                        />
                        <label htmlFor="dateTo" className="text-gray-700 font-medium text-sm">To:</label>
                        <input
                            id="dateTo"
                            type="date"
                            value={dateFilterTo}
                            onChange={(e) => {
                                setDateFilterTo(e.target.value);
                            }}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
                        />
                        <button
                            className="px-4 py-2 bg-gray-300 text-black rounded-full hover:bg-gray-400"
                            onClick={handleResetFilters}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Conditional notifications */}
                {dateFilterFrom && dateFilterTo && (
                    <div className="mb-4 p-3 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-sm">
                        Filtering deals from <strong>{new Date(dateFilterFrom).toLocaleDateString('en-GB')}</strong> to <strong>{new Date(dateFilterTo).toLocaleDateString('en-GB')}</strong>.
                    </div>
                )}
                {!dateFilterFrom && !dateFilterTo && (
                    <div className="mb-4 p-3 bg-orange-100 border border-gray-200 text-gray-700 rounded-lg text-sm">
                        Showing all deals.
                    </div>
                )}

                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50 sticky top-0"><tr>
                            <th className="px-4 py-3 text-sm text-center font-bold text-black">S.No</th>
                            <th className="px-4 py-3 text-sm font-bold text-black">Deal Name</th>
                            <th className="px-4 py-3 text-sm font-bold text-black">Company Name</th>
                            <th className="px-4 py-3 text-sm font-bold text-black">Source</th>
                            <th className="px-4 py-3 text-sm font-bold text-black">E-Mail ID</th>
                            <th className="px-4 py-3 text-sm font-bold text-black">Phone No</th>
                            <th className="px-4 py-3 text-sm font-bold text-black">Created Date</th>
                            <th className="px-4 py-3 text-sm font-bold text-black">Deal Owner</th>
                            <th className="px-4 py-3 text-sm font-bold text-center text-black">Status</th>
                        </tr></thead>
                        <tbody>
                            {currentDeals.length > 0 ? (
                                currentDeals.map((deal, index) => (
                                    <tr key={deal.ilead_id || index} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-700">{indexOfFirstDeal + index + 1}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{deal.clead_name || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{deal.corganization || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{deal.lead_sources || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{deal.cemail || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{deal.iphone_no || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {deal.dcreated_dt
                                                ? new Date(deal.dcreated_dt).toLocaleDateString('en-GB').replace(/\//g, '-')
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{deal.updated_by || '-'}</td>
                                        <td className="px-4 py-3 text-sm w-10">
                                            <span
                                                className={`inline-block text-center px-2 py-1 rounded-full w-24 ${
                                                    deal.lead_status === 'Won'
                                                        ? 'bg-green-100 text-green-600'
                                                        : deal.lead_status === 'Lost'
                                                        ? 'bg-red-100 text-red-600'
                                                        : 'bg-yellow-100 text-yellow-600'
                                                }`}
                                            >
                                                {deal.lead_status || 'Unknown'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-6 text-gray-500">
                                        No deals found for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {renderPagination()}
            </div>
        </div>
    );
};

export default UserDeals;