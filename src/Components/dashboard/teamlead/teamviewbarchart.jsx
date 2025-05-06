import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Eshwar', leads: 45 },
  { name: 'Shivaraj', leads: 20 },
  { name: 'Bala kumar', leads: 35 },
  { name: 'Tamilselvan', leads: 25 },
  { name: 'Arun kumar', leads: 33 }
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 px-2 py-1 rounded text-sm">
        {payload[0].value} Leads
      </div>
    );
  }
  return null;
};

export default function LeadManagementCard() {
  return (
    <div className="bg-white shadow rounded-xl p-4 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700">Lead Management</h2>
        <div className="flex items-center space-x-2">
          <button className="text-sm border px-2 py-1 rounded-md border-gray-300 text-gray-600">This week</button>
          <a href="#" className="text-sm text-blue-600 underline">View more</a>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="leads" fill="#1f2937" radius={[4, 4, 0, 0]} barSize={15}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
