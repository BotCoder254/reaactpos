import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiShield, FiCheck } from 'react-icons/fi';
import { useFraudDetection } from '../../contexts/FraudDetectionContext';
import toast from 'react-hot-toast';

export default function TransactionVerification({ transaction, onVerify }) {
  const { checkTransaction, flagTransaction } = useFraudDetection();
  const [flags, setFlags] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    const checkForFlags = async () => {
      if (transaction) {
        const transactionFlags = await checkTransaction(transaction);
        setFlags(transactionFlags);
        if (transactionFlags.length > 0) {
          setIsVerifying(true);
        }
      }
    };

    checkForFlags();
  }, [transaction]);

  const handleVerify = () => {
    setIsVerifying(false);
    onVerify();
  };

  const handleFlag = async () => {
    if (!flagReason) {
      toast.error('Please provide a reason for flagging this transaction');
      return;
    }

    await flagTransaction(transaction.id, flagReason);
    setShowFlagModal(false);
    setFlagReason('');
  };

  if (!isVerifying) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-lg w-full mx-4"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Transaction Requires Verification
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                {flags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleVerify}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiCheck className="mr-1" />
                Verify & Proceed
              </button>
              <button
                onClick={() => setShowFlagModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <FiShield className="mr-1" />
                Flag as Suspicious
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flag Transaction Modal */}
      <AnimatePresence>
        {showFlagModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Flag Suspicious Transaction
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for Flagging
                  </label>
                  <textarea
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows="3"
                    placeholder="Describe why this transaction is suspicious..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowFlagModal(false);
                      setFlagReason('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlag}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Flag Transaction
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 