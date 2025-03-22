import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
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

    let unsubscribeGoals;
    let unsubscribeSales;

    const fetchData = async () => {
      try {
        // Reference to the organization's goals document
        const goalsRef = doc(db, 'salesGoals', 'organization');
        
        // Set up real-time listener for goals
        unsubscribeGoals = onSnapshot(goalsRef, 
          async (doc) => {
            let goalsData;
            if (doc.exists()) {
              goalsData = doc.data();
            } else {
              // Initialize with default goals if document doesn't exist
              goalsData = {
                daily: { target: 0, achieved: 0 },
                weekly: { target: 0, achieved: 0 },
                monthly: { target: 0, achieved: 0 }
              };
              await setDoc(goalsRef, goalsData);
            }

            // Set up real-time listener for sales
            const salesRef = collection(db, 'sales');
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            unsubscribeSales = onSnapshot(
              query(
                salesRef,
                where('timestamp', '>=', Timestamp.fromDate(startOfMonth))
              ),
              (snapshot) => {
                const sales = snapshot.docs.map(doc => ({
                  ...doc.data(),
                  timestamp: doc.data().timestamp?.toDate()
                }));

                // Calculate achievements
                const dailySales = sales.filter(sale => 
                  sale.timestamp >= startOfDay
                ).reduce((sum, sale) => sum + sale.total, 0);

                const weeklySales = sales.filter(sale => 
                  sale.timestamp >= startOfWeek
                ).reduce((sum, sale) => sum + sale.total, 0);

                const monthlySales = sales.reduce((sum, sale) => sum + sale.total, 0);

                // Update goals with achievements
                const updatedGoals = {
                  daily: { ...goalsData.daily, achieved: dailySales },
                  weekly: { ...goalsData.weekly, achieved: weeklySales },
                  monthly: { ...goalsData.monthly, achieved: monthlySales }
                };

                setGoals(updatedGoals);
                setLoading(false);
                setError(null);
              },
              (err) => {
                console.error('Error fetching sales:', err);
                setError('Failed to load sales data');
                setLoading(false);
              }
            );
          },
          (err) => {
            console.error('Error fetching goals:', err);
            setError('Failed to load sales goals');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Failed to initialize sales tracking');
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup subscriptions
    return () => {
      if (unsubscribeGoals) unsubscribeGoals();
      if (unsubscribeSales) unsubscribeSales();
    };
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
      setError(null);
    } catch (err) {
      console.error('Error updating goal:', err);
      setError('Failed to update goal');
    }
  };

  const value = {
    goals,
    updateGoal,
    loading,
    error
  };

  return (
    <SalesGoalsContext.Provider value={value}>
      {children}
    </SalesGoalsContext.Provider>
  );
} 