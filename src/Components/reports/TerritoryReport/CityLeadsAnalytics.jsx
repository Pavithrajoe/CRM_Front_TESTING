
import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend,} from "chart.js";
import { Pie } from "react-chartjs-2"; 
import { ENDPOINTS } from "../../../api/constraints";

ChartJS.register(ArcElement, Tooltip, Legend);

const CityLeadsAnalytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(ENDPOINTS.TERRITORY_LEADS, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch territory leads data: ${response.statusText}`);
        }
        const responseData = await response.json();

        const leadsByCity = {};
        const conversionData = responseData.data.conversionPerTerritory;
        if (conversionData) {
          for (const city in conversionData) {
            leadsByCity[city] = conversionData[city].total;
          }
        }

        setData(leadsByCity);
      } catch (err) {
        console.error("Error fetching city leads data:", err);
      }
    };
    fetchData();
  }, []);

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


