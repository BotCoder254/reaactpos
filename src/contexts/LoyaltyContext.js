import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  createLoyaltyProgram,
  updateLoyaltyProgram,
  createLoyaltyAccount,
  getLoyaltyAccount,
  updateLoyaltyPoints,
  redeemPoints,
  getLoyaltyAnalytics,
  getLoyaltyProgram
} from '../utils/loyaltyQueries';

const LoyaltyContext = createContext();

export function useLoyalty() {
  return useContext(LoyaltyContext);
}

export function LoyaltyProvider({ children }) {
  const [loyaltyProgram, setLoyaltyProgram] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      if (userRole === 'manager') {
        try {
          const data = await getLoyaltyAnalytics();
          setAnalytics(data);
        } catch (err) {
          console.error('Error fetching loyalty analytics:', err);
        }
      }
    };

    fetchAnalytics();
    setLoading(false);
  }, [currentUser, userRole]);

  const setupLoyaltyProgram = async (programData) => {
    try {
      setError(null);
      const program = await createLoyaltyProgram(programData);
      setLoyaltyProgram(program);
      return program;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProgram = async (programId, programData) => {
    try {
      setError(null);
      await updateLoyaltyProgram(programId, programData);
      setLoyaltyProgram(prev => ({ ...prev, ...programData }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const createAccount = async (customerData) => {
    try {
      setError(null);
      const account = await createLoyaltyAccount(customerData);
      return account;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const lookupAccount = async (phone) => {
    try {
      setError(null);
      const account = await getLoyaltyAccount(phone);
      setCurrentAccount(account);
      return account;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const addPoints = async (accountId, points, amount) => {
    try {
      setError(null);
      const updated = await updateLoyaltyPoints(accountId, points, amount);
      setCurrentAccount(prev => prev?.id === accountId ? updated : prev);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const redeemReward = async (accountId, pointsToRedeem, rewardName) => {
    try {
      setError(null);
      const updated = await redeemPoints(accountId, pointsToRedeem, rewardName);
      setCurrentAccount(prev => prev?.id === accountId ? updated : prev);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const refreshAnalytics = async () => {
    if (userRole !== 'manager') return;
    try {
      setError(null);
      const data = await getLoyaltyAnalytics();
      setAnalytics(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    loyaltyProgram,
    currentAccount,
    analytics,
    loading,
    error,
    setupLoyaltyProgram,
    updateProgram,
    createAccount,
    lookupAccount,
    addPoints,
    redeemReward,
    refreshAnalytics
  };

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
} 