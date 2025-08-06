// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; 
// import { RotateCw, LayoutGrid, List, Filter } from 'lucide-react';
// import { FaGlobe, FaEnvelope, FaPhone } from 'react-icons/fa';
// import Loader from '../../components/Loader';
// import ProfileHeader from "../../Components/common/ProfileHeader";

// const getStatusColor = (status) => {
//     return status === 'won' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
// };

// function WonList(props) {
//     const {
//         loading,
//         error,
//         websiteActive,
//         roleID,
//         fetchDeals,
//         displayedData,
//         totalPages,
//         currentPage,
//         setCurrentPage,
//         handleSearchChange,
//         searchTerm,
//         getSortIndicator,
//         handleSort,
//         formatDate,
//         handleResetFilters,
//         handleFilterApply,
//         handleImportSubmit,
//         importLoading,
//         importError,
//         importSuccess,
//         setImportSuccess,
//         setImportError,
//         setShowImportModal,
//         showImportModal,
//         setSelectedFile
//     } = props;

//     // State is simplified to only manage view mode and modal visibility
//     const [viewMode, setViewMode] = useState('grid');
//     const [showFilterModal, setShowFilterModal] = useState(false);
//     const [fromDate, setFromDate] = useState('');
//     const [toDate, setToDate] = useState('');

//     const navigate = useNavigate();

//     // Placeholder for a navigation function
//     const goToDetail = (id) => {
//         navigate(`/deal-detail/${id}`);
//     };

//     useEffect(() => {
//         fetchDeals();
//     }, [fetchDeals]);

//     // Loader and error state handling
//     if (loading) {
//         return <Loader />;
//     }

//     if (error) {
//         return <div className="text-center py-8 text-red-600 font-medium">{error}</div>;
//     }

//     if (!displayedData || displayedData.length === 0) {
//         return (
//             <div className="max-w-full mx-auto p-4 bg-white rounded-2xl shadow-md space-y-6 min-h-screen">
//                 <ProfileHeader />
//                 <div className="text-center text-gray-500 text-sm sm:text-base py-8">
//                     No deals found.
//                 </div>
//             </div>
//         );
//     }

//     // If we have data, render the full component
//     return (
//         <div className="max-w-full mx-auto p-4 bg-white rounded-2xl shadow-md space-y-6 min-h-screen">
//             <ProfileHeader />

//             <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
//                 <input
//                     type="text"
//                     value={searchTerm}
//                     onChange={handleSearchChange}
//                     placeholder="Search deals..."
//                     className="flex-grow min-w-[200px] px-4 py-2 border border-gray-300 bg-gray-50 rounded-full shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//                 />
//                 <div className="flex gap-2 flex-wrap">
//                     <button
//                         onClick={fetchDeals}
//                         title="Refresh"
//                         className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
//                     >
//                         <RotateCw size={18} />
//                     </button>
//                     <button
//                         onClick={() => setViewMode('grid')}
//                         className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
//                     >
//                         <LayoutGrid size={18} />
//                     </button>
//                     <button
//                         onClick={() => setViewMode('list')}
//                         className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
//                     >
//                         <List size={18} />
//                     </button>
//                     <button
//                         onClick={() => setShowFilterModal(true)}
//                         className={`p-2 rounded-full ${
//                             showFilterModal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
//                         }`}
//                     >
//                         <Filter size={18} />
//                     </button>
//                 </div>
//             </div>

//             <div className="flex flex-wrap gap-2 mt-4 justify-between items-center">
//                 <div className="flex flex-wrap gap-2">
//                     <button
//                         className="px-4 py-2 rounded-full text-sm font-medium transition bg-blue-600 text-white"
//                     >
//                         Won Deals
//                     </button>
//                 </div>

//                 {roleID && (
//                     <button
//                         onClick={() => setShowImportModal(true)}
//                         className='bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition whitespace-nowrap'
//                     >
//                         Import Leads
//                     </button>
//                 )}
//             </div>

