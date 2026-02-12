import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FaEnvelope, FaPhone, FaEdit, FaUser, FaCheckCircle } from 'react-icons/fa';
import { LayoutGrid, List, Filter, RotateCw } from 'lucide-react';
import ProfileHeader from '../../Components/common/ProfileHeader';
import Loader from '../../Components/common/Loader';
import { ENDPOINTS } from '../../api/constraints';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../context/Pagination/pagination';
import usePagination from '../../hooks/usePagination';

const WonList = () => {
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [viewScope, setViewScope] = useState('mine'); 
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'modified_date', direction: 'descending' });
  const [companyIdFromToken, setCompanyIdFromToken] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const dealsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const tokenFromStorage = localStorage.getItem('token');
      if (tokenFromStorage) {
        const decodedToken = jwtDecode(tokenFromStorage);
        setCurrentUserId(Number(decodedToken.user_id));
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

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '-';

  const isWithinDateRange = (date) => {
    if (!date) return true;
    const d = new Date(date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
    return (!from || d >= from) && (!to || d <= to);
  };

  const fetchDeals = useCallback(async () => {
    if (!currentUserId || !currentToken) return;
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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const rawFetchedDeals = Array.isArray(result) ? result : result.data || [];

      const processedDeals = rawFetchedDeals
        .filter((item) => {
          const isConverted = item.bisConverted === true || item.bisConverted === 'true';
          const isActive = item.bactive === true || item.bactive === 'true';
          const matchesCompany = parseInt(item.icompany_id, 10) === companyIdFromToken;
          return isConverted && isActive && matchesCompany;
        })
        .map((item) => ({
          ...item,
          id: item.i_deal_id || item.ilead_id,
          name: item.cdeal_name || item.clead_name,
          organization: item.c_organization || item.corganization,
          email: item.c_email || item.cemail,
          phone: item.c_phone || item.iphone_no,
          owner_name: item.user?.cFull_name || 'Unknown', 
          status_name: item.lead_status?.clead_name || 'Converted',
          potential_name: item.lead_potential?.clead_name || item.lead_potential || 'General',
          modified_date: item.dmodified_dt || item.d_modified_date,
        }));

      setDeals(processedDeals);
    } catch (err) {
      setError('Failed to fetch: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentToken, companyIdFromToken]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals, refreshTrigger]);

  const applyFilters = useCallback(
    (data) =>
      data.filter((item) => {
        const matchesScope = viewScope === 'mine' 
            ? Number(item.clead_owner) === currentUserId 
            : Number(item.clead_owner) !== currentUserId;

        const match = (text) => String(text || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch =
          match(item.name) || match(item.organization) || match(item.email) || match(item.phone) || match(item.owner_name);
        const matchesDate = isWithinDateRange(item.modified_date);
        
        return matchesScope && matchesSearch && matchesDate;
      }),
    [searchTerm, fromDate, toDate, viewScope, currentUserId]
  );

  const sortedData = useMemo(() => {
    let sortableItems = applyFilters(deals);
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (sortConfig.key === 'modified_date') {
          return sortConfig.direction === 'ascending' 
            ? new Date(aValue) - new Date(bValue) 
            : new Date(bValue) - new Date(aValue);
        }
        const stringA = String(aValue || '').toLowerCase();
        const stringB = String(bValue || '').toLowerCase();
        if (stringA < stringB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (stringA > stringB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [deals, applyFilters, sortConfig]);

  const {
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedData: displayedData,
} = usePagination(sortedData, dealsPerPage);


  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setCurrentPage(1);
    setShowFilterModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    return ' ↕';
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;

  return (
    <div className="max-w-full mx-auto p-4 space-y-6 min-h-screen">
      <ProfileHeader />

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Search customers..."
          className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <div className="hidden sm:flex gap-2 flex-wrap">
          <button onClick={() => setRefreshTrigger((p) => p + 1)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
            <RotateCw size={18} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            <List size={18} />
          </button>
          <button onClick={() => setShowFilterModal(true)} className={`p-2 rounded-full transition ${showFilterModal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button 
            onClick={() => { setViewScope('mine'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full text-base font-medium transition-all ${viewScope === 'mine' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          My Customers
        </button>
        <button 
            onClick={() => { setViewScope('others'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full text-base font-medium transition-all ${viewScope === 'others' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All Other Customers
        </button>
      </div>

      {/* Content Area */}
      {displayedData.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-12">No records found.</div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200">
          <table className="w-full text-left text-sm text-gray-700 bg-white">
            <thead className="bg-gray-50 text-gray-800 font-bold border-b">
              <tr>
                <th className="px-4 py-3 w-16">S.No</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('name')}>Name {getSortIndicator('name')}</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('organization')}>Organization {getSortIndicator('organization')}</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('modified_date')}>Modified {getSortIndicator('modified_date')}</th>
                <th className="px-4 py-3">Potential</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((item, index) => (
                <tr key={item.id} onClick={() => window.location.href=`/leaddetailview/${item.id}`} className="border-t hover:bg-gray-50 cursor-pointer transition">
                  <td className="px-4 py-3 font-normal text-gray-800">{(currentPage - 1) * dealsPerPage + (index + 1)} </td>
                  <td className="px-4 py-3 font-normal text-gray-800 ">{item.name || '-'}</td>
                  <td className="px-4 py-3 font-normal text-gray-800">{item.organization || '-'}</td>
                  <td className="px-4 py-3 font-normal text-gray-800">{item.phone || '-'}</td>
                  <td className="px-4 py-3 font-normal text-gray-800">{item.owner_name}</td>
                  <td className="px-4 py-3 font-normal text-gray-800">{formatDate(item.modified_date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 text-[11px] uppercase">{item.potential_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-green-300 text-gray-700 text-[10px] font-bold rounded-full">WON</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedData.map((item,) => (
            <div 
              key={item.id} 
              onClick={() =>
  navigate(`/leaddetailview/${item.id}`, {
    state: {
      leadList: sortedData, 
    },
  })
}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors mb-0.5">
                  {item.name || '-'}
                </h3>
                <p className="text-[11px] text-gray-800 uppercase font-bold tracking-wider truncate border-b pb-3 mb-4 text-medium">
                  {item.organization || '-'}
                </p>
                
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                    <FaEnvelope className="text-blue-600 flex-shrink-0" /> 
                    <span className="truncate">{item.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                    <FaPhone className="text-green-600 flex-shrink-0" /> 
                    <span>{item.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                    <FaUser className="text-purple-600 flex-shrink-0" /> 
                    <span className="truncate">{item.owner_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
                    <FaEdit className="text-orange-600 flex-shrink-0" /> 
                    <span>{formatDate(item.modified_date)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer - Badges */}
              <div className="flex justify-between items-center border-t pt-4 mt-2">
                {/* Won Badge (Bottom Left) */}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm text-xs ">
                  <FaCheckCircle size={10} /> WON
                </span>
                
                {/* Potential Badge (Bottom Right) */}
                <span className="px-3 py-1.5 bg-blue-500 text-white border border-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider text-xs">
                  {item.potential_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Filter by Date</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-4">
              <button onClick={handleResetFilters} className="text-xs text-red-500 font-bold uppercase tracking-wider">Reset</button>
              <div className="flex gap-2">
                <button onClick={() => setShowFilterModal(false)} className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">Cancel</button>
                <button onClick={() => setShowFilterModal(false)} className="px-6 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WonList;



// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { FaEnvelope, FaPhone, FaEdit, FaUser, FaCheckCircle } from 'react-icons/fa';
// import { LayoutGrid, List, Filter, RotateCw } from 'lucide-react';
// import ProfileHeader from '../../Components/common/ProfileHeader';
// import Loader from '../../Components/common/Loader';
// import { ENDPOINTS } from '../../api/constraints';
// import { jwtDecode } from 'jwt-decode';
// import { useNavigate } from 'react-router-dom';
// import Pagination from '../../context/Pagination/pagination';

// const WonList = () => {
//   const [deals, setDeals] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [fromDate, setFromDate] = useState('');
//   const [toDate, setToDate] = useState('');
//   const [viewMode, setViewMode] = useState('grid');
//   const [viewScope, setViewScope] = useState('mine'); 
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [currentToken, setCurrentToken] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [sortConfig, setSortConfig] = useState({ key: 'modified_date', direction: 'descending' });
//   const [companyIdFromToken, setCompanyIdFromToken] = useState(null);
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   const dealsPerPage = 12;

//   const navigate = useNavigate();

//   useEffect(() => {
//     try {
//       const tokenFromStorage = localStorage.getItem('token');
//       if (tokenFromStorage) {
//         const decodedToken = jwtDecode(tokenFromStorage);
//         setCurrentUserId(Number(decodedToken.user_id));
//         setCompanyIdFromToken(decodedToken.company_id);
//         setCurrentToken(tokenFromStorage);
//       } else {
//         setError('Authentication required. Please log in.');
//         setLoading(false);
//       }
//     } catch (e) {
//       setError('Authentication error: ' + e.message);
//       setLoading(false);
//     }
//   }, []);

//   const formatDate = (dateStr) =>
//     dateStr
//       ? new Date(dateStr).toLocaleDateString('en-GB', {
//           day: '2-digit',
//           month: '2-digit',
//           year: 'numeric',
//         })
//       : '-';

//   const isWithinDateRange = (date) => {
//     if (!date) return true;
//     const d = new Date(date);
//     const from = fromDate ? new Date(fromDate) : null;
//     const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
//     return (!from || d >= from) && (!to || d <= to);
//   };

//   const fetchDeals = useCallback(async () => {
//     if (!currentUserId || !currentToken) return;
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(`${ENDPOINTS.GET_DEALS}`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${currentToken}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const result = await response.json();
//       const rawFetchedDeals = Array.isArray(result) ? result : result.data || [];

//       const processedDeals = rawFetchedDeals
//         .filter((item) => {
//           const isConverted = item.bisConverted === true || item.bisConverted === 'true';
//           const isActive = item.bactive === true || item.bactive === 'true';
//           const matchesCompany = parseInt(item.icompany_id, 10) === companyIdFromToken;
//           return isConverted && isActive && matchesCompany;
//         })
//         .map((item) => ({
//           ...item,
//           id: item.i_deal_id || item.ilead_id,
//           name: item.cdeal_name || item.clead_name,
//           organization: item.c_organization || item.corganization,
//           email: item.c_email || item.cemail,
//           phone: item.c_phone || item.iphone_no,
//           owner_name: item.user?.cFull_name || 'Unknown', 
//           status_name: item.lead_status?.clead_name || 'Converted',
//           potential_name: item.lead_potential?.clead_name || item.lead_potential || 'General',
//           modified_date: item.dmodified_dt || item.d_modified_date,
//         }));

//       setDeals(processedDeals);
//     } catch (err) {
//       setError('Failed to fetch: ' + err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUserId, currentToken, companyIdFromToken]);

//   useEffect(() => {
//     fetchDeals();
//   }, [fetchDeals, refreshTrigger]);

//   const applyFilters = useCallback(
//     (data) =>
//       data.filter((item) => {
//         const matchesScope = viewScope === 'mine' 
//             ? Number(item.clead_owner) === currentUserId 
//             : Number(item.clead_owner) !== currentUserId;

//         const match = (text) => String(text || '').toLowerCase().includes(searchTerm.toLowerCase());
//         const matchesSearch =
//           match(item.name) || match(item.organization) || match(item.email) || match(item.phone) || match(item.owner_name);
//         const matchesDate = isWithinDateRange(item.modified_date);
        
//         return matchesScope && matchesSearch && matchesDate;
//       }),
//     [searchTerm, fromDate, toDate, viewScope, currentUserId]
//   );

//   const sortedData = useMemo(() => {
//     let sortableItems = applyFilters(deals);
//     if (sortConfig.key) {
//       sortableItems.sort((a, b) => {
//         const aValue = a[sortConfig.key];
//         const bValue = b[sortConfig.key];
//         if (sortConfig.key === 'modified_date') {
//           return sortConfig.direction === 'ascending' 
//             ? new Date(aValue) - new Date(bValue) 
//             : new Date(bValue) - new Date(aValue);
//         }
//         const stringA = String(aValue || '').toLowerCase();
//         const stringB = String(bValue || '').toLowerCase();
//         if (stringA < stringB) return sortConfig.direction === 'ascending' ? -1 : 1;
//         if (stringA > stringB) return sortConfig.direction === 'ascending' ? 1 : -1;
//         return 0;
//       });
//     }
//     return sortableItems;
//   }, [deals, applyFilters, sortConfig]);

//   const displayedData = useMemo(() => {
//     return sortedData.slice((currentPage - 1) * dealsPerPage, currentPage * dealsPerPage);
//   }, [sortedData, currentPage]);

//   const totalPages = Math.ceil(sortedData.length / dealsPerPage);

//   const handleSort = (key) => {
//     setSortConfig((prev) => ({
//       key,
//       direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
//     }));
//   };

//   const handleResetFilters = () => {
//     setFromDate('');
//     setToDate('');
//     setSearchTerm('');
//     setCurrentPage(1);
//     setShowFilterModal(false);
//     setRefreshTrigger((prev) => prev + 1);
//   };

//   const getSortIndicator = (key) => {
//     if (sortConfig.key === key) return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
//     return ' ↕';
//   };

//   if (loading) return <Loader />;
//   if (error) return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;

//   return (
//     <div className="max-w-full mx-auto p-4 space-y-6 min-h-screen">
//       <ProfileHeader />

//       {/* Search Toolbar */}
//       <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
//           placeholder="Search customers..."
//           className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//         />
//         <div className="hidden sm:flex gap-2 flex-wrap">
//           <button onClick={() => setRefreshTrigger((p) => p + 1)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
//             <RotateCw size={18} />
//           </button>
//           <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
//             <LayoutGrid size={18} />
//           </button>
//           <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
//             <List size={18} />
//           </button>
//           <button onClick={() => setShowFilterModal(true)} className={`p-2 rounded-full transition ${showFilterModal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
//             <Filter size={18} />
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex flex-wrap gap-2 mt-4">
//         <button 
//             onClick={() => { setViewScope('mine'); setCurrentPage(1); }}
//             className={`px-4 py-2 rounded-full text-base font-medium transition-all ${viewScope === 'mine' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
//         >
//           My Customers
//         </button>
//         <button 
//             onClick={() => { setViewScope('others'); setCurrentPage(1); }}
//             className={`px-4 py-2 rounded-full text-base font-medium transition-all ${viewScope === 'others' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
//         >
//           All Other Customers
//         </button>
//       </div>

//       {/* Content Area */}
//       {displayedData.length === 0 ? (
//         <div className="text-center text-gray-500 text-sm py-12">No records found.</div>
//       ) : viewMode === 'list' ? (
//         <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200">
//           <table className="w-full text-left text-sm text-gray-700 bg-white">
//             <thead className="bg-gray-50 text-gray-800 font-bold border-b">
//               <tr>
//                 <th className="px-4 py-3 w-16">S.No</th>
//                 <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('name')}>Name {getSortIndicator('name')}</th>
//                 <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('organization')}>Organization {getSortIndicator('organization')}</th>
//                 <th className="px-4 py-3">Phone</th>
//                 <th className="px-4 py-3">Owner</th>
//                 <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('modified_date')}>Modified {getSortIndicator('modified_date')}</th>
//                 <th className="px-4 py-3">Potential</th>
//                 <th className="px-4 py-3">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {displayedData.map((item, index) => (
//                 <tr key={item.id} onClick={() => window.location.href=`/leaddetailview/${item.id}`} className="border-t hover:bg-gray-50 cursor-pointer transition">
//                   <td className="px-4 py-3 font-normal text-gray-800">{(currentPage - 1) * dealsPerPage + (index + 1)} </td>
//                   <td className="px-4 py-3 font-normal text-gray-800 ">{item.name || '-'}</td>
//                   <td className="px-4 py-3 font-normal text-gray-800">{item.organization || '-'}</td>
//                   <td className="px-4 py-3 font-normal text-gray-800">{item.phone || '-'}</td>
//                   <td className="px-4 py-3 font-normal text-gray-800">{item.owner_name}</td>
//                   <td className="px-4 py-3 font-normal text-gray-800">{formatDate(item.modified_date)}</td>
//                   <td className="px-4 py-3 font-medium text-gray-800 text-[11px] uppercase">{item.potential_name}</td>
//                   <td className="px-4 py-3">
//                     <span className="px-3 py-1 bg-green-300 text-gray-700 text-[10px] font-bold rounded-full">WON</span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {displayedData.map((item,) => (
//             <div 
//               key={item.id} 
//               onClick={() =>
//   navigate(`/leaddetailview/${item.id}`, {
//     state: {
//       leadList: sortedData, // VERY IMPORTANT
//     },
//   })
// }
//               className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
//             >
//               <div>
//                 <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors mb-0.5">
//                   {item.name || '-'}
//                 </h3>
//                 <p className="text-[11px] text-gray-800 uppercase font-bold tracking-wider truncate border-b pb-3 mb-4 text-medium">
//                   {item.organization || '-'}
//                 </p>
                
//                 <div className="space-y-2.5 mb-5">
//                   <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
//                     <FaEnvelope className="text-blue-600 flex-shrink-0" /> 
//                     <span className="truncate">{item.email || '-'}</span>
//                   </div>
//                   <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
//                     <FaPhone className="text-green-600 flex-shrink-0" /> 
//                     <span>{item.phone || '-'}</span>
//                   </div>
//                   <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
//                     <FaUser className="text-purple-600 flex-shrink-0" /> 
//                     <span className="truncate">{item.owner_name}</span>
//                   </div>
//                   <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold">
//                     <FaEdit className="text-orange-600 flex-shrink-0" /> 
//                     <span>{formatDate(item.modified_date)}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Card Footer - Badges */}
//               <div className="flex justify-between items-center border-t pt-4 mt-2">
//                 {/* Won Badge (Bottom Left) */}
//                 <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm text-xs ">
//                   <FaCheckCircle size={10} /> WON
//                 </span>
                
//                 {/* Potential Badge (Bottom Right) */}
//                 <span className="px-3 py-1.5 bg-blue-500 text-white border border-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider text-xs">
//                   {item.potential_name}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         setCurrentPage={setCurrentPage}
//       />

//       {/* Filter Modal */}
//       {showFilterModal && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4 border border-gray-100">
//             <h2 className="text-lg font-bold text-gray-800">Filter by Date</h2>
//             <div className="space-y-4">
//               <div className="space-y-1">
//                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From Date</label>
//                 <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-400" />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">To Date</label>
//                 <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-400" />
//               </div>
//             </div>
//             <div className="flex justify-between items-center pt-4">
//               <button onClick={handleResetFilters} className="text-xs text-red-500 font-bold uppercase tracking-wider">Reset</button>
//               <div className="flex gap-2">
//                 <button onClick={() => setShowFilterModal(false)} className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">Cancel</button>
//                 <button onClick={() => setShowFilterModal(false)} className="px-6 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Apply</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WonList;

