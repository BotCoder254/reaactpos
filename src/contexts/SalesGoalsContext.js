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
                const sales = snapshot.docs.map(doc => {
                  const data = doc.data();
                  // Calculate total from items if total is not present or invalid
                  let calculatedTotal = 0;
                  if (Array.isArray(data.items)) {
                    calculatedTotal = data.items.reduce((sum, item) => {
                      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
                      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
                      return sum + (price * quantity);
                    }, 0);
                  }

                  // Ensure total is a valid number
                  const total = typeof data.total === 'number' ? data.total : 
                              (parseFloat(data.total) || calculatedTotal);

                  return {
                    ...data,
                    total: parseFloat(total.toFixed(2)),
                    timestamp: data.timestamp?.toDate()
                  };
                });

                // Calculate achievements with proper number handling
                const dailySales = parseFloat(sales.filter(sale => 
                  sale.timestamp >= startOfDay
                ).reduce((sum, sale) => sum + (sale.total || 0), 0).toFixed(2));

                const weeklySales = parseFloat(sales.filter(sale => 
                  sale.timestamp >= startOfWeek
                ).reduce((sum, sale) => sum + (sale.total || 0), 0).toFixed(2));

                const monthlySales = parseFloat(sales.reduce((sum, sale) => 
                  sum + (sale.total || 0), 0).toFixed(2));

                // Update goals with achievements
                const updatedGoals = {
                  daily: { 
                    target: parseFloat(goalsData.daily?.target || 0), 
                    achieved: dailySales 
                  },
                  weekly: { 
                    target: parseFloat(goalsData.weekly?.target || 0), 
                    achieved: weeklySales 
                  },
                  monthly: { 
                    target: parseFloat(goalsData.monthly?.target || 0), 
                    achieved: monthlySales 
                  }
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