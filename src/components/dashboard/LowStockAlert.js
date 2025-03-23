import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useInventory } from '../../contexts/InventoryContext';

export default function LowStockAlert() {
  const { products, loading } = useInventory();
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    if (!products) return;
    
    const items = products.filter(product => 
      product.stock <= product.minStockThreshold
    ).map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      currentStock: product.stock,
      minStock: product.minStockThreshold
    }));
    
    setLowStockItems(items);
  }, [products]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow rounded-lg"
      >
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Low Stock Alerts
          </h3>
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {[...Array(3)].map((_, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="animate-pulse flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow rounded-lg"
    >
      <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Low Stock Alerts
        </h3>
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {lowStockItems.map((item) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-4 sm:px-6 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
                <div className="flex items-center">
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-semibold">
                      {item.currentStock} in stock
                    </p>
                    <p className="text-xs text-gray-500">
                      Minimum: {item.minStock}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Handle restock action
                      console.log('Restock:', item.id);
                    }}
                    className="ml-4 px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-500 border border-primary-600 rounded-md"
                  >
                    Restock
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6 rounded-b-lg">
        <div className="text-sm">
          <a
            href="#"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            View all inventory
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
} 