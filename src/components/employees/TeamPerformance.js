import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiAward, FiStar } from 'react-icons/fi';
import { getTeamPerformance } from '../../utils/employeeQueries';

export default function TeamPerformance() {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
        
        const data = await getTeamPerformance(startDate, endDate);
        setTeamData(data);
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Team Performance</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="space-y-4">
        {teamData.map((employee, index) => (
          <div
            key={employee.id}
            className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                {index === 0 && (
                  <FiAward className="h-6 w-6 text-yellow-500 mr-2" />
                )}
                {index === 1 && (
                  <FiStar className="h-6 w-6 text-gray-500 mr-2" />
                )}
                {index === 2 && (
                  <FiStar className="h-6 w-6 text-bronze-500 mr-2" />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {employee.name || employee.email}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(employee.performance.periodStart.seconds * 1000).toLocaleDateString()} - {new Date(employee.performance.periodEnd.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">
                  ${employee.performance.totalSales.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Total Sales</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {employee.performance.totalTransactions}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Avg. Transaction</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${employee.performance.averageTransactionValue.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Items Sold</p>
                <p className="text-lg font-semibold text-gray-900">
                  {employee.performance.itemsSold}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <FiTrendingUp className={`h-4 w-4 ${
                  employee.performance.dailyAverage > 1000 ? 'text-green-500' : 'text-gray-400'
                }`} />
                <span className="ml-2 text-sm text-gray-600">
                  Daily Average: ${employee.performance.dailyAverage.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 