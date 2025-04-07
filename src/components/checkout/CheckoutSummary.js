import React from 'react';
import { FiTag } from 'react-icons/fi';

export default function CheckoutSummary({
  subtotal,
  discount,
  tax,
  total,
  selectedDiscount,
  onDiscountSelect,
  activeDiscounts
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-primary-600">Discount</span>
            <span className="text-primary-600">-${discount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (10%)</span>
          <span className="text-gray-900">${tax.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="text-base font-medium text-gray-900">Total</span>
          <span className="text-base font-medium text-gray-900">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {selectedDiscount && (
        <div className="mt-4 p-3 bg-primary-50 rounded-md">
          <div className="flex items-center">
            <FiTag className="h-5 w-5 text-primary-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-primary-900">
                {selectedDiscount.name}
              </p>
              <p className="text-xs text-primary-700">
                {selectedDiscount.type === 'percentage'
                  ? `${selectedDiscount.value}% off`
                  : 'Buy One Get One Free'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 