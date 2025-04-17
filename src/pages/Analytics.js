import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDownload,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiRefreshCw,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import {
  getSalesReport,
  getTopProducts,
  getCashierPerformance,
  exportSalesReport
} from '../utils/reportQueries';
import { chartColors, defaultOptions } from '../utils/chartConfig';
import { Line as ChartLine } from 'react-chartjs-2';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export default function Analytics() {
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: 0,
    totalItems: 0,
    totalCustomers: 0,
    salesTrend: [],
    hourlyData: [],
    categoryData: []
  });
  
  const [topProducts, setTopProducts] = useState([]);
  const [realtimeData, setRealtimeData] = useState([]);
  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
    // Set up real-time listener
    const unsubscribe = setupRealtimeListener();
    const fetchSalesData = async () => {
      try {
        const salesCollection = collection(db, 'sales');
        const salesQuery = query(salesCollection, orderBy('timestamp', 'desc'), limit(30));
        const salesSnapshot = await getDocs(salesQuery);
        const salesList = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));

        // Process data for charts
        const processedData = processDataForCharts(salesList);
        setSalesData(processedData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
    };

    fetchSalesData();
    return () => {
      unsubscribe();
    };
  }, [dateRange]);

  const setupRealtimeListener = () => {
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

    const q = query(
      collection(db, 'sales'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
          items: Array.isArray(data.items) ? data.items.map(item => ({
            ...item,
            price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
            quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
          })) : []
        };
      });

      // Process real-time data with proper number handling
      const totalSales = sales.reduce((sum, sale) => {
        const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
        return sum + saleTotal;
      }, 0);

      const totalItems = sales.reduce((sum, sale) => {
        return sum + (Array.isArray(sale.items) ? sale.items.reduce((itemSum, item) => {
          return itemSum + (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0);
        }, 0) : 0);
      }, 0);

      const uniqueCustomers = new Set(sales.map(sale => sale.customerId)).size;

      // Process hourly data with proper number handling
      const hourlyData = processHourlyData(sales);

      // Process category data with proper number handling
      const categoryData = processCategoryData(sales);

      // Update real-time data
      setRealtimeData(sales);
      setAnalyticsData(prev => ({
        ...prev,
        totalSales,
        totalItems,
        totalCustomers: uniqueCustomers,
        hourlyData,
        categoryData
      }));

      // Update sales trend with proper number handling
      const salesByDate = sales.reduce((acc, sale) => {
        const date = new Date(sale.timestamp.seconds * 1000).toLocaleDateString();
        const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
        acc[date] = (acc[date] || 0) + saleTotal;
        return acc;
      }, {});

      setAnalyticsData(prev => ({
        ...prev,
        salesTrend: Object.entries(salesByDate).map(([date, total]) => ({
          date,
          total: typeof total === 'number' ? total : parseFloat(total) || 0
        }))
      }));
    });
  };

  const processHourlyData = (sales) => {
    const hourlyStats = Array(24).fill(0).map((_, i) => ({
      hour: i,
      sales: 0,
      transactions: 0
    }));

    sales.forEach(sale => {
      const hour = new Date(sale.timestamp.seconds * 1000).getHours();
      const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
      hourlyStats[hour].sales += saleTotal;
      hourlyStats[hour].transactions += 1;
    });

    return hourlyStats;
  };

  const processCategoryData = (sales) => {
    const categories = {};
    
    sales.forEach(sale => {
      if (Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
          
          if (!categories[item.category]) {
            categories[item.category] = {
              name: item.category,
              value: 0,
              items: 0
            };
          }
          categories[item.category].value += price * quantity;
          categories[item.category].items += quantity;
        });
      }
    });

    return Object.values(categories);
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const products = await getTopProducts(dateRange);
      setTopProducts(products);
    } catch (err) {
      setError('Failed to fetch analytics data. Please try again.');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processDataForCharts = (sales) => {
    const dates = [...new Set(sales.map(sale => 
      sale.timestamp.toISOString().split('T')[0]
    ))].sort();

    const dailyRevenue = dates.map(date => {
      const daySales = sales.filter(sale => 
        sale.timestamp.toISOString().split('T')[0] === date
      );
      return {
        date,
        revenue: daySales.reduce((sum, sale) => {
          const total = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
          return sum + total;
        }, 0),
        orders: daySales.length
      };
    });

    return {
      labels: dailyRevenue.map(day => day.date),
      revenue: dailyRevenue.map(day => day.revenue),
      orders: dailyRevenue.map(day => day.orders)
    };
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

  const revenueChartData = {
    labels: salesData?.labels || [],
    datasets: [
      {
        label: 'Daily Revenue',
        data: salesData?.revenue || [],
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryLight,
        fill: true
      }
    ]
  };

  const ordersChartData = {
    labels: salesData?.labels || [],
    datasets: [
      {
        label: 'Daily Orders',
        data: salesData?.orders || [],
        borderColor: chartColors.success,
        backgroundColor: chartColors.successLight,
        fill: true
      }
    ]
  };

  const chartOptions = {
    ...defaultOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    }
  };

  const orderChartOptions = {
    ...defaultOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
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
                  ${analyticsData.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {analyticsData.totalItems}
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
                  {analyticsData.totalCustomers}
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
            <AreaChart data={analyticsData.salesTrend}>
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
              <Area
                type="monotone"
                dataKey="total"
                name="Sales"
                stroke="#4F46E5"
                fill="#4F46E5"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Sales Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Hourly Sales Distribution</h2>
          <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="hour"
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
                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Category Distribution</h2>
          <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData.categoryData.map((entry, index) => (
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

      {/* Top Products */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Top Products Performance</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left text-gray-900">Product</th>
                <th className="p-4 text-left text-gray-900">Revenue</th>
                <th className="p-4 text-left text-gray-900">Quantity</th>
                <th className="p-4 text-left text-gray-900">Avg. Price</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {topProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-t border-gray-200"
                  >
                    <td className="p-4 text-gray-900">{product.name}</td>
                    <td className="p-4 text-gray-900">${product.revenue.toFixed(2)}</td>
                    <td className="p-4 text-gray-900">{product.quantity}</td>
                    <td className="p-4 text-gray-900">
                      ${(product.revenue / product.quantity).toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64">
            <ChartLine data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Order Trend</h2>
          <div className="h-64">
            <ChartLine data={ordersChartData} options={orderChartOptions} />
          </div>
        </div>
      </div>
    </motion.div>
  );
} 