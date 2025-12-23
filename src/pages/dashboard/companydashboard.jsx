import React, { useEffect, useState, useCallback } from 'react';
import { ENDPOINTS } from '../../api/constraints'; 
import ProfileHeader from "../../Components/common/ProfileHeader"; 
import CompanyKPICards from "../../Components/dashboard/company/companyKPIcards";
import PotentialChart from "../../Components/dashboard/company/potentialchart";
import LeadStatusChart from "../../Components/dashboard/company/leadStatus";

// outside the component and is not reset when the component unmounts/remounts.
let apiCallInitModuleFlag = false; 

export default function CompanyDashboard() {
    // console.log("Component Body Rendered!"); 
    
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getCompanyIdAndToken = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            return { token, companyId: payload.company_id };
        } catch (err) {
            console.error('Error decoding token:', err);
            return null;
        }
    };

    const fetchDashboardData = useCallback(async () => {
        // if (apiCallInitModuleFlag) {
        //     setLoading(false); 
        //     // console.log("Prevented duplicate API call via module flag.");
        //     return; 
        // }

        // apiCallInitModuleFlag = true; 
        
        setLoading(true);
        setError(null);

        const authData = getCompanyIdAndToken();
        if (!authData) {
            setError('Authentication data missing. Please log in.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${ENDPOINTS.COMPANY_GET}`, {
                headers: {
                    Authorization: `Bearer ${authData.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}. Details: ${errorBody}`);
            }

            const result = await response.json();
            // console.log("result:", result);
            setDashboardData(result.data); 
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
            
            // apiCallInitModuleFlag = false; 
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl">Loading dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-600">
                <p className="text-xl">Error loading dashboard: {error}</p>
            </div>
        );
    }
    
    // Destructure the parts needed by the children for cleaner prop passing
    const { 
        groupedByPotentialName = {}, 
        groupedByPotentialNamePercentage = {},
        stageCounts = {},
        ...kpiData 
    } = dashboardData ?? {};


    return (
        <div className="flex mt-[-80px]">
            <main className="w-full flex-1 p-6 mt-[80px] min-h-screen">
                <ProfileHeader />

                <div className="space-y-4 p-4 min-h-screen">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* PASS KPI DATA */}
                            <CompanyKPICards data={kpiData} /> 
                        </div>

                        {/* PASS POTENTIAL CHART DATA */}
                        <PotentialChart 
                            groupedByPotentialName={groupedByPotentialName} 
                            groupedByPotentialNamePercentage={groupedByPotentialNamePercentage}
                        />
                    </div>

                    {/* PASS LEAD STATUS DATA */}
                    <LeadStatusChart stageCounts={stageCounts} />
                </div>
            </main>
        </div>
    );
}