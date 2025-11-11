
import  {  useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend,} from "chart.js";
import { Pie } from "react-chartjs-2"; 

ChartJS.register(ArcElement, Tooltip, Legend);

const CityLeadsAnalytics = (props) => {
  const [data, setData] = useState(null);


    useEffect(()=>{
        //log the count to check 
        console.log("City Leads API Response:");
        const leadsByCity = {};
        //PASS THE PROP DATA
        const conversionData = props.conversionPerTerritory;
        console.log("Conversion Data:", conversionData);
        if (conversionData) {
          for (const city in conversionData) {
            leadsByCity[city] = conversionData[city].total;
          }
        }
        //set the data 
        setData(leadsByCity);
    },[ props.conversionPerTerritory])

      

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center h-[280px]">
        <div className="text-sm text-gray-500">Loading city data...</div>
      </div>
    );
  }

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Leads",
        data: Object.values(data),
        backgroundColor: [
          "#5AC8FA", "#FF9500",  "#34C759", "#AF52DE", "#FF2D55", "#C69C6D", "#8E8E93", 
          "#007AFF", "#5856D6", "#32A852", 
        ],
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, 
        position: 'right', 
        labels: {
            font: {
                size: 11
            },
            color: '#6B7280'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 4,
        padding: 10,
      }
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 h-[280px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Leads by City</h3>
      <div className="flex-grow w-full h-[200px] flex justify-center items-center">
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default CityLeadsAnalytics;


