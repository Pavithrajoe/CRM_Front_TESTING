import React from 'react';
import { Briefcase, IndianRupee, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CompanyKPICards = ({ data }) => {
    const navigate = useNavigate();
    const kpiData = data || {}; 

    const handleTotalLeadClick = () => {
        navigate('/leadcardview', { state: { activeTab: 'total_leads' } });
    };
    const handleTotalLostClick = () => {
        // NOTE: In the original code, this navigated to 'lost' but the label said 'Won Leads'.
        // Assuming you want the 'Won Leads' card to navigate to the converted leads view.
        // If you intended to navigate to 'lost' leads, change the state object accordingly.
        navigate('/leadcardview', { state: { activeTab: 'converted' } }); 
    };

    return (
        <>
            <div className="bg-white border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer" onClick={handleTotalLeadClick} >
                <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-900">Total Leads</p>
                    <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                        <UserPlus className="w-4 h-4" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mt-2">{kpiData.totalLeads || 0}</h2>
            </div>

            <div
                className="bg-white p-4 rounded-lg shadow border cursor-pointer hover:shadow-md transition"
                onClick={handleTotalLostClick}
            >
                <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-900">Won Leads</p>
                    <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                        <Briefcase className="w-4 h-4" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mt-2">{kpiData.convertedLeads || 0}</h2>
            </div>

            <div
                className="bg-white p-4 rounded-lg shadow border cursor-pointer hover:shadow-md transition"
                onClick={() => navigate('/userpage')}
            >
                <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-900">Total Users</p>
                    <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                        <Users className="w-4 h-4" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mt-2">{kpiData.total_users || 0}</h2>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-900">Total Revenue</p>
                    <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                        <IndianRupee className="w-4 h-4" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mt-2">₹{kpiData.totalRevenue || 0}</h2>
            </div>
        </>
    );
};

export default CompanyKPICards;


// import React, { useEffect, useState } from 'react';
// import { Briefcase, IndianRupee, Link, UserPlus, Users } from 'lucide-react';
// import { ENDPOINTS } from '../../../api/constraints'; 
// import { useNavigate } from 'react-router-dom';

// const CompanyKPICards = () => {
//     const navigate = useNavigate();
//     const [data, setData] = useState({});
//     const [error, setError] = useState(null);

//     const getCompanyIdAndToken = () => {
//       const token = localStorage.getItem('token');
//       if (!token) return null;
//       try {
//         const base64Url = token.split('.')[1];
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//         const payload = JSON.parse(atob(base64));
//         return { token, companyId: payload.company_id };
//       } catch (err) {
//         console.error('Error decoding token:', err);
//         return null;
//       }
//     };

//     useEffect(() => {
//       const fetchData = async () => {
//         const authData = getCompanyIdAndToken();
//         if (!authData) {
//           setError('Authentication data missing');
//           return;
//         }

//         try {
//           const response = await fetch(`${ENDPOINTS.COMPANY_GET}`, {
//             headers: {
//               Authorization: `Bearer ${authData.token}`,
//             },
//           });
//           // console.log('Fetching Company KPI Data:', response);

//           if (!response.ok) throw new Error('Failed to fetch data');

//           const result = await response.json();
//         //  console.log('Company KPI API Response:', result);

//           // If the result is an object and you don't need filtering
//           setData(result.data);
//         } catch (err) {
//         //  console.error('API Error:', err);
//           setError(err.message);
//         }
//       };

//       fetchData();
//     }, []);

//     if (error) return <div>Error: {error}</div>;

//     const handleTotalLeadClick = () => {
//       navigate('/leadcardview', { state: { activeTab: 'total_leads' } });
//     };
//     const handleTotalLostClick = () => {
//       navigate('/leadcardview', { state: { activeTab: 'lost' } });
//     };

  
//   return (
//     <>
//      <div className="bg-white border border-white/30 rounded-xl p-4 shadow-sm cursor-pointer" onClick={handleTotalLeadClick} >
//   <div className="flex justify-between items-start">
//     <p className="text-sm font-bold text-gray-900">Total Leads</p>
//     <div className="bg-blue-100 text-blue-600 rounded-full p-2">
//       <UserPlus className="w-4 h-4" />
//     </div>  
//   </div>
//   <h2 className="text-2xl font-bold mt-2">{data.totalLeads ?? 0}</h2>
// </div>

//      <div
//   className="bg-white p-4 rounded-lg shadow border cursor-pointer hover:shadow-md transition"
//   onClick={handleTotalLostClick}
// >
//         <div className="flex justify-between items-start">
//           <p className="text-sm font-bold text-gray-900">Won Leads</p>
//           <div className="bg-blue-100 text-blue-600 rounded-full p-2">
//             <Briefcase className="w-4 h-4" />
//           </div>
//         </div>
//    <h2 className="text-2xl font-bold mt-2">{data.convertedLeads ?? 0}</h2>

//       </div>

//       <div
//   className="bg-white p-4 rounded-lg shadow border cursor-pointer hover:shadow-md transition"
//   onClick={() => navigate('/userpage')} 
// >
//         <div className="flex justify-between items-start">
//           <p className="text-sm font-bold text-gray-900">Total Users</p>
//           <div className="bg-blue-100 text-blue-600 rounded-full p-2">
//             <Users className="w-4 h-4" />
//           </div>
//         </div>
//         <h2 className="text-2xl font-bold mt-2">{data.total_users ?? 0}</h2>
//       </div>

//       <div className="bg-white p-4 rounded-lg shadow border">
//         <div className="flex justify-between items-start">
//           <p className="text-sm font-bold text-gray-900">Total Revenue</p>
//           <div className="bg-blue-100 text-blue-600 rounded-full p-2">
//             <IndianRupee className="w-4 h-4" />
//           </div>
//         </div>
//         <h2 className="text-2xl font-bold mt-2">₹{data.totalRevenue ?? 0}</h2>
//       </div>
//     </>
//   );
// };

// export default CompanyKPICards;