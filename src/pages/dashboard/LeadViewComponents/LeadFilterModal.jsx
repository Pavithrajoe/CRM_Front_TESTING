import React from 'react';

const LeadFilterModal = ({
    showModal,
    onClose,
    onApply,
    onReset,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    selectedPotential,
    setSelectedPotential,
    selectedStatus,
    setSelectedStatus,
    selectedSource,
    setSelectedSource,
    potentials,
    statuses,
    sources,
    // New props for industry and service
    industries,
    selectedIndustry,
    setSelectedIndustry,
    services,
    selectedService,
    setSelectedService
}) => {
    if (!showModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-800">Filter by Data</h2>
                <label className="block text-sm text-gray-700">
                    From
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                    />
                </label>
                <label className="block text-sm text-gray-700">
                    To
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                    />
                </label>
                <label className="block text-sm text-gray-700">
                    Potential
                    <select
                        value={selectedPotential}
                        onChange={(e) => setSelectedPotential(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Potentials</option>
                        {potentials.map(p => (
                            <option key={p.ileadpoten_id} value={p.clead_name}>
                                {p.clead_name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block text-sm text-gray-700">
                    Status
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Statuses</option>
                        {statuses.map(s => (
                            <option key={s.ilead_status_id} value={s.clead_name}>
                                {s.clead_name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block text-sm text-gray-700">
                    Source
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Sources</option>
                        {sources.map(s => (
                            <option key={s.source_id} value={s.source_id}>
                                {s.source_name}
                            </option>
                        ))}
                    </select>
                </label>

                {/* New filter for Industry */}
                <label className="block text-sm text-gray-700">
                    Industry
                    <select
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Industries</option>
                        {industries.map(i => (
                            <option key={i.iindustry_id} value={i.iindustry_id}>
                                {i.cindustry_name}
                            </option>
                        ))}
                    </select>
                </label>

                {/* New filter for Service */}
                <label className="block text-sm text-gray-700">
                    Service
                    <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Services</option>
                        {services.map(s => (
                            <option key={s.iservice_id} value={s.iservice_id}>
                                {s.cservice_name}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onReset}
                        className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button onClick={onApply} className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadFilterModal;

// import React from 'react';

// const LeadFilterModal = ({
//     showModal,
//     onClose,
//     onApply,
//     onReset,
//     fromDate,
//     setFromDate,
//     toDate,
//     setToDate,
//     selectedPotential,
//     setSelectedPotential,
//     selectedStatus,
//     setSelectedStatus,
//     selectedSource,
//     setSelectedSource,
//     potentials,
//     statuses,
//     sources
// }) => {
//     if (!showModal) {
//         return null;
//     }

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" onClick={onClose}>
//             <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
//                 <h2 className="text-lg font-medium text-gray-800">Filter by Data</h2>
//                 <label className="block text-sm text-gray-700">
//                     From
//                     <input
//                         type="date"
//                         value={fromDate}
//                         onChange={(e) => setFromDate(e.target.value)}
//                         className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                     />
//                 </label>
//                 <label className="block text-sm text-gray-700">
//                     To
//                     <input
//                         type="date"
//                         value={toDate}
//                         onChange={(e) => setToDate(e.target.value)}
//                         className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                     />
//                 </label>
//                 <label className="block text-sm text-gray-700">
//                     Potential
//                     <select
//                         value={selectedPotential}
//                         onChange={(e) => setSelectedPotential(e.target.value)}
//                         className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                     >
//                         <option value="">All Potentials</option>
//                         {potentials.map(p => (
//                             <option key={p.ileadpoten_id} value={p.clead_name}>
//                                 {p.clead_name}
//                             </option>
//                         ))}
//                     </select>
//                 </label>
//                 <label className="block text-sm text-gray-700">
//                     Status
//                     <select
//                         value={selectedStatus}
//                         onChange={(e) => setSelectedStatus(e.target.value)}
//                         className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                     >
//                         <option value="">All Statuses</option>
//                         {statuses.map(s => (
//                             <option key={s.ilead_status_id} value={s.clead_name}>
//                                 {s.clead_name}
//                             </option>
//                         ))}
//                     </select>
//                 </label>
//                 <label className="block text-sm text-gray-700">
//                     Source
//                     <select
//                         value={selectedSource}
//                         onChange={(e) => setSelectedSource(e.target.value)}
//                         className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                     >
//                         <option value="">All Sources</option>
//                         {sources.map(s => (
//                             <option key={s.source_id} value={s.source_id}> 
//                                 {s.source_name}
//                             </option>
//                         ))}
//                     </select>
//                 </label>
//                 <div className="flex justify-end gap-2">
//                     <button
//                         onClick={onReset}
//                         className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
//                     >
//                         Reset
//                     </button>
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
//                     >
//                         Cancel
//                     </button>
//                     <button onClick={onApply} className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
//                         Apply
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default LeadFilterModal;