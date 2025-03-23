import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiStar, FiDollarSign, FiGift, FiSettings } from 'react-icons/fi';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import LoyaltyProgramSettings from './LoyaltyProgramSettings';
import LoyaltyMetricsChart from './LoyaltyMetricsChart';

export default function LoyaltyDashboard() {
  const { analytics, loading, error } = useLoyalty();
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiStar className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Program Settings Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FiSettings className="w-5 h-5 mr-2" />
          Program Settings
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-full">
              <FiUsers className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-lg font-semibold text-gray-900">
                {analytics?.totalAccounts.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiStar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Points</p>
              <p className="text-lg font-semibold text-gray-900">
                {analytics?.totalPoints.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="text-lg font-semibold text-gray-900">
                ${analytics?.totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FiGift className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Redemptions</p>
              <p className="text-lg font-semibold text-gray-900">
                {analytics?.totalRedemptions.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-4">
            {analytics?.topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 text-gray-500">{index + 1}.</span>
                  <span className="font-medium text-gray-900">{customer.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {customer.points.toLocaleString()} points
                  </span>
                  <span className="text-sm text-gray-500">
                    ${customer.totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Rewards</h3>
          <div className="space-y-4">
            {analytics?.topRewards.map((reward, index) => (
              <div key={reward.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 text-gray-500">{index + 1}.</span>
                  <span className="font-medium text-gray-900">{reward.name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {reward.count} redemptions
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Metrics Chart */}
      <LoyaltyMetricsChart data={analytics} />

      {/* Settings Modal */}
      {showSettings && (
        <LoyaltyProgramSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
} 