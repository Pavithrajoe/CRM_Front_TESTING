import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/common/sidebar';
import ProfileHeader from '@/components/common/ProfileHeader';
import LeadToolbar from '@/components/dashboard/LeadToolbar';
//import LeadsTable from '@/components/dashboard/LeadsTable'; // <-- make sure this is your table component
import LeadForm from '@/components/LeadForm'; 

export default function LeadCardViewPage() {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('My Leads');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState('card');
  const [showForm, setShowForm] = useState(false); // modal state

  useEffect(() => {
    const mockLeads = Array(100).fill().map((_, index) => ({
      id: index + 1,
      name: `Karthik Raja ${index + 1}`,
      organization: 'Zero Consultancy Services',
      phone: '98745 61230',
      email: `karthik${index + 1}@gmail.com`,
      assignedTo: 'Shivakumar',
      modified: 'week ago',
      status: ['Contacted', 'Pending', 'Follow-up'][index % 3],
      lead: ['Hot', 'Warm', 'Cold'][index % 3],
      category: ['My Leads', 'All Leads', 'Converted Leads'][index % 3],
    }));
    setLeads(mockLeads);
  }, []);

  // Memoized filter + sort + search
  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => activeTab === 'All Leads' || lead.category === activeTab)
      .filter(lead => lead.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
      );
  }, [leads, activeTab, searchTerm, sortAsc]);

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-gray-50 mt-[-5] min-h-screen p-6">
        <div className="ml-auto"><ProfileHeader /></div>

        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-2xl font-semibold mt-[-100px] text-gray-800">Lead Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-blue-00"
          >
            + Create List
          </button>
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

        {/* Card View Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-[150px]">
          {filteredLeads.map((lead, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold">{lead.name}</h2>
                  <p className="text-sm text-gray-600">{lead.organization}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  lead.status === 'Contacted' ? 'bg-green-200 text-green-800'
                  : lead.status === 'Pending' ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-blue-200 text-blue-800'
                }`}>
                  {lead.status}
                </span>
              </div>

                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span>📧</span><span>{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📞</span><span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👤</span><span>{lead.assignedTo}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    📝 Last Modified {lead.modified}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    lead.lead === 'Hot'
                      ? 'bg-red-400 text-white'
                      : lead.lead === 'Warm'
                      ? 'bg-orange-400 text-white'
                      : 'bg-blue-400 text-white'
                  }`}>
                    {lead.lead} Lead
                  </span>
                </div>
              </div>
            ))}
          </div>
         : (
          <div className="overflow-x-auto mt-6">
            <LeadsTable leads={filteredLeads} />
          </div>
        )
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full overflow-y-scroll p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-xl"
              onClick={() => setShowForm(false)}
            >
             
            </button>
            {/* <h2 className="text-xl font-semibold mb-4">Create New Lead</h2> */}
            <LeadForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
