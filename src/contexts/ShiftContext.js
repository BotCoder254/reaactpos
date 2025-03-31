import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getShifts,
  getAttendanceLogs,
  getShiftAnalytics,
  getNotifications,
  clockIn,
  clockOut,
  createShift,
  updateShift,
  deleteShift,
  markNotificationAsRead,
  updateBreakStatus as updateBreakStatusAPI,
  getBreakHistory,
  getActiveBreak
} from '../utils/shiftQueries';
import toast from 'react-hot-toast';
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const ShiftContext = createContext();

export function useShift() {
  return useContext(ShiftContext);
}

export function ShiftProvider({ children }) {
  const { currentUser, userRole } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [breakHistory, setBreakHistory] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshShifts = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Get current week's date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      // Fetch shifts based on role
      const shiftsData = await getShifts(
        startDate,
        endDate,
        userRole === 'cashier' ? currentUser.uid : null
      );

      if (Array.isArray(shiftsData)) {
        setShifts(shiftsData);
      } else {
        setShifts([]);
      }

      // Fetch attendance logs
      const attendanceData = await getAttendanceLogs(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null);
      setAttendance(attendanceData);

      // Fetch notifications
      const notificationsData = await getNotifications(currentUser.uid);
      setNotifications(notificationsData);

      // Fetch break history for the current user
      if (userRole === 'cashier') {
        const breakData = await getBreakHistory(currentUser.uid, startDate, endDate);
        if (Array.isArray(breakData)) {
          setBreakHistory(breakData);
        }

        const currentBreak = await getActiveBreak(currentUser.uid);
        setActiveBreak(currentBreak);
      }

      // Only fetch analytics for managers
      if (userRole === 'manager') {
        try {
          const analyticsData = await getShiftAnalytics(startDate, endDate);
          setAnalytics(analyticsData);
        } catch (err) {
          console.error('Error fetching analytics:', err);
          setAnalytics(null);
        }
      }
    } catch (error) {
      console.error('Error fetching shift data:', error);
      setError('Failed to load shift data. Please try refreshing.');
      toast.error('Failed to load shift data');
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    refreshShifts();
  }, [refreshShifts]);

  const handleClockIn = async (shiftId, pin) => {
    try {
      await clockIn(shiftId, pin);
      await refreshShifts();
    } catch (err) {
      console.error('Error clocking in:', err);
      throw err;
    }
  };

  const handleClockOut = async (attendanceId, pin) => {
    try {
      await clockOut(attendanceId, pin);
      await refreshShifts();
    } catch (err) {
      console.error('Error clocking out:', err);
      throw err;
    }
  };

  const handleCreateShift = async (shiftData) => {
    try {
      if (userRole !== 'manager') {
        throw new Error('Only managers can create shifts');
      }

      const newShift = await addDoc(collection(db, 'shifts'), {
        ...shiftData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await refreshShifts();
      return newShift.id;
    } catch (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
  };

  const handleUpdateShift = async (shiftId, shiftData) => {
    try {
      if (userRole !== 'manager') {
        throw new Error('Only managers can update shifts');
      }

      await updateDoc(doc(db, 'shifts', shiftId), {
        ...shiftData,
        updatedAt: serverTimestamp()
      });

      await refreshShifts();
    } catch (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      await deleteShift(shiftId);
      await refreshShifts();
    } catch (err) {
      console.error('Error deleting shift:', err);
      throw err;
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const handleUpdateBreakStatus = async (breakData) => {
    try {
      const result = await updateBreakStatusAPI(breakData);
      if (result.ok) {
        if (breakData.status === 'active') {
          setActiveBreak(result.data);
        } else if (breakData.status === 'completed' || breakData.status === 'cancelled') {
          setActiveBreak(null);
        }
        await refreshShifts();
      }
      return result;
    } catch (error) {
      console.error('Error updating break:', error);
      throw error;
    }
  };

  const value = {
    shifts,
    attendance,
    analytics,
    notifications,
    breaks,
    breakHistory,
    activeBreak,
    loading,
    error,
    refreshShifts,
    clockIn: handleClockIn,
    clockOut: handleClockOut,
    createShift: handleCreateShift,
    updateShift: handleUpdateShift,
    deleteShift: handleDeleteShift,
    markNotificationAsRead: handleMarkNotificationAsRead,
    updateBreakStatus: handleUpdateBreakStatus
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
    </ShiftContext.Provider>
  );
} 