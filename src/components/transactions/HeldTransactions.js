import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInbox, FiPlay, FiTrash2, FiClock, FiPackage } from 'react-icons/fi';
import { useHeldTransactions } from '../../contexts/HeldTransactionsContext';

export default function HeldTransactions({ onResume }) {
  const { heldTransactions, removeHeldTransaction } = useHeldTransactions();

  if (!heldTransactions || heldTransactions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center mb-4">
        <FiInbox className="w-5 h-5 text-primary-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Held Transactions</h3>
        <span className="ml-2 text-sm text-gray-500">
          ({heldTransactions.length} {heldTransactions.length === 1 ? 'transaction' : 'transactions'})
        </span>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence>
          {heldTransactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-500">
                    <FiClock className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <FiPackage className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">
                      {transaction.items?.length || 0} items
                    </span>
                  </div>
                  <div className="text-sm font-medium text-primary-600">
                    ${(transaction.total || 0).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onResume(transaction.id)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-100"
                    title="Resume Transaction"
                  >
                    <FiPlay className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => removeHeldTransaction(transaction.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
                    title="Remove Transaction"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {transaction.customer && (
                <div className="mt-2 text-sm text-gray-500">
                  Customer: {transaction.customer.name}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
} 