// src/pages/userPage/UserDeals.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../api/constraints';
import { useLocation, useParams } from 'react-router-dom';

const UserDeals = () => {
    const { userId } = useParams();
    // Initialize deals and filteredDeals as empty arrays to prevent .slice() errors
    const [deals, setDeals] = useState([]);
    const [filteredDeals, setFilteredDeals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState(null); // 'open', 'lost', 'deal' (won)
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false); // Add loading state
    const [error, setError] = useState(null); // Add error state

    const dealsPerPage = 10;

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialFrom = queryParams.get('startDate') || '';
    const initialTo = queryParams.get('endDate') || '';

    const [dateFilterFrom, setDateFilterFrom] = useState(initialFrom);
    const [dateFilterTo, setDateFilterTo] = useState(initialTo);

    // Helper to format date for input (already correct)
    const formatDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Effect to fetch deals from the API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true before API call
            setError(null); // Clear previous errors

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('Authentication token not found.');
                    setError('Authentication required. Please log in.');
                    setDeals([]);
                    setFilteredDeals([]);
                    setLoading(false);
                    return;
                }

                if (!userId) {
                    // This can happen on initial render before params are fully resolved,
                    // or if the route isn't configured correctly.
                    console.warn('User ID not provided from URL parameters. Skipping API call.');
                    setDeals([]);
                    setFilteredDeals([]);
                    setLoading(false);
                    return;
                }

                const url = new URL(`${ENDPOINTS.USER_REPORT_DEALS}/${userId}`);
                if (dateFilterFrom) {
                    url.searchParams.append('startDate', dateFilterFrom);
                }
                if (dateFilterTo) {
                    url.searchParams.append('endDate', dateFilterTo);
                }

                // console.log(`Fetching deals from: ${url.toString()}`);

                const response = await axios.get(url.toString(), { // Use url.toString() for axios
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Ensure data is an array, defaulting to empty array if not
                const data = Array.isArray(response.data?.Response) ? response.data.Response : [];
                // console.log("Response data for user deals:", data);

                setDeals(data);
                setFilteredDeals(data); // Initially, filteredDeals is the same as deals
            } catch (err) {
                console.error('Error fetching customers:', err);
                setError('Failed to load customers. Please try again.');
                setDeals([]);
                setFilteredDeals([]);
            } finally {
                setLoading(false); // Set loading to false after API call (success or error)
            }
        };

        fetchData();
    }, [userId, dateFilterFrom, dateFilterTo]); // Dependencies for re-fetching

    // Effect for client-side filtering (search term and status)
    useEffect(() => {
        let updatedDeals = [...deals]; // Start with the full list of deals (already date-filtered by API)

        // Apply status filter
        if (filterType === 'open') {
            updatedDeals = updatedDeals.filter((deal) => deal.bactive === true && deal.bisConverted === false);
        } else if (filterType === 'lost') {
            updatedDeals = updatedDeals.filter((deal) => deal.bactive === false);
        } else if (filterType === 'Customers') { // 'deal' typically means 'Won'
            updatedDeals = updatedDeals.filter((deal) => deal.bisConverted === true);
        }

        // Apply search term filter
        if (searchTerm.trim() !== '') {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
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
                    .filter(Boolean) // Remove any null/undefined values before joining
                    .join(' ')
                    .toLowerCase()
                    .includes(lowerCaseSearchTerm)
            );
        }

        setFilteredDeals(updatedDeals);
        setCurrentPage(1); // Reset to the first page when filters change
    }, [searchTerm, filterType, deals]); // Depend on `deals` to re-filter when API data changes

    // Pagination calculations
    const indexOfLastDeal = currentPage * dealsPerPage;
    const indexOfFirstDeal = indexOfLastDeal - dealsPerPage;
    const currentDeals = filteredDeals.slice(indexOfFirstDeal, indexOfLastDeal); // .slice() is safe here
    const totalPages = Math.ceil(filteredDeals.length / dealsPerPage);

    // Pagination handler
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); // Scroll to top on page change
    };

    // Render pagination buttons
    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisiblePages = 8; // Number of page buttons to show

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Adjust startPage if not enough pages to fill maxVisiblePages from the end
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
                    disabled={currentPage === totalPages || totalPages === 0} // Disable if no pages
                    className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                    Next
                </button>
                <span className="text-sm text-gray-600">
                    {/* Display current range / total count */}
                    {`${Math.min(indexOfLastDeal, filteredDeals.length)}/${filteredDeals.length}`}
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
        // No need to call fetchData explicitly here as useEffect will react to dateFilterFrom/To changes
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <div className="relative flex items-center space-x-2 flex-wrap gap-2">
                        {/* Search Input */}
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
                        {/* Filter Buttons */}
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
                            onClick={() => setFilterType('Customers')}
                        >
                            Won
                        </button>
                        {/* Date Filters */}
                        <label htmlFor="dateFrom" className="text-gray-700 font-medium text-sm">From:</label>
                        <input
                            id="dateFrom"
                            type="date"
                            value={dateFilterFrom}
                            onChange={(e) => setDateFilterFrom(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
                        />
                        <label htmlFor="dateTo" className="text-gray-700 font-medium text-sm">To:</label>
                        <input
                            id="dateTo"
                            type="date"
                            value={dateFilterTo}
                            onChange={(e) => setDateFilterTo(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
                        />
                        {/* Reset Filters Button */}
                        <button
                            className="px-4 py-2 bg-gray-300 text-black rounded-full hover:bg-gray-400"
                            onClick={handleResetFilters}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Conditional notifications */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm">
                        Error: {error}
                    </div>
                )}
                {loading ? (
                    <div className="mb-4 p-3 text-center text-blue-600 text-lg">Loading Customers...</div>
                ) : (
                    <>
                        {dateFilterFrom && dateFilterTo && (
                            <div className="mb-4 p-3 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-sm">
                                Filtering Customers from <strong>{new Date(dateFilterFrom).toLocaleDateString('en-GB')}</strong> to <strong>{new Date(dateFilterTo).toLocaleDateString('en-GB')}</strong>.
                            </div>
                        )}
                        {!dateFilterFrom && !dateFilterTo && (
                            <div className="mb-4 p-3 bg-orange-100 border border-gray-200 text-gray-700 rounded-lg text-sm">
                                Showing all Customers.
                            </div>
                        )}

                        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-sm text-center font-bold text-black">S.No</th>
                                        <th className="px-4 py-3 text-sm font-bold text-black">Customers Name</th>
                                        <th className="px-4 py-3 text-sm font-bold text-black">Company Name</th>
                                        <th className="px-4 py-3 text-sm font-bold text-black">Source</th>
                                        <th className="px-4 py-3 text-sm font-bold text-black">E-Mail ID</th>
                                        <th className="px-4 py-3 text-sm font-bold text-black">Phone No</th>
                                        <th className="px-4 py-3 text-sm font-bold text-black">Created Date</th>
                                        <th className="px-4 py-3 text-sm font-bold text-black">Customer Owner</th>
                                        <th className="px-4 py-3 text-sm font-bold text-center text-black">Status</th>
                                    </tr>
                                </thead>
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
                                                No Customers found for the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {renderPagination()}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserDeals;