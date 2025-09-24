import React from 'react';

const LeadCountSelector = ({ leadsCount, onSelect, selectedCount }) => {
    const counts = [100, 500, 1000];

    const handleSelect = (count) => {
        onSelect(count);
    };

    return (
        <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Display Leads:</span>
            {counts.map(count => (
                <button
                    key={count}
                    onClick={() => handleSelect(count)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                        selectedCount === count
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-200'
                    }`}
                >
                    {count}
                </button>
            ))}
            <span className="text-sm text-gray-500">
                (Total: {leadsCount})
            </span>
        </div>
    );
};

export default LeadCountSelector;