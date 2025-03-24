import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Helper function to convert date to Timestamp
const toFirestoreTimestamp = (date) => {
  if (!date) return null;
  if (date instanceof Timestamp) return date;
  return Timestamp.fromDate(new Date(date));
};

// Shift Management
export const createShift = async (shiftData) => {
  try {
    const formattedData = {
      ...shiftData,
      startTime: toFirestoreTimestamp(shiftData.startTime),
      endTime: toFirestoreTimestamp(shiftData.endTime),
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'shifts'), formattedData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error;
  }
};

export const updateShift = async (shiftId, shiftData) => {
  try {
    const formattedData = {
      ...shiftData,
      startTime: toFirestoreTimestamp(shiftData.startTime),
      endTime: toFirestoreTimestamp(shiftData.endTime),
      updatedAt: serverTimestamp()
    };
    await updateDoc(doc(db, 'shifts', shiftId), formattedData);
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error;
  }
};

export const deleteShift = async (shiftId) => {
  try {
    await deleteDoc(doc(db, 'shifts', shiftId));
  } catch (error) {
    console.error('Error deleting shift:', error);
    throw error;
  }
};

export const getShifts = async (startDate, endDate, cashierId = null) => {
  try {
    let baseQuery;
    const constraints = [];

    // Only add cashierId filter if it's provided and valid
    if (cashierId) {
      constraints.push(where('cashierId', '==', cashierId));
    }

    // Add startTime ordering
    constraints.push(orderBy('startTime'));

    baseQuery = query(collection(db, 'shifts'), ...constraints);
    const querySnapshot = await getDocs(baseQuery);
    
    const shifts = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate()
        };
      })
      .filter(shift => {
        if (!shift.startTime) return false;
        const shiftStart = new Date(shift.startTime);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        return shiftStart >= filterStart && shiftStart <= filterEnd;
      });

    return shifts;
  } catch (error) {
    console.error('Error getting shifts:', error);
    throw error;
  }
};

// Attendance Management
export const clockIn = async (shiftId, cashierId) => {
  try {
    if (!shiftId || !cashierId) {
      throw new Error('ShiftId and CashierId are required');
    }
    const attendanceRef = await addDoc(collection(db, 'attendance'), {
      shiftId,
      cashierId,
      clockInTime: serverTimestamp(),
      status: 'active'
    });
    return attendanceRef.id;
  } catch (error) {
    console.error('Error clocking in:', error);
    throw error;
  }
};

export const clockOut = async (attendanceId) => {
  try {
    if (!attendanceId) {
      throw new Error('AttendanceId is required');
    }
    await updateDoc(doc(db, 'attendance', attendanceId), {
      clockOutTime: serverTimestamp(),
      status: 'completed'
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    throw error;
  }
};

export const getAttendanceLogs = async (startDate, endDate, cashierId = null) => {
  try {
    let constraints = [];
    
    if (cashierId) {
      constraints.push(where('cashierId', '==', cashierId));
    }
    
    constraints.push(orderBy('clockInTime', 'desc'));
    
    const baseQuery = query(collection(db, 'attendance'), ...constraints);
    const querySnapshot = await getDocs(baseQuery);
    
    const logs = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          clockInTime: data.clockInTime?.toDate(),
          clockOutTime: data.clockOutTime?.toDate()
        };
      })
      .filter(log => {
        if (!log.clockInTime) return false;
        const logTime = new Date(log.clockInTime);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        return logTime >= filterStart && logTime <= filterEnd;
      });

    return logs;
  } catch (error) {
    console.error('Error getting attendance logs:', error);
    throw error;
  }
};

// Shift Swaps
export const requestShiftSwap = async (shiftId, requesterId, targetCashierId) => {
  try {
    const swapRef = await addDoc(collection(db, 'shiftSwaps'), {
      shiftId,
      requesterId,
      targetCashierId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return swapRef.id;
  } catch (error) {
    console.error('Error requesting shift swap:', error);
    throw error;
  }
};

export const respondToShiftSwap = async (swapId, accepted) => {
  try {
    await updateDoc(doc(db, 'shiftSwaps', swapId), {
      status: accepted ? 'accepted' : 'rejected',
      respondedAt: serverTimestamp()
    });

    if (accepted) {
      const swapDoc = await getDoc(doc(db, 'shiftSwaps', swapId));
      const swapData = swapDoc.data();
      
      // Update the shift assignment
      await updateDoc(doc(db, 'shifts', swapData.shiftId), {
        cashierId: swapData.targetCashierId,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error responding to shift swap:', error);
    throw error;
  }
};

// Notifications
export const createNotification = async (userId, title, message, type) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Analytics
export const getShiftAnalytics = async (startDate, endDate) => {
  try {
    // Get all shifts and filter in memory
    const q = query(collection(db, 'shifts'), orderBy('startTime'));
    const shiftsSnapshot = await getDocs(q);
    
    const shifts = shiftsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(shift => {
        const shiftStart = new Date(shift.startTime);
        return shiftStart >= startDate && shiftStart <= endDate;
      });

    // Get attendance data
    const attendanceQuery = query(collection(db, 'attendance'), orderBy('clockInTime'));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    const attendance = attendanceSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(record => {
        const recordTime = new Date(record.clockInTime);
        return recordTime >= startDate && recordTime <= endDate;
      });

    // Process data for analytics
    const analytics = {
      totalShifts: shifts.length,
      totalHours: shifts.reduce((acc, shift) => {
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0),
      attendanceRate: (attendance.length / shifts.length) * 100,
      shiftsPerDay: {},
      peakHours: {}
    };

    // Calculate shifts per day
    shifts.forEach(shift => {
      const date = new Date(shift.startTime).toLocaleDateString();
      analytics.shiftsPerDay[date] = (analytics.shiftsPerDay[date] || 0) + 1;
    });

    // Calculate peak hours
    shifts.forEach(shift => {
      const hour = new Date(shift.startTime).getHours();
      analytics.peakHours[hour] = (analytics.peakHours[hour] || 0) + 1;
    });

    return analytics;
  } catch (error) {
    console.error('Error getting shift analytics:', error);
    throw error;
  }
};

// Cache for cashiers data
let cashiersCache = null;
let lastCashiersFetch = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cashier Management
export const getCashiers = async () => {
  try {
    // Return cached data if available and not expired
    if (cashiersCache && lastCashiersFetch && (Date.now() - lastCashiersFetch) < CACHE_DURATION) {
      return cashiersCache;
    }

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'cashier')
    );
    
    const querySnapshot = await getDocs(q);
    const cashiers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Unknown',
      email: doc.data().email,
      role: doc.data().role
    }));

    // Update cache
    cashiersCache = cashiers;
    lastCashiersFetch = Date.now();

    return cashiers;
  } catch (error) {
    console.error('Error getting cashiers:', error);
    // Return cached data if available, even if expired
    if (cashiersCache) {
      return cashiersCache;
    }
    throw error;
  }
}; 