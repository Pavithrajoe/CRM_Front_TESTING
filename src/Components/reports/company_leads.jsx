
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../api/constraints';

const CompanyLeads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token not found');

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const { company_id } = JSON.parse(jsonPayload);
        if (!company_id) throw new Error('Company ID missing');

        const response = await axios.get(`${ENDPOINTS.COMPANY_LEADS}${company_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data?.data || [];
        setLeads(data);
        setFilteredLeads(data);
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    fetchData();
  }, []);

 useEffect(() => {
  let updated = [...leads];

  // Apply filter
  if (filterType === 'open') {
    updated = updated.filter((lead) => lead.bactive === true && lead.bisConverted === false);
  } else if (filterType === 'lost') {
    updated = updated.filter((lead) => lead.bactive === false);
  } else if (filterType === 'deal') {
    updated = updated.filter((lead) => lead.bisConverted === true);
  }

  // Apply search
  if (searchTerm.trim() !== '') {
    updated = updated.filter((lead) =>
      [
        lead.clead_name,
        lead.user?.cFull_name,
        lead.cemail,
        lead.corganization,
        lead.lead_status?.clead_name,
        lead.lead_sources?.source_name,
        lead.iphone_no,
        lead.whatsapp_number,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }

  setFilteredLeads(updated);
  setCurrentPage(1); // Reset to first page on filter/search change
}, [searchTerm, filterType, leads]);

  // Pagination logic
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 8;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Prev
        </button>
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`px-3 py-1 border rounded-lg ${
              currentPage === number ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {number}
          </button>
        ))}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
        Next
        </button>
        <span className="text-sm text-gray-600">
          {indexOfLastLead > filteredLeads.length ? filteredLeads.length : indexOfLastLead}/{filteredLeads.length}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Table Controls */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="w-5 h-5 text-gray-500 absolute left-3 top-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M12.9 14.32a8 8 0 111.41-1.41l4.24 4.24-1.42 1.42-4.23-4.25zM8 14a6 6 0 100-12 6 6 0 000 12z" />
              </svg>
            </div>
            <button
              className={`px-4 py-2 rounded-full ${filterType === 'open' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilterType('open')}
            >
              Open
            </button>
            <button
              className={`px-4 py-2 rounded-full ${filterType === 'lost' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilterType('lost')}
            >
              Lost
            </button>
            <button
              className={`px-4 py-2 rounded-full ${filterType === 'deal' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setFilterType('deal')}
            >
              Deal
            </button>
            <button
              className="px-4 py-2 bg-gray-300 text-black rounded-full"
              onClick={() => {
                setFilterType(null);
                setSearchTerm('');
              }}
            >
              Reset
            </button>
          </div>
         
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto h-full">
          <table className="w-full text-left whitespace-nowrap h-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm text-center font-bold text-black ">S.No</th>
                <th className="px-4 py-3 text-sm font-bold text-black ">Lead Name</th>
                <th className="px-4 py-3 text-sm font-bold text-black ">Company Name</th>
                <th className="px-4 py-3 text-sm font-bold text-black ">Source</th>
                <th className="px-4 py-3 text-sm font-bold text-black ">E-Mail ID</th>
                <th className="px-4 py-3 text-sm font-bold text-black ">Phone No</th>
                <th className="px-4 py-3 text-sm font-bold text-black ">Created Date</th>
                <th className="px-4 py-3 text-sm font-bold  text-black ">Lead owner</th>
                <th className="px-4 py-3 text-sm font-bold text-center  text-black ">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.map((lead, index) => (
                <tr key={lead.ilead_id || index} className="border-t">
                  <td className="px-4 py-3 text-sm text-gray-700">{indexOfFirstLead + index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.clead_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.corganization || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.lead_sources?.source_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.cemail || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.iphone_no || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
  {lead.dcreated_dt
    ? new Date(lead.dcreated_dt).toLocaleDateString('en-GB') // This gives DD/MM/YYYY
        .replace(/\//g, '-') // Convert to DD-MM-YYYY
    : 'N/A'}
</td>

                  <td className="px-4 py-3 text-sm text-gray-700">{lead.user?.cFull_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm w-10">
  <span
    className={`inline-block text-center px-2 py-1 rounded-full w-24 ${
      lead.lead_status?.clead_name === 'Won'
        ? 'bg-green-100 text-green-600'
        : 'bg-yellow-100 text-yellow-600'
    }`}
  >
    {lead.lead_status?.clead_name || 'Unknown'}
  </span>
</td>

                </tr>
              ))}
              {currentLeads.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-500">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default CompanyLeads;
