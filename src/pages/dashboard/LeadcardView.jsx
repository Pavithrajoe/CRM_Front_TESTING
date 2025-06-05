import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaGlobe } from 'react-icons/fa';
import { LayoutGrid, List, Filter, RotateCw } from 'lucide-react';
import ProfileHeader from '../../Components/common/ProfileHeader';
import Loader from '../../Components/common/Loader';
import { ENDPOINTS } from '../../api/constraints';

const LeadCardViewPage = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const leadsPerPage = 9;

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${ENDPOINTS.BASE_URL_IS}/lead/user/${user.iUser_id}?page=1&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
    //  console.log('Leads Data:', data);
      const sorted = (Array.isArray(data.details) ? data.details : []).sort(
        (a, b) => new Date(b.dmodified_dt) - new Date(a.dmodified_dt)
      );
      setAllLeads(sorted);
    } catch (err) {
      setAllLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Deals
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(ENDPOINTS.GET_DEALS, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
    //  console.log('Deals Data:', data);
      setDeals(data);
    } catch (err) {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFilter === 'deals') {
      fetchDeals();
    } else {
      fetchLeads();
    }
  }, [selectedFilter, fetchLeads, fetchDeals]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'hot':
        return 'bg-red-700 text-white';
      case 'warm':
        return 'bg-yellow-500 text-white';
      case 'cold':
        return 'bg-blue-700 text-white';
      case 'new':
        return 'bg-sky-600 text-white';
      case 'contacted':
        return 'bg-green-500 text-white';
      case 'interested':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-yellow-300 text-gray-700';
    }
  };

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const isWithinDateRange = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
    return (!from || d >= from) && (!to || d <= to);
  };

  const filteredLeads = allLeads.filter((lead) => {
    const match = (text) => text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch =
      match(lead.clead_name) || match(lead.corganization) || match(lead.cemail) || match(lead.iphone_no);
    const matchesDate = isWithinDateRange(lead.dmodified_dt);

    const isActiveLead = (lead.bactive === true || lead.bactive === 'true') &&
      !(lead.bisconverted === true || lead.bisconverted === 'true');
    const isWebsiteLead = lead.website_lead === true || lead.website_lead === 'true';

    let matchesFilter = false;
    if (selectedFilter === 'all') matchesFilter = true;
    else if (selectedFilter === 'leads') matchesFilter = isActiveLead;
    else if (selectedFilter === 'websiteLeads') matchesFilter = isWebsiteLead;

    return matchesSearch && matchesDate && matchesFilter;
  });

  const dataToDisplay = selectedFilter === 'deals' ? deals : filteredLeads;
  const totalPages = Math.ceil(dataToDisplay.length / leadsPerPage);
  const displayedData = dataToDisplay.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const goToDetail = (id) => {
    navigate(`/leaddetailview/${id}`);
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white rounded-2xl shadow-md space-y-6 min-h-screen">
      <ProfileHeader />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search leads..."
          className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => (selectedFilter === 'deals' ? fetchDeals() : fetchLeads())}
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

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
        {['all', 'leads', 'websiteLeads', 'deals'].map((filterKey) => (
          <button
            key={filterKey}
            onClick={() => {
              setSelectedFilter(filterKey);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedFilter === filterKey
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterKey === 'all'
              ? 'All Leads'
              : filterKey === 'leads'
              ? 'Leads'
              : filterKey === 'websiteLeads'
              ? 'Website Leads'
              : 'Deals'}
          </button>
        ))}
      </div>

      {/* Filter Modal */}
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
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button onClick={handleFilterApply} className="px-4 py-2 rounded-full bg-blue-600 text-white">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loader or No data */}
      {loading ? (
        <Loader />
      ) : dataToDisplay.length === 0 ? (
        <div className="text-center text-gray-500 text-sm sm:text-base">No {selectedFilter === 'deals' ? 'deals' : 'leads'} found.</div>
      ) : viewMode === 'list' ? (
        // List View
        <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200">
          <div className="min-w-[600px] grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 text-gray-800 text-sm font-medium">
            <div>Name</div>
            <div>Org</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Modified</div>
            <div>Status</div>
          </div>
          {displayedData.map((item) => (
            <div
              key={item.ilead_id || item.i_deal_id}
              onClick={() => goToDetail(item.ilead_id || item.i_deal_id)}
              className="min-w-[600px] grid grid-cols-6 gap-4 px-4 py-3 border-t hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
            >
              <div>{item.clead_name || item.cdeal_name}</div>
              <div>{item.corganization || item.c_organization}</div>
              <div>{item.cemail || item.c_email}</div>
              <div>{item.iphone_no || item.c_phone}</div>
              <div>{formatDate(item.dmodified_dt || item.d_modified_date)}</div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    getStatusColor(item.lead_status?.clead_name || item.c_deal_status_name)
                  }`}
                >
                  {item.lead_status?.clead_name || item.c_deal_status_name || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayedData.map((item) => {
            const isDeal = selectedFilter === 'deals';
            const isConverted = item.bisconverted === true || item.bisconverted === 'true';
            const isLost = item.bactive === false || item.bactive === 'false';
            const isActiveLead = !isDeal && (item.bactive === true || item.bactive === 'true') && !isConverted;
            const isWebsiteLead = item.website_lead === true || item.website_lead === 'true';

            return (
              <div
                key={item.ilead_id || item.i_deal_id}
                onClick={() => goToDetail(item.ilead_id || item.i_deal_id)}
                className="p-5 rounded-2xl border border-gray-200 bg-white shadow-md hover:shadow-lg transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-gray-800 truncate max-w-[70%]">
                    {item.clead_name || item.cdeal_name}
                  </h2>
                  {isDeal ? (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        item.lead_status?.clead_name
                      )}`}
                    >
                      {item.lead_status.clead_name || 'N/A'}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 items-center">
                      {isLost && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold whitespace-nowrap">
                          Lost
                        </span>
                      )}
                      {isConverted && (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold whitespace-nowrap">
                          Deal
                        </span>
                      )}
                      {isActiveLead && (
                        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold whitespace-nowrap">
                          Lead
                        </span>
                      )}
                      {isWebsiteLead && (
                        <span className="px-2 py-1 text-blue-700" title="Website Lead">
                          <FaGlobe />
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">Org: {item.corganization || item.c_organization || '-'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 truncate overflow-hidden">
                  <FaEnvelope className="flex-shrink-0" />
                  <span className="truncate">{item.cemail || item.c_email || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 truncate overflow-hidden">
                  <FaPhone className="flex-shrink-0" />
                  <span className="truncate">{item.iphone_no || item.c_phone || '-'}</span>
                </div>
                <p className="text-sm text-gray-500 whitespace-nowrap">
                  Last Modified: {formatDate(item.dmodified_dt || item.d_modified_date)}
                </p>
                {!isDeal && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                      item.lead_status?.clead_name
                    )}`}
                  >
                    {item.lead_status?.clead_name || 'N/A'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-full bg-gray-200 disabled:opacity-50 text-sm"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-full text-sm ${
                currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-full bg-gray-200 disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadCardViewPage;