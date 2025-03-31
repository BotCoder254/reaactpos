import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiTrash2, FiPlus, FiEye, FiSettings, FiCreditCard, FiTag, FiUser, FiFileText, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { useInvoiceCustomization } from '../../contexts/InvoiceCustomizationContext';
import Tooltip from '../ui/Tooltip';
import InvoicePreview from './InvoicePreview';
import { format } from 'date-fns';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function InvoiceCustomizer() {
  const { currentUser } = useAuth();
  const { settings, updateSettings, companyInfo, recentSales } = useInvoiceCustomization();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [companyData, setCompanyData] = useState(() => {
    // Try to get from localStorage first
    const savedCompanyData = localStorage.getItem('companyData');
    return savedCompanyData ? JSON.parse(savedCompanyData) : companyInfo || {
      name: '',
      taxId: '',
      address: '',
      phone: '',
      email: '',
      website: ''
    };
  });

  // Save company data to localStorage whenever it changes
  useEffect(() => {
    if (companyData) {
      localStorage.setItem('companyData', JSON.stringify(companyData));
    }
  }, [companyData]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (settings) {
      localStorage.setItem('invoiceSettings', JSON.stringify(settings));
    }
  }, [settings]);

  // Load initial data
  useEffect(() => {
    const savedSettings = localStorage.getItem('invoiceSettings');
    if (savedSettings) {
      updateSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    if (companyInfo && Object.keys(companyInfo).length > 0) {
      setCompanyData(companyInfo);
      localStorage.setItem('companyData', JSON.stringify(companyInfo));
    }
  }, [companyInfo]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newSettings = { ...settings, logo: reader.result };
        updateSettings(newSettings);
        localStorage.setItem('invoiceSettings', JSON.stringify(newSettings));
        if (currentUser?.uid) {
          const settingsRef = doc(db, 'invoiceSettings', currentUser.uid);
          await setDoc(settingsRef, newSettings, { merge: true });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = async (e, type = 'primary') => {
    const color = e.target.value;
    const newSettings = {
      ...settings,
      [type === 'primary' ? 'primaryColor' : 'secondaryColor']: color
    };
    updateSettings(newSettings);
    localStorage.setItem('invoiceSettings', JSON.stringify(newSettings));
    if (currentUser?.uid) {
      const settingsRef = doc(db, 'invoiceSettings', currentUser.uid);
      await setDoc(settingsRef, newSettings, { merge: true });
    }
  };

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    const newCompanyData = {
      ...companyData,
      [name]: value
    };
    setCompanyData(newCompanyData);
    localStorage.setItem('companyData', JSON.stringify(newCompanyData));
  };

  const handleSaveCompanyInfo = async () => {
    if (!currentUser?.uid) return;

    try {
      const companyRef = doc(db, 'companyInfo', currentUser.uid);
      await setDoc(companyRef, companyData, { merge: true });
      
      const newSettings = { ...settings, companyInfo: companyData };
      updateSettings(newSettings);
      localStorage.setItem('invoiceSettings', JSON.stringify(newSettings));
      
      const settingsRef = doc(db, 'invoiceSettings', currentUser.uid);
      await setDoc(settingsRef, newSettings, { merge: true });
    } catch (error) {
      console.error('Error saving company info:', error);
    }
  };

  const handleToggleSetting = async (settingPath) => {
    const paths = settingPath.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    
    for (let i = 0; i < paths.length - 1; i++) {
      current = current[paths[i]];
    }
    
    current[paths[paths.length - 1]] = !current[paths[paths.length - 1]];
    updateSettings(newSettings);
    localStorage.setItem('invoiceSettings', JSON.stringify(newSettings));
    
    if (currentUser?.uid) {
      const settingsRef = doc(db, 'invoiceSettings', currentUser.uid);
      await setDoc(settingsRef, newSettings, { merge: true });
    }
  };

  const handlePreview = (sale) => {
    setSelectedSale(sale);
    setShowPreview(true);
  };

  const formatSaleDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  };

  const getCustomerName = (sale) => {
    if (!sale) return 'N/A';
    if (sale.customer?.name) return sale.customer.name;
    if (sale.customerName) return sale.customerName;
    return 'Walk-in Customer';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Customization</h1>
        {recentSales?.length > 0 && (
          <button
            onClick={() => handlePreview(recentSales[0])}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FiEye className="mr-2" />
            Preview with Latest Sale
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiBriefcase className="mr-2" />
            Company Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="name"
                value={companyData.name}
                onChange={handleCompanyInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID
              </label>
              <input
                type="text"
                name="taxId"
                value={companyData.taxId}
                onChange={handleCompanyInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter tax ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={companyData.address}
                onChange={handleCompanyInfoChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter company address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={companyData.phone}
                onChange={handleCompanyInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={companyData.email}
                onChange={handleCompanyInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={companyData.website}
                onChange={handleCompanyInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter website URL"
              />
            </div>
            <button
              onClick={handleSaveCompanyInfo}
              className="w-full mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Save Company Information
            </button>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiSettings className="mr-2" />
            Branding
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo
              </label>
              <div className="flex items-center space-x-4">
                {settings.logo ? (
                  <div className="relative">
                    <img
                      src={settings.logo}
                      alt="Company logo"
                      className="h-16 w-auto"
                    />
                    <button
                      onClick={() => updateSettings({ ...settings, logo: '' })}
                      className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <FiUpload className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Upload Logo
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => handleColorChange(e, 'primary')}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => handleColorChange(e, 'primary')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => handleColorChange(e, 'secondary')}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => handleColorChange(e, 'secondary')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header Message
              </label>
              <textarea
                value={settings.headerMessage}
                onChange={(e) => updateSettings({ ...settings, headerMessage: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter header message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Footer Message
              </label>
              <textarea
                value={settings.footerMessage}
                onChange={(e) => updateSettings({ ...settings, footerMessage: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter footer message"
              />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiFileText className="mr-2" />
            Invoice Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <textarea
                value={settings.paymentTerms}
                onChange={(e) => updateSettings({ ...settings, paymentTerms: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter payment terms"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.taxSettings?.showTaxDetails}
                  onChange={() => handleToggleSetting('taxSettings.showTaxDetails')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Show Tax Details
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showDiscountDetails}
                  onChange={() => handleToggleSetting('showDiscountDetails')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Show Discount Details
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showLoyaltyPoints}
                  onChange={() => handleToggleSetting('showLoyaltyPoints')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Show Loyalty Points
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiDollarSign className="mr-2" />
            Recent Sales
          </h2>
          <div className="space-y-4">
            {recentSales?.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getCustomerName(sale)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatSaleDate(sale.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreview(sale)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent sales available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && selectedSale && (
        <InvoicePreview
          settings={settings}
          companyInfo={companyData}
          sale={{
            ...selectedSale,
            timestamp: selectedSale.timestamp?.toDate?.() || new Date(selectedSale.timestamp),
            invoiceNumber: selectedSale.invoiceNumber || `INV-${format(new Date(), 'yyyyMMdd-HHmmss')}`,
            customer: {
              name: getCustomerName(selectedSale),
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
