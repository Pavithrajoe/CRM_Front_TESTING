import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import { LayoutGrid, List } from 'lucide-react';
import ProfileHeader from '../../Components/common/ProfileHeader';
import LeadForm from '../../Components/LeadForm';
import { ENDPOINTS } from '../../api/constraints';
import Loader from '../../Components/common/Loader';

const LeadCardViewPage = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const leadsPerPage = 9;
  const navigate = useNavigate();

  const fetchLeads = async (page = 1, limit = 1000) => {
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
      console.log("Fetched leads:", data);

      if (Array.isArray(data.details)) {
        // Sort by dmodified_dt DESC
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
    return (
      lead.clead_name?.toLowerCase().includes(lower) ||
      lead.corganization?.toLowerCase().includes(lower) ||
      lead.cemail?.toLowerCase().includes(lower) ||
      lead.iphone_no?.toLowerCase().includes(lower)
    );
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
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search leads..."
          className="border border-amber-800 rounded-lg p-3 w-80"
        />
        <div className="flex gap-3">
          <button onClick={() => setViewMode('grid')}
           className={`p-3 rounded ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-200'}`}>
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setViewMode('list')} 
          className={`p-3 rounded ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-200'}`}>
            <List size={18} />
          </button>
          <button onClick={() => setShowForm(true)} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900">
            + Add Lead
          </button>
        </div>
      </div>

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
                  <div className='break-words'>{lead.clead_name}</div>
                  <div className='break-words'>{lead.corganization}</div>
                  <div className='break-words'>{lead.cemail}</div>
                  <div className='break-words'>{lead.iphone_no}</div>
                  <div className='break-words'>{formatDate(lead.dmodified_dt)}</div>
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

      {/* Lead Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-start pt-10 overflow-y-auto">
          <div className="bg-white w-4/5 rounded-xl shadow-lg relative p-6">
            {/* <button onClick={() => setShowForm(false)} className="absolute top-3 right-4 text-2xl">&times;</button> */}
            <LeadForm onClose={() => { setShowForm(false); fetchLeads(); }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCardViewPage;
