import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiUserCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RoleSwitcher() {
  const { currentUser } = useAuth();
  const {
    effectiveRole,
    isTemporaryRole,
    roleRequest,
    isLoading,
    requestRoleElevation,
    switchToCashierRole,
    revertToBaseRole,
  } = useRole();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60);

  const handleRoleRequest = async () => {
    if (!reason) {
      toast.error('Please provide a reason for role elevation');
      return;
    }
    await requestRoleElevation(reason);
    setShowRequestModal(false);
    setReason('');
  };

  const handleRoleSwitch = async () => {
    if (effectiveRole === 'manager') {
      await switchToCashierRole(duration);
    } else {
      setShowRequestModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          {isTemporaryRole ? (
            <button
              onClick={revertToBaseRole}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg flex items-center space-x-2"
            >
              <FiUserCheck className="h-5 w-5" />
              <span>Revert Role</span>
            </button>
          ) : (
            <button
              onClick={handleRoleSwitch}
              disabled={isLoading || roleRequest?.status === 'pending'}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg flex items-center space-x-2"
            >
              <FiUserPlus className="h-5 w-5" />
              <span>
                {effectiveRole === 'manager'
                  ? 'Switch to Cashier'
                  : 'Request Manager Access'}
              </span>
            </button>
          )}
        </motion.div>
      </div>

      {/* Role Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Request Manager Access
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for Request
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows="3"
                    placeholder="Please explain why you need manager access..."
                  />
                </div>
                {effectiveRole === 'manager' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>4 hours</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRoleRequest}
                    disabled={isLoading || !reason}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pending Request Indicator */}
      <AnimatePresence>
        {roleRequest?.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full shadow-lg flex items-center space-x-2"
          >
            <FiAlertCircle className="h-5 w-5" />
            <span>Role elevation request pending</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 