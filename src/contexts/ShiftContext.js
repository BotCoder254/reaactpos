import React, { createContext, useContext, useState, useEffect } from 'react';
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
  markNotificationAsRead
} from '../utils/shiftQueries';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchShiftData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get shifts for the current week
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // End of week

        const [shiftsData, attendanceData, notificationsData] = await Promise.all([
          getShifts(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null),
          getAttendanceLogs(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null),
          getNotifications()
        ]);

        setShifts(shiftsData);
        setAttendance(attendanceData);
        setNotifications(notificationsData);

        // Only fetch analytics for managers
        if (userRole === 'manager') {
          const analyticsData = await getShiftAnalytics(startDate, endDate);
          setAnalytics(analyticsData);
        }
      } catch (err) {
        console.error('Error fetching shift data:', err);
        setError('Failed to load shift data');
      } finally {
        setLoading(false);
      }
    };

    fetchShiftData();
  }, [currentUser, userRole]);

  const handleClockIn = async (shiftId) => {
    try {
      await clockIn(shiftId);
      // Refresh attendance data
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const attendanceData = await getAttendanceLogs(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Error clocking in:', err);
      throw err;
    }
  };

  const handleClockOut = async (attendanceId) => {
    try {
      await clockOut(attendanceId);
      // Refresh attendance data
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const attendanceData = await getAttendanceLogs(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Error clocking out:', err);
      throw err;
    }
  };

  const handleCreateShift = async (shiftData) => {
    try {
      await createShift(shiftData);
      // Refresh shifts
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const shiftsData = await getShifts(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null);
      setShifts(shiftsData);
    } catch (err) {
      console.error('Error creating shift:', err);
      throw err;
    }
  };

  const handleUpdateShift = async (shiftId, shiftData) => {
    try {
      await updateShift(shiftId, shiftData);
      // Refresh shifts
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const shiftsData = await getShifts(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null);
      setShifts(shiftsData);
    } catch (err) {
      console.error('Error updating shift:', err);
      throw err;
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      await deleteShift(shiftId);
      // Refresh shifts
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const shiftsData = await getShifts(startDate, endDate, userRole === 'cashier' ? currentUser.uid : null);
      setShifts(shiftsData);
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

  const value = {
    shifts,
    attendance,
    analytics,
    notifications,
    loading,
    error,
    clockIn: handleClockIn,
    clockOut: handleClockOut,
    createShift: handleCreateShift,
    updateShift: handleUpdateShift,
    deleteShift: handleDeleteShift,
    markNotificationAsRead: handleMarkNotificationAsRead
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
    </ShiftContext.Provider>
  );
} 