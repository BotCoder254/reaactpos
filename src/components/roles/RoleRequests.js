import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useRole } from '../../contexts/RoleContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function RoleRequests() {
  const { approveRoleRequest } = useRole();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [duration, setDuration] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'roleRequests'),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));
      setRequests(newRequests);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (request) => {
    try {
      setIsLoading(true);
      await approveRoleRequest(request.userId, duration);
      setSelectedRequest(null);
      toast.success('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = async (requestId) => {
    try {
      setIsLoading(true);
      const requestRef = doc(db, 'roleRequests', requestId);
      await setDoc(requestRef, { status: 'denied' }, { merge: true });
      toast.success('Request denied');
    } catch (error) {
      console.error('Error denying request:', error);
      toast.error('Failed to deny request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Role Elevation Requests</h2>
      
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <AnimatePresence>
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {request.userId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(request.timestamp, 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {request.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    <FiCheck className="mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(request.id)}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <FiX className="mr-1" />
                    Deny
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {requests.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No pending role requests
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Approval Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Approve Role Elevation
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duration
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
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Confirm Approval'}
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