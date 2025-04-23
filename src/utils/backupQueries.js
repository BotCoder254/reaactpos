import { db, storage } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Papa from 'papaparse';

// Create a backup
export const createBackup = async (userId, description = '', format = 'json') => {
  try {
    // Get all collections to backup
    const collections = ['sales', 'products', 'inventory', 'users', 'suppliers'];
    const backupData = {};

    // Fetch data from each collection
    for (const collectionName of collections) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      backupData[collectionName] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    let backupContent;
    let contentType;
    let fileExtension;

    // Format the backup data based on selected format
    switch (format.toLowerCase()) {
      case 'csv':
        backupContent = Object.entries(backupData).map(([collection, data]) => {
          const csv = Papa.unparse(data);
          return `--- ${collection} ---\n${csv}\n\n`;
        }).join('');
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'sql':
        backupContent = Object.entries(backupData).map(([collection, data]) => {
          return data.map(item => {
            const values = Object.entries(item)
              .map(([key, value]) => typeof value === 'object' ? JSON.stringify(value) : value)
              .map(value => `'${value}'`)
              .join(', ');
            return `INSERT INTO ${collection} VALUES (${values});`;
          }).join('\n');
        }).join('\n\n');
        contentType = 'application/sql';
        fileExtension = 'sql';
        break;
      case 'xml':
        backupContent = `<?xml version="1.0" encoding="UTF-8"?>\n<backup>\n${
          Object.entries(backupData).map(([collection, data]) => {
            return `  <${collection}>\n${
              data.map(item => {
                return `    <item>\n${
                  Object.entries(item)
                    .map(([key, value]) => `      <${key}>${typeof value === 'object' ? JSON.stringify(value) : value}</${key}>`)
                    .join('\n')
                }\n    </item>`;
              }).join('\n')
            }\n  </${collection}>`;
          }).join('\n')
        }\n</backup>`;
        contentType = 'application/xml';
        fileExtension = 'xml';
        break;
      default: // JSON
        backupContent = JSON.stringify(backupData, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
    }

    // Create backup metadata
    const backupMetadata = {
      createdBy: userId,
      createdAt: Timestamp.now(),
      description,
      collections,
      status: 'completed',
      size: backupContent.length,
      type: 'manual',
      format: format.toLowerCase()
    };

    // Save backup data to storage
    const backupBlob = new Blob([backupContent], { type: contentType });
    const backupRef = ref(storage, `backups/${Date.now()}_backup.${fileExtension}`);
    await uploadBytes(backupRef, backupBlob);
    const downloadURL = await getDownloadURL(backupRef);

    // Save backup metadata to Firestore
    const backupDoc = await addDoc(collection(db, 'backups'), {
      ...backupMetadata,
      fileUrl: downloadURL
    });

    return {
      id: backupDoc.id,
      ...backupMetadata,
      fileUrl: downloadURL
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Schedule a backup
export const scheduleBackup = async (userId, schedule) => {
  try {
    const backupSchedule = {
      createdBy: userId,
      createdAt: Timestamp.now(),
      schedule: {
        frequency: schedule.frequency, // daily, weekly, monthly
        time: schedule.time, // HH:mm format
        dayOfWeek: schedule.dayOfWeek, // 0-6 for weekly
        dayOfMonth: schedule.dayOfMonth, // 1-31 for monthly
      },
      status: 'active',
      lastRun: null,
      nextRun: calculateNextRun(schedule)
    };

    const scheduleDoc = await addDoc(collection(db, 'backupSchedules'), backupSchedule);
    return {
      id: scheduleDoc.id,
      ...backupSchedule
    };
  } catch (error) {
    console.error('Error scheduling backup:', error);
    throw error;
  }
};

// Get all backups
export const getBackups = async (limitCount = 50) => {
  try {
    const backupsQuery = query(
      collection(db, 'backups'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(backupsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting backups:', error);
    throw error;
  }
};

// Get backup schedules
export const getBackupSchedules = async () => {
  try {
    const schedulesSnapshot = await getDocs(collection(db, 'backupSchedules'));
    
    return schedulesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(schedule => schedule.status === 'active')
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Error getting backup schedules:', error);
    throw error;
  }
};

// Request data recovery with file existence check
export const requestRecovery = async (userId, backupId, collections, reason) => {
  try {
    // Verify backup exists
    const backupDoc = await getDoc(doc(db, 'backups', backupId));
    if (!backupDoc.exists()) {
      throw new Error('Backup not found');
    }

    const backupData = backupDoc.data();
    const recoveryRequest = {
      requestedBy: userId,
      requestedAt: Timestamp.now(),
      backupId,
      collections,
      reason,
      status: 'pending',
      approvedBy: null,
      approvedAt: null,
      backupInfo: {
        createdAt: backupData.createdAt || null,
        format: backupData.format || 'json',
        fileUrl: backupData.fileUrl || null,
        description: backupData.description || '',
        size: backupData.size || 0
      }
    };

    const requestDoc = await addDoc(collection(db, 'recoveryRequests'), recoveryRequest);
    return {
      id: requestDoc.id,
      ...recoveryRequest
    };
  } catch (error) {
    console.error('Error requesting recovery:', error);
    throw error;
  }
};

// Get recovery requests
export const getRecoveryRequests = async (userId, userRole) => {
  try {
    let requestsSnapshot;
    
    if (userRole === 'manager') {
      requestsSnapshot = await getDocs(collection(db, 'recoveryRequests'));
    } else {
      const requestsQuery = query(
        collection(db, 'recoveryRequests'),
        where('requestedBy', '==', userId)
      );
      requestsSnapshot = await getDocs(requestsQuery);
    }

    return requestsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => b.requestedAt.seconds - a.requestedAt.seconds);
  } catch (error) {
    console.error('Error getting recovery requests:', error);
    throw error;
  }
};

// Helper function to calculate next run time
function calculateNextRun(schedule) {
  const now = new Date();
  let nextRun = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);

  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'weekly':
      while (nextRun.getDay() !== schedule.dayOfWeek || nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'monthly':
      nextRun.setDate(schedule.dayOfMonth);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }

  return Timestamp.fromDate(nextRun);
}

// Approve recovery request
export const approveRecoveryRequest = async (requestId, managerId) => {
  try {
    const requestRef = doc(db, 'recoveryRequests', requestId);
    await updateDoc(requestRef, {
      status: 'approved',
      approvedBy: managerId,
      approvedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error approving recovery request:', error);
    throw error;
  }
};

// Reject recovery request
export const rejectRecoveryRequest = async (requestId, managerId, reason) => {
  try {
    const requestRef = doc(db, 'recoveryRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      approvedBy: managerId,
      approvedAt: Timestamp.now(),
      rejectionReason: reason
    });
    return true;
  } catch (error) {
    console.error('Error rejecting recovery request:', error);
    throw error;
  }
};

// Update recovery request status
export const updateRecoveryRequest = async (requestId, status, managerId, reason = '') => {
  try {
    const requestRef = doc(db, 'recoveryRequests', requestId);
    const updateData = {
      status,
      approvedBy: managerId,
      approvedAt: Timestamp.now()
    };

    if (status === 'rejected' && reason) {
      updateData.rejectionReason = reason;
    }

    await updateDoc(requestRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating recovery request:', error);
    throw error;
  }
};

// Get all recovery requests for manager
export const getAllRecoveryRequests = async () => {
  try {
    const requestsQuery = query(
      collection(db, 'recoveryRequests'),
      orderBy('requestedAt', 'desc')
    );
    
    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all recovery requests:', error);
    throw error;
  }
}; 
