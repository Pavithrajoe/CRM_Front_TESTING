import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ENDPOINTS } from "../../../api/constraints";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

export default function LeadsTable() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsData, setLeadsData] = useState([]);
  const [subordinatesData, setSubordinatesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const leadsPerPage = 8;

  const navigate = useNavigate();

  useEffect(() => {
    let extractedUserId = null;
    let tokenFromStorage = null;

    try {
      tokenFromStorage = localStorage.getItem('token');

      if (tokenFromStorage) {
        const decodedToken = jwtDecode(tokenFromStorage);
        extractedUserId = decodedToken.user_id;

        if (!extractedUserId) {
          throw new Error("User ID (user_id) not found in decoded token payload.");
        }
      } else {
        throw new Error("Authentication token not found in local storage. Please log in.");
      }
    } catch (e) {
      console.error("Error retrieving or decoding token in LeadsTable:", e);
      setError(`Authentication error: ${e.message}`);
      setLoading(false);
      return;
    }

    if (extractedUserId && tokenFromStorage) {
      setCurrentUserId(extractedUserId);
      setCurrentToken(tokenFromStorage);
    } else {
      setError("Failed to obtain valid user ID or authentication token.");
      setLoading(false);
    }
  }, []);

  const fetchLeadsAndSubordinates = useCallback(async () => {
    if (!currentUserId || !currentToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ENDPOINTS.TEAM_LEAD}/${currentUserId}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(`HTTP error! status: ${response.status}, Details: ${errorData.message || response.statusText}`);
      }
      const result = await response.json();

      setLeadsData(result.details?.lead || []);
      setSubordinatesData(result.details?.subordinates || []);

    } catch (err) {
      console.error("Error fetching leads and subordinates:", err);
      setError(`Failed to fetch data: ${err.message}. Please try again later.`);
      setLeadsData([]);
      setSubordinatesData([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentToken]);

  useEffect(() => {
    fetchLeadsAndSubordinates();
  }, [fetchLeadsAndSubordinates]);

  const activeSubordinatesMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(subordinatesData)) {
      subordinatesData.forEach(sub => {
        if (sub.bactive === true) {
          map.set(sub.iUser_id, true);
        }
      });
    }
    return map;
  }, [subordinatesData]);

  const leads = useMemo(() => {
    return leadsData
      .filter(item => {
        const isLeadActive = item.bactive === true;
        const isOwnerActive = activeSubordinatesMap.has(item.clead_owner);

        return isLeadActive && isOwnerActive;
      })
      .map((item) => ({
        id: item.ilead_id,
        name: item.clead_name || "No Name",
        status: item.lead_status?.clead_name || "Unknown",
        assignedTo: item.user?.cFull_name || "Unassigned", 
        modifiedBy: item.user_crm_lead_modified_byTouser?.cFull_name || "Unknown",
        time: new Date(item.dmodified_dt).toLocaleString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          day: "2-digit",
          month: "short",
        }),
        avatar: "/images/dashboard/grl.png", 
      }));
  }, [leadsData, activeSubordinatesMap]); 

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase();
    return leads 
      .filter(
        (lead) =>
          lead.name.toLowerCase().includes(term) ||
          lead.assignedTo.toLowerCase().includes(term) ||
          lead.status.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        const aMatches = a.name.toLowerCase().includes(term) || a.assignedTo.toLowerCase().includes(term) || a.status.toLowerCase().includes(term);
        const bMatches = b.name.toLowerCase().includes(term) || b.assignedTo.toLowerCase().includes(term) || b.status.toLowerCase().includes(term);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0; 
      });
  }, [search, leads]); 

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const currentLeads = filteredLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-700">Loading leads...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Leads</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); 
            }}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-gray-700 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentLeads.length > 0 ? (
              currentLeads.map((lead) => (
                // <tr
                //   key={lead.id}
                //   className="hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                // >
                <tr
                    key={lead.id}
                    className="hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                    onClick={() => navigate(`/leaddetailview/${lead.id}`)}
                  >

                  <td className="px-6 py-2 whitespace-nowrap text-gray-900 font-medium">
                    {lead.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <img
                        src={lead.avatar}
                        alt={`${lead.assignedTo} avatar`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-gray-900">{lead.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <img
                        src={lead.avatar}
                        alt={`${lead.modifiedBy} avatar`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {lead.modifiedBy}
                        </span>
                        <span className="text-gray-400 text-xs truncate max-w-[160px]">
                          {lead.time}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500"> 
                  No active leads found for active users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 select-none">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`rounded-full px-5 py-2 font-semibold text-sm transition
              ${
                currentPage === 1
                  ? "text-gray-400 border border-gray-300 cursor-not-allowed"
                  : "text-blue-600 border border-blue-400 hover:bg-blue-50"
              }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`rounded-full px-5 py-2 font-semibold text-sm transition
              ${
                currentPage === totalPages
                  ? "text-gray-400 border border-gray-300 cursor-not-allowed"
                  : "text-blue-600 border border-blue-400 hover:bg-blue-50"
              }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}