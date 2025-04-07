import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHelpCircle, FiMonitor, FiLock, FiUnlock, FiShoppingCart, FiUser, FiPhone, FiMail, FiDollarSign, FiTrash2, FiEye } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, setDoc, addDoc, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function RemoteAssistance() {
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isControlling, setIsControlling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  useEffect(() => {
    // Listen for assistance requests from stations
    const requestsQuery = query(
      collection(db, 'assistance-requests'),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      // Sort requests by timestamp
      const sortedRequests = requests.sort((a, b) => b.timestamp - a.timestamp);
      setAssistanceRequests(sortedRequests);
      setLoading(false);
    });

    return () => {
      unsubscribeRequests();
    };
  }, []);

  const handleTakeControl = async (request) => {
    if (!selectedStation) {
      try {
        setIsControlling(true);
        
        // First ensure the station document exists
        const stationRef = doc(db, 'self-checkout-stations', request.stationId);
        await setDoc(stationRef, {
          status: 'active',
          needsAssistance: true,
          isRemoteControlled: true,
          controlledBy: 'cashier_id', // Replace with actual cashier ID
          lastControlTime: new Date(),
          currentCustomer: request.currentCustomer || null
        }, { merge: true });

        // Update the assistance request
        const requestRef = doc(db, 'assistance-requests', request.id);
        await updateDoc(requestRef, {
          status: 'in_progress',
          controlledBy: 'cashier_id', // Replace with actual cashier ID
          controlStartTime: new Date()
        });

        setSelectedStation(request.stationId);
        toast.success('Now controlling station ' + request.stationId);
      } catch (error) {
        console.error('Error taking control:', error);
        toast.error('Failed to take control. Please try again.');
        setIsControlling(false);
      }
    }
  };

  const handleReleaseControl = async () => {
    if (selectedStation) {
      try {
        // Update station status
        const stationRef = doc(db, 'self-checkout-stations', selectedStation);
        await setDoc(stationRef, {
          isRemoteControlled: false,
          controlledBy: null,
          needsAssistance: false,
          status: 'active'
        }, { merge: true });

        // Update all pending requests for this station
        const requestsQuery = query(
          collection(db, 'assistance-requests'),
          where('stationId', '==', selectedStation),
          where('status', 'in', ['pending', 'in_progress'])
        );
        
        const snapshot = await getDocs(requestsQuery);
        const updatePromises = snapshot.docs.map(doc => 
          updateDoc(doc.ref, { 
            status: 'completed',
            completedAt: new Date(),
            completedBy: 'cashier_id' // Replace with actual cashier ID
          })
        );
        
        await Promise.all(updatePromises);

        toast.success('Released control of station ' + selectedStation);
        setSelectedStation(null);
        setIsControlling(false);
      } catch (error) {
        console.error('Error releasing control:', error);
        toast.error('Failed to release control. Please try again.');
      }
    }
  };

  const handleViewTransaction = async () => {
    try {
      const stationRef = doc(db, 'self-checkout-stations', selectedStation);
      const stationDoc = await getDoc(stationRef);
      
      if (stationDoc.exists()) {
        const data = stationDoc.data();
        setCurrentTransaction(data.currentTransaction || null);
        setShowTransactionDetails(true);
      } else {
        toast.error('Station not found');
      }
      
    } catch (error) {
      console.error('Error viewing transaction:', error);
      toast.error('Failed to load transaction details');
    }
  };

  const handleApplyDiscount = async (amount) => {
    try {
      const stationRef = doc(db, 'self-checkout-stations', selectedStation);
      await updateDoc(stationRef, {
        'currentTransaction.discount': Number(amount),
        'currentTransaction.lastUpdated': new Date()
      });

      await addDoc(collection(db, 'self-checkout-logs'), {
        action: 'apply_discount',
        stationId: selectedStation,
        amount: Number(amount),
        timestamp: new Date(),
        appliedBy: 'cashier_id' // Replace with actual cashier ID
      });

      setShowDiscountModal(false);
      setDiscountAmount('');
      toast.success(`Discount of $${amount} applied successfully`);
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount');
    }
  };

  const handleVoidItem = async (itemId) => {
    try {
      const stationRef = doc(db, 'self-checkout-stations', selectedStation);
      const stationDoc = await getDoc(stationRef);
      
      if (stationDoc.exists()) {
        const data = stationDoc.data();
        const currentCart = data.currentTransaction?.cart || [];
        const updatedCart = currentCart.filter(item => item.id !== itemId);
        
        await updateDoc(stationRef, {
          'currentTransaction.cart': updatedCart,
          'currentTransaction.lastUpdated': new Date()
        });

        await addDoc(collection(db, 'self-checkout-logs'), {
          action: 'void_item',
          stationId: selectedStation,
          itemId: itemId,
          timestamp: new Date(),
          voidedBy: 'cashier_id' // Replace with actual cashier ID
        });

        // Refresh transaction details after voiding
        const updatedStationDoc = await getDoc(stationRef);
        if (updatedStationDoc.exists()) {
          setCurrentTransaction(updatedStationDoc.data().currentTransaction || null);
        }

        toast.success('Item voided successfully');
      }
    } catch (error) {
      console.error('Error voiding item:', error);
      toast.error('Failed to void item');
    }
  };

  const handleProcessPayment = async () => {
    try {
      const stationRef = doc(db, 'self-checkout-stations', selectedStation);
      await updateDoc(stationRef, {
        'currentTransaction.status': 'completed',
        'currentTransaction.completedAt': new Date(),
        'currentTransaction.completedBy': 'cashier_id', // Replace with actual cashier ID
        needsAssistance: false,
        isRemoteControlled: false
      });

      await addDoc(collection(db, 'self-checkout-logs'), {
        action: 'complete_transaction',
        stationId: selectedStation,
        timestamp: new Date(),
        completedBy: 'cashier_id' // Replace with actual cashier ID
      });

      setSelectedStation(null);
      setIsControlling(false);
      toast.success('Payment processed successfully');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  // Discount Modal Component
  const DiscountModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply Discount</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Amount ($)
            </label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter discount amount"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDiscountModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApplyDiscount(discountAmount)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              disabled={!discountAmount || Number(discountAmount) <= 0}
            >
              Apply Discount
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Transaction Details Modal Component
  const TransactionDetailsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Details</h2>
        {currentTransaction ? (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium text-gray-900">Items</h3>
              <div className="mt-2 space-y-2">
                {currentTransaction.cart?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      <button
                        onClick={() => handleVoidItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${currentTransaction.subtotal?.toFixed(2)}</span>
              </div>
              {currentTransaction.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${currentTransaction.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${(currentTransaction.subtotal - (currentTransaction.discount || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No active transaction</p>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowTransactionDetails(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Remote Assistance</h1>

        {/* Active Assistance Requests */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Assistance Requests
          </h2>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : assistanceRequests.length > 0 ? (
              assistanceRequests.map((request) => (
                <motion.div
                  key={request.id}
                  whileHover={{ scale: 1.02 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Station {request.stationId}</h3>
                      <p className="text-sm text-gray-500">
                        Requested at {request.timestamp.toLocaleString()}
                      </p>
                      {request.currentCustomer && (
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiUser className="mr-2" />
                            {request.currentCustomer.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FiPhone className="mr-2" />
                            {request.currentCustomer.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMail className="mr-2" />
                            {request.currentCustomer.email}
                          </div>
                        </div>
                      )}
                      {request.cart && request.cart.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiShoppingCart className="mr-2" />
                            {request.cart.length} items (${request.subtotal?.toFixed(2)})
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedStation === request.stationId ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReleaseControl()}
                        className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <FiUnlock className="mr-2" />
                        Release Control
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTakeControl(request)}
                        className="flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
                        disabled={selectedStation !== null}
                      >
                        <FiLock className="mr-2" />
                        Take Control
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FiHelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No active assistance requests</p>
              </div>
            )}
          </div>
        </div>

        {/* Remote Control Interface */}
        {selectedStation && (
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Remote Control - Station {selectedStation}
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FiMonitor className="h-6 w-6 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    Currently controlling Station {selectedStation}
                  </span>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Active
                </span>
              </div>

              {/* Remote Control Actions */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewTransaction}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 flex items-center justify-center"
                >
                  <FiEye className="mr-2" />
                  View Transaction Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDiscountModal(true)}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 flex items-center justify-center"
                >
                  <FiDollarSign className="mr-2" />
                  Apply Discount
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowTransactionDetails(true)}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 flex items-center justify-center"
                >
                  <FiTrash2 className="mr-2" />
                  Void Items
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProcessPayment}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 flex items-center justify-center"
                >
                  <FiShoppingCart className="mr-2" />
                  Process Payment
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showDiscountModal && <DiscountModal />}
        {showTransactionDetails && <TransactionDetailsModal />}
      </div>
    </div>
  );
} 
