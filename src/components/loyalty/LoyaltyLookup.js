import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiUser, FiStar, FiGift, FiPlus } from 'react-icons/fi';
import { useLoyalty } from '../../contexts/LoyaltyContext';

export default function LoyaltyLookup({ onSelect }) {
  const { lookupAccount, createAccount, currentAccount, loyaltyProgram } = useLoyalty();
  const [phone, setPhone] = useState('');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const account = await lookupAccount(phone);
      if (!account) {
        setShowNewAccount(true);
        setNewAccount(prev => ({ ...prev, phone }));
      }
    } catch (err) {
      setError('Error looking up account');
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await createAccount(newAccount);
      await lookupAccount(newAccount.phone);
      setShowNewAccount(false);
      setNewAccount({ name: '', phone: '', email: '' });
    } catch (err) {
      setError('Error creating account');
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLookup} className="flex space-x-2">
        <div className="flex-1">
          <label className="sr-only">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Lookup
        </button>
      </form>

      {error && (
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
      )}

      <AnimatePresence>
        {currentAccount && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-full">
                  <FiUser className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{currentAccount.name}</p>
                  <p className="text-sm text-gray-500">{currentAccount.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Available Points</p>
                  <p className="text-lg font-semibold text-primary-600">
                    {currentAccount.points.toLocaleString()}
                  </p>
                </div>
                {loyaltyProgram?.rewards && (
                  <button
                    onClick={() => onSelect(currentAccount)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FiGift className="h-4 w-4 mr-1" />
                    Redeem
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showNewAccount && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <FiPlus className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Create New Account</h3>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={newAccount.phone}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewAccount(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 