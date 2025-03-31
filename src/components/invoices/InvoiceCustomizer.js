import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';
import { useInvoiceCustomization } from '../../contexts/InvoiceCustomizationContext';
import Tooltip from '../ui/Tooltip';
import InvoicePreview from './InvoicePreview';

export default function InvoiceCustomizer() {
  const { settings, updateSettings, addTemplate, removeTemplate } = useInvoiceCustomization();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newField, setNewField] = useState({ name: '', type: 'text' });
  const [selectedColor, setSelectedColor] = useState(settings.primaryColor || '#2563eb');

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ ...settings, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    updateSettings({ ...settings, primaryColor: color });
  };

  const handleAddField = () => {
    if (newField.name) {
      updateSettings({
        ...settings,
        additionalFields: [
          ...settings.additionalFields,
          { id: Date.now(), ...newField }
        ]
      });
      setNewField({ name: '', type: 'text' });
    }
  };

  const handleRemoveField = (fieldId) => {
    updateSettings({
      ...settings,
      additionalFields: settings.additionalFields.filter(field => field.id !== fieldId)
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Invoice Customization</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPreview(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiEye className="w-5 h-5 mr-2" />
          Preview
        </motion.button>
      </div>

      {/* Branding Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Branding</h3>
        
        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          <div className="flex items-center space-x-4">
            {settings.logo && (
              <img
                src={settings.logo}
                alt="Company logo"
                className="h-16 w-auto object-contain"
              />
            )}
            <div className="flex-1">
              <label className="cursor-pointer">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-blue-500"
                >
                  <FiUpload className="w-5 h-5 mr-2" />
                  Upload Logo
                </motion.div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Brand Color */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Color
          </label>
          <div className="flex items-center space-x-4">
            <div
              className="w-10 h-10 rounded-lg shadow-inner"
              style={{ backgroundColor: selectedColor }}
            />
            <input
              type="color"
              value={selectedColor}
              onChange={handleColorChange}
              className="h-10 w-full cursor-pointer rounded-lg border-2 border-gray-300 bg-white p-1 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Message
            </label>
            <textarea
              value={settings.headerMessage || ''}
              onChange={(e) =>
                updateSettings({ ...settings, headerMessage: e.target.value })
              }
              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Footer Message
            </label>
            <textarea
              value={settings.footerMessage || ''}
              onChange={(e) =>
                updateSettings({ ...settings, footerMessage: e.target.value })
              }
              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200"
              rows="2"
            />
          </div>
        </div>
      </section>

      {/* Additional Fields Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Fields</h3>
        
        <div className="space-y-4 mb-6">
          {settings.additionalFields.map((field) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg"
            >
              <div>
                <span className="font-medium">{field.name}</span>
                <span className="ml-2 text-sm text-gray-500">({field.type})</span>
              </div>
              <Tooltip content="Remove field">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveField(field.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiTrash2 className="w-5 h-5" />
                </motion.button>
              </Tooltip>
            </motion.div>
          ))}
        </div>

        <div className="flex space-x-4">
          <input
            type="text"
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            placeholder="Field name"
            className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
          <select
            value={newField.type}
            onChange={(e) => setNewField({ ...newField, type: e.target.value })}
            className="p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddField}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add Field
          </motion.button>
        </div>
      </section>

      {/* Preview Modal */}
      {showPreview && (
        <InvoicePreview
          settings={settings}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
} 
