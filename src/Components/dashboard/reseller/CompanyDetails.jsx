import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, List, Filter, RotateCw } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { ENDPOINTS } from "../../../api/constraints";

const CompanyDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [allCompanies, setAllCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();

  const getInitialStatus = () => {
    const params = new URLSearchParams(location.search);
    return params.get('status') || 'all';
  };
  const [currentStatusFilter, setCurrentStatusFilter] = useState(getInitialStatus);

  const getUserInfoFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // console.warn('No token found in localStorage.');
      return { userIdFromToken: null, roleId: null };
    }
    try {
      const decoded = jwtDecode(token);
      return {
        userIdFromToken: decoded?.user_id || null,
        roleId: decoded?.role_id || null,
      };
    } catch (error) {
      console.error('Invalid token during decoding in CompanyDetails:', error);
      return { userIdFromToken: null, roleId: null };
    }
  };


  useEffect(() => {
    const fetchAndFilterCompanies = async () => {
      setLoading(true);
      setError(null);

      const { userIdFromToken, roleId } = getUserInfoFromToken();

      if (!userIdFromToken || roleId !== 3) {
        // console.warn('User is not a reseller (role_id !== 3) or User ID from token is missing. Cannot fetch company details.');
        setError('Unauthorized: You must be a reseller to view company details.');
        setLoading(false);
        setAllCompanies([]);
        setFilteredCompanies([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found.');
          setLoading(false);
          return;
        }

        const res = await fetch(ENDPOINTS.COMPANY, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorText}`);
        }

        const result = await res.json();

        if (result && Array.isArray(result)) {
          const relevantCompanies = result.filter(
            (company) => company.ireseller_admin_id === userIdFromToken
          );
          setAllCompanies(relevantCompanies);
        } else {
          // console.warn('API response is not a direct array as expected in CompanyDetails:', result);
          setAllCompanies([]);
        }
      } catch (err) {
        console.error('Failed to fetch company details:', err);
        setError(`Failed to load companies: ${err.message}`);
        setAllCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterCompanies();
  }, [location.search]);


  useEffect(() => {
    let currentFiltered = [...allCompanies];

    
    if (currentStatusFilter === 'active') {
      currentFiltered = currentFiltered.filter(company => company.bactive);
    } else if (currentStatusFilter === 'inactive') {
      currentFiltered = currentFiltered.filter(company => !company.bactive);
    }

    
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(company =>
        company.cCompany_name.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      currentFiltered = currentFiltered.filter(company => {
        const createdDate = new Date(company.dCreated_dt);
        return createdDate >= from && createdDate <= to;
      });
    } else if (fromDate) {
        const from = new Date(fromDate);
        currentFiltered = currentFiltered.filter(company => {
            const createdDate = new Date(company.dCreated_dt);
            return createdDate >= from;
        });
    } else if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        currentFiltered = currentFiltered.filter(company => {
            const createdDate = new Date(company.dCreated_dt);
            return createdDate <= to;
        });
    }

   
    currentFiltered.sort((a, b) => {
      const dateA = new Date(a.dCreated_dt);
      const dateB = new Date(b.dCreated_dt);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredCompanies(currentFiltered);
  }, [allCompanies, currentStatusFilter, searchTerm, fromDate, toDate]);

  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    setCurrentStatusFilter(getInitialStatus());
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const handleFilterApply = () => {
    setShowFilterModal(false);
  };

  const handleFilterCancel = () => {
    setShowFilterModal(false);
    setFromDate('');
    setToDate('');
  };

  useEffect(() => {
    setCurrentStatusFilter(getInitialStatus());
  }, [location.search]);

  if (loading) {
    return <div className="text-center p-8 text-lg text-gray-600">Loading companies...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-lg text-red-600">Error: {error}</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search companies by name..."
          // className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          className="flex-grow min-w-[200px] max-w-sm px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            title="Refresh Data"
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setShowFilterModal(true)}
            title="Open Filters"
            className={`p-2 rounded-full ${
              (fromDate || toDate) ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      
      <div className="mt-6">
        {filteredCompanies.length === 0 && !loading && !error ? (
          <div className="text-center text-gray-500 p-8">No companies found matching your criteria.</div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map(company => (
                <div
                  key={company.iCompany_id}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{company.cCompany_name}</h3>
                  
                  <p className="text-base text-gray-600 mb-1">Status: {company.bactive ? <span className="text-green-600 font-medium">Active</span> : <span className="text-red-600 font-medium">Inactive</span>}</p>
                  <p className="text-base text-gray-600 mb-1">Email: {company.cemail_address || 'N/A'}</p>
                  <p className="text-base text-gray-600 mb-1">Phone: {company.iPhone_no || 'N/A'}</p>
                  <p className="text-base text-gray-600 mb-1">Website: <a href={company.cWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{company.cWebsite}</a></p>
                  <p className="text-sm text-gray-500 mt-2">Created: {new Date(company.dCreated_dt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : ( 
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    
                    <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Organization
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Website
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map(company => (
                    <tr key={company.iCompany_id} className="hover:bg-gray-50">
                     
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                        {company.cCompany_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-500 hover:underline">
                        <a href={company.cWebsite} target="_blank" rel="noopener noreferrer">
                          {company.cWebsite || 'N/A'}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                        {company.cemail_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                        {company.iPhone_no || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base">
                        {company.bactive ? (
                          <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                        {new Date(company.dCreated_dt).toLocaleDateString('en-GB', {
                           day: '2-digit',
                           month: 'long',
                           year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>


      
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
                className="w-full mt-1 px-1 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleFilterCancel}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFilterApply}
                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyDetails;