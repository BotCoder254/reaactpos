import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../contexts/StoreContext';
import { FiTruck, FiBox, FiArrowRight } from 'react-icons/fi';

export default function TransferNotifications() {
  const { currentStore, transfers } = useStore();

  if (!currentStore) return null;

  const relevantTransfers = transfers.filter(
    transfer => transfer.toStore === currentStore.id && transfer.status === 'approved'
  );

  if (relevantTransfers.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {relevantTransfers.map((transfer) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="bg-white rounded-lg shadow-lg p-4 mb-2 border-l-4 border-primary-500"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTruck className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  Incoming Transfer
                </p>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <FiBox className="mr-1.5 h-4 w-4" />
                  <span>{transfer.items.length} items</span>
                  <FiArrowRight className="mx-2 h-4 w-4" />
                  <span>Arriving soon</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 