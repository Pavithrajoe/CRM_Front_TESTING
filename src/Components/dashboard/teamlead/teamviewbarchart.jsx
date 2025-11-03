import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 px-2 py-1 rounded text-sm shadow">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p>{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export default function LeadManagementCard({
  leads, team_members, childSubordinates,loading, error
}) {
  const [showTeam, setShowTeam] = useState(false);
  const [showActiveMembers, setShowActiveMembers] = useState(false);
  const [showInactiveMembers, setShowInactiveMembers] = useState(false);


  const userLeadCountsById = leads.reduce((acc, lead) => {
    if (lead.bactive === true && lead.clead_owner) {
      acc[lead.clead_owner] = (acc[lead.clead_owner] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = team_members
    .filter(
      (member) =>
        member.bactive === true && userLeadCountsById[member.iUser_id] > 0
    )
    .map((member) => ({
      name: member.cFull_name,
      leads: userLeadCountsById[member.iUser_id] || 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  const filteredTeamList = team_members
    .filter((member) => {
      if (showActiveMembers) return member.bactive === true;
      if (showInactiveMembers) return member.bactive === false;
      return true;
    })
    .sort((a, b) => a.cFull_name.localeCompare(b.cFull_name));

  const handleShowAllMembers = () => {
    setShowActiveMembers(false);
    setShowInactiveMembers(false);
  };

  const handleShowActiveMembers = () => {
    setShowActiveMembers(true);
    setShowInactiveMembers(false);
  };

  const handleShowInactiveMembers = () => {
    setShowActiveMembers(false);
    setShowInactiveMembers(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-gray-700">
        Loading data...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-full text-red-600 font-medium">
        {error}
      </div>
    );

  return (
    <div className="relative w-full h-90 max-w-full mx-auto [perspective:1000px]">
      <div
        className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform ${
          showTeam ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* FRONT VIEW */}
        <div className="absolute w-full h-full bg-white rounded-xl p-4 backface-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">
              Active Lead Distribution
            </h2>
            <button
              className="text-sm border px-3 py-1 rounded-md border-gray-300 text-gray-600 hover:bg-gray-100"
              onClick={() => setShowTeam(true)}
            >
              My Team
            </button>
          </div>

          {chartData.length > 0 ? (
            <div className="flex-grow flex items-end">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: "Leads",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="leads"
                    fill="#1f2937"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-center">
              <p className="text-gray-500 text-sm">
                {/* No active lead data available for chart. */}
              </p>
            </div>
          )}
        </div>

        {/* BACK VIEW */}
        <div className="absolute w-full h-full bg-white rounded-xl p-4 backface-hidden [transform:rotateY(180deg)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Team Members</h2>
            <div className="flex gap-2">
              <button
                className={`text-sm border px-3 py-1 rounded-md ${
                  !showActiveMembers && !showInactiveMembers
                    ? "bg-blue-500 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
                onClick={handleShowAllMembers}
              >
                All
              </button>
              <button
                className={`text-sm border px-3 py-1 rounded-md ${
                  showActiveMembers
                    ? "bg-green-500 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
                onClick={handleShowActiveMembers}
              >
                Active
              </button>
              <button
                className={`text-sm border px-3 py-1 rounded-md ${
                  showInactiveMembers
                    ? "bg-red-500 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
                onClick={handleShowInactiveMembers}
              >
                Inactive
              </button>
              <button
                className="text-sm border px-3 py-1 rounded-md border-gray-300 text-gray-600 hover:bg-gray-100"
                onClick={() => setShowTeam(false)}
              >
                Back
              </button>
            </div>
          </div>

          <div className="flex-grow max-h-60 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 pr-1">
            {filteredTeamList.length > 0 ? (
              filteredTeamList.map((member) => {
                const subTeam = childSubordinates.filter(
                  (child) => child.reports_to === member.iUser_id
                );
                return (
                  <div
                    key={member.iUser_id}
                    className="flex flex-col bg-gray-50 rounded-md p-3 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold">
                          {member.cFull_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {member.cFull_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.bactive ? "Active" : "Inactive"} Team Member
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium bg-gray-200 px-2 py-0.5 rounded-full text-gray-700">
                        {userLeadCountsById[member.iUser_id] || 0} Leads
                      </span>
                    </div>

                    {subTeam.length > 0 && (
                      <div className="ml-12 mt-2 space-y-1">
                        {subTeam.map((child) => (
                          <p
                            key={child.iUser_id}
                            className="text-xs text-gray-500"
                          >
                            Manages: {child.cFull_name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-40">
                <p className="text-gray-500 text-sm font-medium">
                  No{" "}
                  {showActiveMembers
                    ? "active"
                    : showInactiveMembers
                    ? "inactive"
                    : ""}{" "}
                  team members found.
                </p>
                <span className="text-xs text-gray-400">
                  Try switching filters or add new members.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
