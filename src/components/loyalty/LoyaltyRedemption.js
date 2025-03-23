import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiGift, FiCheck, FiX } from 'react-icons/fi';
import { useLoyalty } from '../../contexts/LoyaltyContext';

export default function LoyaltyRedemption({ account, onClose, onRedeem }) {
  const { loyaltyProgram, redeemPoints } = useLoyalty();
  const [selectedReward, setSelectedReward] = useState(null);
  const [error, setError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!selectedReward) return;
    
    try {
      setError('');
      setIsRedeeming(true);
      await redeemPoints(account.id, selectedReward.id, selectedReward.points);
      onRedeem(selectedReward);
    } catch (err) {
      setError('Failed to redeem points. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const availableRewards = loyaltyProgram?.rewards?.filter(
    reward => account.points >= reward.points
  ) || [];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Redeem Points</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm text-primary-700">Available Points</p>
                <p className="text-2xl font-bold text-primary-800">
                  {account.points.toLocaleString()}
                </p>
              </div>
              <FiGift className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700">Available Rewards</h3>
            {availableRewards.length === 0 ? (
              <p className="text-sm text-gray-500">
                No rewards available for your current points balance.
              </p>
            ) : (
              availableRewards.map((reward) => (
                <button
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border ${
                    selectedReward?.id === reward.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <FiGift className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {reward.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reward.points.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                  {selectedReward?.id === reward.id && (
                    <FiCheck className="h-5 w-5 text-primary-600" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRedeem}
              disabled={!selectedReward || isRedeeming}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                !selectedReward || isRedeeming
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {isRedeeming ? 'Redeeming...' : 'Redeem Points'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}