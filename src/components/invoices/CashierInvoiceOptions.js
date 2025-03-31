import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPrinter, FiMail, FiMessageSquare } from 'react-icons/fi';
import { useInvoiceCustomization } from '../../contexts/InvoiceCustomizationContext';
import Tooltip from '../ui/Tooltip';

export default function CashierInvoiceOptions({ onClose, onApply }) {
  const { settings } = useInvoiceCustomization();
  const [format, setFormat] = useState('digital');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(settings.templates[0]?.id);

  const handleApply = () => {
    onApply({
      format,
      message,
      templateId: selectedTemplate
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6">Invoice Options</h2>

      {/* Format Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Format</h3>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Send digital invoice via email">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormat('digital')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                format === 'digital'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              <FiMail className="w-6 h-6 mr-2" />
              Digital
            </motion.button>
          </Tooltip>

          <Tooltip content="Print physical invoice">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormat('printed')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                format === 'printed'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              <FiPrinter className="w-6 h-6 mr-2" />
              Printed
            </motion.button>
          </Tooltip>
        </div>
      </div>

      {/* Template Selection */}
      {settings.templates.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Template</h3>
          <div className="grid grid-cols-2 gap-4">
            {settings.templates.map((template) => (
              <Tooltip key={template.id} content={template.description}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border-2 text-left ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </motion.button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Message */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">
          <span className="flex items-center">
            <FiMessageSquare className="w-5 h-5 mr-2" />
            Personalized Message
          </span>
        </h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a thank you message or promotional content..."
          className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="px-6 py-2 rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleApply}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Apply
        </motion.button>
      </div>
    </motion.div>
  );
} 
