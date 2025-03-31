import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export default function InvoicePreview({ settings, onClose }) {
  const sampleData = {
    invoiceNumber: 'INV-2024-001',
    date: new Date().toLocaleDateString(),
    customerName: 'John Doe',
    items: [
      { name: 'Product 1', quantity: 2, price: 29.99 },
      { name: 'Product 2', quantity: 1, price: 49.99 }
    ],
    subtotal: 109.97,
    tax: 10.99,
    total: 120.96
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Invoice Preview</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                {settings.logo && (
                  <img
                    src={settings.logo}
                    alt="Company logo"
                    className="h-16 w-auto mb-4"
                  />
                )}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-bold"
                  style={{ color: settings.primaryColor }}
                >
                  INVOICE
                </motion.h2>
                {settings.headerMessage && (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-600 mt-2"
                  >
                    {settings.headerMessage}
                  </motion.p>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-600">Invoice #: {sampleData.invoiceNumber}</p>
                <p className="text-gray-600">Date: {sampleData.date}</p>
              </div>
            </div>

            {/* Customer Information */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h3 className="font-medium text-gray-900 mb-2">Bill To:</h3>
              <p className="text-gray-600">{sampleData.customerName}</p>
            </motion.div>

            {/* Items Table */}
            <motion.table
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full mb-8"
            >
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.items.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="border-b border-gray-100"
                  >
                    <td className="py-2">{item.name}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">${item.price.toFixed(2)}</td>
                    <td className="text-right py-2">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>

            {/* Totals */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-end mb-8"
            >
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${sampleData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">${sampleData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold" style={{ color: settings.primaryColor }}>
                    ${sampleData.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Custom Fields */}
            {settings.additionalFields.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <h3 className="font-medium text-gray-900 mb-2">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {settings.additionalFields.map((field) => (
                    <div key={field.id} className="flex justify-between">
                      <span className="text-gray-600">{field.name}:</span>
                      <span className="text-gray-900">Sample {field.type} value</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-gray-600 mt-8"
            >
              {settings.footerMessage}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 