import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowLeft, FiUser, FiClock, FiShoppingCart, FiMapPin, FiCheckCircle, FiXCircle, FiDownload, FiPrinter } from 'react-icons/fi';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function InvestigateAlert() {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [relatedTransactions, setRelatedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let unsubscribeAlert;
    let unsubscribeTransactions;

    const setupRealTimeListeners = async () => {
      try {
        // Real-time listener for alert
        const alertRef = doc(db, 'self-checkout-logs', alertId);
        unsubscribeAlert = onSnapshot(alertRef, (doc) => {
          if (doc.exists()) {
            const alertData = {
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate()
            };
            setAlert(alertData);
          }
        }, (error) => {
          console.error('Error in alert listener:', error);
          toast.error('Error monitoring alert updates');
        });

        // Get initial alert data to set up transaction listener
        const alertDoc = await getDoc(alertRef);
        if (alertDoc.exists()) {
          const alertData = alertDoc.data();

          // Real-time listener for related transactions
          const transactionsQuery = query(
            collection(db, 'self-checkout-logs'),
            where('stationId', '==', alertData.stationId),
            where('action', '==', 'complete_transaction')
          );

          unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const transactions = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate()
            }));
            setRelatedTransactions(transactions);
          }, (error) => {
            console.error('Error in transactions listener:', error);
            toast.error('Error monitoring transaction updates');
          });
        }
      } catch (error) {
        console.error('Error setting up listeners:', error);
        toast.error('Failed to load alert details');
      } finally {
        setLoading(false);
      }
    };

    setupRealTimeListeners();

    // Cleanup listeners
    return () => {
      if (unsubscribeAlert) unsubscribeAlert();
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, [alertId]);

  const handleResolveAlert = async (resolution) => {
    try {
      setProcessing(true);
      const alertRef = doc(db, 'self-checkout-logs', alertId);
      
      // Update alert status
      await updateDoc(alertRef, {
        status: resolution,
        resolvedAt: new Date(),
        resolution: resolution === 'resolved' ? 'No fraud detected' : 'Fraud confirmed',
        resolvedBy: 'manager', // You might want to get this from auth context
        lastUpdated: new Date()
      });

      // If it's fraud, update related station status
      if (resolution === 'fraud' && alert.stationId) {
        const stationRef = doc(db, 'self-checkout-stations', alert.stationId);
        await updateDoc(stationRef, {
          status: 'blocked',
          lastFraudAlert: new Date(),
          needsManagerReview: true
        });
      }

      // Add resolution to activity log
      await addDoc(collection(db, 'activity-logs'), {
        type: 'alert_resolution',
        alertId,
        resolution,
        timestamp: new Date(),
        stationId: alert.stationId,
        resolvedBy: 'manager' // You might want to get this from auth context
      });

      toast.success(resolution === 'resolved' ? 'Alert marked as resolved' : 'Fraud confirmed and station blocked');
      navigate('/monitor');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to update alert status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    setGenerating(true);
    const content = document.getElementById('alert-content');
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Alert Report - ${alertId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; }
            .value { color: #666; }
            .transaction { border: 1px solid #eee; padding: 10px; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Alert Investigation Report</h1>
            <p>Alert ID: ${alertId}</p>
          </div>
          <div class="section">
            <h2>Alert Details</h2>
            <p><span class="label">Time:</span> <span class="value">${alert.timestamp.toLocaleString()}</span></p>
            <p><span class="label">Station:</span> <span class="value">${alert.stationId}</span></p>
            <p><span class="label">Severity:</span> <span class="value">${alert.severity}</span></p>
            <p><span class="label">Status:</span> <span class="value">${alert.status || 'Pending'}</span></p>
          </div>
          ${alert.customerDetails ? `
            <div class="section">
              <h2>Customer Details</h2>
              <p><span class="label">Name:</span> <span class="value">${alert.customerDetails.name}</span></p>
            </div>
          ` : ''}
          <div class="section">
            <h2>Related Transactions</h2>
            ${relatedTransactions.map(transaction => `
              <div class="transaction">
                <p><span class="label">Time:</span> <span class="value">${transaction.timestamp.toLocaleString()}</span></p>
                <p><span class="label">Total:</span> <span class="value">$${transaction.total?.toFixed(2) || '0.00'}</span></p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      setGenerating(false);
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-center text-gray-500">Alert not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/monitor')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Back to Monitor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8" id="alert-content">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiAlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            Alert Investigation
          </h1>
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              <FiDownload className="w-5 h-5 mr-2" />
              {generating ? 'Generating...' : 'Download PDF'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
            >
              <FiPrinter className="w-5 h-5 mr-2" />
              Print
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleResolveAlert('resolved')}
              disabled={processing || alert.status === 'resolved'}
              className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
            >
              <FiCheckCircle className="w-5 h-5 mr-2" />
              {processing ? 'Processing...' : 'Mark as Resolved'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleResolveAlert('fraud')}
              disabled={processing || alert.status === 'fraud'}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
            >
              <FiXCircle className="w-5 h-5 mr-2" />
              {processing ? 'Processing...' : 'Confirm Fraud'}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Details</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FiClock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Time</p>
                    <p className="text-sm text-gray-500">{alert.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Station</p>
                    <p className="text-sm text-gray-500">{alert.stationId}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiAlertTriangle className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Severity</p>
                    <p className="text-sm text-gray-500">{alert.severity}</p>
                  </div>
                </div>
                {alert.status && (
                  <div className="flex items-center">
                    <FiCheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status</p>
                      <p className={`text-sm ${
                        alert.status === 'resolved' ? 'text-green-500' : 
                        alert.status === 'fraud' ? 'text-red-500' : 
                        'text-gray-500'
                      }`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {alert.customerDetails && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FiUser className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Name</p>
                      <p className="text-sm text-gray-500">{alert.customerDetails.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Transactions</h2>
              <div className="space-y-4">
                {relatedTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.timestamp.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Total: ${transaction.total?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <FiShoppingCart className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
                {relatedTransactions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No related transactions found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style type="text/css" media="print">
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #alert-content, #alert-content * {
              visibility: visible;
            }
            #alert-content {
              position: absolute;
              left: 0;
              top: 0;
            }
            .no-print {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
} 
