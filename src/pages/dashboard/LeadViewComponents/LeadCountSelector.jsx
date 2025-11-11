import React, { useState } from 'react';

const LeadCountSelector = ({ leadsCount, onSelect, selectedCount, onReset }) => {
    const counts = [50, 100, 500, 1000, 2000, 3000];

    const handleSelect = (event) => {
        const value = event.target.value === "all" ? null : parseInt(event.target.value, 10);
        onSelect(value);
    };

    return (
        <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
            <label className="text-sm font-medium text-gray-700" htmlFor="lead-count-select">
                Display Leads:
            </label>
            <select
                id="lead-count-select"
                value={selectedCount || "all"}
                onChange={handleSelect}
                className="px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="all">Show All (Paged)</option>
                {counts.map((count) => (
                    <option key={count} value={count}>
                        {count}
                    </option>
                ))}
            </select>
            <span className="text-sm text-gray-500">(Total: {leadsCount})</span>
        </div>
    );
};

export default LeadCountSelector;
