import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PotentialChart = ({ groupedByPotentialName = {}, groupedByPotentialNamePercentage = {} }) => {

    const COLORS = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#19FFED',
        '#80FF19', '#FF4F19', '#198CFF', '#8019FF', '#CC66FF', '#FF6666', '#66FFCC',
        '#FFCC66', '#66CCFF', '#CCFF66'
    ];

    // Format the data received via props
    const formattedData = Object.keys(groupedByPotentialNamePercentage).map(key => ({
        name: key,
        value: parseFloat(groupedByPotentialNamePercentage[key]),
        count: groupedByPotentialName[key] || 0,
        percent: `${parseFloat(groupedByPotentialNamePercentage[key]).toFixed(2)}%`,
    }));

    // Filter data to only include valid, positive values for the chart
    const chartData = formattedData.filter(item => item.value > 0);
    
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { name, count, percent } = payload[0].payload;
            return (
                <div className="bg-white p-2 border border-gray-300 rounded shadow-md">
                    <p className="font-semibold text-gray-700">{name}</p>
                    <p className="text-sm text-gray-600">Count: {count}</p>
                    <p className="text-sm text-gray-600">Percentage: {percent}</p>
                </div>
            );
        }
        return null;
    };

    const totalLeadsDisplayed = chartData.reduce((sum, item) => sum + item.count, 0);
    const hasValidChartData = chartData.length > 0;


    return (
        <div className="bg-white p-4 rounded-lg shadow border h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Lead Potential Distribution</h2>
            <p className="text-sm text-gray-500 mb-4 text-center">
                Total Leads: {totalLeadsDisplayed}
            </p>

            <div className="flex-grow flex items-center justify-center">
                {hasValidChartData ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                startAngle={180}
                                endAngle={-180}
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent)}%)`}
                                labelLine={true}
                                labelStyle={{ fontSize: '14px', fill: '#333' }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500">No lead potential data available to display the chart.</p>
                )}
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-6 mt-4">
                {chartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm">
                            {entry.name} ({entry.count} | {entry.percent})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PotentialChart;

