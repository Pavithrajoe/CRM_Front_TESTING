import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import { LayoutGrid, List, Filter, RotateCw } from 'lucide-react';
import ProfileHeader from '../../Components/common/ProfileHeader';
import Loader from '../../Components/common/Loader';
import { ENDPOINTS } from '../../api/constraints';

const LeadCardViewPage = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const leadsPerPage = 9;
  const navigate = useNavigate();

  const fetchLeads = async (page = 1, limit = 1000) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    try {
      const response = await fetch(`${ENDPOINTS.BASE_URL_IS}/lead/user/${userData.iUser_id}?page=${page}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (Array.isArray(data.details)) {
        const sortedLeads = data.details.sort((a, b) => new Date(b.dmodified_dt) - new Date(a.dmodified_dt));
        setAllLeads(sortedLeads);
      } else {
        setAllLeads([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setAllLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = allLeads.filter((lead) => {
    const lower = searchTerm.toLowerCase();
    const matchesSearch =
      lead.clead_name?.toLowerCase().includes(lower) ||
      lead.corganization?.toLowerCase().includes(lower) ||
      lead.cemail?.toLowerCase().includes(lower) ||
      lead.iphone_no?.toLowerCase().includes(lower);

    const modifiedDate = new Date(lead.dmodified_dt);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;

    const matchesDate = (from && to)
      ? (modifiedDate >= from && modifiedDate <= to)
      : true;

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const displayedLeads = filteredLeads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'hot': return 'bg-red-700 text-white';
      case 'warm': return 'bg-yellow-500 text-white';
      case 'cold': return 'bg-blue-700 text-white';
      case 'new': return 'bg-sky-600 text-white';
      case 'contacted': return 'bg-green-500 text-white';
      case 'interested': return 'bg-purple-600 text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const goToLeadDetail = (id) => {
    navigate(`/leaddetailview/${id}`);
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white rounded-xl shadow space-y-6">
      <ProfileHeader />

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search leads..."
          className="px-4 py-2 border border-gray-500 rounded-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-3 items-center">
          {/* Refresh Button */}
          <button
            onClick={() => fetchLeads()}
            title="Refresh Leads"
            className="p-3 rounded bg-gray-200 hover:bg-gray-300"
          >
            <RotateCw size={18} />
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 rounded ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setShowFilterModal(true)}
            className={`p-3 rounded ${showFilterModal ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 space-y-4 w-full max-w-md">
            <h2 className="text-lg font-semibold">Filter by Date</h2>
            <label className="block text-sm">
              From Date
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-400 rounded"
              />
            </label>
            <label className="block text-sm">
              To Date
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-400 rounded"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setShowFilterModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-black text-white"
                onClick={() => {
                  setCurrentPage(1);
                  setShowFilterModal(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Display */}
      {loading ? (
        <Loader />
      ) : filteredLeads.length === 0 ? (
        <div className="text-center text-gray-500">No leads found.</div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {viewMode === 'list' ? (
            <div className="rounded shadow border">
              <div className="grid grid-cols-6 gap-4 p-3 bg-gray-100 font-semibold text-sm">
                <div>Name</div>
                <div>Org</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Modified</div>
                <div>Status</div>
              </div>
              {displayedLeads.map((lead) => (
                <div
                  key={lead.ilead_id}
                  onClick={() => goToLeadDetail(lead.ilead_id)}
                  className="grid grid-cols-6 gap-4 p-3 border-t cursor-pointer hover:bg-gray-50 text-sm"
                >
                  <div className="break-words">{lead.clead_name}</div>
                  <div className="break-words">{lead.corganization}</div>
                  <div className="break-words">{lead.cemail}</div>
                  <div className="break-words">{lead.iphone_no}</div>
                  <div className="break-words">{formatDate(lead.dmodified_dt)}</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lead.lead_status?.clead_name)}`}>
                      {lead.lead_status?.clead_name || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            displayedLeads.map((lead) => (
              <div
                key={lead.ilead_id}
                onClick={() => goToLeadDetail(lead.ilead_id)}
                className="p-4 border rounded-xl shadow hover:shadow-lg transition"
              >
                <h2 className="text-lg font-semibold">{lead.clead_name}</h2>
                <p className="text-sm text-gray-600 mb-2">Org: {lead.corganization || '-'}</p>
                <div className="flex gap-2 items-center text-sm">
                  <FaEnvelope className="text-blue-500" /> {lead.cemail || '-'}
                </div>
                <div className="flex gap-2 items-center text-sm">
                  <FaPhone className="text-gray-500" /> {lead.iphone_no || '-'}
                </div>
                <p className="text-sm mt-2">Last Modified: {formatDate(lead.dmodified_dt)}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.lead_status?.clead_name)}`}>
                  {lead.lead_status?.clead_name || 'N/A'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-black text-white' : 'bg-gray-100'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadCardViewPage;

