import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheck, FiX, FiSettings } from 'react-icons/fi';
import { format } from 'date-fns';
import { useFraudDetection } from '../../contexts/FraudDetectionContext';
import toast from 'react-hot-toast';

export default function FraudMonitoring() {
  const { fraudAlerts, fraudRules, updateFraudRules, resolveFraudAlert } = useFraudDetection();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolution, setResolution] = useState('');
  const [newRules, setNewRules] = useState(fraudRules);

  const handleRuleUpdate = async () => {
    await updateFraudRules(newRules);
    setShowRulesModal(false);
  };

  const handleResolve = async (alertId) => {
    if (!resolution) {
      toast.error('Please provide a resolution');
      return;
    }
    await resolveFraudAlert(alertId, resolution);
    setSelectedAlert(null);
    setResolution('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Fraud Detection Monitor</h2>
        <button
          onClick={() => setShowRulesModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <FiSettings className="mr-2" />
          Configure Rules
        </button>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <AnimatePresence>
          {fraudAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Transaction ID: {alert.transactionId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(alert.timestamp, 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {alert.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <FiCheck className="mr-1" />
                    Resolve
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {fraudAlerts.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No fraud alerts
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Rules Configuration Modal */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-2xl w-full"
            >
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                Fraud Detection Rules Configuration
              </h3>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <label className="block text-base font-medium text-gray-700 mb-3">
                    Transaction Amount Threshold ($)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={newRules.transactionThreshold}
                      onChange={(e) => setNewRules({
                        ...newRules,
                        transactionThreshold: Number(e.target.value)
                      })}
                      className="flex-1 px-4 py-3 text-lg border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Enter amount threshold"
                    />
                    <span className="ml-2 text-gray-500">USD</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Transactions above this amount will be flagged for review
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <label className="block text-base font-medium text-gray-700 mb-3">
                    Refund Amount Threshold ($)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={newRules.refundThreshold}
                      onChange={(e) => setNewRules({
                        ...newRules,
                        refundThreshold: Number(e.target.value)
                      })}
                      className="flex-1 px-4 py-3 text-lg border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Enter refund threshold"
                    />
                    <span className="ml-2 text-gray-500">USD</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Refunds above this amount will require manager approval
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <label className="block text-base font-medium text-gray-700 mb-3">
                    Void Transaction Threshold (per hour)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={newRules.voidThreshold}
                      onChange={(e) => setNewRules({
                        ...newRules,
                        voidThreshold: Number(e.target.value)
                      })}
                      className="flex-1 px-4 py-3 text-lg border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Enter void threshold"
                    />
                    <span className="ml-2 text-gray-500">transactions</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Number of void transactions allowed per hour before flagging
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <label className="block text-base font-medium text-gray-700 mb-3">
                    Suspicious Activity Threshold (transactions per hour)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={newRules.suspiciousActivityThreshold}
                      onChange={(e) => setNewRules({
                        ...newRules,
                        suspiciousActivityThreshold: Number(e.target.value)
                      })}
                      className="flex-1 px-4 py-3 text-lg border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Enter transaction threshold"
                    />
                    <span className="ml-2 text-gray-500">transactions</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Maximum number of transactions per customer per hour before flagging
                  </p>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={() => setShowRulesModal(false)}
                    className="px-6 py-3 text-base font-medium text-gray-700 hover:text-gray-500 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRuleUpdate}
                    className="px-6 py-3 bg-primary-600 text-white text-base font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Save Rules
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Resolution Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resolve Fraud Alert
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Resolution Details
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows="3"
                    placeholder="Explain how this alert was resolved..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedAlert(null);
                      setResolution('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResolve(selectedAlert.id)}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Confirm Resolution
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 