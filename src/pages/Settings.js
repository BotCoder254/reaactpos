import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiPrinter, FiSettings } from 'react-icons/fi';
import DynamicPricingManager from '../components/pricing/DynamicPricingManager';
import ReceiptBrandingManager from '../components/settings/ReceiptBrandingManager';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('pricing');
  const { userRole } = useAuth();

  const tabs = [
    {
      id: 'pricing',
      name: 'Dynamic Pricing',
      icon: FiDollarSign,
      component: DynamicPricingManager,
      allowedRoles: ['manager']
    },
    {
      id: 'receipt',
      name: 'Receipt Branding',
      icon: FiPrinter,
      component: ReceiptBrandingManager,
      allowedRoles: ['manager']
    },
    {
      id: 'general',
      name: 'General Settings',
      icon: FiSettings,
      component: () => <div className="p-4">General settings content</div>,
      allowedRoles: ['manager', 'cashier']
    }
  ];

  const filteredTabs = tabs.filter(tab => 
    tab.allowedRoles.includes(userRole)
  );

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || (() => null);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Settings
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          ${activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                          group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                        `}
                      >
                        <Icon
                          className={`
                            ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                            -ml-0.5 mr-2 h-5 w-5
                          `}
                          aria-hidden="true"
                        />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-6">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActiveComponent />
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings; 