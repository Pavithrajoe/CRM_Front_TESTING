import React, { useEffect, useState } from 'react';
import ProfileHeader from '@/components/common/ProfileHeader';
import LeadToolbar from '@/components/dashboard/LeadToolbar';
import { ENDPOINTS } from '../../api/constraints';
import Loader from '../../Components/common/Loader';

const LeadListViewPage = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('My Leads');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      const token = localStorage.getItem('token');
      const user_data = localStorage.getItem('user');
      let user_data_parsed;

      try {
        user_data_parsed = JSON.parse(user_data);
        console.log(user_data_parsed)
      } catch (err) {
        console.error('Invalid user data in localStorage:', err);
        setError('User data is invalid');
        setLoading(false);
        return;
      }

      const userId = user_data_parsed?.iUser_id;
      if (!userId) {
        console.error('User ID not found.');
        setError('User ID not found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${ENDPOINTS.BASE_URL_IS}/lead/user/${user_data_parsed.iUser_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch leads: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data.details)) {
          setLeads(data.details);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const filteredLeads = leads
    .filter((lead) => {
      if (activeTab === 'All Leads') return true;
      if (activeTab === 'My Leads') return lead.assignedTo === 'Shivakumar'; // Replace with dynamic user name if needed
      if (activeTab === 'Converted Leads') return lead.status === 'Converted';
      return true;
    })
    .filter((lead) =>
      lead.clead_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc
        ? a.clead_name?.localeCompare(b.clead_name)
        : b.clead_name?.localeCompare(a.clead_name)
    );

  return (
    <div className="flex">
      <main className="flex-1 bg-gray-50 min-h-screen p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Lead Management</h1>
          <ProfileHeader />
        </div>

        <LeadToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {loading ? (
          <Loader/>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <div className="overflow-auto mt-6">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Organization</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Assigned To</th>
                  <th className="p-2">Modified</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Lead</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr key={idx} className="border-b text-sm">
                    <td className="p-2">{lead.clead_name}</td>
                    <td className="p-2">{lead.corganization}</td>
                    <td className="p-2">{lead.iphone_no}</td>
                    <td className="p-2">{lead.cemail}</td>
                    <td className="p-2">{lead.assignedTo}</td>
                    <td className="p-2">{lead.dmodified_dt}</td>
                    <td className="p-2">{lead.lead_status?.clead_name}</td>
                    <td className="p-2">{lead.lead_potential?.clead_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default LeadListViewPage;
