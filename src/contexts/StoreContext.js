import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';

const StoreContext = createContext();

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }) {
  const [currentStore, setCurrentStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const { currentUser } = useAuth();
  const { effectiveRole } = useRole();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchStores = async () => {
      try {
        const storesRef = collection(db, 'stores');
        let storesQuery;

        if (effectiveRole === 'manager') {
          storesQuery = query(storesRef);
        } else {
          storesQuery = query(
            storesRef,
            where('assignedUsers', 'array-contains', currentUser.uid)
          );
        }

        const unsubscribe = onSnapshot(storesQuery, (snapshot) => {
          const storesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setStores(storesData);

          // Set default store if none selected
          if (!currentStore && storesData.length > 0) {
            setCurrentStore(storesData[0]);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching stores:', error);
        setError('Failed to load stores');
        setLoading(false);
      }
    };

    const fetchTransfers = async () => {
      try {
        const transfersRef = collection(db, 'transfers');
        const unsubscribe = onSnapshot(
          query(transfersRef, where('status', '!=', 'completed')),
          (snapshot) => {
            const transfersData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTransfers(transfersData);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching transfers:', error);
      }
    };

    fetchStores();
    fetchTransfers();
  }, [currentUser, effectiveRole]);

  const switchStore = async (storeId) => {
    try {
      const store = stores.find(s => s.id === storeId);
      if (store) {
        setCurrentStore(store);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error switching store:', error);
      return false;
    }
  };

  const createStore = async (storeData) => {
    try {
      const newStore = {
        ...storeData,
        createdAt: Timestamp.now(),
        createdBy: currentUser.uid,
        status: 'active'
      };

      const docRef = await addDoc(collection(db, 'stores'), newStore);
      return { id: docRef.id, ...newStore };
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  };

  const updateStore = async (storeId, updateData) => {
    try {
      const storeRef = doc(db, 'stores', storeId);
      await updateDoc(storeRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid
      });
      return true;
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  };

  const createTransfer = async (transferData) => {
    try {
      const newTransfer = {
        ...transferData,
        status: 'pending',
        createdAt: Timestamp.now(),
        createdBy: currentUser.uid,
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'transfers'), newTransfer);
      return { id: docRef.id, ...newTransfer };
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  };

  const updateTransfer = async (transferId, status, notes = '') => {
    try {
      const transferRef = doc(db, 'transfers', transferId);
      await updateDoc(transferRef, {
        status,
        notes,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid
      });
      return true;
    } catch (error) {
      console.error('Error updating transfer:', error);
      throw error;
    }
  };

  const getStoreInventory = async (storeId) => {
    try {
      const inventoryRef = collection(db, 'inventory');
      const q = query(inventoryRef, where('storeId', '==', storeId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching store inventory:', error);
      throw error;
    }
  };

  const value = {
    currentStore,
    stores,
    transfers,
    loading,
    error,
    switchStore,
    createStore,
    updateStore,
    createTransfer,
    updateTransfer,
    getStoreInventory
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
} 