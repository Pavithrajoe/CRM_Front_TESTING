import React from "react";
import { FaSortAlphaDown, FaSortAlphaUp, FaThLarge, FaListUl } from "react-icons/fa";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const LeadToolbar = ({
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  sortAsc,
  setSortAsc,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="space-y-6 mt-[-60px] p-4">
      {/* Search Field */}
      <div className="flex justify-between items-center flex-wrap mb-4">
        <div className="flex-1 min-w-[150px] relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            className="border border-gray-300 rounded-full pl-12 pr-7 py-3 w-full md:w-96 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex justify-between items-center flex-wrap mb-2 mt-[150px]">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          {["My Leads", "All Leads", "Converted Leads"].map((tab) => (
            <span
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer text-base font-medium ${
                activeTab === tab ? "text-blue-600 underline" : "text-black"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Sort & View Mode Buttons */}
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="border px-4 py-2 rounded-md flex items-center text-sm gap-2"
          >
            {sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
            Sort By
          </button>

          <button
            onClick={() => setViewMode("card")}
            className={`relative border p-3 rounded-md hover:bg-gray-100 group ${
              viewMode === "card" ? "bg-black text-white" : ""
            }`}
          >
            <FaThLarge />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Card View
            </span>
          </button>

          <button
            onClick={() => setViewMode("list")}
            className={`relative border p-3 rounded-md hover:bg-gray-100 group ${
              viewMode === "list" ? "bg-black text-white" : ""
            }`}
          >
            <FaListUl />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              List View
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadToolbar;
