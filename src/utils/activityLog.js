import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

export const logActivity = async (activity) => {
  try {
    const currentUser = auth.currentUser;
    const activityData = {
      ...activity,
      userId: currentUser ? currentUser.uid : null,
      userEmail: currentUser ? currentUser.email : null,
      timestamp: new Date(),
    };

    const activityRef = collection(db, 'activity_logs');
    await addDoc(activityRef, activityData);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error here as logging failure shouldn't break the main flow
  }
};

export const createAuditLog = async (type, action, details, metadata = {}) => {
  return logActivity({
    type,
    action,
    details,
    metadata
  });
}; 