import React, { useState, useMemo } from "react";

const leads = [
  {
    id: 1,
    name: "Govind Raj",
    status: "Contacted",
    assignedTo: "Dhnush",
    modifiedBy: "Shivakumar",
    time: "01:00 PM on 24th Apr",
    avatar: "/public/images/dashboard/grl.png",
  },
  {
    id: 2,
    name: "Mari Sudhir",
    status: "Contacted",
    assignedTo: "Shivakumar",
    modifiedBy: "Shivakumar",
    time: "01:00 PM on 24th Apr",
    avatar: "/public/images/dashboard/grl.png",
  },
  // ...other leads
];

export default function LeadsTable() {
  const [search, setSearch] = useState("");

  const filteredLeads = useMemo(() => {
    if (!search) return leads;
    const term = search.toLowerCase();
    return leads
      .filter(lead =>
        lead.name.toLowerCase().includes(term) ||
        lead.assignedTo.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        const aName = a.name.toLowerCase().indexOf(term);
        const bName = b.name.toLowerCase().indexOf(term);
        return aName - bName;
      });
  }, [search]);

  return (
    <div className="bg-white rounded-md p-4 w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold">Leads</h2>
        <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto gap-2">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
              <th className="py-2 px-2">S. No</th>
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Assigned To</th>
              <th className="py-2 px-2">Modified by</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 px-2 whitespace-nowrap">{lead.id}</td>
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
    </div>
  );
}
