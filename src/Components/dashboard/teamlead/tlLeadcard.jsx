import React, { useState, useMemo } from "react";

export default function LeadsTable({ data }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;

  const leads = data?.map((item) => ({
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
  })) || [];

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase();
    return leads
      .filter((lead) =>
        lead.name.toLowerCase().includes(term) ||
        lead.assignedTo.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        const aIndex = a.name.toLowerCase().indexOf(term);
        const bIndex = b.name.toLowerCase().indexOf(term);
        return aIndex - bIndex;
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

  return (
    <div className="bg-white rounded-md p-4 w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold">Leads</h2>
        <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto gap-2">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="border border-gray-800 rounded-full px-3 py-1 text-sm focus:outline-none flex-1 sm:flex-none"
          />
          <a href="/leadcardview" className="text-sm text-black hover:underline">
            View All
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-auto">
          <thead>
            <tr className="text-left text-black border-b">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Assigned To</th>
              <th className="py-2 px-2">Modified by</th>
            </tr>
          </thead>
          <tbody>
            {currentLeads.length > 0 ? (
              currentLeads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 px-2 whitespace-nowrap">{lead.name}</td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <img
                        src={lead.avatar}
                        alt={`${lead.assignedTo} avatar`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="truncate max-w-[80px] block">{lead.assignedTo}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <img
                        src={lead.avatar}
                        alt={`${lead.modifiedBy} avatar`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="truncate max-w-[100px] block">{lead.modifiedBy}</span>
                        <span className="text-gray-400 text-xs truncate max-w-[120px] block">
                          {lead.time}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 border rounded ${
              currentPage === 1 ? "text-gray-400 border-gray-300" : "text-black border-black"
            }`}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded ${
              currentPage === totalPages
                ? "text-gray-400 border-gray-300"
                : "text-black border-black"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
