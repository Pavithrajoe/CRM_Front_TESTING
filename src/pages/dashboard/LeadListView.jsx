import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/common/sidebar';
import ProfileHeader from '@/components/common/ProfileHeader';
import LeadToolbar from '@/components/dashboard/LeadToolbar';

const LeadListViewPage = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('My Leads');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    const mockLeads = Array(20).fill().map((_, i) => ({
      name: `Karthik Raja ${i + 1}`,
      organization: 'Zero Consultancy Services',
      phone: '98745 61230',
      email: `karthik${i + 1}@gmail.com`,
      assignedTo: 'Shivakumar',
      modified: 'week ago',
      status: ['Contacted', 'Pending', 'Follow-up'][i % 3],
      lead: ['Hot', 'Warm', 'Cold'][i % 3],
      category: ['My Leads', 'All Leads', 'Converted Leads'][i % 3],
    }));
    setLeads(mockLeads);
  }, []);

  const filteredLeads = leads
    .filter((lead) => activeTab === 'All Leads' || lead.category === activeTab)
    .filter((lead) => lead.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-50 min-h-screen p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Lead Management (List View)</h1>
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
                  <td className="p-2">{lead.name}</td>
                  <td className="p-2">{lead.organization}</td>
                  <td className="p-2">{lead.phone}</td>
                  <td className="p-2">{lead.email}</td>
                  <td className="p-2">{lead.assignedTo}</td>
                  <td className="p-2">{lead.modified}</td>
                  <td className="p-2">{lead.status}</td>
                  <td className="p-2">{lead.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default LeadListViewPage;
