import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';



const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 px-2 py-1 rounded text-sm">
        {payload[0].value}  
      </div>
    );
  }
  return null;
};

export default function LeadManagementCard({leads }) {


  const userLeadCounts = leads.reduce((acc, lead) => {
  const userName = lead.user?.cFull_name || 'Unknown';

  // If the user already exists in the accumulator, increment the count
  if (acc[userName]) {
    acc[userName]++;
  } else {
    acc[userName] = 1;
  }

  return acc;
}, {});




 const data = Object.entries(userLeadCounts).map(([name, count]) => ({
  name,
  leads: count
}));

console.log(data);


  return (
    <div className="bg-white rounded-md p-4 w-full max-w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700">Lead Management</h2>
        <div className="flex items-center space-x-2">
          <button className="text-sm border px-2 py-1 rounded-md border-gray-300 text-gray-600">This week</button>
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