import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaUser } from 'react-icons/fa';
import { LayoutGrid, List } from 'lucide-react';
import ProfileHeader from '@/components/common/ProfileHeader';
import LeadForm from '@/components/LeadForm';
import { ENDPOINTS } from '../../api/constraints';
import Loader from '../../Components/common/Loader';

const LeadCardViewPage = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchLeads = async () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    try {
      setLoading(true);
      const response = await fetch(
        `${ENDPOINTS.BASE_URL_IS}/lead/user/${userData.iUser_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch leads: ${response.status}`);

      const data = await response.json();

      if (Array.isArray(data.details)) {
        setAllLeads(data.details);
      } else {
        throw new Error('Invalid data format');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const goToReminderPage = (ilead_id) => {
    navigate(`/leaddetailview/${ilead_id}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'hot':
        return 'bg-red-800 text-sm p-2 rounded-xl font-bold text-white';
      case 'cold':
        return 'bg-blue-800 text-sm p-2 rounded-sm font-bold text-white';
      case 'warm':
        return 'bg-yellow-500 text-sm p-2 rounded-xl font-bold text-white';
      case 'new':
        return 'bg-sky-500 p-2 text-sm rounded-xl font-bold text-white';
      case 'contacted':
        return 'bg-green-500 p-2 text-sm rounded-xl font-bold text-white';
      case 'interested':
        return 'bg-purple-500 p-2 text-sm rounded-xl font-bold text-white';
      default:
        return 'bg-gray-300 p-2 text-sm rounded-xl font-bold text-gray-700';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Frontend filtered leads
  const filteredLeads = allLeads.filter((lead) =>
    lead.clead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cemail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.corganization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.iphone_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-full mx-auto p-4 rounded-xl bg-white space-y-6 shadow-xl">
      <ProfileHeader />

      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search leads..."
          className="border p-3 rounded-lg w-80 h-12 border-amber-800"
        />
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="Grid View"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 rounded-xl ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            title="List View"
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="p-3 bg-black text-white rounded-xl hover:bg-gray-800"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-gray-500 text-center">No leads found.</div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          {viewMode === 'list' ? (
            <div className="bg-white w-full rounded-lg shadow-md">
              <div className="grid grid-cols-6 gap-16 p-4 font-semibold border-b bg-gray-100">
                <div>Name</div>
                <div>Organisation</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Modified</div>
                <div>Status</div>
              </div>
              {filteredLeads.map((lead) => (
                <div
                  key={lead.ilead_id}
                  className="grid grid-cols-6 gap-16 p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => goToReminderPage(lead.ilead_id)}
                >
                  <div>{lead.clead_name}</div>
                  <div>{lead.corganization}</div>
                  <div>{lead.cemail}</div>
                  <div>{lead.iphone_no}</div>
                  <div>{formatDate(lead.dmodified_dt)}</div>
                  <div>
                    <span className={getStatusColor(lead.lead_status?.clead_name)}>
                      {lead.lead_status?.clead_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.ilead_id}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => goToReminderPage(lead.ilead_id)}
              >
                <h2 className="font-semibold text-lg mb-1">{lead.clead_name}</h2>
                <p className="text-sm text-gray-600 mb-2">Organization: {lead.corganization || '-'}</p>
                <div className="flex items-center gap-2 mb-1">
                  <FaEnvelope size={14} className="text-blue-500" />
                  <p className="text-sm text-blue-600">{lead.cemail || '-'}</p>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <FaPhone size={14} className="text-gray-500" />
                  <p className="text-sm">{lead.iphone_no || '-'}</p>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <FaUser size={14} className="text-purple-500" />
                  <p className="text-sm text-purple-600">{lead.assignedTo || '-'}</p>
                </div>
                <p className="text-sm mt-2">Last Modified: {formatDate(lead.dmodified_dt)}</p>
                <div className={`mt-2 ${getStatusColor(lead.lead_status?.clead_name)} px-3 py-1 rounded-full text-xs font-semibold inline-block`}>
                  {lead.lead_status?.clead_name || 'Unknown'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent mt-[-150px] z-50">
          <div
            className="bg-blur overflow-y-auto relative transform transition-transform duration-300 ease-in-out"
            style={{ left: '10%', width: '80%', height: '100vh' }}
          >
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6 h-full">
              <LeadForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCardViewPage;
