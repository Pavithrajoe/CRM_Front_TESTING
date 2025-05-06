import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ENDPOINTS } from '../api/constraints'; 

const SalesFunnel = () => {
  const [chartData, setChartData] = useState([]);
  const [leadOwner, setLeadOwner] = useState('Loading...');
  const [followUpCount, setFollowUpCount] = useState(0);

  const transformStatusDataToChart = (data) => {
    if (!data.length) return [];

    const sorted = [...data].sort((a, b) => new Date(a.dcreated_dt) - new Date(b.dcreated_dt));
    const baseDate = new Date(sorted[0].dcreated_dt);

    return sorted.map((status) => {
      const date = new Date(status.dcreated_dt);
      const days = Math.ceil((date - baseDate) / (1000 * 60 * 60 * 24));
      return {
        name: status.clead_name,
        value: days === 0 ? 1 : days,
      };
    });
  };

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch(ENDPOINTS.LEAD_STATUS);
        const data = await res.json();
        const processed = transformStatusDataToChart(data);
        setChartData(processed);
      } catch (err) {
        console.error('Error fetching lead status:', err);
      }
    };

    const fetchLeadOwner = async () => {
      try {
        const [leadRes, usersRes] = await Promise.all([
          fetch(ENDPOINTS.LEAD),
          fetch(ENDPOINTS.USERS),
        ]);

        const leadData = await leadRes.json();
        const usersData = await usersRes.json();

        const leadOwnerId = Array.isArray(leadData) ? leadData[0]?.clead_owner : leadData.clead_owner;
        const ownerUser = usersData.find(user => user.id === leadOwnerId);
        setLeadOwner(ownerUser?.name || 'Not Assigned');
      } catch (err) {
        console.error('Error fetching lead owner:', err);
        setLeadOwner('Error');
      }
    };

    const fetchFollowUps = async () => {
      try {
        const res = await fetch(ENDPOINTS.FOLLOW_UP);
        const data = await res.json();
        setFollowUpCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error('Error fetching follow-ups:', err);
        setFollowUpCount(0);
      }
    };

    fetchChartData();
    fetchLeadOwner();
    fetchFollowUps();
  }, []);

  const stats = [
    { label: 'Lead Owner', value: leadOwner },
    { label: 'Follow-Ups', value: followUpCount },
    { label: 'Current Status', value: 'Interested' },
    { label: 'Demo', value: 5 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4 mt-4">
        <h2 className="text-xl font-semibold">Sales Funnel</h2>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="value" fill="#222" radius={[10, 10, 0, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-0">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-100 p-4 rounded-xl shadow-sm flex flex-col items-center"
          >
            <p className="text-gray-700 font-medium">{item.label}</p>
            <p className="text-xl font-bold mt-1">
              {typeof item.value === 'number'
                ? item.value.toString().padStart(2, '0')
                : item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesFunnel;
