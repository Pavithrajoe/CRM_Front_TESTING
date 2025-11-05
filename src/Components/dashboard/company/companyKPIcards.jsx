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