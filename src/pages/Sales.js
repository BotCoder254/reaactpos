import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiDownload,
  FiFilter,
  FiPrinter,
  FiMail,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { exportSales, emailReceipt } from '../utils/salesQueries';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [filterCashier, setFilterCashier] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const { userRole } = useAuth();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesCollection = collection(db, 'sales');
        const salesQuery = query(salesCollection, orderBy('timestamp', 'desc'));
        const salesSnapshot = await getDocs(salesQuery);
        const salesList = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toLocaleString() || 'N/A'
        }));
        setSales(salesList);
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const handleExport = async () => {
    try {
      await exportSales(sales);
      alert('Sales data exported successfully!');
    } catch (error) {
      console.error('Error exporting sales:', error);
      alert('Failed to export sales data');
    }
  };

  const handleEmailReceipt = async (sale, email) => {
    try {
      await emailReceipt(sale, email);
      alert('Receipt sent successfully!');
    } catch (error) {
      console.error('Error sending receipt:', error);
      alert('Failed to send receipt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>
      <div className="flex justify-between items-center mb-6">
        {userRole === 'manager' && (
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FiDownload className="mr-2 -ml-1 h-5 w-5" />
            Export Data
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        {userRole === 'manager' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cashier
            </label>
            <select
              value={filterCashier}
              onChange={(e) => setFilterCashier(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Cashiers</option>
              {/* Add cashier options dynamically */}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <motion.tr
                key={sale.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sale.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.customerName || 'Walk-in Customer'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${sale.total?.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    sale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sale.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => window.print()}
                      className="text-gray-600 hover:text-primary-600"
                    >
                      <FiPrinter className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        const email = prompt('Enter email address:');
                        if (email) handleEmailReceipt(sale, email);
                      }}
                      className="text-gray-600 hover:text-primary-600"
                    >
                      <FiMail className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 