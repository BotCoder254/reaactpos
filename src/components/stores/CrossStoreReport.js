import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../contexts/StoreContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CrossStoreReport() {
  const { stores, getStoreInventory } = useStore();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    salesByStore: [],
    inventoryByStore: [],
    topProducts: [],
    transferHistory: []
  });
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const storeData = await Promise.all(
        stores.map(async (store) => {
          const inventory = await getStoreInventory(store.id);
          return {
            ...store,
            inventory
          };
        })
      );

      // Process data for charts
      const salesByStore = storeData.map(store => ({
        name: store.name,
        sales: Math.random() * 10000, // Replace with actual sales data
        inventory: store.inventory.length
      }));

      const inventoryByStore = storeData.map(store => ({
        name: store.name,
        value: store.inventory.length,
        lowStock: store.inventory.filter(item => item.quantity <= item.minQuantity).length
      }));

      setReportData({
        salesByStore,
        inventoryByStore,
        topProducts: [], // Add actual top products data
        transferHistory: [] // Add actual transfer history data
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cross-Store Report</h2>
          <p className="text-sm text-gray-500">Consolidated data across all locations</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={fetchReportData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              // Implement export functionality
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Sales by Store Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales by Store</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.salesByStore}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="sales" fill="#10B981" name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Status</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.inventoryByStore}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#6366F1" name="Total Items" />
              <Bar dataKey="lowStock" fill="#EF4444" name="Low Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Store Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">{store.name}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.salesByStore.find(s => s.name === store.name)?.sales || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inventory Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.inventoryByStore.find(s => s.name === store.name)?.value || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">
                  {reportData.inventoryByStore.find(s => s.name === store.name)?.lowStock || 0}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 