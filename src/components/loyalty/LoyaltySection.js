import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import LoyaltyLookup from './LoyaltyLookup';
import LoyaltyRedemption from './LoyaltyRedemption';
import { useLoyalty } from '../../contexts/LoyaltyContext';

export default function LoyaltySection({ total, onApplyDiscount }) {
  const { currentAccount, loyaltyProgram } = useLoyalty();
  const [showRedemption, setShowRedemption] = useState(false);
  const [appliedReward, setAppliedReward] = useState(null);

  const handleAccountSelect = (account) => {
    setShowRedemption(true);
  };

  const handleRedemption = (reward) => {
    setShowRedemption(false);
    setAppliedReward(reward);
    onApplyDiscount(reward.value);
  };

  const calculatePointsToEarn = () => {
    if (!loyaltyProgram?.pointsPerDollar || total < (loyaltyProgram?.minimumPurchase || 0)) {
      return 0;
    }
    return Math.floor(total * loyaltyProgram.pointsPerDollar);
  };

  const pointsToEarn = calculatePointsToEarn();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Loyalty Program</h3>
        {pointsToEarn > 0 && !appliedReward && (
          <div className="flex items-center text-primary-600">
            <FiStar className="h-5 w-5 mr-1" />
            <span className="text-sm font-medium">
              Earn {pointsToEarn.toLocaleString()} points
            </span>
          </div>
        )}
      </div>

      {appliedReward ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiStar className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Reward Applied: {appliedReward.name}
                </p>
                <p className="text-sm text-green-600">
                  {appliedReward.points.toLocaleString()} points redeemed
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setAppliedReward(null);
                onApplyDiscount(0);
              }}
              className="text-sm text-green-700 hover:text-green-800 font-medium"
            >
              Remove
            </button>
          </div>
        </motion.div>
      ) : (
        <LoyaltyLookup onSelect={handleAccountSelect} />
      )}

      <AnimatePresence>
        {showRedemption && currentAccount && (
          <LoyaltyRedemption
            account={currentAccount}
            onClose={() => setShowRedemption(false)}
            onRedeem={handleRedemption}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 