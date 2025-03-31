import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPrinter, FiMail, FiMessageSquare, FiCheck, FiX, FiEye } from 'react-icons/fi';
import { useInvoiceCustomization } from '../../contexts/InvoiceCustomizationContext';
import Tooltip from '../ui/Tooltip';
import InvoicePreview from './InvoicePreview';
import { format as dateFormat } from 'date-fns';

export default function CashierInvoiceOptions() {
  const { settings, updateSettings, companyInfo, recentSales } = useInvoiceCustomization();
  const [invoiceFormat, setInvoiceFormat] = useState('digital');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(settings?.defaultTemplate || 'standard');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [currentCompanyInfo, setCurrentCompanyInfo] = useState(null);

  // Load latest settings and company info from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('invoiceSettings');
    const savedCompanyInfo = localStorage.getItem('companyData');
    
    if (savedSettings) {
      setCurrentSettings(JSON.parse(savedSettings));
    } else {
      setCurrentSettings(settings);
    }
    
    if (savedCompanyInfo) {
      setCurrentCompanyInfo(JSON.parse(savedCompanyInfo));
    } else {
      setCurrentCompanyInfo(companyInfo);
    }
  }, [settings, companyInfo]);

  // Update current settings when they change
  useEffect(() => {
    if (settings) {
      setCurrentSettings(settings);
      setSelectedTemplate(settings.defaultTemplate || 'standard');
    }
  }, [settings]);

  // Update current company info when it changes
  useEffect(() => {
    if (companyInfo) {
      setCurrentCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  useEffect(() => {
    if (recentSales?.length > 0) {
      setSelectedSale(recentSales[0]);
    }
  }, [recentSales]);

  const handleApply = async () => {
    try {
      const updatedSettings = {
        ...currentSettings,
        currentFormat: invoiceFormat,
        customMessage: message,
        selectedTemplate: selectedTemplate
      };

      await updateSettings(updatedSettings);
      localStorage.setItem('invoiceSettings', JSON.stringify(updatedSettings));
      
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleCancel = () => {
    setInvoiceFormat('digital');
    setMessage('');
    setSelectedTemplate(currentSettings?.defaultTemplate || 'standard');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Invoice Options</h2>
        <button
          onClick={() => setShowPreview(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <FiEye className="mr-2" />
          Preview
        </button>
      </div>

      {/* Format Selection */}
      <section className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Format</h3>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Send invoice via email">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInvoiceFormat('digital')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                invoiceFormat === 'digital'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <FiMail className="w-6 h-6 mr-2" />
              <span className="font-medium">Digital</span>
            </motion.button>
          </Tooltip>

          <Tooltip content="Print physical copy">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInvoiceFormat('printed')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                invoiceFormat === 'printed'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <FiPrinter className="w-6 h-6 mr-2" />
              <span className="font-medium">Printed</span>
            </motion.button>
          </Tooltip>
        </div>
      </section>

      {/* Template Selection */}
      <section className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Template</h3>
        <div className="grid grid-cols-2 gap-4">
          {currentSettings?.templates?.map((template) => (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
              <p className="text-sm text-gray-500">{template.description}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Custom Message */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FiMessageSquare className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Custom Message</h3>
        </div>
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personalized message or promotional content..."
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200"
            rows="3"
            maxLength={200}
          />
          <div className="absolute bottom-2 right-2 text-sm text-gray-500">
            {message.length}/200
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <FiX className="w-5 h-5 mr-2" />
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FiCheck className="w-5 h-5 mr-2" />
          Apply Changes
        </motion.button>
      </div>

      {showPreview && selectedSale && (
        <InvoicePreview
          settings={currentSettings}
          companyInfo={currentCompanyInfo}
          sale={{
            ...selectedSale,
            timestamp: selectedSale.timestamp?.toDate?.() || new Date(selectedSale.timestamp),
            invoiceNumber: selectedSale.invoiceNumber || `INV-${dateFormat(new Date(), 'yyyyMMdd-HHmmss')}`,
            customer: {
              name: selectedSale.customer?.name || selectedSale.customerName || 'Walk-in Customer',
              email: selectedSale.customer?.email || selectedSale.email || '',
              address: selectedSale.customer?.address || selectedSale.address || ''
            }
          }}
          onClose={() => setShowPreview(false)}
          onPrint={() => window.print()}
          onDownload={() => console.log('Download')}
          onEmail={() => {
            const email = prompt('Enter email address:');
            if (email) console.log('Email to:', email);
          }}
        />
      )}
    </div>
  );
}
