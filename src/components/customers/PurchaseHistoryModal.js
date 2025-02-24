import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShoppingBag } from 'react-icons/fi';
import { getCustomerPurchases } from '../../utils/customerQueries';

export default function PurchaseHistoryModal({ isOpen, onClose, customer }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer?.id && isOpen) {
      fetchPurchases();
    }
  }, [customer, isOpen]);

  async function fetchPurchases() {
    try {
      setLoading(true);
      const data = await getCustomerPurchases(customer.id);
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Purchase History
              </h2>
              <p className="text-sm text-gray-500">{customer?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No purchases yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This customer hasn't made any purchases yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(purchase.timestamp).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          ${purchase.total.toFixed(2)}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {purchase.paymentMethod}
                      </span>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900">Items:</h4>
                      <ul className="mt-2 divide-y divide-gray-200">
                        {purchase.items.map((item, index) => (
                          <li key={index} className="py-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                {item.name}
                              </span>
                              <span className="text-sm text-gray-900">
                                {item.quantity} x ${item.price.toFixed(2)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 