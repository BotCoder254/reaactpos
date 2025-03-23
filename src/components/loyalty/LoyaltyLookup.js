import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiUser, FiUserPlus } from 'react-icons/fi';
import { useLoyalty } from '../../contexts/LoyaltyContext';

export default function LoyaltyLookup({ onSelect }) {
  const { lookupAccount, createAccount } = useLoyalty();
  const [phone, setPhone] = useState('');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!phone) return;

    try {
      setError('');
      setLoading(true);
      const account = await lookupAccount(formatPhone(phone));
      if (account) {
        onSelect(account);
      } else {
        setShowNewAccount(true);
        setNewAccount(prev => ({ ...prev, phone: formatPhone(phone) }));
      }
    } catch (err) {
      setError('Failed to find account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name || !newAccount.phone) {
      setError('Name and phone number are required.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const account = await createAccount(newAccount);
      onSelect(account);
      setShowNewAccount(false);
      setNewAccount({ name: '', phone: '', email: '' });
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhone(e.target.value);
    setPhone(formattedPhone);
    setError('');
  };

  return (
    <div className="space-y-4">
      {!showNewAccount ? (
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || !phone}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Look Up Account'}
            </button>
          </div>
        </form>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateAccount}
          className="space-y-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={newAccount.name}
              onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="text"
              id="newPhone"
              value={newAccount.phone}
              onChange={(e) => setNewAccount(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email (Optional)
            </label>
            <input
              type="email"
              id="email"
              value={newAccount.email}
              onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowNewAccount(false)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newAccount.name || !newAccount.phone}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}