import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSave } from 'react-icons/fi';
import { useLoyalty } from '../../contexts/LoyaltyContext';

export default function LoyaltyProgramSettings({ isOpen, onClose }) {
  const { loyaltyProgram, setupLoyaltyProgram, updateProgram } = useLoyalty();
  const [formData, setFormData] = useState({
    name: loyaltyProgram?.name || '',
    pointsPerDollar: loyaltyProgram?.pointsPerDollar || 1,
    minimumPurchase: loyaltyProgram?.minimumPurchase || 0,
    rewards: loyaltyProgram?.rewards || [
      { points: 100, name: '$5 off purchase', value: 5 },
      { points: 200, name: '$10 off purchase', value: 10 },
      { points: 500, name: '$25 off purchase', value: 25 }
    ]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (loyaltyProgram) {
        await updateProgram(loyaltyProgram.id, formData);
      } else {
        await setupLoyaltyProgram(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving loyalty program:', error);
    }
  };

  const handleRewardChange = (index, field, value) => {
    const newRewards = [...formData.rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setFormData(prev => ({ ...prev, rewards: newRewards }));
  };

  const addReward = () => {
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, { points: 0, name: '', value: 0 }]
    }));
  };

  const removeReward = (index) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative top-20 mx-auto p-6 border w-full max-w-2xl bg-white rounded-lg shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Loyalty Program Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Program Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Points per Dollar
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.pointsPerDollar}
                onChange={(e) => setFormData(prev => ({ ...prev, pointsPerDollar: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Purchase
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimumPurchase}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumPurchase: parseFloat(e.target.value) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Rewards
              </label>
              <button
                type="button"
                onClick={addReward}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Reward
              </button>
            </div>

            <AnimatePresence>
              {formData.rewards.map((reward, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center space-x-4 mb-4"
                >
                  <input
                    type="number"
                    placeholder="Points"
                    value={reward.points}
                    onChange={(e) => handleRewardChange(index, 'points', parseInt(e.target.value))}
                    className="w-24 border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Reward Name"
                    value={reward.name}
                    onChange={(e) => handleRewardChange(index, 'name', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Value"
                    value={reward.value}
                    onChange={(e) => handleRewardChange(index, 'value', parseFloat(e.target.value))}
                    className="w-24 border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeReward(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
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
              type="submit"
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
            >
              <FiSave className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 