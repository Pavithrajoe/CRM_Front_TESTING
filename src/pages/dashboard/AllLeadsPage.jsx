import React, { useState, useEffect } from 'react';
import ProfileHeader from '@/components/common/ProfileHeader';
// import LeadToolbar from '@/components/dashboard/LeadToolbar';
import LeadToolbar from '../../Components/dashboard/LeadToolbar';
import LeadCardView from './LeadcardView';
// import LeadCardView from '@/components/dashboard/LeadCardView';
// import LeadCardView from './LeadcardView';
// import LeadCardView from './LeadcardView';
// import LeadListView from '@/components/dashboard/LeadListView';
import LeadForm from '@/components/LeadForm';

const AllLeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('My Leads');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState('card');
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // State for date filter

  useEffect(() => {
    // Mock data generation (same as before)
    const mockLeads = Array(100)
      .fill()
      .map((_, index) => {
        const statusOptions = ['Contacted', 'Pending', 'Follow-up'];
        const leadOptions = ['Hot', 'Warm', 'Cold'];
        const categoryOptions = ['My Leads', 'All Leads', 'Converted Leads'];
        const modifiedDate = new Date();
        modifiedDate.setDate(modifiedDate.getDate() - Math.floor(Math.random() * 30)); // Random date within the last 30 days

        return {
          id: index + 1,
          name: `Karthik Raja ${index + 1}`,
          organization: `Zero Consultancy Services ${index + 1}`,
          phone: '98745 61230',
          email: `karthik${index + 1}@gmail.com`,
          assignedTo: 'Shivakumar',
          modified: modifiedDate.toLocaleDateString(),
          status: statusOptions[index % statusOptions.length],
          lead: leadOptions[index % leadOptions.length],
          category: categoryOptions[index % categoryOptions.length],
          modifiedDateObject: modifiedDate, // For filtering
        };
      });
    setLeads(mockLeads);
  }, []);

  const filteredLeads = leads
    .filter((lead) => activeTab === 'All Leads' || lead.category === activeTab)
    .filter((lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((lead) =>
      !selectedDate || new Date(lead.modifiedDateObject).toDateString() === selectedDate.toDateString()
    )
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  return (
    <div className="flex">
      <main className="flex-1 bg-gray-50 mt-[-5] min-h-screen p-6">
        <div className="ml-auto">
          {/* <ProfileHeader /> */}
        </div>

        {/* <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-2xl font-semibold mt-[-100px] text-gray-800">Lead Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
          >
            Create Lead
          </button>
        </div> */}

        {/* <LeadToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        /> */}

        {viewMode === 'card' && <LeadCardView leads={filteredLeads} />}
        {viewMode === 'list' && <LeadListView leads={filteredLeads} />}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full md:w-3/4 lg:w-1/2 overflow-y-auto rounded-md shadow-lg relative">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-xl focus:outline-none"
                onClick={() => setShowForm(false)}
              >
                &times;
              </button>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Lead</h2>
                <LeadForm onClose={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AllLeadsPage;