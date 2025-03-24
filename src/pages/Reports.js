import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDownload,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiRefreshCw,
  FiTrendingUp
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  getSalesReport,
  getTopProducts,
  getCashierPerformance,
  exportSalesReport
} from '../utils/reportQueries';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

const Reports = () => {
  const [dateRange, setDateRange] = useState('month');
  const [cashierId, setCashierId] = useState('all');
  const [productCategory, setProductCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalItems: 0,
    totalCustomers: 0,
    salesTrend: []
  });
  
  const [topProducts, setTopProducts] = useState([]);
  const [cashierStats, setCashierStats] = useState([]);
  const [realtimeData, setRealtimeData] = useState([]);

  useEffect(() => {
    let unsubscribe;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial report data
        const report = await getSalesReport(dateRange, cashierId, productCategory);
        setReportData(report);

        // Get top products
        const products = await getTopProducts(dateRange);
        setTopProducts(products);

        // Get cashier performance
        const cashiers = await getCashierPerformance(dateRange);
        setCashierStats(cashiers);

        // Set up real-time listener
        const now = new Date();
        let startDate;

        switch (dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = new Date(now.setDate(now.getDate() - 30));
        }

        const constraints = [
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc')
        ];

        if (cashierId !== 'all') {
          constraints.push(where('cashierId', '==', cashierId));
        }

        const q = query(collection(db, 'sales'), ...constraints);

        unsubscribe = onSnapshot(q, (snapshot) => {
          const sales = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filter by product category if needed
          const filteredSales = productCategory === 'all'
            ? sales
            : sales.filter(sale =>
                sale.items.some(item => item.category === productCategory)
              );

          setRealtimeData(filteredSales);

          // Update summary data
          const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
          const totalItems = filteredSales.reduce((sum, sale) => 
            sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
          );
          const uniqueCustomers = new Set(filteredSales.map(sale => sale.customerId)).size;

          // Update sales trend
          const salesByDate = filteredSales.reduce((acc, sale) => {
            const date = new Date(sale.timestamp.seconds * 1000).toLocaleDateString();
            acc[date] = (acc[date] || 0) + sale.total;
            return acc;
          }, {});

          const salesTrend = Object.entries(salesByDate)
            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
            .map(([date, total]) => ({
              date,
              total
            }));

          setReportData({
            totalSales,
            totalItems,
            totalCustomers: uniqueCustomers,
            salesTrend
          });
        }, (error) => {
          console.error('Error in real-time listener:', error);
          setError('Failed to get real-time updates');
        });

      } catch (err) {
        setError('Failed to fetch report data. Please try again.');
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dateRange, cashierId, productCategory]);

  const handleExport = async () => {
    try {
      await exportSalesReport(reportData, dateRange);
    } catch (err) {
      setError('Failed to export report. Please try again.');
      console.error('Error exporting report:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FiRefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FiDownload className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="p-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>

        <select
          value={cashierId}
          onChange={(e) => setCashierId(e.target.value)}
          className="p-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Cashiers</option>
          {cashierStats.map(cashier => (
            <option key={cashier.id} value={cashier.id}>
              {cashier.name}
            </option>
          ))}
        </select>

        <select
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          className="p-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="beverage">Beverage</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-white rounded-lg shadow-md"
          >
            <div className="flex items-center gap-4">
              <FiDollarSign className="w-8 h-8 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Sales</h3>
                <p className="text-2xl font-bold text-primary-600">
                  ${reportData.totalSales.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            key="items"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-white rounded-lg shadow-md"
          >
            <div className="flex items-center gap-4">
              <FiShoppingBag className="w-8 h-8 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Items Sold</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {reportData.totalItems}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            key="customers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-white rounded-lg shadow-md"
          >
            <div className="flex items-center gap-4">
              <FiUsers className="w-8 h-8 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Customers</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {reportData.totalCustomers}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sales Trend Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Sales Trend</h2>
        <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem'
                }}
                formatter={(value) => [`$${value}`, 'Sales']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Sales"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Top Products</h2>
          <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Sales Distribution</h2>
          <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProducts.slice(0, 4)}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {topProducts.slice(0, 4).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cashier Performance */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Cashier Performance</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left text-gray-900">Name</th>
                <th className="p-4 text-left text-gray-900">Total Sales</th>
                <th className="p-4 text-left text-gray-900">Transactions</th>
                <th className="p-4 text-left text-gray-900">Avg. Transaction</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {cashierStats.map((cashier, index) => (
                  <motion.tr
                    key={cashier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-t border-gray-200"
                  >
                    <td className="p-4 text-gray-900">{cashier.name}</td>
                    <td className="p-4 text-gray-900">${cashier.totalSales.toFixed(2)}</td>
                    <td className="p-4 text-gray-900">{cashier.transactionCount}</td>
                    <td className="p-4 text-gray-900">${cashier.averageTransaction.toFixed(2)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports; 