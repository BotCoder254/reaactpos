import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPercent, FiTag } from 'react-icons/fi';
import { addDiscount, updateDiscount } from '../../utils/discountQueries';

export default function DiscountModal({ isOpen, onClose, discount, onRefetch }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    active: true,
    validUntil: '',
    conditions: '',
    minPurchase: '',
    maxDiscount: '',
    applicableProducts: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (discount) {
      setFormData({
        name: discount.name || '',
        type: discount.type || 'percentage',
        value: discount.value || '',
        active: discount.active ?? true,
        validUntil: discount.validUntil ? new Date(discount.validUntil.seconds * 1000).toISOString().split('T')[0] : '',
        conditions: discount.conditions || '',
        minPurchase: discount.minPurchase || '',
        maxDiscount: discount.maxDiscount || '',
        applicableProducts: discount.applicableProducts || []
      });
    } else {
      setFormData({
        name: '',
        type: 'percentage',
        value: '',
        active: true,
        validUntil: '',
        conditions: '',
        minPurchase: '',
        maxDiscount: '',
        applicableProducts: []
      });
    }
  }, [discount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const discountData = {
        ...formData,
        value: formData.type === 'percentage' ? parseFloat(formData.value) : 0,
        minPurchase: parseFloat(formData.minPurchase) || 0,
        maxDiscount: parseFloat(formData.maxDiscount) || 0,
        validUntil: new Date(formData.validUntil)
      };

      if (discount) {
        await updateDiscount(discount.id, discountData);
      } else {
        await addDiscount(discountData);
      }

      onRefetch();
      onClose();
    } catch (error) {
      console.error('Error saving discount:', error);
      setError('Failed to save discount');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
        >
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {discount ? 'Edit Discount' : 'Add New Discount'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full h-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Summer Sale"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="mt-1 block w-full h-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="bogo">Buy One Get One Free</option>
                </select>
              </div>

              {formData.type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount Percentage
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      className="block w-full h-10 pr-12 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Valid Until
                </label>
                <input
                  type="date"
                  required
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  className="mt-1 block w-full h-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Purchase Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchase: e.target.value })
                    }
                    className="block w-full h-10 pl-7 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formData.type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Discount Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscount: e.target.value })
                      }
                      className="block w-full h-10 pl-7 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.active.toString()}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.value === 'true' })
                  }
                  className="mt-1 block w-full h-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Conditions
                </label>
                <textarea
                  value={formData.conditions}
                  onChange={(e) =>
                    setFormData({ ...formData, conditions: e.target.value })
                  }
                  rows={3}
                  className="mt-1 block w-full min-h-[80px] border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter any additional conditions or restrictions..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Discount'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}