import React, { useState, useMemo } from "react";

export default function LeadsTable({ data }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const leadsPerPage = 8; // Define the number of leads per page

  const leads = useMemo(
    () =>
      data?.map((item) => ({
        // id: item.ilead_id,
        name: item.clead_name || "No Name",
        status: item.lead_status?.clead_name || "Unknown",
        assignedTo: item.clead_owner_name || "Unassigned",
        modifiedBy: item.modified_by || "Unknown",
        time: new Date(item.dmodified_dt).toLocaleString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          day: "2-digit",
          month: "short",
        }),
         avatar: "/images/dashboard/grl.png",
      })) || [],
    [data]
  );

  console.log("Leads Data:", leads); // Log the leads data to check its value

  const filteredLeads = useMemo(() => {
    if (!leads.length) return [];
    const term = search.toLowerCase();
    return leads
      .filter((lead) =>
        lead.name.toLowerCase().includes(term) ||
        lead.assignedTo.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        const aName = a.name.toLowerCase().indexOf(term);
        const bName = b.name.toLowerCase().indexOf(term);
        return aName - bName;
      });
  }, [search, leads]);

  const totalPages = useMemo(() => Math.ceil(filteredLeads.length / leadsPerPage), [filteredLeads, leadsPerPage]);
  const currentLeads = useMemo(() => {
    const startIndex = (page - 1) * leadsPerPage;
    const endIndex = startIndex + leadsPerPage;
    return filteredLeads.slice(startIndex, endIndex);
  }, [page, filteredLeads, leadsPerPage]);

  return (
    <div className="bg-white rounded-md p-4 w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold">Leads</h2>
        <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto gap-2">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-800 rounded-full px-3 py-1 text-sm focus:outline-none flex-1 sm:flex-none"
          />
          <a href="#" className="text-sm text-black hover:underline">
            View All
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-auto">
          <thead>
            <tr className="text-left text-black border-b">
              {/* <th className="py-2 px-2">ID</th> */}
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Assigned To</th>
              <th className="py-2 px-2">Modified by</th>
            </tr>
          </thead>
          <tbody>
            {currentLeads.map((lead) => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                {/* <td className="py-2 px-2 whitespace-nowrap">{lead.id}</td> */}
                <td className="py-2 px-2 whitespace-nowrap">{lead.name}</td>
                <td className="py-2 px-2 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      lead.status.toLowerCase() === "hot"
                        ? "bg-red-100 text-red-700"
                        : lead.status.toLowerCase() === "warm"
                        ? "bg-yellow-100 text-yellow-700"
                        : lead.status.toLowerCase() === "cold"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700" // Default status color
                    }`}
                  >
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
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredLeads.length > leadsPerPage && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 mr-2 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Previous
          </button>
          <span>
            {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 ml-2 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Next
          </button>
        </div>
      )}
      {leads.length > leadsPerPage && filteredLeads.length <= leadsPerPage && (
        <div className="overflow-x-auto max-h-60 mt-4">
          <table className="min-w-full text-sm table-auto">
            <thead>
              <tr className="text-left text-black border-b">
                {/* <th className="py-2 px-2">ID</th> */}
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Assigned To</th>
                <th className="py-2 px-2">Modified by</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                  {/* <td className="py-2 px-2 whitespace-nowrap">{lead.id}</td> */}
                  <td className="py-2 px-2 whitespace-nowrap">{lead.name}</td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        lead.status.toLowerCase() === "hot"
                          ? "bg-red-100 text-red-700"
                          : lead.status.toLowerCase() === "warm"
                          ? "bg-yellow-100 text-yellow-700"
                          : lead.status.toLowerCase() === "cold"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700" // Default status color
                      }`}
                    >
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
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}