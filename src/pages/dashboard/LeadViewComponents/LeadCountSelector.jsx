import React, { useState } from 'react';

const LeadCountSelector = ({ leadsCount, onSelect }) => {
    const counts = [100, 500, 1000, 2000, 3000]; // Available counts
    const [selectedCount, setSelectedCount] = useState(""); // Start with empty value for placeholder

    const handleSelect = (event) => {
        const value = parseInt(event.target.value, 10);
        setSelectedCount(value);
        onSelect(value);
    };

    return (
        <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
            <label
                className="text-sm font-medium text-gray-700"
                htmlFor="lead-count-select"
            >
                Display Leads:
            </label>
            <select
                id="lead-count-select"
                value={selectedCount}
                onChange={handleSelect}
                className="px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="" disabled>
                    Select Count
                </option>
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


// import React from 'react';

// const LeadCountSelector = ({ leadsCount, onSelect, selectedCount }) => {
//     const counts = [100, 500, 1000];

//     const handleSelect = (count) => {
//         onSelect(count);
//     };

//     return (
//         <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
//             <span className="text-sm font-medium text-gray-700">Display Leads:</span>
//             {counts.map(count => (
//                 <button
//                     key={count}
//                     onClick={() => handleSelect(count)}
//                     className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
//                         selectedCount === count
//                             ? 'bg-blue-600 text-white'
//                             : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-200'
//                     }`}
//                 >
//                     {count}
//                 </button>
//             ))}
//             <span className="text-sm text-gray-500">
//                 (Total: {leadsCount})
//             </span>
//         </div>
//     );
// };

// export default LeadCountSelector;