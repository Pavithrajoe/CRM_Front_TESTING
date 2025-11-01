import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ENDPOINTS } from "../../../api/constraints";

const CompanyStatsCards = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
  });

  const navigate = useNavigate();

  const getUserInfoFromToken = () => {
    const token = localStorage.getItem('token');
    // console.log('Token from localStorage:', token ? 'Token found' : 'No token found');

    if (!token) {
      return { userIdFromToken: null, roleId: null }; 
    }

    try {
      const decoded = jwtDecode(token);
      // console.log('Decoded token payload:', decoded);

      return {
        userIdFromToken: decoded?.user_id || null,
        roleId: decoded?.role_id || null,
      };
    } catch (error) {
      console.error('Invalid token during decoding:', error);
      return { userIdFromToken: null, roleId: null };
    }
  };

  useEffect(() => {
    const fetchCompanyStats = async () => {
      const { userIdFromToken, roleId } = getUserInfoFromToken();

      // console.log('Extracted User ID from Token (for filtering):', userIdFromToken);
      // console.log('Extracted Role ID:', roleId);

      if (!userIdFromToken || roleId !== 3) {
        // console.warn('User is not a reseller (role_id !== 3) or User ID from token is missing. Skipping company stats fetch.');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // console.error('No authentication token found before making API call.');
          return;
        }

        // console.log(`Attempting to fetch from: ${ENDPOINTS.COMPANY} with Authorization header.`);
        const res = await fetch(ENDPOINTS.COMPANY, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          // console.error(`HTTP error! Status: ${res.status}, Message: ${errorText}`);
          throw new Error(`Failed to fetch company stats: ${res.status} ${res.statusText}`);
        }

        const result = await res.json();
        // console.log('API response for companies:', result);

        if (result && Array.isArray(result)) {
          const companies = result;
          // console.log('Processing companies array:', companies);

          const relevantCompanies = companies.filter(
            (company) => company.ireseller_admin_id === userIdFromToken
          );
          // console.log('Filtered companies (relevant to this reseller_admin_id):', relevantCompanies);

          const total = relevantCompanies.length;
          const active = relevantCompanies.filter((company) => company.bactive).length;
          const inactive = total - active;

          setStats({
            totalCompanies: total,
            activeCompanies: active,
            inactiveCompanies: inactive,
          });
        } else {
          // console.warn('API response is not a direct array as expected:', result);
          setStats({ totalCompanies: 0, activeCompanies: 0, inactiveCompanies: 0 });
        }
      } catch (err) {
        // console.error('Failed to fetch company stats due to network or processing error:', err);
      }
    };

    fetchCompanyStats();
  }, []);

  const handleCardClick = (status) => {
    navigate(`/company-details?status=${status}`);
  };

  const cardList = [
    {
      label: 'Total Companies',
      value: stats.totalCompanies,
      color: 'bg-blue-100 text-blue-600',
      status: 'all',
    },
    {
      label: 'Active Companies',
      value: stats.activeCompanies,
      color: 'bg-green-100 text-green-600',
      status: 'active',
    },
    {
      label: 'Inactive Companies',
      value: stats.inactiveCompanies,
      color: 'bg-red-100 text-red-600',
      status: 'inactive',
    },
  ];

  return (
    <div className="space-y-4">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cardList.slice(0, 2).map((card, idx) => (
          <div
            key={idx}
            className={`rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition ${card.color}`}
            
            onClick={() => handleCardClick(card.status)}
          >
            <h2 className="text-sm font-semibold">{card.label}</h2>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div
          className={`rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition ${cardList[2].color}`}
          onClick={() => handleCardClick(cardList[2].status)}
        >
          <h2 className="text-sm font-semibold">{cardList[2].label}</h2>
          <p className="text-2xl font-bold">{cardList[2].value}</p>
        </div>

        {/* Plans Card */}
        <div className="rounded-xl shadow p-4 bg-yellow-100 text-yellow-700">
          <h2 className="text-sm font-semibold">Plans</h2>
          <p className="text-2xl font-bold">Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyStatsCards;