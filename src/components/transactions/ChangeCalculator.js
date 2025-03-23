import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiX } from 'react-icons/fi';

export default function ChangeCalculator({ isOpen, onClose, totalAmount, onComplete }) {
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCashReceived('');
      setChange(0);
      setError('');
    }
  }, [isOpen]);

  const handleCashReceivedChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCashReceived(value);
      setError('');
      
      const numericValue = parseFloat(value) || 0;
      const changeAmount = numericValue - totalAmount;
      
      if (numericValue < totalAmount) {
        setError('Insufficient amount');
        setChange(0);
      } else {
        setError('');
        setChange(changeAmount);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !error && parseFloat(cashReceived) >= totalAmount) {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (!cashReceived || parseFloat(cashReceived) < totalAmount) {
      setError('Insufficient amount');
      return;
    }
    onComplete(parseFloat(cashReceived), change);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Calculate Change</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiDollarSign className="text-gray-400" />
              </div>
              <input
                type="text"
                value={totalAmount.toFixed(2)}
                disabled
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash Received
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiDollarSign className="text-gray-400" />
              </div>
              <input
                type="text"
                value={cashReceived}
                onChange={handleCashReceivedChange}
                onKeyPress={handleKeyPress}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
                autoFocus
                inputMode="decimal"
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Change Due
            </label>
            <motion.div
              animate={{
                scale: change > 0 ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
              className="relative rounded-md shadow-sm"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiDollarSign className="text-gray-400" />
              </div>
              <input
                type="text"
                value={change.toFixed(2)}
                disabled
                className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-bold ${
                  change > 0 ? 'text-green-600' : ''
                }`}
              />
            </motion.div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleComplete}
            disabled={!cashReceived || parseFloat(cashReceived) < totalAmount}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Complete Payment
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
} 