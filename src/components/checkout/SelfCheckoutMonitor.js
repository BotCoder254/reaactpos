import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiClock, FiDollarSign, FiUsers, FiActivity, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, query, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function SelfCheckoutMonitor() {
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    averageTransactionTime: 0,
    totalTransactions: 0,
    potentialFraudCount: 0,
    hourlyTransactions: []
  });

  // Simulated real-time data for visualizations
  const [transactionData, setTransactionData] = useState([]);
  const [stationPerformance, setStationPerformance] = useState([]);
  const [fraudDistribution, setFraudDistribution] = useState([]);

  useEffect(() => {
    // Listen for all stations without complex queries
    const stationsRef = collection(db, 'self-checkout-stations');
    const unsubscribeStations = onSnapshot(stationsRef, (snapshot) => {
      const stationData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(station => station.status === 'active'); // Filter in memory
      setStations(stationData);
    });

    // Listen for all transactions
    const transactionsRef = collection(db, 'self-checkout-logs');
    const transactionsQuery = query(transactionsRef, orderBy('timestamp', 'desc'));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }))
        .filter(log => log.action === 'complete_transaction');
      setTransactions(transactionData);

      // Update stats
      const totalTransactions = transactionData.length;
      const totalTime = transactionData.reduce((sum, t) => {
        return sum + (t.duration || 0);
      }, 0);
      const avgTime = totalTransactions > 0 ? totalTime / totalTransactions : 0;

      setStats(prev => ({
        ...prev,
        totalTransactions,
        averageTransactionTime: Math.round(avgTime)
      }));
    });

    // Listen for all alerts without complex queries
    const logsRef = collection(db, 'self-checkout-logs');
    const unsubscribeAlerts = onSnapshot(logsRef, (snapshot) => {
      const allLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      // Filter alerts in memory
      const alertData = allLogs.filter(log => log.type === 'alert')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10); // Get only last 10 alerts
      
      setAlerts(alertData);

      // Generate transaction data for charts
      const hourlyData = generateHourlyTransactionData(allLogs);
      setTransactionData(hourlyData);

      // Generate station performance data
      const performanceData = generateStationPerformanceData(allLogs);
      setStationPerformance(performanceData);

      // Generate fraud distribution data
      const fraudData = generateFraudDistributionData(allLogs);
      setFraudDistribution(fraudData);
    });

    return () => {
      unsubscribeStations();
      unsubscribeAlerts();
      unsubscribeTransactions();
    };
  }, []);

  // Generate simulated hourly transaction data
  const generateHourlyTransactionData = (logs) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hour: hour.toString().padStart(2, '0') + ':00',
      transactions: logs.filter(log => 
        log.timestamp?.getHours() === hour &&
        log.action === 'complete_transaction'
      ).length
    }));
  };

  // Generate station performance data
  const generateStationPerformanceData = (logs) => {
    const stationMap = new Map();
    logs.forEach(log => {
      if (log.stationId) {
        const current = stationMap.get(log.stationId) || { 
          stationId: log.stationId,
          transactions: 0,
          alerts: 0
        };
        if (log.action === 'complete_transaction') current.transactions++;
        if (log.type === 'alert') current.alerts++;
        stationMap.set(log.stationId, current);
      }
    });
    return Array.from(stationMap.values());
  };

  // Generate fraud distribution data
  const generateFraudDistributionData = (logs) => {
    const fraudLogs = logs.filter(log => log.type === 'alert');
    return [
      { name: 'High Value Removal', value: fraudLogs.filter(log => log.severity === 'high').length },
      { name: 'Multiple Removals', value: fraudLogs.filter(log => log.severity === 'medium').length },
      { name: 'Suspicious Timing', value: fraudLogs.filter(log => log.severity === 'low').length }
    ];
  };

  const getStationStatus = (station) => {
    if (station.needsAssistance) {
      return { color: 'text-yellow-500', text: 'Needs Assistance' };
    }
    if (station.currentTransaction) {
      return { color: 'text-green-500', text: 'In Use' };
    }
    return { color: 'text-gray-500', text: 'Available' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Self-Checkout Monitor</h1>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Transaction Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.floor(stats.averageTransactionTime / 60)}m {stats.averageTransactionTime % 60}s
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <FiAlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Potential Fraud Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Stations */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Stations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((station) => {
            const status = getStationStatus(station);
            return (
              <motion.div
                key={station.id}
                whileHover={{ scale: 1.02 }}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">Station {station.id}</h3>
                    <p className={`text-sm ${status.color}`}>{status.text}</p>
                    {station.currentCustomer && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 flex items-center">
                          <FiUser className="w-4 h-4 mr-1" />
                          {station.currentCustomer.name}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <FiPhone className="w-4 h-4 mr-1" />
                          {station.currentCustomer.phone}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <FiMail className="w-4 h-4 mr-1" />
                          {station.currentCustomer.email}
                        </p>
                      </div>
                    )}
                  </div>
                  {station.currentTransaction && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Current Total</p>
                      <p className="font-medium text-gray-900">
                        ${(station.currentTransaction?.total || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">Station {transaction.stationId}</h3>
                  <p className="text-sm text-gray-500">
                    {transaction.timestamp.toLocaleString()}
                  </p>
                  {transaction.customerDetails && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center">
                        <FiUser className="w-4 h-4 mr-1" />
                        {transaction.customerDetails.name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FiPhone className="w-4 h-4 mr-1" />
                        {transaction.customerDetails.phone}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FiMail className="w-4 h-4 mr-1" />
                        {transaction.customerDetails.email}
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium text-gray-900">
                    ${(transaction.total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent transactions</p>
          )}
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hourly Transaction Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hourly Transactions</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="transactions" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Performance Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Station Performance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stationId" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="#82ca9d" name="Transactions" />
                <Bar dataKey="alerts" fill="#ff8042" name="Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fraud Alert Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fraudDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {fraudDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center">
                <FiAlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">
                    Station {alert.stationId} • {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Investigate
              </button>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent alerts</p>
          )}
        </div>
      </div>
    </div>
  );
} 