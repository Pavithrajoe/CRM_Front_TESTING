import React from 'react';
import { Trophy, UserCheck, TrendingUp, CheckCircle } from 'lucide-react';

const achievements = [
  {
    id: 1,
    title: 'Leads Converted',
    value: 128,
    icon: <UserCheck className="text-green-600 w-6 h-6" />,
  },
  {
    id: 2,
    title: 'Deals Closed',
    value: 52,
    icon: <CheckCircle className="text-blue-600 w-6 h-6" />,
  },
  {
    id: 3,
    title: 'Target Completion',
    value: '92%',
    icon: <TrendingUp className="text-purple-600 w-6 h-6" />,
  },
  {
    id: 4,
    title: 'Top Performer',
    value: 'Deepaguru',
    icon: <Trophy className="text-yellow-500 w-6 h-6" />,
  },
];

const AchievementDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Achievements Dashboard</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl shadow-md flex items-center justify-between hover:shadow-lg transition"
            >
              <div>
                <h4 className="text-gray-600 text-sm">{item.title}</h4>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full">
                {item.icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementDashboard;
