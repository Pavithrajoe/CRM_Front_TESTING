import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ENDPOINTS } from "../../../api/constraints";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

const ITEMS_PER_PAGE = 8;
export default function DealsTable({data =[]}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  const [sortOrder, setSortOrder] = useState(null); // for  sort order

 


  // This code don't have any use case in this file still I keep it here for any future references !!
  
  // const fetchDeals = useCallback(async () => {
  //   if (!currentUserId || !currentToken) {
  //     setLoading(false);
  //     return;
  //   }

  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const response = await fetch(ENDPOINTS.GET_DEALS, {
  //       method: "GET",
  //       headers: {
  //         'Authorization': `Bearer ${currentToken}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
  //       throw new Error(`HTTP error! status: ${response.status}, Details: ${errorData.message || response.statusText}`);
  //     }
  //     const result = await response.json();

  //     setDealsData(result || []);

  //   }
  //   catch (err) {
  //     console.error("Error fetching deals:", err);
  //     setError(`Failed to fetch deals: ${err.message}. Please try again later.`);
  //     setDealsData([]);
  //   }
  //   finally {
  //     setLoading(false);
  //   }
  // }, [currentUserId, currentToken]);


  const deals = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn("dealsData is not an array:", data);
      return [];
    }

    if (!data) {
      return <div>Loading ...</div>;
    }
    return (
      // dealsData
      //   .filter(item =>
      //     item.bactive === true &&
      //     item.bisConverted === true &&
      //     (item.modified_by === currentUserId || item.clead_owner_id === currentUserId)
      //   )

      data
        ?.map((item) => ({
          id: item.ilead_id,
          name: item.clead_name || "No Name",
          status: item.lead_status?.clead_name || "Unknown",
          assignedTo: item.clead_owner_name || "Unassigned",
          modifiedBy:
            item.user_crm_lead_modified_byTouser?.cFull_name ||
            String(item.modified_by) ||
            "Unknown",
          time: (() => {
            const dateObj = new Date(item.dmodified_dt);
            const datePart = dateObj
              .toLocaleDateString("en-GB")
              .replace(/\//g, "/");
            const timePart = dateObj
              .toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(/am|pm/, (match) => match.toUpperCase());
            return `${datePart}\n${timePart}`;
          })(),
          modifiedDate: new Date(item.dmodified_dt),
          avatar: "./images/dashboard/grl.png",
        }))
        .sort((a, b) => b.modifiedDate.getTime() - a.modifiedDate.getTime()) ||
      []
    );
  }, [data]);

  const previous = '<';
  const next = '>';

  const filteredDeals = useMemo(() => {
    const term = search.toLowerCase();
    let filtered = deals.filter(
      (deal) =>
        deal.name.toLowerCase().includes(term) ||
        deal.assignedTo.toLowerCase().includes(term) ||
        deal.status.toLowerCase().includes(term)
    );

    // sorting logic
    if (sortOrder === "asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }
    return filtered;
  }, [search, deals, sortOrder]);

  const totalPages = Math.ceil(filteredDeals.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedDeals = filteredDeals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSortToggle = () => { // sort toggle
    if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortOrder(null);
    } else {
      setSortOrder("asc");
    }
  };

  if (error) {
    return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-black"> Won List</h2>
        <input
          type="search"
          placeholder="Search here"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-64 px-4 py-2 rounded-full border border-gray-300 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          aria-label="Search deals"
          spellCheck="false"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table
          className="min-w-full divide-y divide-gray-200 text-sm"
          style={{ tableLayout: "fixed" }}
        >
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[33.33%] cursor-pointer select-none"
                onClick={handleSortToggle} 
              >
                <div className="flex items-center gap-2">
                  Name
                  {sortOrder === "asc" ? ( //  sorting icons
                    <FaSortUp className="text-blue-500" />
                  ) : sortOrder === "desc" ? (
                    <FaSortDown className="text-blue-500" />
                  ) : (
                    <FaSort className="text-gray-400" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[33.33%]">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[33.33%]">
                Modified By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedDeals.length > 0 ? (
              paginatedDeals.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => navigate(`/leaddetailview/${deal.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td
                    className="px-6 py-4 text-gray-900 font-medium truncate"
                    title={deal.name}
                  >
                    {deal.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium truncate">
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={deal.avatar}
                        alt={`${deal.modifiedBy || "User"} avatar`}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-black font-medium max-w-[200px]">
                          {deal.modifiedBy}
                        </span>
                        <span className="text-gray-400 text-xs max-w-[220px] truncate">
                          {deal.time}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-gray-500"
                >
                  {data.length === 0
                    ? "  No active and converted Leads found for you."
                    : " No active and converted Leads found for you."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6 select-none">
        <button
          className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
            currentPage === 1
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-blue-600 border-gray-300 hover:bg-blue-50"
          }`}
          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {previous}
        </button>

        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
            currentPage === totalPages || totalPages === 0
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-blue-600 border-gray-300 hover:bg-blue-50"
          }`}
          onClick={() =>
            currentPage < totalPages && setCurrentPage(currentPage + 1)
          }
          disabled={currentPage === totalPages || totalPages === 0}
        >
          {next}
        </button>
      </div>
    </div>
  );
}