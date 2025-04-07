import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHelpCircle, FiMonitor, FiLock, FiUnlock, FiShoppingCart, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function RemoteAssistance() {
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isControlling, setIsControlling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for assistance requests from stations
    const stationsQuery = query(
      collection(db, 'self-checkout-stations'),
      where('needsAssistance', '==', true)
    );

    // Listen for pending assistance requests
    const requestsQuery = query(
      collection(db, 'assistance-requests'),
      where('status', '==', 'pending')
    );

    const unsubscribeStations = onSnapshot(stationsQuery, (snapshot) => {
      const stations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'station',
        timestamp: doc.data().lastAssistanceRequest || new Date()
      }));
      updateRequests(stations);
    });

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'request'
      }));
      updateRequests(requests);
    });

    return () => {
      unsubscribeStations();
      unsubscribeRequests();
    };
  }, []);

  const updateRequests = (newRequests) => {
    setAssistanceRequests(prev => {
      const combined = [...prev, ...newRequests];
      // Remove duplicates and sort by timestamp
      const unique = combined.filter((request, index, self) =>
        index === self.findIndex(r => r.stationId === request.stationId)
      ).sort((a, b) => (b.timestamp?.toDate?.() || b.timestamp) - (a.timestamp?.toDate?.() || a.timestamp));
      return unique;
    });
    setLoading(false);
  };

  const handleTakeControl = async (request) => {
    if (!selectedStation) {
      try {
        setSelectedStation(request.stationId);
        setIsControlling(true);
        
        // Update station status
        await updateDoc(doc(db, 'self-checkout-stations', request.stationId), {
          isRemoteControlled: true,
          controlledBy: 'cashier_id', // Replace with actual cashier ID
          lastControlTime: new Date()
        });

        // Update request status if it's from assistance-requests
        if (request.source === 'request') {
          await updateDoc(doc(db, 'assistance-requests', request.id), {
            status: 'in_progress'
          });
        }

        toast.success('Now controlling station ' + request.stationId);
      } catch (error) {
        console.error('Error taking control:', error);
        toast.error('Failed to take control');
        setSelectedStation(null);
        setIsControlling(false);
      }
    }
  };

  const handleReleaseControl = async () => {
    if (selectedStation) {
      try {
        await updateDoc(doc(db, 'self-checkout-stations', selectedStation), {
          isRemoteControlled: false,
          controlledBy: null,
          needsAssistance: false
        });

        // Update all pending requests for this station
        const requestsQuery = query(
          collection(db, 'assistance-requests'),
          where('stationId', '==', selectedStation),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(requestsQuery);
        snapshot.docs.forEach(async (doc) => {
          await updateDoc(doc.ref, { status: 'completed' });
        });

        toast.success('Released control of station ' + selectedStation);
        setSelectedStation(null);
        setIsControlling(false);
      } catch (error) {
        console.error('Error releasing control:', error);
        toast.error('Failed to release control');
      }
    }
  };

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
            {assistanceRequests.map((request) => (
              <motion.div
                key={request.id}
                whileHover={{ scale: 1.02 }}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Station {request.stationId}</h3>
                    <p className="text-sm text-gray-500">
                      Requested at {new Date(request.timestamp?.toDate()).toLocaleString()}
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
            ))}
            {assistanceRequests.length === 0 && (
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
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200"
                >
                  View Transaction Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200"
                >
                  Apply Discount
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200"
                >
                  Void Item
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200"
                >
                  Process Payment
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
