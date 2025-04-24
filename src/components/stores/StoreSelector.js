import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../contexts/StoreContext';
import { FiMapPin, FiChevronDown } from 'react-icons/fi';

export default function StoreSelector() {
  const { currentStore, stores, switchStore, loading } = useStore();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm px-4 py-2 min-w-[200px]">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stores.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="bg-white rounded-lg shadow-sm">
        <select
          value={currentStore?.id || ''}
          onChange={(e) => switchStore(e.target.value)}
          className="appearance-none w-full pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiMapPin className="h-4 w-4 text-primary-500" />
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <FiChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      {currentStore && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-50"
        >
          <div className="text-xs text-gray-500">Current Store Details</div>
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium text-gray-900">{currentStore.address}</p>
            <p className="text-sm text-gray-600">{currentStore.phone}</p>
            <p className="text-sm text-gray-600">{currentStore.email}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 