import React from "react";

const leads = [
  {
    id: 1,
    name: "Govind raj",
    status: "Contacted",
    assignedTo: "Shivakumar",
    modifiedBy: "Shivakumar",
    time: "01:00 PM on 24th Apr",
    avatar: "/avatar.png", // Replace with your avatar image path
  },
  {
    id: 2,
    name: "Govind raj",
    status: "Contacted",
    assignedTo: "Shivakumar",
    modifiedBy: "Shivakumar",
    time: "01:00 PM on 24th Apr",
    avatar: "/avatar.png",
  },
  {
    id: 3,
    name: "Govind raj",
    status: "Contacted",
    assignedTo: "Shivakumar",
    modifiedBy: "Shivakumar",
    time: "01:00 PM on 24th Apr",
    avatar: "/avatar.png",
  },
];

export default function LeadsTable() {
  return (
    <div className="bg-white shadow-md rounded-md p-4 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Leads</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search"
            className="border border-gray-300 rounded-full px-3 py-1 text-sm focus:outline-none"
          />
          <a href="#" className="text-sm text-blue-600 hover:underline">
            View All
          </a>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">S. No</th>
            <th>Name</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Modified by</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b last:border-0">
              <td className="py-2">{lead.id}</td>
              <td>{lead.name}</td>
              <td>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  {lead.status}
                </span>
              </td>
              <td className="flex items-center gap-2 py-2">
                <img src={lead.avatar} alt="" className="w-6 h-6 rounded-full" />
                {lead.assignedTo}
              </td>
              <td className="flex items-center gap-2 py-2">
                <img src={lead.avatar} alt="" className="w-6 h-6 rounded-full" />
                <div>
                  <div>{lead.modifiedBy}</div>
                  <div className="text-gray-400 text-xs">{lead.time}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
