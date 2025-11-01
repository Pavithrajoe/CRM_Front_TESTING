import React from 'react';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend} from 'recharts';

const LeadStatusChart = ({ stageCounts = {} }) => {
    const transformedData = Object.entries(stageCounts)
        .map(([stage, details]) => ({
            name: stage.trim(),
            "Lead Status": details.count,
            orderId: details.orderId
        }))
        .sort((a, b) => {
            const orderA = typeof a.orderId === 'number' ? a.orderId : Infinity;
            const orderB = typeof b.orderId === 'number' ? b.orderId : Infinity; 
            return orderA - orderB;
        });

    const chartData = transformedData;

    // Custom tooltip component for the chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            const displayValue = typeof value === 'number' ? `${value} Leads` : value;

            return (
                <div className="bg-white p-2 border border-gray-300 rounded shadow-md">
                    <p className="font-semibold text-gray-700">{`${label}: ${displayValue}`}</p>
                </div>
            );
        }
        return null;
    };

    // Custom tick formatter for Y-axis to ensure integer values
    const formatYAxisTick = (tick) => {
        return Math.max(0, Math.floor(tick)); // negative values not allowed
    };

    return (
        <div className="bg-white p-4 h-[80vh] rounded-lg shadow flex flex-col">
            <div className="flex justify-between items-center ">
                <h2 className="text-lg font-semibold">Sales Pipeline Stages</h2>
            </div>
            <div className="flex-grow">
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No lead status data available.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 40,
                                left: 30,
                                bottom: 100, // Increased bottom margin for rotated X-Axis labels
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                type="category"
                                angle={-45}
                                textAnchor="end"
                                height={120} // Adjusted height to accommodate rotated labels
                                interval={0}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                label={{
                                    value: 'Number of Leads',
                                    angle: -90,
                                    position: 'insideLeft',
                                    dy: 50,
                                    style: { textAnchor: 'middle', fontSize: '14px' }
                                }}
                                tickFormatter={formatYAxisTick}
                                domain={[0, 'auto']} 
                                allowDecimals={false}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} />
                            <Line
                                type="linear"
                                dataKey="Lead Status"
                                stroke="#164CA1"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6, stroke: '#164CA3', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default LeadStatusChart;
