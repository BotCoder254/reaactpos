import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDocs,
  serverTimestamp,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';
import toast from 'react-hot-toast';

const FraudDetectionContext = createContext();

export function useFraudDetection() {
  return useContext(FraudDetectionContext);
}

export function FraudDetectionProvider({ children }) {
  const { currentUser } = useAuth();
  const { effectiveRole } = useRole();
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [fraudRules, setFraudRules] = useState({
    transactionThreshold: 1000,
    refundThreshold: 500,
    voidThreshold: 5,
    suspiciousActivityThreshold: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Use a simpler query that doesn't require a composite index
    const alertsQuery = query(
      collection(db, 'fraudAlerts'),
      where('status', '==', 'pending'),
      limit(100)
    );

    const unsubscribe = onSnapshot(alertsQuery, 
      (snapshot) => {
        const alerts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          alerts.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate()
          });
        });
        // Sort alerts in memory instead of using orderBy
        alerts.sort((a, b) => b.timestamp - a.timestamp);
        setFraudAlerts(alerts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching fraud alerts:', error);
        toast.error('Error fetching fraud alerts');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Check transaction against fraud rules
  const checkTransaction = async (transaction) => {
    const flags = [];

    // Check amount threshold
    if (transaction.amount > fraudRules.transactionThreshold) {
      flags.push('High value transaction');
    }

    // Check for multiple transactions
    const recentTransactions = await getRecentTransactions(transaction.customerId);
    if (recentTransactions.length > fraudRules.suspiciousActivityThreshold) {
      flags.push('Multiple transactions in short period');
    }

    return flags;
  };

  // Get recent transactions for a customer
  const getRecentTransactions = async (customerId) => {
    if (!customerId) return [];

    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - 1);

    const q = query(
      collection(db, 'transactions'),
      where('customerId', '==', customerId),
      where('timestamp', '>', timeLimit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  // Flag a transaction as suspicious
  const flagTransaction = async (transactionId, reason) => {
    if (!transactionId || !reason) {
      toast.error('Transaction ID and reason are required');
      return;
    }

    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      await setDoc(transactionRef, {
        status: 'flagged',
        flagReason: reason,
        flaggedBy: currentUser?.uid,
        flaggedAt: serverTimestamp()
      }, { merge: true });

      // Create fraud alert
      const alertRef = doc(collection(db, 'fraudAlerts'));
      await setDoc(alertRef, {
        transactionId,
        reason,
        status: 'pending',
        createdBy: currentUser?.uid,
        timestamp: serverTimestamp()
      });

      toast.success('Transaction flagged for review');
    } catch (error) {
      console.error('Error flagging transaction:', error);
      toast.error('Failed to flag transaction');
    }
  };

  // Update fraud detection rules (manager only)
  const updateFraudRules = async (newRules) => {
    if (effectiveRole !== 'manager') {
      toast.error('Only managers can update fraud rules');
      return;
    }

    try {
      // Validate rules before updating
      if (!newRules || typeof newRules !== 'object') {
        throw new Error('Invalid rules format');
      }

      // Ensure all required fields are numbers and not undefined
      const validatedRules = {
        transactionThreshold: Number(newRules.transactionThreshold) || fraudRules.transactionThreshold,
        refundThreshold: Number(newRules.refundThreshold) || fraudRules.refundThreshold,
        voidThreshold: Number(newRules.voidThreshold) || fraudRules.voidThreshold,
        suspiciousActivityThreshold: Number(newRules.suspiciousActivityThreshold) || fraudRules.suspiciousActivityThreshold
      };

      const rulesRef = doc(db, 'settings', 'fraudRules');
      await updateDoc(rulesRef, {
        ...validatedRules,
        updatedAt: serverTimestamp()
      });

      setFraudRules(validatedRules);
      toast.success('Fraud rules updated successfully');
    } catch (error) {
      console.error('Error updating fraud rules:', error);
      toast.error('Failed to update fraud rules');
      throw error;
    }
  };

  // Resolve fraud alert
  const resolveFraudAlert = async (alertId, resolution) => {
    try {
      if (!alertId || !resolution) {
        throw new Error('Alert ID and resolution are required');
      }

      const alertRef = doc(db, 'fraudAlerts', alertId);
      await updateDoc(alertRef, {
        status: 'resolved',
        resolution,
        resolvedAt: serverTimestamp()
      });

      toast.success('Fraud alert resolved');
    } catch (error) {
      console.error('Error resolving fraud alert:', error);
      toast.error('Failed to resolve fraud alert');
      throw error;
    }
  };

  const value = {
    fraudAlerts,
    fraudRules,
    loading,
    checkTransaction,
    flagTransaction,
    updateFraudRules,
    resolveFraudAlert
  };

  return (
    <FraudDetectionContext.Provider value={value}>
      {children}
    </FraudDetectionContext.Provider>
  );
} 