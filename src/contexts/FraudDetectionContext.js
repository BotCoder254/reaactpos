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
  getDoc
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

  // Load fraud rules on mount
  useEffect(() => {
    const loadFraudRules = async () => {
      try {
        const rulesRef = doc(db, 'settings', 'fraudRules');
        const rulesDoc = await getDoc(rulesRef);
        
        if (rulesDoc.exists()) {
          setFraudRules(rulesDoc.data());
        } else {
          // Create initial fraud rules document
          await setDoc(rulesRef, {
            ...fraudRules,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error loading fraud rules:', error);
        toast.error('Failed to load fraud rules');
      }
    };

    loadFraudRules();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const alertsQuery = query(
      collection(db, 'fraudAlerts'),
      where('status', '==', 'pending')
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
        alerts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
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

  const updateFraudRules = async (newRules) => {
    if (effectiveRole !== 'manager') {
      toast.error('Only managers can update fraud rules');
      return;
    }

    try {
      if (!newRules || typeof newRules !== 'object') {
        throw new Error('Invalid rules format');
      }

      const validatedRules = {
        transactionThreshold: Number(newRules.transactionThreshold) || fraudRules.transactionThreshold,
        refundThreshold: Number(newRules.refundThreshold) || fraudRules.refundThreshold,
        voidThreshold: Number(newRules.voidThreshold) || fraudRules.voidThreshold,
        suspiciousActivityThreshold: Number(newRules.suspiciousActivityThreshold) || fraudRules.suspiciousActivityThreshold
      };

      const rulesRef = doc(db, 'settings', 'fraudRules');
      await setDoc(rulesRef, {
        ...validatedRules,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setFraudRules(validatedRules);
      toast.success('Fraud rules updated successfully');
    } catch (error) {
      console.error('Error updating fraud rules:', error);
      toast.error('Failed to update fraud rules');
    }
  };

  const checkTransaction = async (transaction) => {
    if (!transaction || !transaction.amount) return [];
    
    const flags = [];

    if (transaction.amount > fraudRules.transactionThreshold) {
      flags.push('High value transaction');
    }

    if (transaction.customerId) {
      const recentTransactions = await getRecentTransactions(transaction.customerId);
      if (recentTransactions.length > fraudRules.suspiciousActivityThreshold) {
        flags.push('Multiple transactions in short period');
      }
    }

    return flags;
  };

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

  const resolveFraudAlert = async (alertId, resolution) => {
    try {
      if (!alertId || !resolution) {
        throw new Error('Alert ID and resolution are required');
      }

      const alertRef = doc(db, 'fraudAlerts', alertId);
      await setDoc(alertRef, {
        status: 'resolved',
        resolution,
        resolvedAt: serverTimestamp(),
        resolvedBy: currentUser?.uid
      }, { merge: true });

      toast.success('Fraud alert resolved');
    } catch (error) {
      console.error('Error resolving fraud alert:', error);
      toast.error('Failed to resolve fraud alert');
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