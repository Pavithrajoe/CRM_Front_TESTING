import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FaEnvelope, FaPhone, FaGlobe, FaEdit } from 'react-icons/fa';
import { LayoutGrid, List, Filter, RotateCw } from 'lucide-react';
import ProfileHeader from '../../Components/common/ProfileHeader';
import Loader from '../../Components/common/Loader';
import { ENDPOINTS } from '../../api/constraints';
import { jwtDecode } from 'jwt-decode';

const WonList = () => {
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'modified_date', direction: 'descending' });
  const [companyIdFromToken, setCompanyIdFromToken] = useState(null);
  const [roleID, setRoleID] = useState();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const dealsPerPage = 12;

  // Auth logic
  useEffect(() => {
    let tokenFromStorage = null;
    try {
      tokenFromStorage = localStorage.getItem('token');
      if (tokenFromStorage) {
        const decodedToken = jwtDecode(tokenFromStorage);
        setCurrentUserId(decodedToken.user_id);
        setRoleID(decodedToken.role_id);
        setCompanyIdFromToken(decodedToken.company_id);
        setCurrentToken(tokenFromStorage);
      } else {
        setError('Authentication required. Please log in.');
        setLoading(false);
      }
    } catch (e) {
      setError('Authentication error: ' + e.message);
      setLoading(false);
    }
  }, []);

  // Helper function for date formatting
  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '-';

  // Helper function to check if a date is within the date range
  const isWithinDateRange = (date) => {
    if (!date) return true;
    const d = new Date(date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
    return (!from || d >= from) && (!to || d <= to);
  };

  // Fetch and process deals only "WON"
  const fetchDeals = useCallback(async () => {
    if (!currentUserId || !currentToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ENDPOINTS.GET_DEALS}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! status: ${response.status}, Details: ${errorData.message || response.statusText}`);
      }
      const result = await response.json();
      const rawFetchedDeals = Array.isArray(result) ? result : result.data || [];

      // Standardize keys and filter in a single pass
      const processedDeals = rawFetchedDeals
        .filter(item => {
          const isOwned = item.clead_owner === currentUserId;
          const isConverted = item.bisConverted === true || item.bisConverted === 'true';
          const isActive = item.bactive === true || item.bactive === 'true';
          const matchesCompany = parseInt(item.icompany_id, 10) === companyIdFromToken;
          return isOwned && isConverted && isActive && matchesCompany;
        })
        .map(item => ({
          ...item,
          id: item.i_deal_id || item.ilead_id,
          name: item.cdeal_name || item.clead_name,
          organization: item.c_organization || item.corganization,
          email: item.c_email || item.cemail,
          phone: item.c_phone || item.iphone_no,
          modified_date: item.dmodified_dt || item.d_modified_date,
        }));

      // Sort deals by modified date descending
      const sortedDeals = processedDeals.sort(
        (a, b) => new Date(b.modified_date || 0) - new Date(a.modified_date || 0)
      );
      setDeals(sortedDeals);
    } catch (err) {
      setError('Failed to fetch deals: ' + err.message);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentToken, companyIdFromToken]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals, refreshTrigger]);

  // UI FILTERING + SEARCH + DATE
  const applyFilters = useCallback(
    (data) =>
      data.filter((item) => {
        const match = (text) => String(text || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch =
          match(item.name) ||
          match(item.organization) ||
          match(item.email) ||
          match(item.phone);

        const matchesDate = isWithinDateRange(item.modified_date);

        return matchesSearch && matchesDate;
      }),
    [searchTerm, fromDate, toDate]
  );

  // SORT
  const sortedData = useMemo(() => {
    let sortableItems = applyFilters(deals);
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'modified_date') {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          const comparison = dateA - dateB;
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }

        const stringA = String(aValue || '').toLowerCase();
        const stringB = String(bValue || '').toLowerCase();

        if (stringA < stringB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (stringA > stringB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [deals, applyFilters, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / dealsPerPage);
  const displayedData = sortedData.slice((currentPage - 1) * dealsPerPage, currentPage * dealsPerPage);

  // UI HANDLERS
  const handleSort = useCallback((key) => {
    setSortConfig((prevSortConfig) => {
      let direction = 'ascending';
      if (prevSortConfig.key === key && prevSortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      return { key, direction };
    });
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterApply = () => {
    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
      alert("The 'To' date cannot be earlier than the 'From' date.");
      return;
    }
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilterModal(false);
    setSortConfig({ key: 'modified_date', direction: 'descending' });
    setRefreshTrigger(prev => prev + 1); // Trigger re-fetch
  };

  const goToDetail = (id) => {
    window.location.href = `/leaddetailview/${id}`;
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return ' ↕';
  };

  if (loading) {
    return <Loader />;
  }
  if (error) {
    return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;
  }

  // UI
  return (
    <div className="max-w-full mx-auto p-4 space-y-6 min-h-screen">
      <ProfileHeader />

      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search customers..."
          className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            title="Refresh"
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setShowFilterModal(true)}
            className={`p-2 rounded-full ${
              showFilterModal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 justify-between items-center">
        <div className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium">
          Our Customers
        </div>
      </div>

      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-medium text-gray-800">Filter by Date</h2>
            <label className="block text-sm text-gray-700">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="block text-sm text-gray-700">
              To
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
              >Reset</button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
              >Cancel</button>
              <button onClick={handleFilterApply} className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {displayedData.length === 0 ? (
        <div className="text-center text-gray-500 text-sm sm:text-base py-8">
          No Customers found.
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200">
              <div className="min-w-[600px] grid gap-4 px-4 py-3 bg-gray-50 text-gray-800 text-sm font-medium grid-cols-6">
                <div className="cursor-pointer flex items-center" onClick={() => handleSort('name')}>
                  Name {getSortIndicator('name')}
                </div>
                <div className="cursor-pointer flex items-center" onClick={() => handleSort('organization')}>
                  Org {getSortIndicator('organization')}
                </div>
                <div className="min-w-[120px] cursor-pointer flex items-center" onClick={() => handleSort('email')}>
                  Email {getSortIndicator('email')}
                </div>
                <div className="cursor-pointer flex items-center" onClick={() => handleSort('phone')}>
                  Phone {getSortIndicator('phone')}
                </div>
                <div className="cursor-pointer flex items-center" onClick={() => handleSort('modified_date')}>
                  Modified {getSortIndicator('modified_date')}
                </div>
                <div className="flex items-center">
                  Status
                </div>
              </div>
              {displayedData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => goToDetail(item.id)}
                  className="min-w-[600px] grid gap-4 px-4 py-3 border-t bg-white hover:bg-gray-100 cursor-pointer text-sm text-gray-700 grid-cols-6"
                >
                  <div>{item.name || '-'}</div>
                  <div>{item.organization || '-'}</div>
                  <div className="relative group overflow-visible">
                    <span className="block truncate">{item.email || '-'}</span>
                    {item.email && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 shadow-lg p-2 rounded-md text-xs z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-max pointer-events-none group-hover:pointer-events-auto">
                        {item.email}
                      </div>
                    )}
                  </div>
                  <div>{item.phone || '-'}</div>
                  <div>{formatDate(item.modified_date)}</div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs bg-green-100 text-green-700`}>
                      Won
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {displayedData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => goToDetail(item.id)}
                  className="relative bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                >
                  {(item.website_lead === true || item.website_lead === 'true') && (
                    <div className="absolute top-3 right-3 text-blue-600" title="Website Lead">
                      <FaGlobe size={18} />
                    </div>
                  )}
                  <div>
                    <div className="flex w-full justify-between items-center space-x-10">
                      <h3 className="font-semibold text-lg text-black-900 truncate mb-1">
                        {item.name || '-'}
                      </h3>
                    </div>
                    <p className="text-black-600 text-sm font-semibold mb-2 truncate">
                      {item.organization || '-'}
                    </p>
                    <div className="text-black-500 text-xs space-y-1 mb-3">
                      {item.email && (
                        <p className="flex items-center">
                          <FaEnvelope className="mr-2 text-blue-500" /> {item.email}
                        </p>
                      )}
                      {item.phone && (
                        <p className="flex items-center">
                          <FaPhone className="mr-2 text-green-500" /> {item.phone}
                        </p>
                      )}

                      {item.modified_date && (
                        <p className='flex items-center' >
                            <FaEdit className="mr-2 text-orange-500" /> Modified: {formatDate(item.modified_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white`}>
                      Won
                    </span>
                    <h3 className="inline-block text-xs text-black bg-blue-300 px-2 py-1 rounded-full truncate max-w-full">
                    {item.lead_potential?.clead_name || item.lead_potential || '-'}
                    </h3>

                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default WonList;

// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { FaEnvelope, FaPhone, FaGlobe } from 'react-icons/fa';
// import { LayoutGrid, List, Filter, RotateCw } from 'lucide-react';
// import ProfileHeader from '../../Components/common/ProfileHeader';
// import Loader from '../../Components/common/Loader';
// import { ENDPOINTS } from '../../api/constraints';
// import { jwtDecode } from 'jwt-decode';

// const WonList = () => {
//   const [deals, setDeals] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [fromDate, setFromDate] = useState('');
//   const [toDate, setToDate] = useState('');
//   const [viewMode, setViewMode] = useState('grid');
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [currentToken, setCurrentToken] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [sortConfig, setSortConfig] = useState({ key: 'modified_date', direction: 'descending' });
//   const [companyIdFromToken, setCompanyIdFromToken] = useState(null);
//   const [roleID, setRoleID] = useState();
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   const dealsPerPage = 12;

//   // Auth logic
//   useEffect(() => {
//     let tokenFromStorage = null;
//     try {
//       tokenFromStorage = localStorage.getItem('token');
//       if (tokenFromStorage) {
//         const decodedToken = jwtDecode(tokenFromStorage);
//         setCurrentUserId(decodedToken.user_id);
//         setRoleID(decodedToken.role_id);
//         setCompanyIdFromToken(decodedToken.company_id);
//         setCurrentToken(tokenFromStorage);
//       } else {
//         setError('Authentication required. Please log in.');
//         setLoading(false);
//       }
//     } catch (e) {
//       setError('Authentication error: ' + e.message);
//       setLoading(false);
//     }
//   }, []);

//   // Helper function for date formatting
//   const formatDate = (dateStr) =>
//     dateStr
//       ? new Date(dateStr).toLocaleDateString('en-GB', {
//           day: '2-digit',
//           month: '2-digit',
//           year: 'numeric',
//         })
//       : '-';

//   // Helper function to check if a date is within the date range
//   const isWithinDateRange = (date) => {
//     if (!date) return true;
//     const d = new Date(date);
//     const from = fromDate ? new Date(fromDate) : null;
//     const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
//     return (!from || d >= from) && (!to || d <= to);
//   };

//   // Fetch and process deals only "WON"
//   const fetchDeals = useCallback(async () => {
//     if (!currentUserId || !currentToken) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(`${ENDPOINTS.GET_DEALS}`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${currentToken}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
//         throw new Error(`HTTP error! status: ${response.status}, Details: ${errorData.message || response.statusText}`);
//       }
//       const result = await response.json();
//       const rawFetchedDeals = Array.isArray(result) ? result : result.data || [];

//       // Standardize keys and filter in a single pass
//       const processedDeals = rawFetchedDeals
//         .filter(item => {
//           const isOwned = item.clead_owner === currentUserId;
//           const isConverted = item.bisConverted === true || item.bisConverted === 'true';
//           const isActive = item.bactive === true || item.bactive === 'true';
//           const matchesCompany = parseInt(item.icompany_id, 10) === companyIdFromToken;
//           return isOwned && isConverted && isActive && matchesCompany;
//         })
//         .map(item => ({
//           ...item,
//           id: item.i_deal_id || item.ilead_id,
//           name: item.cdeal_name || item.clead_name,
//           organization: item.c_organization || item.corganization,
//           email: item.c_email || item.cemail,
//           phone: item.c_phone || item.iphone_no,
//           modified_date: item.dmodified_dt || item.d_modified_date,
//         }));

//       // Sort deals by modified date descending
//       const sortedDeals = processedDeals.sort(
//         (a, b) => new Date(b.modified_date || 0) - new Date(a.modified_date || 0)
//       );
//       setDeals(sortedDeals);
//     } catch (err) {
//       setError('Failed to fetch deals: ' + err.message);
//       setDeals([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUserId, currentToken, companyIdFromToken]);

//   useEffect(() => {
//     fetchDeals();
//   }, [fetchDeals, refreshTrigger]);

//   // UI FILTERING + SEARCH + DATE
//   const applyFilters = useCallback(
//     (data) =>
//       data.filter((item) => {
//         const match = (text) => String(text || '').toLowerCase().includes(searchTerm.toLowerCase());
//         const matchesSearch =
//           match(item.name) ||
//           match(item.organization) ||
//           match(item.email) ||
//           match(item.phone);

//         const matchesDate = isWithinDateRange(item.modified_date);

//         return matchesSearch && matchesDate;
//       }),
//     [searchTerm, fromDate, toDate]
//   );

//   // SORT
//   const sortedData = useMemo(() => {
//     let sortableItems = applyFilters(deals);
//     if (sortConfig.key) {
//       sortableItems.sort((a, b) => {
//         const aValue = a[sortConfig.key];
//         const bValue = b[sortConfig.key];

//         if (sortConfig.key === 'modified_date') {
//           const dateA = new Date(aValue);
//           const dateB = new Date(bValue);
//           const comparison = dateA - dateB;
//           return sortConfig.direction === 'ascending' ? comparison : -comparison;
//         }

//         const stringA = String(aValue || '').toLowerCase();
//         const stringB = String(bValue || '').toLowerCase();

//         if (stringA < stringB) {
//           return sortConfig.direction === 'ascending' ? -1 : 1;
//         }
//         if (stringA > stringB) {
//           return sortConfig.direction === 'ascending' ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return sortableItems;
//   }, [deals, applyFilters, sortConfig]);

//   const totalPages = Math.ceil(sortedData.length / dealsPerPage);
//   const displayedData = sortedData.slice((currentPage - 1) * dealsPerPage, currentPage * dealsPerPage);

//   // UI HANDLERS
//   const handleSort = useCallback((key) => {
//     setSortConfig((prevSortConfig) => {
//       let direction = 'ascending';
//       if (prevSortConfig.key === key && prevSortConfig.direction === 'ascending') {
//         direction = 'descending';
//       }
//       return { key, direction };
//     });
//   }, []);

//   const handleSearchChange = (e) => {
//     setSearchTerm(e.target.value);
//     setCurrentPage(1);
//   };

//   const handleFilterApply = () => {
//     if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
//       alert("The 'To' date cannot be earlier than the 'From' date.");
//       return;
//     }
//     setCurrentPage(1);
//     setShowFilterModal(false);
//   };

//   const handleResetFilters = () => {
//     setFromDate('');
//     setToDate('');
//     setSearchTerm('');
//     setCurrentPage(1);
//     setShowFilterModal(false);
//     setSortConfig({ key: 'modified_date', direction: 'descending' });
//     setRefreshTrigger(prev => prev + 1); // Trigger re-fetch
//   };

//   const goToDetail = (id) => {
//     window.location.href = `/leaddetailview/${id}`;
//   };

//   const getStatusColor = (status) => 'bg-green-100 text-green-700';

//   const getSortIndicator = (key) => {
//     if (sortConfig.key === key) {
//       return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
//     }
//     return ' ↕';
//   };

//   if (loading) {
//     return <Loader />;
//   }
//   if (error) {
//     return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;
//   }

//   // UI
//   return (
//     <div className="max-w-full mx-auto p-4 space-y-6 min-h-screen">
//       <ProfileHeader />

//       <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={handleSearchChange}
//           placeholder="Search customers..."
//           className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//         />
//         <div className="flex gap-2 flex-wrap">
//           <button
//             onClick={() => setRefreshTrigger(prev => prev + 1)}
//             title="Refresh"
//             className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
//           >
//             <RotateCw size={18} />
//           </button>
//           <button
//             onClick={() => setViewMode('grid')}
//             className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
//           >
//             <LayoutGrid size={18} />
//           </button>
//           <button
//             onClick={() => setViewMode('list')}
//             className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
//           >
//             <List size={18} />
//           </button>
//           <button
//             onClick={() => setShowFilterModal(true)}
//             className={`p-2 rounded-full ${
//               showFilterModal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
//             }`}
//           >
//             <Filter size={18} />
//           </button>
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-2 mt-4 justify-between items-center">
//         <div className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium">
//           Our Customers
//         </div>
//       </div>

//       {showFilterModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
//             <h2 className="text-lg font-medium text-gray-800">Filter by Date</h2>
//             <label className="block text-sm text-gray-700">
//               From
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//               />
//             </label>
//             <label className="block text-sm text-gray-700">
//               To
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//               />
//             </label>
//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={handleResetFilters}
//                 className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
//               >Reset</button>
//               <button
//                 onClick={() => setShowFilterModal(false)}
//                 className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
//               >Cancel</button>
//               <button onClick={handleFilterApply} className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
//                 Apply
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {displayedData.length === 0 ? (
//         <div className="text-center text-gray-500 text-sm sm:text-base py-8">
//           No Customers found.
//         </div>
//       ) : (
//         <>
//           {viewMode === 'list' ? (
//             <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200">
//               <div className="min-w-[600px] grid gap-4 px-4 py-3 bg-gray-50 text-gray-800 text-sm font-medium grid-cols-6">
//                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('name')}>
//                   Name {getSortIndicator('name')}
//                 </div>
//                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('organization')}>
//                   Org {getSortIndicator('organization')}
//                 </div>
//                 <div className="min-w-[120px] cursor-pointer flex items-center" onClick={() => handleSort('email')}>
//                   Email {getSortIndicator('email')}
//                 </div>
//                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('phone')}>
//                   Phone {getSortIndicator('phone')}
//                 </div>
//                 <div className="cursor-pointer flex items-center" onClick={() => handleSort('modified_date')}>
//                   Modified {getSortIndicator('modified_date')}
//                 </div>
//                 <div className="flex items-center">
//                   Status
//                 </div>
//               </div>
//               {displayedData.map((item) => (
//                 <div
//                   key={item.id}
//                   onClick={() => goToDetail(item.id)}
//                   className="min-w-[600px] grid gap-4 px-4 py-3 border-t bg-white hover:bg-gray-100 cursor-pointer text-sm text-gray-700 grid-cols-6"
//                 >
//                   <div>{item.name || '-'}</div>
//                   <div>{item.organization || '-'}</div>
//                   <div className="relative group overflow-visible">
//                     <span className="block truncate">{item.email || '-'}</span>
//                     {item.email && (
//                       <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 shadow-lg p-2 rounded-md text-xs z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-max pointer-events-none group-hover:pointer-events-auto">
//                         {item.email}
//                       </div>
//                     )}
//                   </div>
//                   <div>{item.phone || '-'}</div>
//                   <div>{formatDate(item.modified_date)}</div>
//                   <div>
//                     <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor('deal')}`}>
//                       Won
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
//               {displayedData.map((item) => (
//                 <div
//                   key={item.id}
//                   onClick={() => goToDetail(item.id)}
//                   className="relative bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
//                 >
//                   {(item.website_lead === true || item.website_lead === 'true') && (
//                     <div className="absolute top-3 right-3 text-blue-600" title="Website Lead">
//                       <FaGlobe size={18} />
//                     </div>
//                   )}
//                   <div>
//                     <div className="flex w-full justify-between items-center space-x-10">
//                       <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">
//                         {item.name || '-'}
//                       </h3>
//                       <h3 className="font-semibold text-sm text-black bg-yellow-200 px-3 py-1 rounded-full truncate">
//                         {item.lead_potential?.clead_name || item.lead_potential || '-'}
//                       </h3>
//                     </div>
//                     <p className="text-gray-600 text-sm mb-2 truncate">
//                       {item.organization || '-'}
//                     </p>
//                     <div className="text-gray-500 text-xs space-y-1 mb-3">
//                       {item.email && (
//                         <p className="flex items-center">
//                           <FaEnvelope className="mr-2 text-blue-500" /> {item.email}
//                         </p>
//                       )}
//                       {item.phone && (
//                         <p className="flex items-center">
//                           <FaPhone className="mr-2 text-green-500" /> {item.phone}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100">
//                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('deal')}`}>
//                       Won
//                     </span>
//                     <span className="text-gray-500 text-xs">
//                       Modified: {formatDate(item.modified_date)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </>
//       )}

//       {totalPages > 1 && (
//         <div className="flex justify-center items-center space-x-2 mt-6">
//           <button
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             disabled={currentPage === 1}
//             className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Previous
//           </button>
//           <span className="text-gray-700">
//             Page {currentPage} of {totalPages}
//           </span>
//           <button
//             onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//             disabled={currentPage === totalPages}
//             className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WonList;

