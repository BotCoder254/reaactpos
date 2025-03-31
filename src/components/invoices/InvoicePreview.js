import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiPrinter, FiMail } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

export default function InvoicePreview({ settings, companyInfo, sale = {}, onClose, onPrint, onDownload, onEmail }) {
  // Default values for undefined sale
  const defaultSale = {
    invoiceNumber: 'PREVIEW-001',
    timestamp: new Date().toISOString(),
    customer: {
      name: 'Sample Customer',
      email: 'sample@example.com',
      address: '123 Sample St, Sample City'
    },
    items: [],
    tax: 0,
    discount: null,
    loyaltyPoints: 0,
    ...sale // Spread the actual sale data if it exists
  };

  const actualSale = sale || defaultSale;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const calculateSubtotal = () => {
    return actualSale.items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return actualSale.tax || (calculateSubtotal() * 0.1); // Default 10% tax if not specified
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discount = actualSale.discount?.amount || 0;
    return subtotal + tax - discount;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Invoice Preview</h2>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDownload}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              >
                <FiDownload className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPrint}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              >
                <FiPrinter className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEmail}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              >
                <FiMail className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8" style={{ color: settings.primaryColor }}>
            {/* Company Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-start mb-8"
            >
              <div>
                {settings.logo && (
                  <img
                    src={settings.logo}
                    alt="Company logo"
                    className="h-16 w-auto mb-4"
                  />
                )}
                <h1 className="text-2xl font-bold" style={{ color: settings.primaryColor }}>
                  {companyInfo?.name || 'Company Name'}
                </h1>
                {companyInfo?.taxId && (
                  <p className="text-sm text-gray-600">Tax ID: {companyInfo.taxId}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold mb-2">INVOICE</p>
                <p className="text-sm text-gray-600">#{actualSale.invoiceNumber}</p>
                <p className="text-sm text-gray-600">
                  Date: {new Date(actualSale.timestamp).toLocaleDateString()}
                </p>
              </div>
            </motion.div>

            {/* Header Message */}
            {settings.headerMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-lg text-center"
                style={{ backgroundColor: `${settings.secondaryColor}20` }}
              >
                <p className="text-sm">{settings.headerMessage}</p>
              </motion.div>
            )}

            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-lg font-bold mb-2">Bill To:</h2>
              <p>{actualSale.customer?.name}</p>
              <p>{actualSale.customer?.email}</p>
              <p>{actualSale.customer?.address}</p>
            </motion.div>

            {/* Items Table */}
            <motion.table
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full mb-8"
            >
              <thead>
                <tr className="border-b-2" style={{ borderColor: settings.primaryColor }}>
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {actualSale.items.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-200"
                  >
                    <td className="py-2">{item.name}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">{formatCurrency(item.price)}</td>
                    <td className="text-right py-2">
                      {formatCurrency(item.quantity * item.price)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>

            {/* Totals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end mb-8"
            >
              <div className="w-64">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>

                {settings.showDiscountDetails && actualSale.discount && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <span>{actualSale.discount.type} Discount:</span>
                    <span>-{formatCurrency(actualSale.discount.amount)}</span>
                  </div>
                )}

                {settings.taxSettings?.showTaxDetails && (
                  <div className="flex justify-between mb-2">
                    <span>Tax:</span>
                    <span>{formatCurrency(calculateTax())}</span>
                  </div>
                )}

                <div
                  className="flex justify-between font-bold pt-2 border-t-2"
                  style={{ borderColor: settings.primaryColor }}
                >
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </motion.div>

            {/* Additional Fields */}
            {settings.additionalFields?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h3 className="font-bold mb-2">Additional Information</h3>
                <div className="space-y-2">
                  {settings.additionalFields.map((field) => (
                    <div key={field.id} className="flex">
                      <span className="font-medium w-1/3">{field.name}:</span>
                      <span className="text-gray-600">{actualSale[field.id] || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Payment Terms */}
            {settings.paymentTerms && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h3 className="font-bold mb-2">Payment Terms</h3>
                <p className="text-sm text-gray-600">{settings.paymentTerms}</p>
              </motion.div>
            )}

            {/* Loyalty Points */}
            {settings.showLoyaltyPoints && actualSale.loyaltyPoints > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-lg"
                style={{ backgroundColor: `${settings.secondaryColor}20` }}
              >
                <h3 className="font-bold mb-2">Loyalty Program</h3>
                <p className="text-sm">
                  Points earned from this purchase: {actualSale.loyaltyPoints}
                </p>
              </motion.div>
            )}

            {/* Footer Message */}
            {settings.footerMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-gray-600 mt-8"
              >
                {settings.footerMessage}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 