//             {showFilterModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
//                         <h2 className="text-lg font-medium text-gray-800">Filter by Date</h2>
//                         <label className="block text-sm text-gray-700">
//                             From
//                             <input
//                                 type="date"
//                                 value={fromDate}
//                                 onChange={(e) => setFromDate(e.target.value)}
//                                 className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                             />
//                         </label>
//                         <label className="block text-sm text-gray-700">
//                             To
//                             <input
//                                 type="date"
//                                 value={toDate}
//                                 onChange={(e) => setToDate(e.target.value)}
//                                 className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400"
//                             />
//                         </label>
//                         <div className="flex justify-end gap-2">
//                             <button
//                                 onClick={handleResetFilters}
//                                 className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
//                             >
//                                 Reset
//                             </button>
//                             <button
//                                 onClick={() => setShowFilterModal(false)}
//                                 className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
//                             >
//                                 Cancel
//                             </button>
//                             <button onClick={handleFilterApply} className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
//                                 Apply
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {showImportModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
//                         <h2 className="text-lg font-medium text-gray-800">Import Leads</h2>

//                         <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
//                             <p className="font-medium">Import Instructions:</p>
//                             <ul className="list-disc pl-5 space-y-1 mt-1">
//                                 <li>Use the template below to ensure proper formatting</li>
//                                 <li>Required fields: Name, Email or Phone</li>
//                                 <li>Supported file types: .xlsx, .xls, .csv</li>
//                                 <li>Max file size: 5MB</li>
//                             </ul>
//                         </div>

//                         <div className="flex justify-center mb-4">
//                             <a
//                                 href="../../../public/files/import_leads.xls"
//                                 download="Leads_Import_Template.xls"
//                                 className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
//                             >
//                                 <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
//                                 </svg>
//                                 Download Import Template
//                             </a>
//                         </div>

//                         {importError && (
//                             <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
//                                 <div className="font-medium mb-1">Import Error:</div>
//                                 <div>{importError}</div>
//                             </div>
//                         )}

//                         {importSuccess && (
//                             <div className="text-green-600 text-sm p-2 bg-green-50 rounded-md">
//                                 Leads imported successfully!
//                             </div>
//                         )}

//                         <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
//                             <input
//                                 type="file"
//                                 id="file-upload"
//                                 accept=".xlsx,.xls,.csv"
//                                 onChange={(e) => setSelectedFile(e.target.files[0])}
//                                 className="hidden"
//                             />
//                             <label
//                                 htmlFor="file-upload"
//                                 className="cursor-pointer flex flex-col items-center justify-center"
//                             >
//                                 <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
//                                 </svg>
//                                 <span className="text-sm text-gray-600">
//                                     {selectedFile ? selectedFile.name : "Click to select Excel file"}
//                                 </span>
//                             </label>
//                         </div>

//                         <div className="flex justify-end gap-2 pt-4">
//                             <button
//                                 onClick={() => {
//                                     setShowImportModal(false);
//                                     setSelectedFile(null);
//                                     setImportError(null);
//                                     setImportSuccess(false);
//                                 }}
//                                 className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={handleImportSubmit}
//                                 disabled={!selectedFile || importLoading}
//                                 className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                                 {importLoading ? (
//                                     <span className="flex items-center">
//                                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                         </svg>
//                                         Importing...
//                                     </span>
//                                 ) : "Import"}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
            
//             <>
//                 {viewMode === 'list' && (
//                     <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-200">
//                         <div className="min-w-[600px] grid gap-4 px-4 py-3 bg-gray-50 text-gray-800 text-sm font-medium grid-cols-6">
//                             <div className="cursor-pointer flex items-center" onClick={() => handleSort('cdeal_name')}>
//                                 Name {getSortIndicator('cdeal_name')}
//                             </div>
//                             <div className="cursor-pointer flex items-center" onClick={() => handleSort('c_organization')}>
//                                 Org {getSortIndicator('c_organization')}
//                             </div>
//                             <div className="min-w-[120px] cursor-pointer flex items-center" onClick={() => handleSort('c_email')}>
//                                 Email {getSortIndicator('c_email')}
//                             </div>
//                             <div className="cursor-pointer flex items-center" onClick={() => handleSort('c_phone')}>
//                                 Phone {getSortIndicator('c_phone')}
//                             </div>
//                             <div className="cursor-pointer flex items-center" onClick={() => handleSort('d_modified_date')}>
//                                 Modified {getSortIndicator('d_modified_date')}
//                             </div>
//                             <div className="cursor-pointer flex items-center" onClick={() => handleSort('status')}>
//                                 Status {getSortIndicator('status')}
//                             </div>
//                         </div>
//                         {displayedData.map((item) => {
//                             const statusText = 'Won';
//                             const statusBgColor = getStatusColor('won');

//                             return (
//                                 <div
//                                     key={item.i_deal_id}
//                                     onClick={() => goToDetail(item.i_deal_id)}
//                                     className="min-w-[600px] grid gap-4 px-4 py-3 border-t hover:bg-gray-100 cursor-pointer text-sm text-gray-700 grid-cols-6"
//                                 >
//                                     <div>{item.cdeal_name || '-'}</div>
//                                     <div>{item.c_organization || '-'}</div>
//                                     <div className="relative group overflow-visible">
//                                         <span className="block truncate">
//                                             {item.c_email || '-'}
//                                         </span>
//                                         {item.c_email && (
//                                             <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 shadow-lg p-2 rounded-md text-xs z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-max pointer-events-none group-hover:pointer-events-auto">
//                                                 {item.c_email}
//                                             </div>
//                                         )}
//                                     </div>
//                                     <div>{item.c_phone || '-'}</div>
//                                     <div>{formatDate(item.d_modified_date)}</div>
//                                     <div>
//                                         <span className={`px-3 py-1 rounded-full text-xs ${statusBgColor}`}>
//                                             {statusText}
//                                         </span>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}

//                 {viewMode === 'grid' && (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
//                         {displayedData.map((item) => {
//                             const statusText = 'Won';
//                             const statusBgColor = getStatusColor('won');

//                             return (
//                                 <div
//                                     key={item.i_deal_id}
//                                     onClick={() => goToDetail(item.i_deal_id)}
//                                     className="relative bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
//                                 >
//                                     <div>
//                                         <div className="flex w-full justify-between items-center space-x-10">
//                                             <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">
//                                                 {item.cdeal_name || '-'}
//                                             </h3>
//                                             <h3 className="font-semibold text-sm text-black bg-yellow-200 px-3 py-1 rounded-full truncate">
//                                                 {item.lead_potential || '-'}
//                                             </h3>
//                                         </div>

//                                         <p className="text-gray-600 text-sm mb-2 truncate">
//                                             {item.c_organization || '-'}
//                                         </p>
//                                         <div className="text-gray-500 text-xs space-y-1 mb-3">
//                                             {item.c_email && (
//                                                 <p className="flex items-center">
//                                                     <FaEnvelope className="mr-2 text-blue-500" /> {item.c_email}
//                                                 </p>
//                                             )}
//                                             {item.c_phone && (
//                                                 <p className="flex items-center">
//                                                     <FaPhone className="mr-2 text-green-500" /> {item.c_phone}
//                                                 </p>
//                                             )}
//                                         </div>
//                                     </div>
//                                     <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100">
//                                         <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBgColor}`}>
//                                             {statusText}
//                                         </span>
//                                         <span className="text-gray-500 text-xs">
//                                             Modified: {formatDate(item.d_modified_date)}
//                                         </span>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}
//             </>

//             {totalPages > 1 && (
//                 <div className="flex justify-center items-center space-x-2 mt-6">
//                     <button
//                         onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                         disabled={currentPage === 1}
//                         className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         Previous
//                     </button>
//                     <span className="text-gray-700">
//                         Page {currentPage} of {totalPages}
//                     </span>
//                     <button
//                         onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                         disabled={currentPage === totalPages}
//                         className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         Next
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default WonList;