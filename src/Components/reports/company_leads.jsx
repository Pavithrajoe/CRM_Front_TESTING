import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../api/constraints';
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import * as XLSX from 'xlsx'; // Import xlsx library for Excel export
import { saveAs } from 'file-saver'; // Import saveAs from file-saver for downloading files


const CompanyLeads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const leadsPerPage = 10;

  // New states for date filtering
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [showDefaultMonthNotification, setShowDefaultMonthNotification] = useState(false);

  // Helper function to format date to YYYY-MM-DD for input type="date"
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Effect to set default current month dates on initial load
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedFirstDay = formatDateForInput(firstDayOfMonth);
    const formattedLastDay = formatDateForInput(lastDayOfMonth);

    setDateFilterFrom(formattedFirstDay);
    setDateFilterTo(formattedLastDay);
    setShowDefaultMonthNotification(true); 
  }, []); // Run only once on mount

  // Effect to fetch data based on filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token not found');

        const base66Url = token.split('.')[1];
        const base64 = base66Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const { company_id } = JSON.parse(jsonPayload);
        if (!company_id) throw new Error('Company ID missing');

        // Prepare params for the API call
        const params = {
          fromDate: dateFilterFrom,
          toDate: dateFilterTo,
        };
        if(dateFilterFrom && dateFilterTo){
        const response = await axios.get(`${ENDPOINTS.COMPANY_LEADS}/${company_id}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: params, // Pass fromDate and toDate as query parameters
        });
      
        const data = response.data?.data || [];
        setLeads(data);
        setFilteredLeads(data); // Initial filter based on fetched data
      }
      } catch (err) {
        console.error('Error fetching leads:', err);
        // Optionally, show an error message to the user
      }
    };
    fetchData();
  }, [dateFilterFrom, dateFilterTo]); // Re-fetch data when date filters change

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

  // Function to handle Excel export for the leads table
  const handleExport = () => {
    if (filteredLeads.length === 0) {
      alert("No data to export for the current filter.");
      return;
    }

    const dataToExport = filteredLeads.map((lead, index) => {
      return {
        'S.No': index + 1,
        'Lead Name': lead.clead_name || '-',
        'Company Name': lead.corganization || '-',
        'Source': lead.lead_sources?.source_name || '-',
        'E-Mail ID': lead.cemail || '-',
        'Phone No': lead.iphone_no || '-',
        'Created Date': lead.dcreated_dt
          ? new Date(lead.dcreated_dt).toLocaleDateString('en-GB').replace(/\//g, '-')
          : '-',
        'Lead Owner': lead.user?.cFull_name || '-',
        'Status': lead.lead_status?.clead_name || 'Unknown',
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CompanyLeadsReport");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'CompanyLeadsReport.xlsx');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Changed Header structure to include both button and title */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "32px 32px 0 32px", // Added top padding to match previous design if needed
        marginBottom: "24px" // Keep margin bottom for spacing to content below
      }}>
        <button
          onClick={() => navigate("/reportpage")}
          style={{
            color: "#6B7280",
            padding: "8px",
            borderRadius: "9999px",
            fontSize: "24px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
            marginRight: "16px", // Space between button and title
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="Back to reports"
        >
          <FaArrowLeft />
        </button>
        <h2 style={{
          fontSize: 26,
          fontWeight: 700,
          color: "#1c1c1e",
          margin: 0 // Ensure no default margin from h2
        }}>Company Leads Reports</h2> {/* Changed heading text */}
      </div>

      {/* Table Controls - moved padding to this div */}
      <div className="px-6 pb-6"> {/* Adjusted padding here to align search/filters */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2"> {/* Added flex-wrap and gap */}
          <div className="relative flex items-center space-x-2 flex-wrap gap-2"> {/* Added flex-wrap and gap */}
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
              className={`px-4 py-2 rounded-xl ${filterType === 'open' ? 'bg-blue-600 text-white' : 'bg-blue-200'}`}
              onClick={() => setFilterType('open')}
            >
              Open
            </button>
            <button
              className={`px-4 py-2 rounded-xl ${filterType === 'deal' ? 'bg-green-600 text-white' : 'bg-blue-200'}`}
              onClick={() => setFilterType('deal')}
            >
              Won
            </button>
            <button
              className={`px-4 py-2 rounded-xl ${filterType === 'lost' ? 'bg-red-600 text-white' : 'bg-blue-200'}`}
              onClick={() => setFilterType('lost')}
            >
              Lost
            </button>
          </div>
          {/* Export to Excel Button */}
          <button
            onClick={handleExport}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
          >
            Export to Excel
          </button>
        </div>

        {/* New Date Filter Inputs and Reset Button */}
        <div className="flex gap-4 items-center flex-wrap mb-4">
          <label className="text-gray-700 font-medium text-sm">From:</label>
          <input
            type="date"
            value={dateFilterFrom}
            onChange={(e) => {
              setDateFilterFrom(e.target.value);
              setShowDefaultMonthNotification(false);
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
          />
          <label className="text-gray-700 font-medium text-sm">To:</label>
          <input
            type="date"
            value={dateFilterTo}
            onChange={(e) => {
              setDateFilterTo(e.target.value);
              setShowDefaultMonthNotification(false); 
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
          />
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            onClick={() => {
              setFilterType(null);
              setSearchTerm('');
              // Reset date filters to empty and trigger re-fetch for all data
              setDateFilterFrom('');
              setDateFilterTo('');
              setShowDefaultMonthNotification(false);
            }}
          >
            Reset All Filters
          </button>
        </div>

        {/* Current Month Data Notification */}
        {showDefaultMonthNotification && dateFilterFrom && dateFilterTo && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{
              background: "linear-gradient(to right, #e6ffe6, #d0ffe0)",
              color: "#1b5e20",
              border: "1px solid #a5d6a7",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            💡 Showing leads for the **current month**: **{new Date(dateFilterFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **{new Date(dateFilterTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.
          </div>
        )}
        {!showDefaultMonthNotification && dateFilterFrom && dateFilterTo && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{
              background: "linear-gradient(to right, #e0f7fa, #c2eff5)",
              color: "#006064",
              border: "1px solid #80deea",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            🗓️ Filtering leads from **{new Date(dateFilterFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}** to **{new Date(dateFilterTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}**.
          </div>
        )}
        {!dateFilterFrom && !dateFilterTo && (
            <div className="mb-4 p-3 rounded-lg text-sm"
              style={{
                background: "linear-gradient(to right, #f8f8f8, #f0f0f0)",
                color: "#424242",
                border: "1px solid #e0e0e0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
                📊 Showing **all available leads** (no date filter applied).
            </div>
        )}


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
                <th className="px-4 py-3 text-sm font-bold text-black ">Lead owner</th>
                <th className="px-4 py-3 text-sm font-bold text-center text-black ">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.map((lead, index) => (
                <tr key={lead.ilead_id || index} className="border-t">
                  <td className="px-4 py-3 text-sm text-gray-700">{indexOfFirstLead + index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.clead_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.corganization || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.lead_sources?.source_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.cemail || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.iphone_no || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
  {lead.dcreated_dt
    ? (() => {
        const date = new Date(lead.dcreated_dt);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      })()
    : '-'}
</td>

                  <td className="px-4 py-3 text-sm text-gray-700">{lead.user?.cFull_name || '-'}</td>
                  <td className="px-4 py-3 text-sm w-10">
                    <span
                      className={`inline-block text-center px-2 py-1 rounded-xl w-24 ${
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
