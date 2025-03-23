import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiTrendingUp, FiGift } from 'react-icons/fi';
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
import LoyaltyLookup from './LoyaltyLookup';
import LoyaltyRedemption from './LoyaltyRedemption';
import { useLoyalty } from '../../contexts/LoyaltyContext';

export default function LoyaltySection({ total, onApplyDiscount }) {
  const { currentAccount, loyaltyProgram, analytics } = useLoyalty();
  const [showRedemption, setShowRedemption] = useState(false);
  const [appliedReward, setAppliedReward] = useState(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    // Reset applied reward when total changes
    if (appliedReward && total < appliedReward.minimumPurchase) {
      setAppliedReward(null);
      onApplyDiscount(0);
    }
  }, [total, appliedReward, onApplyDiscount]);

  const handleAccountSelect = (account) => {
    setShowRedemption(true);
  };

  const handleRedemption = (reward) => {
    setAppliedReward(reward);
    onApplyDiscount(reward.value);
    setShowRedemption(false);
  };

  const calculatePointsToEarn = () => {
    if (!loyaltyProgram || !total) return 0;
    return Math.floor(total * (loyaltyProgram.pointsPerDollar || 1));
  };

  const pointsToEarn = calculatePointsToEarn();

  // Prepare chart data
  const pointsHistory = currentAccount?.pointsHistory || [];
  const chartData = pointsHistory.map(history => ({
    date: new Date(history.timestamp).toLocaleDateString(),
    points: history.points,
    amount: history.amount
  }));

  if (!currentAccount || !loyaltyProgram) return null;

  const availableRewards = loyaltyProgram.rewards.filter(
    reward => currentAccount.points >= reward.points
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary-50 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <FiStar className="w-5 h-5 text-primary-600 mr-2" />
          <span className="font-medium text-primary-900">Loyalty Program</span>
        </div>
        <span className="text-sm text-primary-600 font-medium">
          {currentAccount.points.toLocaleString()} points
        </span>
      </div>

      {!appliedReward ? (
        <>
          <p className="text-sm text-primary-600 mb-2">
            You'll earn {pointsToEarn.toLocaleString()} points with this purchase
          </p>
          {availableRewards.length > 0 && (
            <button
              onClick={() => setShowRedemption(true)}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Redeem Points
            </button>
          )}
        </>
      ) : (
        <div className="bg-white rounded-md p-3 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{appliedReward.name}</p>
              <p className="text-xs text-gray-500">Applied to purchase</p>
            </div>
            <button
              onClick={() => {
                setAppliedReward(null);
                onApplyDiscount(0);
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {showRedemption && (
        <LoyaltyRedemption
          account={currentAccount}
          onClose={() => setShowRedemption(false)}
          onRedeem={handleRedemption}
        />
      )}

      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-sm text-gray-600">Available Points</p>
          <p className="text-2xl font-bold text-primary-600">
            {currentAccount.points.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setShowChart(!showChart)}
          className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100"
        >
          <FiTrendingUp className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {showChart && chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="points"
                    stroke="#4F46E5"
                    name="Points"
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10B981"
                    name="Amount ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {availableRewards.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Available Rewards</p>
          <div className="space-y-2">
            {availableRewards.map(reward => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-2 bg-white rounded"
              >
                <div className="flex items-center">
                  <FiGift className="h-4 w-4 text-primary-500 mr-2" />
                  <span className="text-sm text-gray-900">{reward.name}</span>
                </div>
                <span className="text-sm font-medium text-primary-600">
                  {reward.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
} 