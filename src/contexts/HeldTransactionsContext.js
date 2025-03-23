import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const HeldTransactionsContext = createContext();

export function useHeldTransactions() {
  return useContext(HeldTransactionsContext);
}

export function HeldTransactionsProvider({ children }) {
  const [heldTransactions, setHeldTransactions] = useState([]);
  const { currentUser } = useAuth();

  const holdTransaction = (transaction) => {
    const heldTransaction = {
      ...transaction,
      id: Date.now(),
      timestamp: new Date(),
      cashierId: currentUser?.uid,
    };
    setHeldTransactions(prev => [...prev, heldTransaction]);
    return heldTransaction.id;
  };

  const resumeTransaction = (transactionId) => {
    const transaction = heldTransactions.find(t => t.id === transactionId);
    if (transaction) {
      setHeldTransactions(prev => prev.filter(t => t.id !== transactionId));
      return transaction;
    }
    return null;
  };

  const removeHeldTransaction = (transactionId) => {
    setHeldTransactions(prev => prev.filter(t => t.id !== transactionId));
  };

  const value = {
    heldTransactions,
    holdTransaction,
    resumeTransaction,
    removeHeldTransaction
  };

  return (
    <HeldTransactionsContext.Provider value={value}>
      {children}
    </HeldTransactionsContext.Provider>
  );
} 