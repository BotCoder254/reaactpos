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
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Helper function to convert date to Timestamp
const toFirestoreTimestamp = (date) => {
  if (!date) return null;
  if (date instanceof Timestamp) return date;
  return Timestamp.fromDate(new Date(date));
};

// Shift Management
export const createShift = async (shiftData) => {
  try {
    if (!shiftData || typeof shiftData !== 'object') {
      throw new Error('Invalid shift data');
    }

    // Validate required fields
    const requiredFields = ['employeeId', 'startTime', 'endTime'];
    for (const field of requiredFields) {
      if (!shiftData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const formattedData = {
      ...shiftData,
      startTime: toFirestoreTimestamp(shiftData.startTime),
      endTime: toFirestoreTimestamp(shiftData.endTime),
      status: 'active',
      createdAt: serverTimestamp()
    };

    // Get cashier details
    const userRef = doc(db, 'users', shiftData.employeeId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      formattedData.cashierName = userData.name || userData.email || 'Unknown';
    }

    const docRef = await addDoc(collection(db, 'shifts'), formattedData);
    toast.success('Shift created successfully');
    return docRef.id;
  } catch (error) {
    console.error('Error creating shift:', error);
    toast.error('Failed to create shift');
    throw error;
  }
};

export const updateShift = async (shiftId, updateData) => {
  try {
    if (!shiftId || typeof shiftId !== 'string') {
      throw new Error('Invalid shift ID');
    }

    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Invalid update data');
    }

    const shiftRef = doc(db, 'shifts', shiftId);
    await updateDoc(shiftRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    toast.success('Shift updated successfully');
  } catch (error) {
    console.error('Error updating shift:', error);
    toast.error('Failed to update shift');
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

export const getShifts = async (startDate, endDate, employeeId = null) => {
  try {
    const shiftsRef = collection(db, 'shifts');
    let constraints = [orderBy('startTime', 'desc')];

    if (startDate) {
      constraints.push(where('startTime', '>=', toFirestoreTimestamp(startDate)));
    }
    
    if (endDate) {
      constraints.push(where('startTime', '<=', toFirestoreTimestamp(endDate)));
    }

    if (employeeId) {
      constraints.push(where('employeeId', '==', employeeId));
    }

    const queryRef = query(shiftsRef, ...constraints);
    const snapshot = await getDocs(queryRef);
    
    // Get all unique employee IDs
    const employeeIds = new Set(snapshot.docs.map(doc => doc.data().employeeId));
    
    // Fetch all employee details in one go
    const employeeDetails = {};
    if (employeeIds.size > 0) {
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('uid', 'in', Array.from(employeeIds)));
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        employeeDetails[doc.id] = userData.name || userData.email || 'Unknown';
      });
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate().toISOString(),
        endTime: data.endTime?.toDate().toISOString(),
        cashierName: employeeDetails[data.employeeId] || data.cashierName || 'Unknown'
      };
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    toast.error('Failed to fetch shifts');
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
    if (!userId) {
      console.warn('No userId provided to getNotifications');
      return [];
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate() || null
      };
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    toast.error('Failed to fetch notifications');
    return [];
  }
};

// Analytics
export const getShiftAnalytics = async (startDate, endDate) => {
  try {
    // Get all shifts and filter in memory
    const q = query(collection(db, 'shifts'), orderBy('startTime'));
    const shiftsSnapshot = await getDocs(q);
    
    const shifts = shiftsSnapshot.docs
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

    // Get attendance data
    const attendanceQuery = query(collection(db, 'attendance'), orderBy('clockInTime'));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    const attendance = attendanceSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          clockInTime: data.clockInTime?.toDate(),
          clockOutTime: data.clockOutTime?.toDate()
        };
      })
      .filter(record => {
        if (!record.clockInTime) return false;
        const recordTime = new Date(record.clockInTime);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        return recordTime >= filterStart && recordTime <= filterEnd;
      });

    // Get previous period data for comparison
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - 7); // One week before
    const previousEnd = new Date(endDate);
    previousEnd.setDate(previousEnd.getDate() - 7);

    const previousShifts = shiftsSnapshot.docs
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
        return shiftStart >= previousStart && shiftStart <= previousEnd;
      });

    // Calculate changes from previous period
    const previousTotalShifts = previousShifts.length || 1; // Avoid division by zero
    const shiftChange = ((shifts.length - previousTotalShifts) / previousTotalShifts) * 100;

    const previousTotalHours = previousShifts.reduce((acc, shift) => {
      if (!shift.startTime || !shift.endTime) return acc;
      return acc + (shift.endTime - shift.startTime) / (1000 * 60 * 60);
    }, 0);
    const currentTotalHours = shifts.reduce((acc, shift) => {
      if (!shift.startTime || !shift.endTime) return acc;
      return acc + (shift.endTime - shift.startTime) / (1000 * 60 * 60);
    }, 0);
    const hoursChange = previousTotalHours ? ((currentTotalHours - previousTotalHours) / previousTotalHours) * 100 : 0;

    // Process data for analytics
    const analytics = {
      totalShifts: shifts.length,
      totalHours: currentTotalHours,
      attendanceRate: shifts.length ? (attendance.length / shifts.length) * 100 : 0,
      shiftsPerDay: {},
      peakHours: {},
      changes: {
        shifts: shiftChange.toFixed(2),
        hours: hoursChange.toFixed(2),
        attendance: 0 // Will be calculated below
      }
    };

    // Calculate shifts per day
    shifts.forEach(shift => {
      if (!shift.startTime) return;
      const date = shift.startTime.toLocaleDateString();
      analytics.shiftsPerDay[date] = (analytics.shiftsPerDay[date] || 0) + 1;
    });

    // Calculate peak hours
    shifts.forEach(shift => {
      if (!shift.startTime) return;
      const hour = shift.startTime.getHours();
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

export const endShift = async (shiftId) => {
  try {
    if (!shiftId || typeof shiftId !== 'string') {
      throw new Error('Invalid shift ID');
    }

    const shiftRef = doc(db, 'shifts', shiftId);
    await updateDoc(shiftRef, {
      status: 'completed',
      endTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    toast.success('Shift ended successfully');
  } catch (error) {
    console.error('Error ending shift:', error);
    toast.error('Failed to end shift');
    throw error;
  }
}; 