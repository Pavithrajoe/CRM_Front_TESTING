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
  subSources,
  selectedSubSource,
  setSelectedSubSource,

  industries,
  selectedIndustry,
  setSelectedIndustry,
  subIndustries,
  selectedSubIndustry,
  setSelectedSubIndustry,

  services,
  selectedService,
  setSelectedService,

  subServices,
  selectedSubService,
  setSelectedSubService,

  potentials,
  statuses,
  sources
}) => {
  if (!showModal) return null;

  const labelCls = "text-xs font-semibold text-gray-600";
  const inputCls =
    "w-full h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 py-3 border-b bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <h2 className="text-base font-semibold text-white">
            Advanced Filters
          </h2>
          <p className="text-xs text-blue-100">
            Refine leads using precise conditions
          </p>
        </div>

        {/* BODY */}
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* COLUMN 1 */}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Potential</label>
                <select
                  value={selectedPotential}
                  onChange={(e) => setSelectedPotential(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Potentials</option>
                  {potentials?.data?.map((p) => (
                    <option key={p.ileadpoten_id} value={p.clead_name}>
                      {p.clead_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Statuses</option>
                  {statuses?.map((s) => (
                    <option key={s.ilead_status_id} value={s.clead_name}>
                      {s.clead_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Source</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Sources</option>
                  {sources?.data?.map((s) => (
                    <option key={s.source_id} value={s.source_id}>
                      {s.source_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Sub Source</label>
                <select
                  value={selectedSubSource}
                  onChange={(e) => setSelectedSubSource(e.target.value)}
                  disabled={!selectedSource}
                  className={inputCls}
                >
                  <option value="">All Sub Sources</option>
                  {subSources?.map((ss) => (
                    <option key={ss.isub_src_id} value={ss.isub_src_id}>
                      {ss.ssub_src_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Industries</option>
                  {industries?.map((i) => (
                    <option key={i.iindustry_id} value={i.iindustry_id}>
                      {i.cindustry_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Sub Industry</label>
                <select
                  value={selectedSubIndustry}
                  onChange={(e) => setSelectedSubIndustry(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Sub Industries</option>
                  {subIndustries?.map((si) => (
                    <option key={si.isubindustry} value={si.isubindustry}>
                      {si.subindustry_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* COLUMN 3 */}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Services</option>
                  {services?.map((s) => (
                    <option key={s.iservice_id} value={s.iservice_id}>
                      {s.cservice_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Sub Service</label>
                <select
                  value={selectedSubService}
                  onChange={(e) => setSelectedSubService(e.target.value)}
                  disabled={!selectedService}
                  className={inputCls}
                >
                  <option value="">All Sub Services</option>
                  {subServices
                    ?.filter(
                      (ss) =>
                        Number(ss.iservice_parent) ===
                        Number(selectedService)
                    )
                    .map((ss) => (
                      <option
                        key={ss.isubservice_id}
                        value={ss.isubservice_id}
                      >
                        {ss.subservice_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
          <button onClick={onReset} className="px-4 py-1.5 text-sm rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition" > Reset </button>
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-full bg-gray-200 hover:bg-gray-300 transition" >
            Cancel
          </button>
          <button onClick={onApply} className="px-5 py-1.5 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow transition" >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadFilterModal;





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
//     sources,
//     industries,
//     services,
//     selectedIndustry,
//     setSelectedIndustry,
//     selectedService,
//     setSelectedService
// }) => {
//     if (!showModal) {
//         return null;
//     }
//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" onClick={onClose}>
//             <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
//                 <h2 className="text-lg font-medium text-gray-800 mb-4">Filter by Data</h2>
                
//                 {/* 3-column grid layout */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
//                     {/* Column 1: Date & Basic Info */}
//                     <div className="space-y-4">
//                         <label className="block text-sm text-gray-700">
//                             From Date
//                             <input
//                                 type="date"
//                                 value={fromDate}
//                                 onChange={(e) => setFromDate(e.target.value)}
//                                 className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
//                             />
//                         </label>
//                         <label className="block text-sm text-gray-700">
//                             To Date
//                             <input
//                                 type="date"
//                                 value={toDate}
//                                 onChange={(e) => setToDate(e.target.value)}
//                                 className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
//                             />
//                         </label>
//                     </div>

//                     {/* Column 2: Lead Properties */}
//                     <div className="space-y-4">
//                        <label className="block text-sm text-gray-700"> Potential
//                         <select
//                             value={selectedPotential}
//                             onChange={(e) => setSelectedPotential(e.target.value)}
//                             className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
//                         >
//                             <option value="">All Potentials</option>
//                         {Array.isArray(potentials?.data) && potentials.data.map(p => (
//                             <option key={p.ileadpoten_id} value={p.clead_name}>
//                                 {p.clead_name}
//                             </option>
//                             ))}
//                         </select>
//                         </label>

//                         <label className="block text-sm text-gray-700">
//                             Status
//                             <select
//                                 value={selectedStatus}
//                                 onChange={(e) => setSelectedStatus(e.target.value)}
//                                 className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
//                             >
//                                 <option value="">All Statuses</option>
//                                 {Array.isArray(statuses) && statuses.map(s => (
//                                     <option key={s.ilead_status_id} value={s.clead_name}>
//                                         {s.clead_name}
//                                     </option>
//                                 ))}
//                             </select>
//                         </label>
//                     </div>

//                     {/* Column 3: Additional Filters */}
//                     <div className="space-y-4">
//                         <label className="block text-sm text-gray-700">
//                             Source
//                             <select
//                                 value={selectedSource}
//                                 onChange={(e) => setSelectedSource(e.target.value)}
//                                 className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
//                             >
//                                 <option value="">All Sources</option>
//                                 {Array.isArray(sources?.data) && sources.data.map(s => (
//                                     <option key={s.source_id} value={s.source_id}>
//                                         {s.source_name}
//                                     </option>
//                                 ))}
//                             </select>
//                         </label>
//                         <label className="block text-sm text-gray-700">
//                             Industry
//                             <select
//                                 value={selectedIndustry}
//                                 onChange={(e) => setSelectedIndustry(e.target.value)}
//                                 className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
//                             >
//                                 <option value="">All Industries</option>
//                                 {Array.isArray (industries?.response?.industry ) && industries.response.industry.map(i => (
//                                     <option key={i.iindustry_id} value={i.iindustry_id}>
//                                         {i.cindustry_name}
//                                     </option>
//                                 ))}
//                             </select>
//                         </label>
//                         <label className="block text-sm text-gray-700">
//                             Service
//                             <select
//                                 value={selectedService}
//                                 onChange={(e) => setSelectedService(e.target.value)}
//                                 className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 text-sm"
//                             >
//                                 <option value="">All Services</option>
//                                 { Array.isArray (services?.data) && services.data.map(s => (
//                                     <option key={s.serviceId} value={s.serviceId}>
//                                         {s.serviceName}
//                                     </option>
//                                 ))}
//                             </select>
//                         </label>
//                     </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex justify-end gap-2 pt-4 border-t mt-4">
//                     <button
//                         onClick={onReset}
//                         className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 text-sm"
//                     >
//                         Reset
//                     </button>
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
//                     >
//                         Cancel
//                     </button>
//                     <button onClick={onApply} className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm">
//                         Apply
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default LeadFilterModal;

