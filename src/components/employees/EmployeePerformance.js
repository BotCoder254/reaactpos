import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiShoppingCart, FiPackage, FiAward } from 'react-icons/fi';
import { getEmployeeStats } from '../../utils/employeeQueries';

export default function EmployeePerformance({ employeeId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const employeeStats = await getEmployeeStats(employeeId);
        setStats(employeeStats);
      } catch (error) {
        console.error('Error fetching employee stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-primary-50 rounded-lg">
          <div className="flex items-center">
            <FiDollarSign className="h-6 w-6 text-primary-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Total Sales</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-primary-600">
            ${stats?.totalSales.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <FiShoppingCart className="h-6 w-6 text-green-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Transactions</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {stats?.totalTransactions}
          </p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <FiTrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Avg. Transaction</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            ${stats?.averageTransactionValue.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <FiPackage className="h-6 w-6 text-purple-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Items Sold</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-purple-600">
            {stats?.itemsSold}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center">
          <FiAward className="h-6 w-6 text-yellow-500" />
          <h3 className="ml-2 text-lg font-medium text-gray-900">Performance Metrics</h3>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Daily Average Sales</span>
            <span className="font-medium text-gray-900">
              ${stats?.dailyAverage.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Sales per Transaction</span>
            <span className="font-medium text-gray-900">
              ${stats?.salesPerTransaction.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 