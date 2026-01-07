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
    industries,
    services,
    selectedIndustry,
    setSelectedIndustry,
    selectedService,
    setSelectedService
}) => {
    if (!showModal) {
        return null;
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-800 mb-4">Filter by Data</h2>
                
                {/* 3-column grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Column 1: Date & Basic Info */}
                    <div className="space-y-4">
                        <label className="block text-sm text-gray-700">
                            From Date
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
                            />
                        </label>
                        <label className="block text-sm text-gray-700">
                            To Date
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
                            />
                        </label>
                    </div>

                    {/* Column 2: Lead Properties */}
                    <div className="space-y-4">
                       <label className="block text-sm text-gray-700"> Potential
                        <select
                            value={selectedPotential}
                            onChange={(e) => setSelectedPotential(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
                        >
                            <option value="">All Potentials</option>
                        {Array.isArray(potentials?.data) && potentials.data.map(p => (
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
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
                            >
                                <option value="">All Statuses</option>
                                {Array.isArray(statuses) && statuses.map(s => (
                                    <option key={s.ilead_status_id} value={s.clead_name}>
                                        {s.clead_name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Column 3: Additional Filters */}
                    <div className="space-y-4">
                        <label className="block text-sm text-gray-700">
                            Source
                            <select
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
                            >
                                <option value="">All Sources</option>
                                {Array.isArray(sources?.data) && sources.data.map(s => (
                                    <option key={s.source_id} value={s.source_id}>
                                        {s.source_name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm text-gray-700">
                            Industry
                            <select
                                value={selectedIndustry}
                                onChange={(e) => setSelectedIndustry(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
                            >
                                <option value="">All Industries</option>
                                {Array.isArray (industries?.response?.industry ) && industries.response.industry.map(i => (
                                    <option key={i.iindustry_id} value={i.iindustry_id}>
                                        {i.cindustry_name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm text-gray-700">
                            Service
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
                            >
                                <option value="">All Services</option>
                                { Array.isArray (services?.data) && services.data.map(s => (
                                    <option key={s.serviceId} value={s.serviceId}>
                                        {s.serviceName}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <button
                        onClick={onReset}
                        className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 text-sm"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                    >
                        Cancel
                    </button>
                    <button onClick={onApply} className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm">
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadFilterModal;

