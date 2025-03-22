import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { chartColors } from '../../utils/chartConfig';
import { getDiscountPerformanceMetrics } from '../../utils/discountQueries';
import '../../utils/chartConfig';

const DiscountPerformanceChart = ({ data = [] }) => {
  const formattedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      savings: Number(item.savings || 0).toFixed(2),
      orders: Number(item.orders || 0),
      revenue: Number(item.revenue || 0).toFixed(2)
    }));
  }, [data]);

  if (!formattedData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500 text-center">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Over Time</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="savings"
              name="Savings ($)"
              stroke="#4F46E5"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="Revenue ($)"
              stroke="#10B981"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#F59E0B"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DiscountPerformanceChart;