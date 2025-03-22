import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiImage, FiEye } from 'react-icons/fi';
import { getReceiptBranding, updateReceiptBranding, generateReceiptHTML } from '../../utils/receiptQueries';
import { useAuth } from '../../contexts/AuthContext';

const ReceiptBrandingManager = () => {
  const [branding, setBranding] = useState({
    logo: '',
    businessName: '',
    slogan: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    footerText: '',
    showLogo: true,
    showSlogan: true,
    showContact: true,
    fontSize: 'normal',
    theme: 'classic'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { userRole } = useAuth();

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const data = await getReceiptBranding();
      setBranding(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching branding:', err);
      setError('Failed to load receipt branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await updateReceiptBranding(branding);
      setError('Settings saved successfully');
    } catch (err) {
      console.error('Error saving branding:', err);
      setError('Failed to save receipt branding settings');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const sampleSaleData = {
    id: 'SAMPLE-001',
    timestamp: new Date(),
    cashierName: 'John Doe',
    items: [
      { name: 'Sample Product 1', quantity: 2, price: 19.99 },
      { name: 'Sample Product 2', quantity: 1, price: 29.99 }
    ],
    subtotal: 69.97,
    tax: 7.00,
    discount: 5.00,
    total: 71.97
  };

  if (userRole !== 'manager') {
    return (
      <div className="p-4">
        <p className="text-gray-600">Only managers can access receipt branding settings.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Receipt Branding</h2>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700"
          >
            <FiEye className="mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700"
          >
            <FiSave className="mr-2" />
            Save Changes
          </motion.button>
        </div>
      </div>

      {error && (
        <div className={`mb-4 p-4 border-l-4 ${
          error === 'Settings saved successfully'
            ? 'bg-green-50 border-green-500 text-green-700'
            : 'bg-red-50 border-red-500 text-red-700'
        }`}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Branding Settings</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Logo</label>
              <div className="mt-1 flex items-center space-x-4">
                {branding.logo && (
                  <div className="relative group">
                    <img src={branding.logo} alt="Logo" className="h-16 w-16 object-contain border rounded-lg" />
                    <button
                      onClick={() => setBranding({ ...branding, logo: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <label className="cursor-pointer bg-white px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <FiImage className="inline-block mr-2" />
                  Upload Logo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                type="text"
                value={branding.businessName}
                onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
                className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Slogan</label>
              <input
                type="text"
                value={branding.slogan}
                onChange={(e) => setBranding({ ...branding, slogan: e.target.value })}
                className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter your business slogan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={branding.address}
                onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter your business address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={branding.phone}
                  onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                  className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={branding.email}
                  onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                  className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={branding.website}
                onChange={(e) => setBranding({ ...branding, website: e.target.value })}
                className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter website URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Footer Text</label>
              <textarea
                value={branding.footerText}
                onChange={(e) => setBranding({ ...branding, footerText: e.target.value })}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter footer message"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Font Size</label>
                <select
                  value={branding.fontSize}
                  onChange={(e) => setBranding({ ...branding, fontSize: e.target.value })}
                  className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={branding.theme}
                  onChange={(e) => setBranding({ ...branding, theme: e.target.value })}
                  className="mt-1 block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={branding.showLogo}
                  onChange={(e) => setBranding({ ...branding, showLogo: e.target.checked })}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">Show Logo on Receipt</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={branding.showSlogan}
                  onChange={(e) => setBranding({ ...branding, showSlogan: e.target.checked })}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">Show Slogan on Receipt</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={branding.showContact}
                  onChange={(e) => setBranding({ ...branding, showContact: e.target.checked })}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">Show Contact Information on Receipt</label>
              </div>
            </div>
          </form>
        </div>

        {showPreview && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Receipt Preview</h3>
            </div>
            <div
              className="p-4 overflow-auto max-h-[800px]"
              dangerouslySetInnerHTML={{
                __html: generateReceiptHTML(branding, sampleSaleData)
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptBrandingManager; 