import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FiLoader, 
  FiTrendingUp, 
  FiDollarSign, 
  FiShoppingCart, 
  FiAward,
  FiBarChart2
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getEmployeeStats, getTeamPerformance } from '../utils/employeeQueries';
import PerformanceCharts from '../components/employees/PerformanceCharts';

export default function EmployeeStats() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = collection(db, 'users');
        const q = query(userRef, where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setError('Failed to fetch user role');
      } finally {
        // Don't set loading to false here, wait for performance data
      }
    };

    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!currentUser || !userRole) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true); // Set loading true when starting to fetch
        const endDate = new Date();
        const startDate = new Date();
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const data = userRole === 'cashier'
          ? await getEmployeeStats(currentUser.uid)
          : await getTeamPerformance(startDate, endDate);
        setPerformanceData(data);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setError('Failed to fetch performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [currentUser, userRole, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600">
          <FiLoader className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userRole || !['admin', 'manager', 'cashier'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  const renderMetricCard = (title, value, icon, trend = null) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-100 rounded-full">
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {userRole === 'cashier' ? 'Your Performance' : 'Team Performance'}
        </h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="ml-4 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {performanceData && (
        <div className="space-y-6">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderMetricCard(
              'Total Sales',
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                .format(performanceData.totalSales || 0),
              <FiDollarSign className="h-6 w-6 text-primary-600" />,
              5.2
            )}
            {renderMetricCard(
              'Transactions',
              performanceData.totalTransactions || 0,
              <FiShoppingCart className="h-6 w-6 text-primary-600" />,
              3.1
            )}
            {renderMetricCard(
              'Average Sale',
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                .format(performanceData.averageTransactionValue || 0),
              <FiTrendingUp className="h-6 w-6 text-primary-600" />,
              -2.3
            )}
            {renderMetricCard(
              'Items Sold',
              performanceData.itemsSold || 0,
              <FiBarChart2 className="h-6 w-6 text-primary-600" />,
              7.8
            )}
          </div>

          {/* Performance Charts */}
          {!Array.isArray(performanceData) && (
            <PerformanceCharts
              salesData={performanceData.salesData || []}
              transactionsData={performanceData.transactionsData || []}
            />
          )}

          {/* Team Performance Table (Only for managers/admins) */}
          {(userRole === 'manager' || userRole === 'admin') && Array.isArray(performanceData) && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Team Performance Rankings
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Sale
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceData.map((employee, index) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                              .format(employee.performance.totalSales)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {employee.performance.totalTransactions}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                              .format(employee.performance.averageTransactionValue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiAward 
                              className={`h-5 w-5 mr-2 ${
                                index === 0 ? 'text-yellow-400' : 
                                index === 1 ? 'text-gray-400' :
                                index === 2 ? 'text-orange-400' :
                                'text-gray-300'
                              }`}
                            />
                            <span className="text-sm text-gray-900">
                              {index === 0 ? 'Top Performer' :
                               index === 1 ? 'Silver' :
                               index === 2 ? 'Bronze' :
                               `Rank ${index + 1}`}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 