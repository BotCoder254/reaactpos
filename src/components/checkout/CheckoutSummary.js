import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPercent, FiTag } from 'react-icons/fi';
import { getActiveDiscounts, calculateDiscount } from '../../utils/discountQueries';

export default function CheckoutSummary({ subtotal, onDiscountApplied }) {
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const activeDiscounts = await getActiveDiscounts();
        setDiscounts(activeDiscounts);
      } catch (error) {
        console.error('Error fetching active discounts:', error);
      }
    };

    fetchDiscounts();
  }, []);

  useEffect(() => {
    if (selectedDiscount) {
      const amount = calculateDiscount(subtotal, selectedDiscount);
      setDiscountAmount(amount);
      onDiscountApplied(amount);
    } else {
      setDiscountAmount(0);
      onDiscountApplied(0);
    }
  }, [selectedDiscount, subtotal, onDiscountApplied]);

  const handleDiscountSelect = (discount) => {
    if (selectedDiscount?.id === discount.id) {
      setSelectedDiscount(null);
    } else {
      setSelectedDiscount(discount);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {discounts.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Available Discounts</h3>
            <div className="space-y-2">
              {discounts.map((discount) => (
                <motion.button
                  key={discount.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDiscountSelect(discount)}
                  className={`w-full flex items-center justify-between p-3 rounded-md border ${
                    selectedDiscount?.id === discount.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center">
                    {discount.type === 'percentage' ? (
                      <FiPercent className="h-5 w-5 text-primary-500 mr-2" />
                    ) : (
                      <FiTag className="h-5 w-5 text-primary-500 mr-2" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {discount.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {discount.type === 'percentage'
                          ? `${discount.value}% off`
                          : 'Buy One Get One Free'}
                        {discount.minPurchase > 0 &&
                          ` (Min. $${discount.minPurchase})`}
                      </p>
                    </div>
                  </div>
                  {selectedDiscount?.id === discount.id && (
                    <span className="text-xs font-medium text-primary-600">
                      Applied
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-primary-600">
            <span>Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <span>Total</span>
            <span>${(subtotal - discountAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 