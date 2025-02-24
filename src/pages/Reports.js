import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiDownload,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiRefreshCw
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
  Bar
} from 'recharts';
import {
  getSalesReport,
  getTopProducts,
  getCashierPerformance,
  exportSalesReport
} from '../utils/reportQueries';

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

  useEffect(() => {
    fetchReportData();
  }, [dateRange, cashierId, productCategory]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sales, products, cashiers] = await Promise.all([
        getSalesReport(dateRange, cashierId, productCategory),
        getTopProducts(dateRange),
        getCashierPerformance(dateRange)
      ]);

      setReportData(sales);
      setTopProducts(products);
      setCashierStats(cashiers);
    } catch (err) {
      setError('Failed to fetch report data. Please try again.');
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <FiRefreshCw className="w-8 h-8 animate-spin text-primary" />
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
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FiDownload />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>

        <select
          value={cashierId}
          onChange={(e) => setCashierId(e.target.value)}
          className="p-2 border rounded-lg"
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
          className="p-2 border rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="beverage">Beverage</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-lg shadow-md"
        >
          <div className="flex items-center gap-4">
            <FiDollarSign className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Total Sales</h3>
              <p className="text-2xl font-bold">
                ${reportData.totalSales.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-lg shadow-md"
        >
          <div className="flex items-center gap-4">
            <FiShoppingBag className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Items Sold</h3>
              <p className="text-2xl font-bold">{reportData.totalItems}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-lg shadow-md"
        >
          <div className="flex items-center gap-4">
            <FiUsers className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Total Customers</h3>
              <p className="text-2xl font-bold">{reportData.totalCustomers}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sales Trend Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
        <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Products</h2>
        <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#4F46E5" name="Revenue" />
              <Bar dataKey="quantity" fill="#10B981" name="Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cashier Performance */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Cashier Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Total Sales</th>
                <th className="p-4 text-left">Transactions</th>
                <th className="p-4 text-left">Avg. Transaction</th>
              </tr>
            </thead>
            <tbody>
              {cashierStats.map((cashier) => (
                <tr key={cashier.id} className="border-t">
                  <td className="p-4">{cashier.name}</td>
                  <td className="p-4">${cashier.totalSales.toFixed(2)}</td>
                  <td className="p-4">{cashier.transactionCount}</td>
                  <td className="p-4">${cashier.averageTransaction.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports; 