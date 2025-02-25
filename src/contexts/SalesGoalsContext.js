import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SalesGoalsContext = createContext();

export function useSalesGoals() {
  return useContext(SalesGoalsContext);
}

export function SalesGoalsProvider({ children }) {
  const [goals, setGoals] = useState({
    daily: { target: 0, achieved: 0 },
    weekly: { target: 0, achieved: 0 },
    monthly: { target: 0, achieved: 0 }
  });
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Reference to the organization's goals document
    const goalsRef = doc(db, 'salesGoals', 'organization');
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(goalsRef, 
      (doc) => {
        if (doc.exists()) {
          setGoals(doc.data());
        } else {
          // Initialize with default goals if document doesn't exist
          const defaultGoals = {
            daily: { target: 0, achieved: 0 },
            weekly: { target: 0, achieved: 0 },
            monthly: { target: 0, achieved: 0 }
          };
          setDoc(goalsRef, defaultGoals);
          setGoals(defaultGoals);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching goals:', err);
        setError('Failed to load sales goals');
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [currentUser]);

  const updateGoal = async (period, target) => {
    if (!currentUser) return;

    try {
      const goalsRef = doc(db, 'salesGoals', 'organization');
      const updatedGoals = {
        ...goals,
        [period]: { ...goals[period], target: parseFloat(target) }
      };

      await setDoc(goalsRef, updatedGoals);
      // No need to setGoals here as the onSnapshot listener will update it
      setError(null);
    } catch (err) {
      console.error('Error updating goal:', err);
      setError('Failed to update goal');
    }
  };

  const updateAchievement = async (period, achieved) => {
    if (!currentUser) return;

    try {
      const goalsRef = doc(db, 'salesGoals', 'organization');
      const updatedGoals = {
        ...goals,
        [period]: { ...goals[period], achieved: parseFloat(achieved) }
      };

      await setDoc(goalsRef, updatedGoals);
      // No need to setGoals here as the onSnapshot listener will update it
      setError(null);
    } catch (err) {
      console.error('Error updating achievement:', err);
      setError('Failed to update achievement');
    }
  };

  const value = {
    goals,
    updateGoal,
    updateAchievement,
    loading,
    error
  };

  return (
    <SalesGoalsContext.Provider value={value}>
      {children}
    </SalesGoalsContext.Provider>
  );
} 